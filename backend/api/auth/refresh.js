/** @format */

const express = require("express");
const router = express.Router();
const {
  generateToken,
  generateRefreshToken,
  verifyToken,
} = require("../../utils/tokenConf");
const { serialize } = require("cookie");

router.get("/", async (req, res) => {
  try {
    if (!req.cookies?.refreshToken) {
      console.log(req.cookies);
      return res
        .status(403)
        .json({ error: "لطفا در سایت ثبت نام کنید", success: false });
    }
    const { email } = verifyToken(req.cookies?.refreshToken);
    if (!email) {
      return res
        .status(422)
        .json({ error: "دسترسی نامعتبر است", success: false });
    }
    const token = generateToken({ email });
    const refreshToken = generateRefreshToken({ email });
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
      .json({ success: false, success: true });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

module.exports = router;
