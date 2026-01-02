/** @format */

const { sign, verify } = require("jsonwebtoken");

function generateToken(data) {
  const token = sign(data, process.env.SIGNATURE, {
    expiresIn: "24h",
  });
  return token;
}

function generateRefreshToken(data) {
  const refreshToken = sign(data, process.env.SIGNATURE, {
    expiresIn: "7d",
  });
  return refreshToken;
}

function verifyToken(token) {
  const accessToken = verify(token, process.env.SIGNATURE);
  return accessToken;
}

module.exports = { generateToken, verifyToken, generateRefreshToken };
