// cloud_name: "dbu3ntrbw",
const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAuthenticated");

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    if (
      req.fields.description.length > 500 ||
      req.fields.title.length > 50 ||
      req.fields.price > 100000
    ) {
      res.status(401).json({
        message:
          "Offer description and/or title is too long, or price is too high",
      });
    } else {
      const pictureToUpload = req.files.picture.path;
      const result = await cloudinary.uploader.upload(pictureToUpload, {
        folder: `vinted/offers/`,
      });

      const newOffer = new Offer({
        product_name: req.fields.title,
        product_description: req.fields.description,
        product_price: req.fields.price,
        product_details: [
          {
            MARQUE: req.fields.brand,
          },
          {
            TAILLE: req.fields.size,
          },
          {
            ETAT: req.fields.condition,
          },
          {
            COULEUR: req.fields.color,
          },
          {
            EMPLACEMENT: req.fields.city,
          },
        ],
        owner: req.user,
        product_image: result.secure_url,
      });

      await newOffer.save();

      res.status(200).json(newOffer);
    }
  } catch (error) {
    res.status(401).json({ error: { message: error.message } });
  }
});

router.put("/offer/modify", isAuthenticated, async (req, res) => {
  try {
    const pictureToUpload = req.files.picture.path;
    const result = await cloudinary.uploader.upload(pictureToUpload, {
      folder: `vinted/offers/`,
    });

    const offerToUpdate = await findByIdAndUpdate(req.fields.id, {
      product_name: req.fields.title,
      product_description: req.fields.description,
      product_price: req.fields.price,
      product_details: [
        {
          MARQUE: req.fields.brand,
        },
        {
          TAILLE: req.fields.size,
        },
        {
          ETAT: req.fields.condition,
        },
        {
          COULEUR: req.fields.color,
        },
        {
          EMPLACEMENT: req.fields.city,
        },
      ],
      product_image: result.secure_url,
    });

    if (offerToUpdate) {
      res.status(200).json({ message: "Offer successfully updated" });
    } else {
      res.status(400).json({ error: "This offer doesn't exist" });
    }
  } catch (error) {
    res.status(401).json({ error: { message: error.message } });
  }
});

router.get("/offers", async (req, res) => {
  try {
    const filters = {};

    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }

    if (req.query.priceMin || req.query.priceMax) {
      filters.product_price = {};

      if (req.query.priceMin) {
        filters.product_price.$gte = Number(req.query.priceMin);
      }

      if (req.query.priceMax) {
        filters.product_price.$lte = Number(req.query.priceMax);
      }
    }

    const sortObject = {};
    if (req.query.sort === "price-desc") {
      sortObject.product_price = "desc";
    } else if (req.query.sort === "price-asc") {
      sortObject.product_price = "asc";
    }

    let page;
    if (Number(req.query.page) < 1) {
      page = 1;
    } else {
      page = Number(req.query.page);
    }

    let limit = Number(req.query.limit);

    const offers = await Offer.find(filters)
      .populate({
        path: "owner",
        select: "account",
      })
      .sort(sortObject)
      .skip((page - 1) * limit)
      .limit(limit);

    const count = await Offer.countDocuments(filters);

    res.status(200).json({ count: count, offers: offers });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const getOffer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    if (getOffer) {
      res.status(200).json(getOffer);
    } else {
      res.status(400).json({ message: "Wrong ID" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
