const express = require("express");
const {
  addTask,
  getSingleTask,
  updateTask,
  deleteTask,
  cancelTask,
  acceptTask,
  markCompleteTask,
  approveTask,
  disapproveTask,
  addMessageTask,
  updateMessageTask,
  deleteMessageTask,
  readNotification,
  fetchNotification

} = require("../controllers/taskController");
const { uploadImage, updateMultipleImages,} = require("../services/uploadService");

const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const router = express.Router();
router.use(verifyAccessToken);
// Routes
router.post("/create-task", addTask);
router.post("/get-single-task/", getSingleTask);
router.put("/update-task", updateTask);
router.delete("/delete-task", deleteTask);
router.put("/cancel-task", cancelTask);
router.put("/accept-task", acceptTask);
router.put("/mark-complete-task", markCompleteTask);
router.put("/approve-task", approveTask);
router.put("/disapprove-task", disapproveTask);
router.post("/add-message-task", addMessageTask);
router.put("/update-message-task", updateMessageTask);
router.delete("/delete-message-task", deleteMessageTask);
router.post("/read-notification", readNotification);
router.post("/fetch-notification", fetchNotification);
module.exports = router;
