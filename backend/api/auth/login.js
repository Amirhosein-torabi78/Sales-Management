/** @format */

const express = require("express");
const connectToDb = require("../../utils/db");
const userModel = require("../../models/user");
const { verifyPassword } = require("../../utils/passwordConf");
const {
  generateToken,
  generateRefreshToken,
} = require("../../utils/tokenConf");
const { serialize } = require("cookie");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    await connectToDb();

    const { userName, password } = req.body;
    if (!userName?.trim() || !password?.trim()) {
      return res
        .status(422)
        .json({ error: "نام کاربری یا رمز عبور الزامی است", success: false });
    }
    const user = await userModel.findOne({ userName: userName });

    if (!user) {
      return res.status(404).json({ error: "کاربر یافت نشد", success: false });
    }

    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return res
        .status(403)
        .json({ error: "رمز عبور نادرست است", success: false });
    }
    const token = generateToken({ email: user.email });
    const refreshToken = generateRefreshToken({ email: user.email });

    return res
      .setHeader("Set-Cookie", [
        serialize("token", token, {
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60 * 24,
        }),
        serialize("refreshToken", refreshToken, {
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        }),
      ])
      .status(200)
      .json({ message: "با موفقیت وارد شدید", success: true });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

module.exports = router;
