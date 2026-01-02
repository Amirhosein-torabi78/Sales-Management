/** @format */

const mongoose = require("mongoose");

const purchaseInvoiceShcema = new mongoose.Schema(
  {
    representation: {
      type: mongoose.Types.ObjectId,
      ref: "Representation",
      required: true,
    },
    price: { type: Number, required: false },
    priceOfCheck: { type: Number, required: false },
    priceOfCredit: { type: Number, required: false },
    description: { type: String, required: false },
    pay: {
      type: String,
      required: true,
      enum: ["cash", "credit", "check", "cardReader", "check and credit"],
    },
    products: [
      {
        name: { type: String, required: true },
        purchasePrice: { type: Number, required: true },
        salePrice: { type: Number, required: true },
        inventory: { type: Number, require: true, default: 0 },
      },
    ],
    demand: { type: mongoose.Types.ObjectId, ref: "Demand", required: false },
    check: { type: mongoose.Types.ObjectId, ref: "MyCheck", required: false },
    off: { type: Number, required: false },
  },
  { timestamps: true }
);

purchaseInvoiceShcema.index({ representation: 1 });

const purchaseInvoiceModel =
  mongoose.models.PurchaseInvoice ||
  mongoose.model("PurchaseInvoice", purchaseInvoiceShcema);

module.exports = purchaseInvoiceModel;
