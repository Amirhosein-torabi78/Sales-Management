/** @format */

const express = require("express");
const router = express.Router();
const connectToDb = require("../../utils/db");
const creditModel = require("../../models/credit");
const RBAC = require("../../utils/RBAC");
const { isValidObjectId } = require("mongoose");

router.get("/", RBAC , async (req, res) => {
  try {
    await connectToDb();
    const credits = await creditModel
      .find()
      .populate("customer")
      .populate("saleInvoices")
      .lean();

      // just -id send of purchaseInvoices send to front-end
    if (req.query?.page) {
      const page = req.query.page * 10;
      const datas = credits.slice(page - 10, page);
      const totalPages = Math.ceil(credits.length / 10);
      return res.json({ credits: datas, totalPages, success: true });
    } else {
      return res.json({ credits, success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

router.put("/:id", RBAC ,  async (req, res) => {
  try {
    await connectToDb();
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res
        .status(422)
        .json({ error: "آیدی نسیه معتبر نیست", success: false });
    }

    const { price } = req.body;
    if (![price || price < 1]) {
      return res
        .status(422)
        .json({ error: "ارسال نام نسیه اجباری است", success: false });
    }

    const credit = await creditModel.findOneAndUpdate({ _id: id }, req.body);

    if (!credit) {
      return res.status(404).json({ error: "نسیه یافت نشد", success: false });
    }

    return res.json({
      message: "اطلاعات نسیه با موفقیت تغییر یافت",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

router.delete("/:id", RBAC ,  async (req, res) => {
  try {
    await connectToDb();
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res
        .status(422)
        .json({ error: "آیدی نسیه معتبر نیست", success: false });
    }
    const cerdit = await creditModel.findOneAndDelete({ _id: id });
    if (!cerdit) {
      return res.status(404).json({ error: "نسیه یافت نشد", success: false });
    }

    return res.json({
      message: "نسیه با موفقیت حذف شد",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

module.exports = router;
