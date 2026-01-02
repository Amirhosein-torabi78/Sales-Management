/** @format */

const express = require("express");
const router = express.Router();
const connectToDb = require("../../utils/db");
const RBAC = require("../../utils/RBAC");
const checkModel = require("../../models/check");
const { isValidObjectId } = require("mongoose");

router.get("/checks", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const checks = await checkModel
      .find()
      .populate("check")
      .populate("saleInvoice")
      .lean();
    if (req.query?.page) {
      const page = req.query.page * 10;
      const datas = checks.slice(page - 10, page);
      const totalPages = Math.ceil(checks.length / 10);
      return res.json({ checks: datas, totalPages, success: true });
    } else {
      return res.json({ checks, success: true });
    }
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
        .json({ error: "آیدی چک معتبر نیست", success: false });
    }
    const user = await checkModel.findOneAndDelete({ _id: id });
    if (!user) {
      return res.status(404).json({ error: "چک یافت نشد", success: false });
    }

    return res.json({
      message: "چک با موفقیت حذف شد",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});



module.exports = router;
