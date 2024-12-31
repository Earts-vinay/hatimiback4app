const { Schema, model } = require("mongoose");

const NotificationSchema = new Schema({
  emp_id: {
    type: String,
    required: false,
  },
  notification_for: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  task_id: {
    type: String,
    required: false,
  },
  is_read: {
    type: Boolean,
    required: false,
  },
  added_date: {
    type: String,
    required: false,
  },
}, {
  timestamps: true,
  versionKey: false,
});




const Notification = model('Notification', NotificationSchema);

module.exports = { Notification};
