const express = require("express");
const {
  createShiftModule,
  updateShiftModule,
  deleteShiftModule,
  getAllShiftModule,
  updateShiftInEmployee,
  fetchShiftLog

} = require("../controllers/shiftController");
const { uploadImage, updateMultipleImages,} = require("../services/uploadService");

const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const router = express.Router();
router.use(verifyAccessToken);
// Routes
router.post("/create-shift-model", createShiftModule);
router.put("/update-shift-model", updateShiftModule);
router.delete("/delete-shift-model", deleteShiftModule);
router.post("/get-all-shift-model", getAllShiftModule);
router.put("/update-employee-shift", updateShiftInEmployee);
router.post("/fetch-shift-log", fetchShiftLog);

module.exports = router;
