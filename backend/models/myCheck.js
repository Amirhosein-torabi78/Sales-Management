/** @format */

const mongoose = require("mongoose");

const myCheckSchema = new mongoose.Schema(
  {
    price: { type: Number, required: true },
    representation: {
      type: mongoose.Types.ObjectId,
      ref: "Representation",
      required: true,
    },
    purchaseInvoice: {
      type: mongoose.Types.ObjectId,
      ref: "PurchaseInvoice",
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

myCheckSchema.index({ representation: 1 });
myCheckSchema.index({ status: 1 });

const myCheckModel =
  mongoose.models.MyCheck || mongoose.model("MyCheck", myCheckSchema);
module.exports = myCheckModel;
