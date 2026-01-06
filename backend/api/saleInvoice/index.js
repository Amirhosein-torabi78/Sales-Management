/** @format */

const express = require("express");
const router = express.Router();
const connectToDb = require("../../utils/db");
const saleInvoiceModel = require("../../models/saleInvoice");
const RBAC = require("../../utils/RBAC");
const { isValidObjectId } = require("mongoose");
const productModel = require("../../models/product");
const creditModel = require("../../models/credit");
const sellerModel = require("../../models/seller");
const customerModel = require("../../models/customer");
const checkModel = require("../../models/check");
const demandModel = require("../../models/demand");
const userModel = require("../../models/user");

router.get("/", RBAC, async (req, res) => {
  try {
    await connectToDb();

    const saleInvoices = await saleInvoiceModel
      .find()
      .populate("customer")
      .populate("seller")
      .lean();

    const saleInvoicesWithCalc = await Promise.all(
      saleInvoices.map(async (invoice) => {
        const pricesWithoutOff =
          (invoice.price || 0) +
          (invoice.priceOfCredit || 0) +
          (invoice.priceOfCheck || 0);

        const pricesWithOff =
          (invoice.price || 0) +
          (invoice.priceOfCredit || 0) +
          (invoice.priceOfCheck || 0) -
          invoice.off;

        let totalSalePrice = 0;
        let totalPurchasePrice = 0;

        for (let p of invoice.products) {
          const product = await productModel.findOne({ _id: p.product });
          if (!product) {
            continue
          }
          const salePrice = p.price || product.salePrice;
          const purchasePrice = product.purchasePrice;
          totalSalePrice += salePrice * p.inventory;
          totalPurchasePrice += purchasePrice * p.inventory;
        }

        const products = invoice.products.map((p) => ({
          ...p,
          totalPrice: p.price * p.inventory,
        }));

        const profitOrLoss = totalSalePrice - totalPurchasePrice - invoice.off;

        return {
          ...invoice,
          products,
          pricesWithoutOff,
          pricesWithOff,
          profitOrLoss,
        };
      })
    );

    if (req.query?.page) {
      const page = req.query.page * 10;
      const datas = saleInvoicesWithCalc.slice(page - 10, page);
      const totalPages = Math.ceil(saleInvoicesWithCalc.length / 10);

      return res.json({
        saleInvoices: datas,
        totalPages,
        success: true,
      });
    } else {
      return res.json({
        saleInvoices: saleInvoicesWithCalc,
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

router.get("/:id", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const { id } = req.params;

    if (!id || !isValidObjectId(id)) {
      return res
        .status(422)
        .json({ error: "آیدی فاکتور فروش نامعتبر است", success: false });
    }

    const saleInvoice = await saleInvoiceModel
      .findOne({ _id: id })
      .populate("customer")
      .populate("seller")
      .lean();

    if (!saleInvoice) {
      return res
        .status(404)
        .json({ error: "فاکتور فروش یافت نشد", success: false });
    }

    const pricesWithoutOff =
      (saleInvoice.price || 0) +
      (saleInvoice.priceOfCredit || 0) +
      (saleInvoice.priceOfCheck || 0);

    const pricesWithOff =
      (saleInvoice.price || 0) +
      (saleInvoice.priceOfCredit || 0) +
      (saleInvoice.priceOfCheck || 0) -
      saleInvoice.off;

    let totalSalePrice = 0;
    let totalPurchasePrice = 0;

    for (let p of saleInvoice.products) {
      const product = await productModel.findOne({ _id: p.product });

      const salePrice = p.price || product.salePrice;
      const purchasePrice = product.purchasePrice;

      totalSalePrice += salePrice * p.inventory;
      totalPurchasePrice += purchasePrice * p.inventory;
    }

    const profitOrLoss = totalSalePrice - totalPurchasePrice - saleInvoice.off;

    const products = saleInvoice.products.map((p) => ({
      ...p,
      totalPrice: p.price * p.inventory,
    }));

    return res.json({
      saleInvoice: {
        ...saleInvoice,
        products,
        pricesWithoutOff,
        pricesWithOff,
        profitOrLoss,
      },
      success: true,
    });
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
    const { pay, products, seller, customer, status, off, ...otherFields } =
      req.body;
    const validPays = [
      "cash",
      "credit",
      "check",
      "cardReader",
      "check and credit",
      "off",
    ];
    const validStatus = ["process", "completed"];
    if (!pay?.trim() || !validPays.includes(pay)) {
      return res
        .status(422)
        .json({ error: "نوع پرداخت نامعتبر است", success: false });
    }

    if (!status || !validStatus.includes(status)) {
      return res.status(422).json({
        error: "وضعیت فاکتور مشخص نشده یا اشتباه است",
        success: false,
      });
    }
    if (!seller || !isValidObjectId(seller)) {
      return res
        .status(422)
        .json({ error: "اطلاعات فروشنده اشتباه است", success: false });
    }

    if (!customer || !isValidObjectId(customer)) {
      return res
        .status(422)
        .json({ error: "اطلاعات مشتری اشتباه است", success: false });
    }
    const customerInfo = await customerModel.findOne({ _id: customer });
    if (!customerInfo) {
      return res.status(404).json({ error: "مشتری یافت نشد", success: false });
    }
    if (!Array.isArray(products) || products.length < 1) {
      return res
        .status(422)
        .json({ error: "محصولی انتخاب نشده است", success: false });
    }
    const isProductsValid = products.every(
      (p) => p.product?.trim() && p.inventory
    );
    if (!isProductsValid) {
      return res
        .status(422)
        .json({ error: "محصول نامعتبر است", success: false });
    }
    const isSellerExist = await sellerModel.findOne({ _id: seller });
    if (!isSellerExist) {
      return res
        .status(404)
        .json({ error: "فروشنده یافت نشد", success: false });
    }
    const isCustomerExist = await customerModel.findOne({ _id: customer });
    if (!isCustomerExist) {
      return res.status(404).json({ error: "مشتری یافت نشد", success: false });
    }
    for (let p of products) {
      const product = await productModel.findOne({ _id: p.product });
      if (!product) {
        return res
          .status(404)
          .json({ error: "این محصول در انبار موجود نیست", success: false });
      }
      if (product.inventory < p.inventory) {
        return res.status(422).json({
          error: "مقدار سفارش داده شده از موجودی بیشتر است",
          success: false,
        });
      }

      if (status == "completed") {
        product.inventory = product.inventory - p.inventory;
        await product.save();
      }
    }
    const parsedProducts = await Promise.all(
      products.map(async (p) => {
        const product = await productModel.findOne({ _id: p.product });
        return {
          product: p.product,
          inventory: p.inventory,
          price: p.price || product.salePrice,
        };
      })
    );

    const productPrices = parsedProducts.reduce((acc, curr) => {
      acc += curr.price * curr.inventory;
      return acc;
    }, 0);

    let priceOfInvoice = 0;
    ["price", "priceOfCredit", "priceOfCheck"].forEach((price) => {
      if (req.body[price]) {
        priceOfInvoice += req.body[price];
      }
    });

    if (priceOfInvoice < productPrices) {
      return res.status(422).json({
        error: "مبلغ دریافتی از مجموع مبلغ محصولات کمتر است",
        success: false,
      });
    }

    const priceOfCredit = req.body.priceOfCredit
      ? req.body.priceOfCredit - req.body.off
      : 0;
    const price = req.body.price ? req.body.price - req.body.off : 0;
    const invoice = await saleInvoiceModel.create({
      pay,
      customer: customerInfo._id,
      seller,
      status,
      off,
      priceOfCredit,
      price,

      ...otherFields,
      products: parsedProducts,
    });

    if (invoice.pay === "credit") {
      const price = invoice.priceOfCredit - invoice.off;
      const demands = await demandModel.find({ customer: customerInfo._id });
      if (demands.length > 0) {
        for (let d of demands) {
          if (d.price > price) {
            d.price = d.price - price;
            price = 0;
            await d.save();
          } else {
            price = price - d.price;
            await demandModel.findOneAndDelete({ customer: customerInfo._id });
          }
        }
      }

      if (price > 0) {
        const credit = await creditModel.create({
          customer: customerInfo._id,
          representation: invoice.representation,
          price,
          saleInvoice: invoice._id,
          description: invoice.description,
        });

        invoice.credit = credit._id;
        customerInfo.credit = credit._id;
        await customerInfo.save();
        await invoice.save();
      }
    } else if (invoice.pay == "check") {
      const check = await checkModel.create({
        customer: customerInfo._id,
        price: invoice.priceOfCheck,
        saleInvoice: invoice._id,
        description: invoice.description,
        status: "process",
      });
      invoice.check = check._id;
      customerInfo.check = check._id;
      await customerInfo.save();
      await invoice.save();
    } else if (invoice.pay == "check and credit") {
      const price = invoice.priceOfCredit - invoice.off;
      const demands = await demandModel.find({ customer: customerInfo._id });
      if (demands.length > 0) {
        for (let d of demands) {
          if (d.price > price) {
            d.price = d.price - price;
            price = 0;
            await d.save();
          } else {
            price = price - d.price;
            await demandModel.findOneAndDelete({
              customer: customerInfo._id,
            });
          }
        }
      }

      if (price > 0) {
        const credit = await creditModel.create({
          customer: customerInfo._id,
          representation: invoice.representation,
          price: invoice.priceOfCredit,
          saleInvoice: invoice._id,
          description: invoice.description,
        });

        invoice.credit = credit._id;
        customerInfo.credit = credit._id;
      }

      const check = await checkModel.create({
        customer: invoice.customer,
        price: invoice.priceOfCheck,
        saleInvoice: invoice._id,
        description: invoice.description,
        status: "process",
      });
      invoice.check = check._id;
      customerInfo.check = check._id;
      await invoice.save();
      await customerInfo.save();
    }

    return res
      .status(201)
      .json({ message: "فاکتور با موفقیت اضافه شد", success: true });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "خطای ناشناخته", dbError: error, success: false });
  }
});

router.put("/:id", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res
        .status(422)
        .json({ error: "آیدی فاکتور فروش معتبر نیست", success: false });
    }

    const { pay, products } = req.body;
    const validPays = ["cash", "credit", "check", "cardReader"];
    if (!pay?.trim() || !validPays.includes(pay)) {
      return res
        .status(422)
        .json({ error: "نوع پرداخت نامعتبر است", success: false });
    }

    const productPrices = products.reduce((acc, curr) => {
      acc += curr.price;
      return acc;
    }, 0);

    let priceOfInvoice = 0;
    ["price", "priceOfCredit", "priceOfCheck"].forEach((price) => {
      if (req.body[price]) {
        priceOfInvoice += req.body[price];
      }
    });

    if (priceOfInvoice < productPrices) {
      return res.status(422).json({
        error: "مبلغ دریافتی از مجموع مبلغ محصولات کمتر است",
        success: false,
      });
    }

    const saleInvoice = await saleInvoiceModel.findOneAndUpdate(
      { _id: id },
      req.body
    );

    if (!saleInvoice) {
      return res
        .status(404)
        .json({ error: "فاکتور فروش یافت نشد", success: false });
    }

    return res.json({
      message: "اطلاعات فاکتور فروش با موفقیت تغییر یافت",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

router.delete("/:id", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res
        .status(422)
        .json({ error: "آیدی فاکتور فروش معتبر نیست", success: false });
    }
    const saleInvoice = await saleInvoiceModel.findOneAndDelete({
      _id: id,
    });
    if (!saleInvoice) {
      return res
        .status(404)
        .json({ error: "فاکتور فروش یافت نشد", success: false });
    }

    await creditModel.findOneAndDelete({ saleInvoice: saleInvoice._id });

    return res.json({
      message: "فاکتور فروش با موفقیت حذف شد",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

router.post("/:id/setStatus", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res
        .status(422)
        .json({ error: "آیدی فاکتور فروش نامعتبر است", success: false });
    }
    const saleInvoice = await saleInvoiceModel.findOne({ _id: id });
    if (!saleInvoice) {
      return res
        .status(404)
        .json({ error: "فاکتور فروش یافت نشد", success: false });
    }

    for (let p of saleInvoice.products) {
      const product = await productModel.findOne({ _id: p.product });
      if (!product) {
        return res
          .status(404)
          .json({ error: "محصول یافت نشد", success: false });
      }
      if (product.inventory < p.inventory) {
        return res
          .status(422)
          .json({ error: "موجودی انبار کافی نمیباشد", success: false });
      }

      product.inventory = product.inventory - p.inventory;
      await product.save();
    }
    saleInvoice.status = "completed";
    saleInvoice.save();
    return res.json({
      message: "تغییر وضعیت فاکتور با موفقیت انجام شد",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

router.post("/filter", RBAC, async (req, res) => {
  try {
    if (!req.body) {
      return res
        .status(422)
        .json({ error: "مقادیر فیلتر نامعتبر هستند", success: false });
    }
    await connectToDb();
    const saleInvoices = await saleInvoiceModel
      .find({ ...req.body })
      .populate("customer")
      .populate("seller")
      .lean();
    if (req.query?.page) {
      const page = req.query.page * 10;
      const datas = saleInvoices.slice(page - 10, page);
      const totalPages = Math.ceil(saleInvoices.length / 10);
      return res.json({ saleInvoices: datas, totalPages, success: true });
    } else {
      return res.json({ saleInvoices, success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

router.post("/:id/return", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const { id } = req.params;
    const { products } = req.body;
    if (!id || !isValidObjectId(id)) {
      return res
        .status(422)
        .json({ error: "آیدی فاکتور فروش نامعتبر است", success: false });
    }
    const user = await userModel.findOne({});
    const saleInvoice = await saleInvoiceModel.findOne({ _id: id });
    if (!saleInvoice) {
      return res
        .status(404)
        .json({ error: "فاکتور فروش یافت نشد", success: false });
    }

    let prices = 0;
    for (let p of products) {
      const productInvoice = saleInvoice.products.find(
        (pInvoice) => pInvoice.product.toString() == p.id
      );
      if (!productInvoice) {
        return res.status(404).json({
          error: "این محصول در فاکتور فروش ثبت نشده است",
          success: false,
        });
      }
      if (p.inventory > productInvoice.inventory) {
        return res.status(422).json({
          error: "تعداد مرجوعی از تعداد فروش بیشتر است",
          success: false,
        });
      }
      for (let pInvoice of saleInvoice.products) {
        if (pInvoice.product.toString() == p.id) {
          pInvoice.inventory = pInvoice.inventory - p.inventory;
          const product = await productModel.findOne({ _id: pInvoice.product });
          product.inventory = product.inventory + p.inventory;
          await product.save();
        }
      }
      await saleInvoice.save();
      if (productInvoice.price) {
        prices += productInvoice.price * p.inventory;
      } else {
        const product = await productModel.findOne({ _id: p.id });
        if (!product) {
          return res
            .status(404)
            .json({ error: "محصول یافت نشد", success: false });
        }
        product.inventory = product.inventory + p.inventory;
        await product.save();
        prices += product.salePrice * p.inventory;
      }
    }
    if (saleInvoice?.priceOfCredit && prices == saleInvoice?.priceOfCredit) {
      prices = 0;
      saleInvoice.priceOfCredit = 0;
      await saleInvoice.save();
      await creditModel.findOneAndDelete({ _id: saleInvoice.credit });
    } else if (
      saleInvoice?.priceOfCredit &&
      prices > saleInvoice?.priceOfCredit
    ) {
      prices = prices - saleInvoice.priceOfCredit;
      saleInvoice.priceOfCredit = 0;
      await saleInvoice.save();
      await creditModel.findOneAndDelete({ _id: saleInvoice.credit });
      await demandModel.create({
        price: prices,
        user: user._id,
        customer: saleInvoice.customer,
        saleInvoice: saleInvoice._id,
      });
    } else if (
      saleInvoice?.priceOfCredit &&
      prices < saleInvoice?.priceOfCredit
    ) {
      saleInvoice.priceOfCredit = saleInvoice.priceOfCredit - prices;
      const credit = await creditModel.findOne({ _id: saleInvoice.credit });
      if (credit) {
        credit.price = credit.price - prices;
        await credit.save();
      }
      await saleInvoice.save();
      return res.json({ message: "مرجوعی با موفقیت اعمال شد", success: true });
    } else if (saleInvoice?.priceOfCheck && prices) {
      await saleInvoice.save();
      await demandModel.create({
        price: prices,
        user: user._id,
        customer: saleInvoice.customer,
        saleInvoice: saleInvoice._id,
      });
    }
    return res.json({
      message: "مرجوعی با موفقیت اعمال شد",
      success: true,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "خطای ناشناخته", success: false, dbError: error });
  }
});

module.exports = router;
