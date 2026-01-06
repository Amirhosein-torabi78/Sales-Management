/** @format */

const express = require("express");
const router = express.Router();
const connectToDb = require("../../utils/db");
const representationModel = require("../../models/representation");
const RBAC = require("../../utils/RBAC");
const { isValidObjectId } = require("mongoose");
const buildSearchQuery = require("../../utils/buildSearchQuery");

router.get("/", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const representations = await representationModel.find().lean();
    if (req.query?.page) {
      const page = req.query.page * 10;
      const datas = representations.slice(page - 10, page);
      const totalPages = Math.ceil(representations.length / 10);
      return res.json({ representations: datas, totalPages, success: true });
    } else {
      return res.json({ representations, success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

router.post("/", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const { name, firstPhone, secoundPhone } = req.body;
    if (!name) {
      return res
        .status(422)
        .json({ error: "ارسال نام نمایندگی اجباری است", success: false });
    }
    const isDuplicate = await representationModel.findOne({
      name,
      $or: [{ firstPhone }, { secoundPhone }],
    });
    if (isDuplicate) {
      return res
        .status(409)
        .json({ error: "این نمایندگی قبلا ثبت شده است", success: false });
    }
    await representationModel.create(req.body);
    return res
      .status(201)
      .json({ message: "نمایندگی با موفقیت اضافه شد", success: true });
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
        .json({ error: "آیدی نمایندگی معتبر نیست", success: false });
    }

    const { name } = req.body;
    if (!name) {
      return res
        .status(422)
        .json({ error: "ارسال نام نمایندگی اجباری است", success: false });
    }

    const user = await representationModel.findOneAndUpdate(
      { _id: id },
      req.body
    );

    if (!user) {
      return res
        .status(404)
        .json({ error: "نمایندگی یافت نشد", success: false });
    }

    return res.json({
      message: "اطلاعات نمایندگی با موفقیت تغییر یافت",
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
        .json({ error: "آیدی نمایندگی معتبر نیست", success: false });
    }
    const user = await representationModel.findOneAndDelete({ _id: id });
    if (!user) {
      return res
        .status(404)
        .json({ error: "نمایندگی یافت نشد", success: false });
    }

    return res.json({
      message: "نمایندگی با موفقیت حذف شد",
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
        .json({ error: "آیدی نمایندگی معتبر نیست", success: false });
    }
    const representation = await representationModel
      .findOne({ _id: id })
      .lean();
    if (!representation) {
      return res
        .status(404)
        .json({ error: "نمایندگی یافت نشد", success: false });
    }
    return res.json({ representation, success: true });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

router.post("/search", RBAC, async (req, res) => {
  try {
    await connectToDb();

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(422).json({
        error: "لطفا مقداری را برای سرچ معین کنید",
        success: false,
      });
    }

    const query = buildSearchQuery({
      body: req.body,
      stringFields: ["name", "address"],
      exactFields: ["firstPhone", "secoundPhone"],
    });

    const representations = await representationModel.find(query).lean();
    if (req.query?.page) {
      const page = req.query.page * 10;
      const datas = representations.slice(page - 10, page);
      const totalPages = Math.ceil(representations.length / 10);
      return res.json({ representations: datas, totalPages, success: true });
    }

    return res.json({ representations, success: true });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

module.exports = router;
