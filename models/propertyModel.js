const mongoose = require("mongoose");
const roomSchema = require("./roomsModel");
const { v4: uuidv4 } = require("uuid");
const amenitySchema = new mongoose.Schema({
  amenity_description: { type: String },
  amenity_name: { type: String, required: true },
  amenity_icon: { type: String, required: true },
});
const propertySchema = new mongoose.Schema(
  {
    property_uid: { type: String, default: uuidv4, required: true },
    phone_number: { type: String, required: false },
    property_name: { type: String, required: true },
    property_description: { type: String },
    property_type: { type: String, required: true },
    property_address: { type: String },
    property_city: { type: String, required: true },
    property_state: { type: String, required: true },
    property_country: { type: String, required: true },
    place_name: { type: String},
    property_size: { type: String },
    check_in_time: { type: String},
    check_out_time: {type: String},
    indoor_amenities: { type: [amenitySchema] },
    outdoor_amenities: { type: [amenitySchema] },
    property_images: { type: [String], required: true },
    total_rooms: { type: Number },
    max_capacity: { type: Number, required: true },
    rooms: { type: [roomSchema] },
    active: { type: Boolean, default: true, required: true },
  },
  { timestamps: true, versionKey: false }
);

const Property = mongoose.model("Property", propertySchema);

module.exports = { Property };
