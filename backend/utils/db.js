/** @format */

const mongoose = require("mongoose");

async function connectToDb() {
  if (!mongoose.connections[0].readyState) {
    await mongoose.connect(process.env.MONGODBURI);
  }
}

module.exports = connectToDb;
