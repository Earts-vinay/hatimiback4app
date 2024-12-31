const { Schema, model } = require("mongoose");
const couponSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      uppercase: true,
    },
    expiry: {
      type: String,
    },
    discount_flat: {
      type: Number,
    },
    discount_percent: {
      type: Number,
    },
    property_uids: {
      type: [String],
      required: true,
    },
    one_time_use: {
      type: Boolean,
      default: false,
    },
    is_used: {
      type: Boolean,
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Coupon = model("Coupon", couponSchema);

module.exports = { Coupon };
