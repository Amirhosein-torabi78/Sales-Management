/** @format */

const express = require("express");
const router = express.Router();
const connectToDb = require("../../utils/db");
const sellerModel = require("../../models/seller");
const RBAC = require("../../utils/RBAC");
const { isValidObjectId } = require("mongoose");

router.get("/", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const seller = await sellerModel.find().lean();
    if (req.query?.page) {
      const page = req.query.page * 10;
      const datas = seller.slice(page - 10, page);
      const totalPages = Math.ceil(seller.length / 10);
      return res.json({ seller: datas, totalPages, success: true });
    } else {
      return res.json({ seller, success: true });
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
        .json({ error: "ارسال نام فروشنده اجباری است", success: false });
    }
    const isDuplicate = await sellerModel.findOne({
      fullName,
      $or: [{ firstPhone }, { secoundPhone }],
    });
    if (isDuplicate) {
      return res
        .status(409)
        .json({ error: "این فروشنده قبلا ثبت شده است", success: false });
    }
    await sellerModel.create(req.body);
    return res
      .status(201)
      .json({ message: "فروشنده با موفقیت اضافه شد", success: true });
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
        .json({ error: "آیدی فروشنده معتبر نیست", success: false });
    }

    const { fullName } = req.body;
    if (!fullName) {
      return res
        .status(422)
        .json({ error: "ارسال نام فروشنده اجباری است", success: false });
    }

    const user = await sellerModel.findOneAndUpdate({ _id: id }, req.body);

    if (!user) {
      return res
        .status(404)
        .json({ error: "فروشنده یافت نشد", success: false });
    }

    return res.json({
      message: "اطلاعات فروشنده با موفقیت تغییر یافت",
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
        .json({ error: "آیدی فروشنده معتبر نیست", success: false });
    }
    const user = await sellerModel.findOneAndDelete({ _id: id });
    if (!user) {
      return res
        .status(404)
        .json({ error: "فروشنده یافت نشد", success: false });
    }

    return res.json({
      message: "فروشنده با موفقیت حذف شد",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

module.exports = router;
