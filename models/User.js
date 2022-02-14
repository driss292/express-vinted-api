const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: String,
  account: {
    username: String,
    phone: String,
    avatar: Object,
  },
  token: String,
  hash: String,
  salt: String,
});

module.exports = User;
