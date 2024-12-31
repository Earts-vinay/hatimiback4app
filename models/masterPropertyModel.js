const { Schema, model } = require("mongoose");

const propertyLocationSchema = new Schema({
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  description:{
    type:String,
    required:true
  },
  image:{
    type:String,
    required:false
  }
}, {
  timestamps: true,
  versionKey: false,
});

const propertyTypeSchema = new Schema({
  type: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
  versionKey: false,
});

const outdoorAmenitySchema = new Schema({
  name: {
      type: String,
      required: true,
  },
  icon: {
      type: String,
  },
  description: {
      type: String,
  },
}, {
  timestamps: true,
  versionKey: false,
});

const indoorAmenitySchema = new Schema({
  name: {
      type: String,
      required: true,
  },
  icon: {
      type: String,
  },
  description: {
      type: String,
  },
}, {
  timestamps: true,
  versionKey: false,
});


const PropertyLocation = model('PropertyLocation', propertyLocationSchema);
const PropertyType = model('PropertyType', propertyTypeSchema);
const IndoorAmenity = model('indoorAmenity', indoorAmenitySchema);
const OutdoorAmenity = model('outdoorAmenity', outdoorAmenitySchema);

module.exports = { PropertyLocation, PropertyType, IndoorAmenity, OutdoorAmenity};
