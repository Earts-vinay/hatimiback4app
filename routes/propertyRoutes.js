const express = require("express");
const {
  createProperty,
  getPropertyWithID,
  getAllActiveProperties,
  deletePropertyWithID,
  updatePropertyWithID,
  getproperties,
  uploadPropertyImage,
  deletePropertyImage

} = require("../controllers/propertyController");
const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const router = express.Router();
router.use(verifyAccessToken);
// Routes
router.post(
  "/create-property",
  createProperty
);
router.get("/get-property/:id", getPropertyWithID);
router.get("/get-all-properties", getAllActiveProperties);
router.delete("/delete-property/:id", deletePropertyWithID);
router.put("/update-property",updatePropertyWithID);
router.get("/getproperties", getproperties);
router.post('/upload/:id',uploadPropertyImage);
router.delete('/deleteImage/:id',deletePropertyImage);
module.exports = router;
