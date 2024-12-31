const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const amenitySchema = new mongoose.Schema({
  amenity_description: { type: String },
  amenity_name: { type: String, required: true },
  amenity_icon: { type: String, required: true },
  amenity_price: { type: String },
});
const extraInfoSchema = new mongoose.Schema(
  {
    service_name: {
      type: String,
    },
    service_price: {
      type: Number,
    },
  },
  {
    _id: false,
    versionKey: false,
  }
);



const bookingInfoSchema = new mongoose.Schema(
  {
    id: { type: String },
    booking_id: { type: String },
    name: { type: String },
    mobile_number: { type: String },
    email: { type: String },
    status: { type: String },
    check_in: { type: String },
    check_out: { type: String },
    check_in_time: { type: String },
    check_out_time: { type: String },
    is_payment:{type: Boolean},
    payment_status:{type: String},
    balance_amount:{type:Number},
    extra_services:{
      type:[extraInfoSchema],
    }
  },
  { _id: false, versionKey: false, timestamps: true }
);

const roomSchema = new mongoose.Schema(
  {
    room_uid: { type: String, default: uuidv4, required: true },
    property_uid: { type: String, required: true },
    room_name: { type: String, required: true },
    room_type: { type: String, required: true },
    room_typeid: {type: String, required: false},
    is_deleted: {type:Boolean,required:false},
    max_guest_occupancy: { type: Number, required: true },
    base_guest_occupancy: { type: Number, required: false },
    extra_bed_count: { type: Number, required: false },
    room_charge: { type: Number, required: true },
    bed_size: { type: String, required: true },
    room_size: { type: String, required: true },
    room_description: { type: String },
    room_amenities: { type: [amenitySchema] },
    room_images: { type: [String], required: true },
    room_number: { type: String, required: true },
    is_booked: { type: Boolean, default: false },
    booking_info: { type: [bookingInfoSchema] },
    room_gstin: { type: String, required: false },
    active: { type: Boolean, default: false, required: true },
  },
  { timestamps: true, versionKey: false }
);

module.exports = roomSchema;
