const nodemailer = require("nodemailer");
const User = require("../models/user");
const logger = require("../utils/logger");
const createError = require("http-errors");
const {
  signAccessToken,
  verifyAccessToken,
  // signRefreshToken,
  // verifyRefreshToken,
} = require("../services/JWT/jwt.tokens");
// const client = require("../services/Redis/init_redis");
require("dotenv").config();

exports.createUser = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const doesExit = await User.findOne({ email: email });
    if (doesExit) throw createError.Conflict(`${email} is already exist`);
    const user = new User({ username, email, password, role });
    await user.save();
    res.status(201).json({status:true, message: "User created successfully" });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(
        (error) => error.message
      );
      return res.status(422).json({status:false, errors: errorMessages });
    }
    return res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};

// controllers/authController.js

exports.login = async (req, res) => {
  const { identifier, password } = req.body;
  try {
    if (identifier === undefined || password === undefined) {
      throw createError.BadRequest();
    }
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user) {
      throw createError.Unauthorized("Invalid credentials.");
    }
    const isMatch = await user.validPassword(password);
    if (!isMatch) throw createError.Unauthorized("Username/Password not valid");
    const accesstoken = await signAccessToken({
      username: user.username,
      email: user.email,
    });
    const refreshtoken = await signRefreshToken({
      username: user.username,
      email: user.email,
    });

    res.json({ status:true,message: "Login successful", accesstoken, refreshtoken });
  } catch (error) {
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};
exports.refreshToken = async (req, res) => {
  const { refresh_token } = req.body;
  try {
    if (!refresh_token) throw createError.BadRequest();
    const payload = await verifyRefreshToken(refresh_token);
    const accesstoken = await signAccessToken({
      username: payload.username,
      email: payload.email,
    });
    const refreshtoken = await signRefreshToken({
      username: payload.username,
      email: payload.email,
    });
    res.send({status:true, accesstoken, refreshtoken });
  } catch (error) {
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};

(exports.logout = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) throw createError.BadRequest();
    const payload = await verifyRefreshToken(refresh_token);
    client.del(payload.email, (err, val) => {
      if (err) {
        console.log(err.message);
        throw createError.InternalServerError();
      }
      console.log(val);
      res.sendStatus(204);
    });
  } catch (error) {
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
}),
(exports.resetPassword = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      logger.error("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Reset Password",
      text: `Click the link to reset your password: ${WEBAPP_URI}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        logger.error("Failed to send reset password email");
        res
          .status(500)
          .json({ message: "Failed to send reset password email" });
      } else {
        logger.info("Reset password link sent successfully");
        res.json({ message: "Reset password link sent successfully" });
      }
    });
  });
