const express = require("express");
// const authController = require("../controllers/authController");
// const validationMiddleware = require("../middleware/validation");
// const { check } = require("express-validator");
const UserController = require("../controllers/userController");
const preValidation = require("../middleware/per-validation");
const verifyLogin = require("../middleware/verify-login");
const router = express.Router();

const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


// router.post("/login", authController.login);
// router.post("/refresh-token", authController.refreshToken);

// router.post("/reset-password", authController.resetPassword);
// router.post(
//   "/create-user",
//   [
//     check("username")
//       .isLength({ min: 5, max: 20 })
//       .withMessage("Username must be between 5 to 20 characters"),
//     check("email").isEmail().withMessage("Invalid email address"),
//     check("password")
//       .isLength({ min: 6 })
//       .withMessage("Password must be at least 6 characters"),
//   ],
//   validationMiddleware.validate,
//   authController.createUser
// );
// router.delete('/logout', authController.logout)

router.get("/me", verifyLogin, UserController.getProfile);
router.get('/logout', UserController.logout)

router.post("/register", preValidation("register"), UserController.register);
router.post("/login", preValidation("login"), UserController.login);
router.put("/change-password", verifyAccessToken, preValidation("changePassword"), UserController.changePassword);
router.post("/reset-password", verifyAccessToken, UserController.resetPassword);
router.post("/verify", verifyAccessToken,  UserController.verify);
router.post("/update-password", verifyAccessToken,  UserController.updatePassword);
router.post("/its_login",  UserController.its_login);
router.post("/fetchCustomerDetails", verifyAccessToken,  UserController.fetchCustomerDetails);



module.exports = router;
