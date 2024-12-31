const { Schema, model, Types } = require("mongoose");

const reviewSchema = new Schema({
  property_uid: {
    type: String,
    required: true
  },
  user_id: {
    type: Types.ObjectId,
    ref: 'User',
  },
  ratings: {
    amenities: { type: Number, required: true, min: 1, max: 5 },
    communication: { type: Number, required: true, min: 1, max: 5 },
    value_for_money: { type: Number, required: true, min: 1, max: 5 },
    hygiene: { type: Number, required: true, min: 1, max: 5 },
    location: { type: Number, required: true, min: 1, max: 5 },
    rooms: { type: Number, required: true, min: 1, max: 5 },
    food: { type: Number, required: true, min: 1, max: 5 },
  },
  comment: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true, versionKey: false }
);

const Review = model('Review', reviewSchema);

module.exports = Review;
