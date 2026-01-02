/** @format */

const { serialize } = require("cookie");
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  try {
    return res
      .setHeader("Set-Cookie", [
        serialize("token", "", {
          path: "/",
          maxAge: 0,
          httpOnly: true,
        }),
        serialize("refreshToken", "", {
          path: "/",
          maxAge: 0,
          httpOnly: true,
        }),
      ])
      .json({ message: "با موفقیت خارج شدید", success: true });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

module.exports = router;
