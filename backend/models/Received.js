/** @format */

const mongoose = require("mongoose");

const receivedSchema = new mongoose.Schema(
  {
    price: { type: Number, required: true },
    customer: {
      type: mongoose.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    seller: { type: mongoose.Types.ObjectId, required: true },
    description: { type: String, required: false },
    saleInvoice: { type: mongoose.Types.ObjectId, ref: "SaleInvoice" },
  },
  { timestamps: true }
);

receivedSchema.index({ customer: 1 });
receivedSchema.index({ seller: 1 });
receivedSchema.index({ saleInvoice: 1 });

const receivedModel =
  mongoose.models.Received || mongoose.model("Received", receivedSchema);

module.exports = receivedModel;
