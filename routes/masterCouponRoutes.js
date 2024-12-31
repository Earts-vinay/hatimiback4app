const express = require("express");
const {
  getCouponDetails,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponById,
  verifyCoupon
} = require("../controllers/masterCouponController");

const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const router = express.Router();
router.use(verifyAccessToken);

// Routes
router.get("/get-all-coupons", getCouponDetails);
router.get("/get-coupon/:id", getCouponById);

router.post("/create", createCoupon);
router.post("/verify-coupon", verifyCoupon);


router.put("/update/:id", updateCoupon);

router.delete("/delete/:id", deleteCoupon);

module.exports = router;
