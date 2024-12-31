const { Schema, model } = require("mongoose");

const TaskSchema = new Schema({
  emp_id: {
    type: String,
    required: true,
  },
  property_id: {
    type: String,
    required: true,
  },
  task_title: {
    type: String,
    required: true,
  },
  task_date: {
    type: String,
    required: true,
  },
  task_time: {
    type: String,
    required: true,
  },
  task_type: {
    type: String,
    required: true,
  },
  room_no: {
    type: String,
    required: false,
  },
  task_status: {
    type: String,
    required: false,
  },
  status_by_employee: {
    type: String,
    required: false,
  },
  is_cancel: {
    type: Boolean,
    default:false,
    required: false,
  },
  task_image: {
    type: Array,
    default:[],
    required: false,
  },
  mark_complete: {
    type: Array,
    default:[],
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


const TaskConversationSchema = new Schema({
  task_id: {
    type: String,
    required: true,
  },
  emp_id: {
    type: String,
    required: true,
  },
  messages: {
    type: Array,
    required: true,
  }
}, {
  timestamps: true,
  versionKey: false,
});


const Task = model('Task', TaskSchema);
const TaskConversation = model('TaskConversation', TaskConversationSchema);

module.exports = { Task, TaskConversation};
