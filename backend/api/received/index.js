/** @format */

const express = require("express");
const router = express.Router();
const connectToDb = require("../../utils/db");
const receivedModel = require("../../models/Received");
const sellerModel = require("../../models/seller");
const customerModel = require("../../models/customer");
const saleInvoiceModel = require("../../models/saleInvoice");
const creditModel = require("../../models/credit");
const demandModel = require("../../models/demand");
const RBAC = require("../../utils/RBAC");
const { isValidObjectId } = require("mongoose");
const userModel = require("../../models/user");

router.get("/", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const receiveds = await receivedModel
      .find()
      .populate("customer")
      .populate("seller")
      .populate("saleInvoice")
      .lean();
    if (req.query?.page) {
      const page = req.query.page * 10;
      const datas = receiveds.slice(page - 10, page);
      const totalPages = Math.ceil(receiveds.length / 10);
      return res.json({ receiveds: datas, totalPages, success: true });
    } else {
      return res.json({ receiveds, success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

router.post("/", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const { price, customer, seller } = req.body;
    if (!price || price < 1) {
      return res
        .status(422)
        .json({ error: "قیمت نا معتبر است", success: false });
    }
    if (!isValidObjectId(customer) || !isValidObjectId(seller)) {
      return res
        .status(422)
        .json({ error: "آیدی مشتری یا فروشنده نامعتبر است", success: false });
    }
    const Seller = await sellerModel.findOne({ _id: seller });
    if (!Seller) {
      return res
        .status(404)
        .json({ error: "فروشنده یافت نشد", success: false });
    }
    const Customer = await customerModel.findOne({ _id: customer });
    if (!Customer) {
      return res.status(404).json({ error: "مشتری یافت نشد", success: false });
    }
    const user = await userModel.findOne();
    await receivedModel.create(req.body);
    const saleInvoices = await saleInvoiceModel.find({ customer });
    const credits = await creditModel.find({ customer });
    if (credits.length < 1) {
      await demandModel.create({
        customer,
        price,
        user: user._id,
      });
      return res
        .status(201)
        .json({ message: "دریافتی با موفقیت ثبت شد", success: true });
    }
    let realPrice = price;
    for (let invoice of saleInvoices) {
      if (invoice.priceOfCredit) {
        const credit = await creditModel.findOne({ _id: invoice.credit });
        if (invoice.priceOfCredit > realPrice) {
          invoice.priceOfCredit = invoice.priceOfCredit - realPrice;
          invoice.price = invoice.priceOfCredit - realPrice;
          credit.price = credit.price - realPrice;
          await invoice.save();
          await credit.save();
          realPrice = 0;
        } else if (invoice.priceOfCredit < realPrice) {
          realPrice = realPrice - invoice.priceOfCredit;
          invoice.price = invoice.price + invoice.priceOfCredit;
          invoice.priceOfCredit = 0;
          await invoice.save();
          await creditModel.findOneAndDelete({ _id: invoice.credit });
        } else {
          realPrice = 0;
          invoice.price = invoice.price + invoice.priceOfCredit;
          invoice.priceOfCredit = 0;
          await invoice.save();
          await creditModel.findOneAndDelete({
            _id: invoice.credit,
          });
        }
      }
    }
    return res
      .status(201)
      .json({ message: "دریافتی با موفقیت ثبت شد", success: true });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "خطای ناشناخته", dbError: error, success: false });
  }
});

router.put("/:id", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const { price, customer, seller } = req.body;
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res
        .status(422)
        .json({ error: "آیدی دریافتی نا معتبر است", success: false });
    }
    if (!price || price < 1) {
      return res
        .status(422)
        .json({ error: "قیمت نا معتبر است", success: false });
    }
    if (!isValidObjectId(customer) || !isValidObjectId(seller)) {
      return res
        .status(422)
        .json({ error: "آیدی مشتری یا فروشنده نامعتبر است", success: false });
    }
    const Seller = await sellerModel.findOne({ _id: seller });
    if (!Seller) {
      return res
        .status(404)
        .json({ error: "فروشنده یافت نشد", success: false });
    }
    const Customer = await customerModel.findOne({ _id: customer });
    if (!Customer) {
      return res.status(404).json({ error: "مشتری یافت نشد", success: false });
    }
    await receivedModel.findOneAndReplace({ _id: id }, req.body);
    return res
      .status(201)
      .json({ message: "دریافتی با موفقیت ویرایش شد", success: true });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "خطای ناشناخته", dbError: error, success: false });
  }
});

router.delete("/:id", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res
        .status(422)
        .json({ error: "آیدی دریافتی معتبر نیست", success: false });
    }
    await receivedModel.findOneAndDelete({ _id: id });

    return res.json({
      message: "دریافتی با موفقیت حذف شد",
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
        .json({ error: "آیدی دریافتی معتبر نیست", success: false });
    }
    const received = await receivedModel.findOne({ _id: id }).lean();
    if (!received) {
      return res
        .status(404)
        .json({ error: "دریافتی یافت نشد", success: false });
    }
    return res.json({ received, success: true });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

module.exports = router;
