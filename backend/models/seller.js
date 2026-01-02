/** @format */

const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  firstPhone: { type: String, required: false },
  secoundPhone: { type: String, required: false },
  address: { type: String, required: false },
});

sellerSchema.virtual("representations", {
  localField: "_id",
  foreignField: "seller",
  ref: "Representation",
});
sellerSchema.virtual("receiveds", {
  localField: "_id",
  foreignField: "seller",
  ref: "Received",
});

sellerSchema.index({ fullName: 1 });

const sellerModel =
  mongoose.models.Seller || mongoose.model("Seller", sellerSchema);

module.exports = sellerModel;
