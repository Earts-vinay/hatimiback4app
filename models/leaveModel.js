const { Schema, model } = require("mongoose");

const LeaveSchema = new Schema({
  emp_id: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  leave_start_date: {
    type: String,
    required: false,
  },
  leave_end_date: {
    type: String,
    required: false,
  },
  login_time: {
    type: String,
    required: false,
  },
  logout_time: {
    type: String,
    required: false,
  },
  is_halfday: {
    type: Boolean,
    default:false,
    required: false,
  },
  halfday_reason: {
    type: String,
    required: false,
  },
  is_leave: {
    type: Boolean,
    default:false,
    required: true,
  },
  is_sick_leave: {
    type: Boolean,
    default:false,
    required: true,
  },
  leave_reason: {
    type: String,
    required: false,
  },
  leave_status: {
    type: String,
    required: false,
  },
  leave_type: {
    type: String,
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



const Leave = model('Leave', LeaveSchema);

module.exports = { Leave};
