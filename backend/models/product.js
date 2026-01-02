/** @format */

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    purchasePrice: { type: Number, required: true },
    salePrice: { type: Number, required: true },
    inventory: { type: Number, require: true, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: 1 });

const productModel =
  mongoose.models.Product || mongoose.model("Product", productSchema);

module.exports = productModel;
