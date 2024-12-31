const express = require("express");
const { uploadImage } = require("../services/uploadService");
const {
  createMasterCompanyDetails,
  updateMasterCompanyDetails,
  getMasterCompanyDetails,
  getMasterCompanyById,
} = require("../controllers/masterCompanyDetailsController");


const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const router = express.Router();
router.use(verifyAccessToken);

router.get("/get-company-details", getMasterCompanyDetails);
router.get( "/get-company/:id",getMasterCompanyById);
router.post("/create", uploadImage.single("logo"), createMasterCompanyDetails);
router.put("/update", uploadImage.single("logo"), updateMasterCompanyDetails);

module.exports = router;
