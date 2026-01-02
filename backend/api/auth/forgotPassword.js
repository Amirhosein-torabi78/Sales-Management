/** @format */

const express = require("express");
const router = express.Router();
const connectToDb = require("../../utils/db");
const userModel = require("../../models/user");
const { hashPassword } = require("../../utils/passwordConf");

router.post("/", async (req, res) => {
  try {
    await connectToDb();
    const { email, newPassword } = req.body;

    if (!email) {
      return res.status(422).json({ error: "ایمیل مشخص نیست", success: false });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ error: "کاربری با این ایمیل یافت نشد", success: false });
    }

    if (!newPassword) {
      return res
        .status(422)
        .json({ error: "رمز عبور جدید مشخص نیست", success: false });
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    user.save();
    return res.json({
      message: "رمز عبور با موفقیت تغییر یافت",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

module.exports = router;
