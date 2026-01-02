/** @format */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectToDb = require("./utils/db");
const loginRouter = require("./api/auth/login");
const logoutRouter = require("./api/auth/logout");
const forgotPasswordRouter = require("./api/auth/forgotPassword");
const customerRouter = require("./api/customer/index");
const representationsRouter = require("./api/representation/index");
const saleInvoicesRouter = require("./api/saleInvoice/index");
const creditsRouter = require("./api/credit/index");
const productsRouter = require("./api/products/index");
const refreshRouter = require("./api/auth/refresh");
const meRouter = require("./api/auth/me");
const sellersRouter = require("./api/seller/index");
const receivedsRouter = require("./api/received/index");
const purchaseinvoiceRouter = require("./api/purchaseInvoice/index");
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "http://localhost:3000",
    ],
  })
);

app.use(cookieParser());
app.use("/login", loginRouter);
app.use("/logout", logoutRouter);
app.use("/forgotPassword", forgotPasswordRouter);
app.use("/customers", customerRouter);
app.use("/refresh", refreshRouter);
app.use("/me", meRouter);
app.use("/products", productsRouter);
app.use("/representations", representationsRouter);
app.use("/saleInvoices", saleInvoicesRouter);
app.use("/credits", creditsRouter);
app.use("/sellers", sellersRouter);
app.use("/receiveds", receivedsRouter);
app.use("/purchaseinvoices", purchaseinvoiceRouter);
const pathName = path.join(__dirname, "../assets");
app.use(express.static(pathName));

const PORT = process.env.PORT;

connectToDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });
