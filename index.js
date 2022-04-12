require("dotenv").config();

const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(formidable());

mongoose.connect(process.env.MONGODB_URI);

const signupRoutes = require("./routes/users");
app.use(signupRoutes);
const offersRoutes = require("./routes/offers");
app.use(offersRoutes);
const paymentRoutes = require("./routes/payment");
app.use(paymentRoutes);

app.get("/", (req, res) => {
  res.json("Bienvenue sur l'API de Vinted");
});

app.get("*", (req, res) => {
  res.status(404).json({ message: "This page doesn't exist" });
});

app.listen(process.env.PORT, () => {
  console.log("Server has started");
});
