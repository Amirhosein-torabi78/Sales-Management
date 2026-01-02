/** @format */

const mongoose = require("mongoose");

const creditSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: false,
    },
    representation: {
      type: mongoose.Types.ObjectId,
      ref: "Representation",
      required: false,
    },
    price: { type: Number, required: true },
    description: { type: String, required: false },
    saleInvoice: {
      type: mongoose.Types.ObjectId,
      ref: "SaleInvoice",
      required: false,
    },
  },
  { timestamps: true }
);

creditSchema.index({ customer: 1 });
creditSchema.index({ representation: 1 });
creditSchema.index({ saleInvoice: 1 });

const creditModel =
  mongoose.models.Credit || mongoose.model("Credit", creditSchema);

module.exports = creditModel;
