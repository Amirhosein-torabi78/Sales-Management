/** @format */

const { hash, compare } = require("bcrypt");

async function hashPassword(password) {
  const hashedPassword = await hash(password, 12);
  return hashedPassword;
}

async function verifyPassword(originalPassword, hashedPassword) {
  const isPasswordValid = await compare(originalPassword, hashedPassword);
  return isPasswordValid;
}

module.exports = { hashPassword, verifyPassword };
