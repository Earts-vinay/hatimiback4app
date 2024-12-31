const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  room_name: String,
  room_type: String,
  room_bedcapacity_max: String,
  room_charge: String,
  room_bedsize: String,
  room_amenities: [String],
  room_images: String,
});

const propertySchema = new mongoose.Schema({
  property_name: String,
  property_type: String,
  property_phone: String,
  property_city: String,
  total_rooms: Number,
  total_persons: Number,
  property_dimension: String,
  property_rating: Number,
  amenities: [String],
  property_images: String,
  rooms: [roomSchema],
});

const searchProperty = mongoose.model("frontend-properties", propertySchema);

module.exports = searchProperty;
