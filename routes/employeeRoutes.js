const express = require("express");
const {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAllEmployees,
  getEmployeeById,
  updateDetails,
  roleSwap,
  updateroleSwap,
  fetchSwap,
  logIn,
  getEmployeeByRole,
  updateEmployeeDeviceID,
  dashboardCount,
  getEmployeeByProperty

} = require("../controllers/employeeController");
const { uploadImage, updateMultipleImages,} = require("../services/uploadService");

const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const router = express.Router();
// router.use(verifyAccessToken);
// Routes
router.post("/create-employee",verifyAccessToken, createEmployee);
router.put("/update-employee",verifyAccessToken, updateEmployee);
router.delete("/delete-employee",verifyAccessToken, deleteEmployee);
router.get("/get-all-employee", verifyAccessToken, getAllEmployees);
router.get("/get-single-employee/:id",verifyAccessToken, getEmployeeById);
router.put( "/update-details",verifyAccessToken,uploadImage.single("id_proof"),updateDetails);
router.put("/role-swap",verifyAccessToken, roleSwap);
router.put("/update-role-swap",verifyAccessToken, updateroleSwap);
router.get("/fetch-swap",verifyAccessToken, fetchSwap);
router.post("/login", logIn);
router.post("/get-employee-by-role",verifyAccessToken, getEmployeeByRole);
router.post("/get-employee-by-property",verifyAccessToken, getEmployeeByProperty);
router.put("/update-employee-deviceID",verifyAccessToken, updateEmployeeDeviceID);
router.post("/dashboard-count",verifyAccessToken, dashboardCount);

module.exports = router;
