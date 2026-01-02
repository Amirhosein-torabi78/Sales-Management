/** @format */

const mongoose = require("mongoose");

const demandSchema = new mongoose.Schema(
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
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    price: { type: Number, required: true },
    saleInvoice: {
      type: mongoose.Types.ObjectId,
      ref: "SaleInvoice",
      required: false,
    },
    purchaseInvoice: {
      type: mongoose.Types.ObjectId,
      ref: "PurchaseInvoice",
      required: false,
    },
  },
  { timestamps: true }
);

demandSchema.index({ customer: 1 });
demandSchema.index({ representation: 1 });
demandSchema.index({ saleInvoice: 1 });

const demandModel =
  mongoose.models.Demand || mongoose.model("Demand", demandSchema);

module.exports = demandModel;
