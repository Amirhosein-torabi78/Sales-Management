/** @format */

const mongoose = require("mongoose");

const representationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  firstPhone: { type: String, required: false },
  secoundPhone: { type: String, required: false },
  address: { type: String, required: false },
});

representationSchema.virtual("credits", {
  localField: "_id",
  ref: "Cerdit",
  foreignField: "representation",
});

representationSchema.virtual("PurchaseInvoices", {
  localField: "_id",
  ref: "PurchaseInvoice",
  foreignField: "representation",
});

representationSchema.virtual("demands", {
  localField: "_id",
  ref: "Demand",
  foreignField: "representation",
});

representationSchema.index({ name: 1 });

const representationModel =
  mongoose.models.Representation ||
  mongoose.model("Representation", representationSchema);

module.exports = representationModel;
