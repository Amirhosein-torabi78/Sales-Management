/** @format */

const express = require("express");
const router = express.Router();
const connectToDb = require("../../utils/db");
const productModel = require("../../models/product");
const RBAC = require("../../utils/RBAC");
const { isValidObjectId } = require("mongoose");
const buildSearchQuery = require("../../utils/buildSearchQuery");

router.get("/", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const products = await productModel.find().lean();
    if (req.query?.page) {
      const page = req.query.page * 10;
      const datas = products.slice(page - 10, page);
      const totalPages = Math.ceil(products.length / 10);
      return res.json({ products: datas, totalPages, success: true });
    } else {
      return res.json({ products, success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

router.post("/", RBAC, async (req, res) => {
  try {
    await connectToDb();
    const { name, salePrice, purchasePrice, inventory } = req.body;
    const price = salePrice + purchasePrice;
    if (!name?.trim() || !price || price < 1) {
      return res
        .status(422)
        .json({ error: "ارسال نام و قیمت محصول اجباری است", success: false });
    }
    if (!inventory || inventory < 1) {
      return res
        .status(422)
        .json({ error: "تعداد محصول نامعتبر است", success: false });
    }
    const isDuplicate = await productModel.findOne({
      name,
    });
    if (isDuplicate) {
      return res
        .status(409)
        .json({ error: "این محصول قبلا ثبت شده است", success: false });
    }
    await productModel.create(req.body);
    return res
      .status(201)
      .json({ message: "محصول با موفقیت اضافه شد", success: true });
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
        .json({ error: "آیدی محصول معتبر نیست", success: false });
    }

    const { name, salePrice, purchasePrice } = req.body;
    const price = salePrice + purchasePrice;
    if (!name?.trim() || !price || price < 1) {
      return res
        .status(422)
        .json({ error: "ارسال نام و قیمت محصول اجباری است", success: false });
    }

    const product = await productModel.findOneAndUpdate({ _id: id }, req.body);

    if (!product) {
      return res.status(404).json({ error: "محصول یافت نشد", success: false });
    }

    return res.json({
      message: "اطلاعات محصول با موفقیت تغییر یافت",
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
        .json({ error: "آیدی محصول معتبر نیست", success: false });
    }
    await productModel.findOneAndDelete({ _id: id });

    return res.json({
      message: "محصول با موفقیت حذف شد",
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
        .json({ error: "آیدی محصول معتبر نیست", success: false });
    }
    const product = await productModel.findOne({ _id: id }).lean();
    if (!product) {
      return res.status(404).json({ error: "محصول یافت نشد", success: false });
    }
    return res.json({ product, success: true });
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
      stringFields: ["title", "name", "brand"],
      exactFields: ["price", "stock", "category"],
    });

    const products = await productModel.find(query).lean();
    if (req.query?.page) {
      const page = req.query.page * 10;
      const datas = products.slice(page - 10, page);
      const totalPages = Math.ceil(products.length / 10);
      return res.json({ products: datas, totalPages, success: true });
    }

    return res.json({ products, success: true });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

module.exports = router;
