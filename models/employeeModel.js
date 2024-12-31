const { Schema, model } = require("mongoose");

const EmployeeSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  role: {
    type: Array,
    default:[],
    required: true,
  },
  mobile_no: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  property_id: {
    type: Array,
    default:[],
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  id_proof: {
    type: String,
    required: false,
  },
  alternate_no: {
    type: String,
    required: false,
  },
  total_paid_leave: {
    type: Number,
    required: false,
  },
  shift_id: {
    type: String,
    required: false,
  },
  shift_array: {
    type: Array,
    default:[],
    required: false,
  },
  device_id: {
    type: String,
    required: false,
  },
}, {
  timestamps: true,
  versionKey: false,
});


const EmployeeTransferSchema = new Schema({
  emp_id: {
    type: String,
    required: true,
  },
  updated_by_name: {
    type: String,
    required: true,
  },
  previous_property_name: {
    type: String,
    required: false,
  },
  latest_property_name: {
    type: String,
    required: false,
  },
  date_time: {
    type: String,
    required: true,
  }
}, {
  timestamps: true,
  versionKey: false,
});

const EmployeeSwapSchema = new Schema({
  emp_id: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  till_date: {
    type: String,
    required: true,
  },
  swap_date: {
    type: String,
    required: true,
  },
  initiated_by: {
    type: String,
    required: true,
  },
  approved_by: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    required: true,
  },
  is_cancel: {
    type: Boolean,
    default:false,
    required: true,
  },
}, {
  timestamps: true,
  versionKey: false,
});


const Employee = model('Employee', EmployeeSchema);
const EmployeeTransfer = model('EmployeeTransfer', EmployeeTransferSchema);
const EmployeeSwap = model('EmployeeSwap', EmployeeSwapSchema);

module.exports = { Employee,EmployeeTransfer,EmployeeSwap};
