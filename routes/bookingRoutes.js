const express = require("express");
const { body } = require("express-validator");
const {
  getReservations,
  getBookingById,
  createBooking,
  updateBooking,
  getRoomNumbersByPropertyIdAndRoomType,
  getNameAndIdByQuery,
  getFrontDeskInfo,
  updateReservationStatus,
  updateInvoice,
  updateProperyBookingInfo,
  createorder,
  updateStatus,
  getCustomerBooking,
  previousBooking,
  razorpayWebhook
} = require("../controllers/bookingController");
const validationMiddleware = require("../middleware/validation");
const preValidation = require("../middleware/per-validation");


const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const router = express.Router();
// router.use(verifyAccessToken);

// Routes

router.post("/list-reservations/:id",verifyAccessToken, getReservations); // property_uid is passed in the route parameters
router.get("/get/:id",verifyAccessToken, getBookingById);// booking '_id' is passed in the route parameters
router.post("/get-booking-search/:id",verifyAccessToken, getNameAndIdByQuery);// property_uid is passed in the route parameters

router.post("/get-front-desk-info/:id",verifyAccessToken, getFrontDeskInfo);
router.post("/get-room-numbers/:id",verifyAccessToken, getRoomNumbersByPropertyIdAndRoomType);
router.post("/create-order",verifyAccessToken,createorder)
router.post("/updatestatus",verifyAccessToken,updateStatus)

router.post("/create", preValidation("bookingDatesSchema"),verifyAccessToken,createBooking);
router.put(
  "/update/:id",
  [
    body("property_uid").notEmpty().withMessage("Property UID cannot be empty"),
    body("booking_id").notEmpty().withMessage("Booking ID cannot be empty"),
    body("booking_status")
      .notEmpty()
      .withMessage("Booking status cannot be empty"),
  ],
  validationMiddleware.validate,
  updateBooking
);

router.put("/update-reservation/:id",verifyAccessToken, updateReservationStatus);
router.get("/updated-invoice/:id",verifyAccessToken, updateInvoice);
router.delete("/delete-info",verifyAccessToken, updateProperyBookingInfo);
router.post("/getCustomerBooking",verifyAccessToken, getCustomerBooking);
router.post("/previousBooking",verifyAccessToken, previousBooking);
router.post("/razorpayWebhook", razorpayWebhook);

module.exports = router;
