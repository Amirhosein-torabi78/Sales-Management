/** @format */

const express = require("express");
const router = express.Router();
const connectToDb = require("../../utils/db");
const customerModel = require("../../models/customer");
const RBAC = require("../../utils/RBAC");
const { isValidObjectId } = require("mongoose");

router.get("/", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const customersArray = await customerModel
      .find()
      .populate("saleInvoices")
      .populate("credits")
      .populate("demands")
      .lean();

    const customers = customersArray.map((customer) => {
      const totalDemands = customer.demands.reduce((acc, curr) => {
        acc += curr.price;
        return acc;
      }, 0);
      const totalCredits = customer.credits.reduce((acc, curr) => {
        acc += curr.price;
        return acc;
      }, 0);
      const totalPurchases = customer.saleInvoices.reduce((acc, curr) => {
        acc += curr.price + curr.priceOfCredit + curr.priceOfCheck;
        return acc;
      }, 0);

      return {
        ...customer,
        totalCredits,
        totalDemands,
        totalPurchases,
        totalPays: totalPurchases - totalCredits,
      };
    });

    if (req.query?.page) {
      const page = req.query.page * 10;
      const datas = customers.slice(page - 10, page);
      const totalPages = Math.ceil(customers.length / 10);
      return res.json({ customers: datas, totalPages, success: true });
    } else {
      return res.json({ customers, success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

router.post("/", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const { fullName, firstPhone, secoundPhone } = req.body;
    if (!fullName) {
      return res
        .status(422)
        .json({ error: "ارسال نام مشتری اجباری است", success: false });
    }
    const isDuplicate = await customerModel.findOne({
      fullName,
      $or: [{ firstPhone }, { secoundPhone }],
    });
    if (isDuplicate) {
      return res
        .status(409)
        .json({ error: "این مشتری قبلا ثبت شده است", success: false });
    }
    await customerModel.create(req.body);
    return res
      .status(201)
      .json({ message: "مشتری با موفقیت اضافه شد", success: true });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

router.put("/:id", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res
        .status(422)
        .json({ error: "آیدی مشتری معتبر نیست", success: false });
    }

    const { fullName } = req.body;
    if (!fullName) {
      return res
        .status(422)
        .json({ error: "ارسال نام مشتری اجباری است", success: false });
    }

    const user = await customerModel.findOneAndUpdate({ _id: id }, req.body);

    if (!user) {
      return res.status(404).json({ error: "مشتری یافت نشد", success: false });
    }

    return res.json({
      message: "اطلاعات مشتری با موفقیت تغییر یافت",
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
        .json({ error: "آیدی مشتری معتبر نیست", success: false });
    }
    const user = await customerModel.findOneAndDelete({ _id: id });
    if (!user) {
      return res.status(404).json({ error: "مشتری یافت نشد", success: false });
    }

    return res.json({
      message: "مشتری با موفقیت حذف شد",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

router.get("/:id", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res
        .status(422)
        .json({ error: "آیدی مشتری معتبر نیست", success: false });
    }
    const customer = await customerModel
      .findOne({ _id: id })
      .populate("saleInvoices")
      .populate("credits")
      .populate("demands")
      .lean();
    if (!customer) {
      return res.status(404).json({ error: "مشتری یافت نشد", success: false });
    }
    const totalDemands = customer.demands.reduce((acc, curr) => {
      acc += curr.price;
      return acc;
    }, 0);
    const totalCredits = customer.credits.reduce((acc, curr) => {
      acc += curr.price;
      return acc;
    }, 0);
    const totalPurchases = customer.saleInvoices.reduce((acc, curr) => {
      acc += curr.price + curr.priceOfCredit + curr.priceOfCheck;
      return acc;
    }, 0);

    return res.json({
      ...customer,
      totalCredits,
      totalDemands,
      totalPurchases,
      totalPays: totalPurchases - totalCredits,
    });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

module.exports = router;
