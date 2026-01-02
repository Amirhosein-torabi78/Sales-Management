/** @format */

const mongoose = require("mongoose");

const checkSchema = new mongoose.Schema(
  {
    price: { type: Number, required: true },
    customer: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    saleInvoice: {
      type: mongoose.Types.ObjectId,
      ref: "SaleInvoice",
      required: true,
    },
    description: { type: String, required: false },
    status: {
      type: String,
      required: true,
      enum: ["passed", "process", "return"],
    },
  },
  { timestamps: true }
);

checkSchema.index({ customer: 1 });
checkSchema.index({ status: 1 });

const checkModel =
  mongoose.models.Check || mongoose.model("Check", checkSchema);
module.exports = checkModel;
