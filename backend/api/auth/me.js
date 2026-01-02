/** @format */

const express = require("express");
const router = express.Router();
const connectToDb = require("../../utils/db");
const RBAC = require("../../utils/RBAC");

router.get("/", RBAC ,  async (req, res) => {
  try {
    await connectToDb();
    const {user} = req
    return res.json({ user, success: true });
  } catch (error) {
    return res.status(500).json({ error: "خطای ناشناخته", success: false });
  }
});

module.exports = router;
