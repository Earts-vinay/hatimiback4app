const express = require("express");
const {
  empLoginAdmin,
  markHalfdayAdmin,
  markLeaveAdmin,
  fetchBalancePaidLeave,
  empLogin,
  empLogout,
  fetchEmpLoginTiming,
  fetchMasterRoll,
  exportMasterRoll,
  fetchMasterRollNew,
  exportMasterRollNew

} = require("../controllers/attendanceController");

const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const router = express.Router();
router.use(verifyAccessToken);

// Routes
router.post("/emp_login_admin", empLoginAdmin);
router.post("/mark_halfday_admin", markHalfdayAdmin);
router.post("/mark_leave_admin", markLeaveAdmin);
router.post("/fetch_balance_paid_leave", fetchBalancePaidLeave);
router.post("/emp_login", empLogin);
router.post("/emp_logout", empLogout);
router.post("/fetch_emp_login_timing", fetchEmpLoginTiming);
router.post("/fetch_emp_master_roll", fetchMasterRoll);
router.post("/export_emp_master_roll", exportMasterRoll);
router.post("/fetch_emp_master_roll_new", fetchMasterRollNew);
router.post("/export_emp_master_roll_new", exportMasterRollNew);

module.exports = router;
