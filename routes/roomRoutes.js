const express = require("express");
const { uploadImage } = require("../services/uploadService");
const {
  createRoomProperty,
  getRoomPropertyWithID,
  updateRoomPropertyWithID,
  deleteRoomPropertyWithID,
  getAllRoomsWithID,
  deletePropertyRoomImage,
  getRoomMaxCapacity,
  getAvailableRoomsForBooking,
  getRoomsInfoForBooking,
} = require("../controllers/roomController");
const validationMiddleware = require("../middleware/validation");
const { body } = require("express-validator");
const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const router = express.Router();
router.use(verifyAccessToken);
// Routes
router.post(
  "/get-available-rooms/:property_uid",
  [
    body("startDate").notEmpty().withMessage("startDate is required"),
    body("endDate").notEmpty().withMessage("endDate is required"),
    body("adults")
      .isNumeric()
      .withMessage("adults is number type")
      .notEmpty()
      .withMessage("adults cannot be empty"),
    body("children")
      .isNumeric()
      .withMessage("children is number type")
      .notEmpty()
      .withMessage("children cannot be empty"),
    body("no_of_rooms")
      .isNumeric()
      .withMessage("no_of_rooms is number type")
      .notEmpty()
      .withMessage("no_of_rooms cannot be empty"),
  ],
  validationMiddleware.validate,
  getAvailableRoomsForBooking
);
router.post("/get-rooms-info/:property_uid", getRoomsInfoForBooking);
router.get("/get-max-capacity/:property_uid", getRoomMaxCapacity);
router.post("/create-room", createRoomProperty);
router.get("/get-room/:property_uid/:room_uid", getRoomPropertyWithID);
router.put("/update-room", updateRoomPropertyWithID);
router.delete("/delete-room/:property_uid/:room_uid", deleteRoomPropertyWithID);
router.get("/get-all-rooms/:id", getAllRoomsWithID);
router.delete("/deleteImage/:property_uid/:room_uid", deletePropertyRoomImage);
module.exports = router;
