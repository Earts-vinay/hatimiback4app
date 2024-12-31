const express = require("express");
const {
    createContactUs
} = require("../controllers/contactUSController");
const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const router = express.Router();
router.use(verifyAccessToken);

// Routes
router.post('/create-contact-us',createContactUs)


module.exports = router;
