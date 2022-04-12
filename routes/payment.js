const express = require("express");
const formidable = require("express-formidable");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_KEY);
router.use(formidable());

router.post("/payment", async (req, res) => {
  try {
    const response = await stripe.charges.create({
      amount: (req.fields.amount * 100).toFixed(0),
      currency: "eur",
      description: `Paiement Vinted pour : ${req.fields.title}`,
      source: req.fields.token,
    });

    res.status(200).json({ response });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
