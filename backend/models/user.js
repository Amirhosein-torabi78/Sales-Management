/** @format */

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
});

userSchema.virtual('demands', {
  localField : "_id",
  foreignField : "user",
  ref : "Demand"
})

const userModel = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = userModel;
