/** @format */

const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  firstPhone: { type: String, required: false },
  secoundPhone: { type: String, required: false },
  address: { type: String, required: false },
});

customerSchema.virtual("credits", {
  ref: "Credit",
  localField: "_id",
  foreignField: "customer",
});

customerSchema.virtual("saleInvoices", {
  ref: "SaleInvoice",
  localField: "_id",
  foreignField: "customer",
});

customerSchema.virtual("demands", {
  ref: "Demand",
  localField: "_id",
  foreignField: "customer",
});

customerSchema.virtual("receiveds", {
  ref: "Received",
  localField: "_id",
  foreignField: "customer",
});

customerSchema.index({ fullName: 1 });

const customerModel =
  mongoose.models.Customer || mongoose.model("Customer", customerSchema);

module.exports = customerModel;
