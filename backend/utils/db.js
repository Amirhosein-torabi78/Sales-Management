/** @format */
const mongoose = require("mongoose");

async function connectToDb() {
  try {
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODBURI);
    }
  } catch (error) {
    throw error;
  }
}

module.exports = connectToDb;
