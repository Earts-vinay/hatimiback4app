const { Schema, model } = require("mongoose");

const RoleSchema = new Schema({
  designation: {
    type: String,
    required: true,
  },
  access_control: {
    type: Object,
    required: true,
  },
  is_admin: {
    type: Boolean,
    default: false,
    required: true,
  },
}, {
  timestamps: true,
  versionKey: false,
});


const Role = model('Role', RoleSchema);

module.exports = { Role};
