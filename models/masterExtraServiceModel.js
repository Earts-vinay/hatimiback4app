const { Schema, model } = require("mongoose");


const extraServiceSchema = new Schema({
  name: {
      type: String,
      required: true,
  },
  logo: {
      type: String,
  },
  cost: {
      type: String,
  },
  property_uid: {
      type: String,
  },
}, {
  timestamps: true,
  versionKey: false,
});

const accommodationSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    logo: {
        type: String,
    },
    cost: {
        type: String,
    },
  }, {
    timestamps: true,
    versionKey: false,
  });
  const foodAndBevarageSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    logo: {
        type: String,
    },
    cost: {
        type: String,
    },
  }, {
    timestamps: true,
    versionKey: false,
  });
  const laundrySchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    logo: {
        type: String,
    },
    cost: {
        type: String,
    },
  }, {
    timestamps: true,
    versionKey: false,
  });
  const rentalSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    logo: {
        type: String,
    },
    cost: {
        type: String,
    },
  }, {
    timestamps: true,
    versionKey: false,
  });

  const ExtraService  = model('extraService',extraServiceSchema)
  // const Accommodation  = model('accommodation',accommodationSchema)
  // const FoodAndBevarage  = model('foodAndBevarage',foodAndBevarageSchema)
  // const Laundry  = model('laundry',laundrySchema)
  // const Rental  = model('rental',rentalSchema)

  module.exports = { ExtraService };
