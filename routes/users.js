const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Offer = require("../models/Offer");

//Outils pour hashage
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

router.post("/user/signup", async (req, res) => {
  try {
    const findUserMail = await User.findOne({ email: req.fields.email });

    if (findUserMail === null) {
      if (
        req.fields.username &&
        req.fields.username !== "" &&
        isNaN(req.fields.username)
      ) {
        const password = req.fields.password;
        const salt = uid2(16);
        const hash = SHA256(password + salt).toString(encBase64);
        const token = uid2(16);

        const newUser = new User({
          email: req.fields.email,
          account: {
            username: req.fields.username,
            phone: req.fields.phone,
          },
          token: token,
          hash: hash,
          salt: salt,
        });

        newUser.save();

        const userInfo = {
          id: newUser.id,
          token: newUser.token,
          account: {
            username: newUser.account.username,
            phone: newUser.account.phone,
          },
        };

        res.status(200).json(userInfo);
      } else {
        res.status(400).json({ message: "Invalid or missing username" });
      }
    } else {
      res
        .status(400)
        .json({ message: "Account with this email already exists" });
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const currentUser = await User.findOne({ email: req.fields.email });
    // console.log(currentUser);

    if (currentUser) {
      const password = req.fields.password;
      const salt = currentUser.salt;
      const hash = SHA256(password + salt).toString(encBase64);

      if (hash === currentUser.hash) {
        const userInfo = {
          id: currentUser.id,
          token: currentUser.token,
          account: {
            username: currentUser.account.username,
            phone: currentUser.account.phone,
          },
        };

        res.status(202).json(userInfo);
      } else {
        res.status(400).json({ message: "Wrong password" });
      }
    } else {
      res.status(400).json({ message: "Email is invalid" });
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

module.exports = router;
