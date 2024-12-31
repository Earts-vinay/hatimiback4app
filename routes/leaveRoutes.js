const express = require("express");
const {
  fetchDisapprovedLeave,
  fetchApprovedLeave,
  approveDeclineLeave,
  applyLeave

} = require("../controllers/leaveController");

const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const router = express.Router();
router.use(verifyAccessToken);

// Routes
router.post("/fetch_disapproved_leave", fetchDisapprovedLeave);
router.post("/fetch_approved_leave", fetchApprovedLeave);
router.post("/approve_decline_leave", approveDeclineLeave);
router.post("/apply_leave", applyLeave);

module.exports = router;
