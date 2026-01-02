/** @format */

const express = require("express");
const router = express.Router();
const connectToDb = require("../../utils/db");
const saleInvoiceModel = require("../../models/saleInvoice");
const RBAC = require("../../utils/RBAC");
const { isValidObjectId } = require("mongoose");
const purchaseInvoiceModel = require("../../models/purchaseInvoice");
const myCheckModel = require("../../models/myCheck");
const demandModel = require("../../models/demand");
const userModel = require("../../models/user");
const productModel = require("../../models/product");

router.get("/", RBAC, async (req, res) => {
  try {
    await connectToDb();

    const purchaseInvoices = await saleInvoiceModel
      .find()
      .populate("representation")
      .lean();
    const invoices = purchaseInvoices.map((invoice) => {
      const totalPurchase = invoice.products.reduce((acc, curr) => {
        acc += curr.purchasePrice * curr.inventory;
        return acc;
      }, 0);

      return {
        ...invoice,
        totalPurchase,
      };
    });
    if (req.query?.page) {
      const page = req.query.page * 10;
      const datas = invoices.slice(page - 10, page);
      const totalPages = Math.ceil(invoices.length / 10);

      return res.json({
        purchaseInvoices: datas,
        totalPages,
        success: true,
      });
    } else {
      return res.json({
        purchaseInvoices: invoices,
        success: true,
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: "خطای ناشناخته",
      success: false,
    });
  }
});

router.post("/", RBAC, async (req, res) => {
  try {
    await connectToDb();

    const {
      representation,
      products,
      pay,
      priceOfCredit = 0,
      priceOfCheck = 0,
      price = 0,
      off = 0,
    } = req.body;

    // ===== validations =====
    if (!representation || !isValidObjectId(representation)) {
      return res
        .status(422)
        .json({ error: "آیدی نمایندگی نادرست است", success: false });
    }

    if (!Array.isArray(products) || products.length < 1) {
      return res
        .status(422)
        .json({ error: "اطلاعات محصولات نامعتبر است", success: false });
    }

    if (!pay) {
      return res
        .status(422)
        .json({ error: "نوع پرداخت مشخص نیست", success: false });
    }

    // ===== price calculations =====
    const totalPrices =
      Number(price) +
      Number(priceOfCheck) +
      Number(priceOfCredit) -
      Number(off);

    if (Number.isNaN(totalPrices)) {
      return res
        .status(422)
        .json({ error: "مقادیر قیمتی نامعتبر است", success: false });
    }

    const productPrices = products.reduce((acc, curr) => {
      if (
        typeof curr.purchasePrice !== "number" ||
        typeof curr.inventory !== "number"
      ) {
        throw new Error("اطلاعات قیمت یا تعداد محصول نامعتبر است");
      }
      return acc + curr.purchasePrice * curr.inventory;
    }, 0);

    if (productPrices > totalPrices) {
      return res.status(422).json({
        error: "مبلغ پرداختی از مجموع مبلغ محصولات کمتر است",
        success: false,
      });
    }

    // ===== user =====
    const user = await userModel.findOne();
    if (!user) {
      return res.status(404).json({ error: "کاربر یافت نشد", success: false });
    }

    // ===== create invoice =====
    const purchaseInvoice = await purchaseInvoiceModel.create({
      ...req.body,
      representation,
      products,
      pay,
      priceOfCredit,
      priceOfCheck,
      price,
      off,
    });

    purchaseInvoice.priceOfCredit =
      Number(purchaseInvoice.priceOfCredit) - Number(off);
    await purchaseInvoice.save();

    // ===== payment logic (unchanged) =====
    switch (pay) {
      case "credit": {
        const demand = await demandModel.create({
          user: user._id,
          representation,
          price: purchaseInvoice.priceOfCredit,
        });
        purchaseInvoice.demand = demand._id;
        await purchaseInvoice.save();
        break;
      }

      case "check": {
        const check = await myCheckModel.create({
          price: priceOfCheck,
          representation,
          status: "process",
          purchaseInvoice: purchaseInvoice._id,
        });
        purchaseInvoice.check = check._id;
        await purchaseInvoice.save();
        break;
      }

      case "check and credit": {
        const demand = await demandModel.create({
          user: user._id,
          representation,
          price: purchaseInvoice.priceOfCredit,
        });
        purchaseInvoice.demand = demand._id;
        await purchaseInvoice.save();

        const check = await myCheckModel.create({
          price: priceOfCheck,
          representation,
          status: "process",
          purchaseInvoice: purchaseInvoice._id,
        });
        purchaseInvoice.check = check._id;
        await purchaseInvoice.save();
        break;
      }
    }

    // ===== products update =====
    for (let p of products) {
      const product = await productModel.findOne({ name: p.name });

      if (product) {
        product.purchasePrice = p.purchasePrice;
        product.salePrice = p.salePrice;
        product.inventory += p.inventory; // منطق خرید حفظ شده
        await product.save();
      } else {
        await productModel.create(p);
      }
    }

    return res.status(201).json({
      message: "فاکتور خرید اضافه شد",
      success: true,
      totalPrices,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.message || "خطای ناشناخته",
      success: false,
    });
  }
});
router.put("/:id", RBAC, async (req, res) => {
  try {
    await connectToDb();

    const { id } = req.params;
    const {
      representation,
      pay,
      price = 0,
      priceOfCredit = 0,
      priceOfCheck = 0,
      off = 0,
    } = req.body;

    // اعتبارسنجی آیدی فاکتور و نمایندگی
    if (!isValidObjectId(id)) {
      return res
        .status(422)
        .json({ error: "آیدی فاکتور نامعتبر است", success: false });
    }
    if (representation && !isValidObjectId(representation)) {
      return res
        .status(422)
        .json({ error: "آیدی نمایندگی نامعتبر است", success: false });
    }

    // اعتبارسنجی نوع پرداخت
    const validPays = ["cash", "credit", "check", "check and credit"];
    if (pay && !validPays.includes(pay)) {
      return res
        .status(422)
        .json({ error: "نوع پرداخت نامعتبر است", success: false });
    }

    const invoice = await purchaseInvoiceModel.findById(id);
    if (!invoice) {
      return res.status(404).json({ error: "فاکتور یافت نشد", success: false });
    }

    const user = await userModel.findOne();
    if (!user) {
      return res.status(404).json({ error: "کاربر یافت نشد", success: false });
    }

    // محاسبه مجموع پرداختی
    const totalPrices =
      Number(price) +
      Number(priceOfCredit) +
      Number(priceOfCheck) -
      Number(off);

    // محاسبه جمع قیمت محصولات موجود در فاکتور
    const productPrices = invoice.products.reduce((acc , curr)=>{
        acc += (curr.purchasePrice * curr.inventory)
        return acc
    });

    if (productPrices > totalPrices) {
      return res.status(422).json({
        error: "مبلغ پرداختی از مجموع مبلغ محصولات کمتر است",
        success: false,
      });
    }

    const oldPay = invoice.pay;

    // ===== ویرایش فیلدهای فاکتور (products دست نخورده) =====
    invoice.representation = representation ?? invoice.representation;
    invoice.pay = pay ?? invoice.pay;
    invoice.price = price;
    invoice.priceOfCredit = priceOfCredit - off;
    invoice.priceOfCheck = priceOfCheck;
    invoice.off = off;

    await invoice.save();

    // ===== همگام‌سازی جدول‌های وابسته =====
    if (oldPay === invoice.pay) {
      // نوع پرداخت تغییر نکرده → فقط بروزرسانی اطلاعات
      if (invoice.pay === "credit" && invoice.demand) {
        await demandModel.findByIdAndUpdate(invoice.demand, {
          price: invoice.priceOfCredit,
          representation: invoice.representation,
        });
      }
      if (invoice.pay === "check" && invoice.check) {
        await myCheckModel.findByIdAndUpdate(invoice.check, {
          price: invoice.priceOfCheck,
          representation: invoice.representation,
        });
      }
      if (invoice.pay === "check and credit") {
        if (invoice.demand) {
          await demandModel.findByIdAndUpdate(invoice.demand, {
            price: invoice.priceOfCredit,
            representation: invoice.representation,
          });
        }
        if (invoice.check) {
          await myCheckModel.findByIdAndUpdate(invoice.check, {
            price: invoice.priceOfCheck,
            representation: invoice.representation,
          });
        }
      }
    } else {
      // نوع پرداخت تغییر کرده → پاکسازی قبلی
      if (invoice.demand) {
        await demandModel.findByIdAndDelete(invoice.demand);
        invoice.demand = null;
      }
      if (invoice.check) {
        await myCheckModel.findByIdAndDelete(invoice.check);
        invoice.check = null;
      }

      // ساخت مجدد based on new pay
      switch (invoice.pay) {
        case "credit": {
          const demand = await demandModel.create({
            user: user._id,
            representation: invoice.representation,
            price: invoice.priceOfCredit,
          });
          invoice.demand = demand._id;
          break;
        }
        case "check": {
          const check = await myCheckModel.create({
            price: invoice.priceOfCheck,
            representation: invoice.representation,
            status: "process",
            purchaseInvoice: invoice._id,
          });
          invoice.check = check._id;
          break;
        }
        case "check and credit": {
          const demand = await demandModel.create({
            user: user._id,
            representation: invoice.representation,
            price: invoice.priceOfCredit,
          });
          const check = await myCheckModel.create({
            price: invoice.priceOfCheck,
            representation: invoice.representation,
            status: "process",
            purchaseInvoice: invoice._id,
          });
          invoice.demand = demand._id;
          invoice.check = check._id;
          break;
        }
        default:
          // هیچ جدول وابسته‌ای ندارد
          break;
      }

      await invoice.save();
    }

    return res.status(200).json({
      message: "فاکتور خرید با موفقیت ویرایش شد",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.message || "خطای ناشناخته",
      success: false,
    });
  }
});
router.delete("/:id", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res
        .status(422)
        .json({ error: "آیدی فاکتور خرید معتبر نیست", success: false });
    }
    await purchaseInvoiceModel.findOneAndDelete({ _id: id });

    return res.json({
      message: "فاکتور خرید با موفقیت حذف شد",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

module.exports = router;
