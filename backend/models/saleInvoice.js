/** @format */

const mongoose = require("mongoose");
const creditModel = require("./credit");

const saleInvoiceSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    seller: {
      type: mongoose.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    credit: { type: mongoose.Types.ObjectId, ref: "Credit" },
    check: { type: mongoose.Types.ObjectId, ref: "Check" },
    description: { type: String, required: false },
    price: { type: Number, required: false },
    priceOfCredit: { type: Number, required: false },
    priceOfCheck: { type: Number, required: false },
    pay: {
      type: String,
      required: true,
      enum: ["cash", "credit", "check", "cardReader", "check and credit"],
    },
    products: [
      {
        product: {
          type: mongoose.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        inventory: { type: Number, required: true },
        price: { type: Number, required: false },
      },
    ],
    status: { type: String, enum: ["process", "completed"], required: true },
    demand: { type: mongoose.Types.ObjectId, ref: "Demand", required: false },
    off: { type: Number, required: true },
  },
  { timestamps: true }
);

saleInvoiceSchema.index({ customer: 1 });
saleInvoiceSchema.index({ pay: 1 });
saleInvoiceSchema.index({ seller: 1 });
saleInvoiceSchema.index({ status: 1 });

const saleInvoiceModel =
  mongoose.models.saleInvoice ||
  mongoose.model("SaleInvoice", saleInvoiceSchema);

module.exports = saleInvoiceModel;
