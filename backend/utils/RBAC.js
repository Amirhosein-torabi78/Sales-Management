/** @format */

const { verifyToken } = require("./tokenConf");
const userModel = require("../models/user");

async function RBAC(req, res, next) {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({
        error: "لطفا وارد حساب کاربری خود شوید",
        success: false,
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(422).json({
        error: "توکن نامعتبر است",
        success: false,
      });
    }

    if (!decoded?.email) {
      return res.status(422).json({
        error: "دسترسی نامعتبر است",
        success: false,
      });
    }

    const user = await userModel.findOne({ email: decoded.email }, "-password");

    if (!user) {
      return res.status(404).json({
        error: "کاربری یافت نشد",
        success: false,
      });
    }

    // اتصال داده به req
    req.user = user;
    req.email = decoded.email;

    next(); // این مهم ترین بخشه
  } catch (err) {
    return res.status(500).json({
      error: "مشکل داخلی سرور",
      success: false,
    });
  }
}

module.exports = RBAC;
