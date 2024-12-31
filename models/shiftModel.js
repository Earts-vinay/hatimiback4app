const { Schema, model } = require("mongoose");

const ShiftModuleSchema = new Schema({
  property_id: {
    type: String,
    required: true,
  },
  shift_name: {
    type: String,
    required: true,
  },
  from_time: {
    type: String,
    required: true,
  },
  to_time: {
    type: String,
    required: true,
  },
  added_date: {
    type: String,
    required: true,
  }
}, {
  timestamps: true,
  versionKey: false,
});

const ShiftLogSchema = new Schema({
  shift_id: {
    type: String,
    required: true,
  },
  property_id: {
    type: String,
    required: true,
  },
  emp_id: {
    type: String,
    required: true,
  },
  from_date: {
    type: String,
    required: true,
  },
  to_date: {
    type: String,
    required: false,
  },
  added_date: {
    type: String,
    required: true,
  }
}, {
  timestamps: true,
  versionKey: false,
});




const ShiftModule = model('ShiftModule', ShiftModuleSchema);
const ShiftLog = model('ShiftLog', ShiftLogSchema);

module.exports = { ShiftModule, ShiftLog};
