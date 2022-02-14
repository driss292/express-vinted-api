const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary");

const Offer = require("../models/Offer");
const User = require("../models/User");

cloudinary.config({
  cloud_name: "dbu3ntrbw",
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const isAuthenticated = async (req, res, next) => {
  if (req.headers.authorization) {
    const user = await User.findOne({
      token: req.headers.authorization.replace("Bearer ", ""),
    });

    if (user) {
      req.user = user;
      next();
    } else {
      res.status(401).json({ error: "UNAUTHORIZED " });
    }
  } else {
    res.status(401).json({ error: "UNAUTHORIZED " });
  }
};

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const newOffer = new Offer({
      product_name: req.fields.title,
      product_description: req.fields.description,
      product_price: req.fields.price,
      product_details: [
        { MARQUE: req.fields.brand },
        { TAILLE: req.fields.size },
        { ETAT: req.fields.condition },
        { COULEUR: req.fields.color },
        { EMPLACEMENT: req.fields.city },
      ],
    });

    const result = await cloudinary.uploader.upload(req.files.picture.path);
    newOffer.product_image = result;
    newOffer.owner = req.user;

    await newOffer.save();
    res.json(newOffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ------------------------------------------------

router.post("/offers", async (req, res) => {
  try {
    const filtersObject = {};
    if (req.query.title) {
      filtersObject.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin) {
      filtersObject.product_price = {
        $gte: req.query.priceMin,
      };
    }

    if (req.query.priceMax) {
      if (filtersObject.product_price) {
        filtersObject.product_price.$lte = req.query.priceMax;
      } else {
        filtersObject.product_price = {
          $lte: req.query.priceMax,
        };
      }
    }

    const sortObject = {};
    if (req.query.sort === "price-desc") {
      sortObject.product_price = "desc";
    } else if (req.query.sort === "price-asc") {
      sortObject.product_price = "asc";
    }

    let limit = 3;
    if (req.query.limit) {
      limit = req.query.limit;
    }
    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const offers = await Offer.find(filtersObject)
      .sort(sortObject)
      .skip(page - 1)
      .limit(limit)
      .select("product_name product_price");

    const count = await Offer.countDocuments(filtersObject);

    res.json({ count: count, oofers: offers });
  } catch (error) {
    res.status(400).json({ message: errror.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account.username account.phone",
    });
    res.status(200).json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
