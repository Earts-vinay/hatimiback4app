const express = require("express");
const {
    getAllReviews,
    getReviewById,
    createReview,
    updateReview,
    deleteReview,
} = require("../controllers/reviewController");

const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const router = express.Router();
router.use(verifyAccessToken);
router.get("/get", getAllReviews);
router.get("/get/:id", getReviewById);

router.post("/create-review", createReview);

router.put("/update-review/:id", updateReview);

router.delete("/delete-review/:id", deleteReview);

module.exports = router;
