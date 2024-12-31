const express = require("express");
const {
  createRole,
  updateRole,
  deleteRole,
  getAllRoles,
  getRoleById,

} = require("../controllers/masterRoleController");
const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const router = express.Router();
router.use(verifyAccessToken);

// Routes
router.post("/create-role", createRole);
router.put("/update-role", updateRole);
router.delete("/delete-role", deleteRole);
router.get("/get-all-role", getAllRoles);
router.get("/get-single-role/:id", getRoleById);
module.exports = router;
