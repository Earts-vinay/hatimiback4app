const { Schema, model } = require("mongoose");

const customerInfoSchema = new Schema(
  {
    name: {
      type: String,
    },
    mobile_number: {
      type: String,
    },
    email: {
      type: String,
    },
    purpose_of_visit:{
      type: String,
    },
    company_name:{
      type: String,
    },
    company_gst:{
      type: String,
    },
    itsID:{
      type: String,
    },
    address:{
      type: String,
    },

  },
  {
    _id: false,
    versionKey: false,
  }
);
const extraInfoSchema = new Schema(
  {
    service_name: {
      type: String,
    },
    service_price: {
      type: Number,
    },
    service_count: {
      type: Number,
    },
    service_days: {
      type: Number,
    },
    single_service_price: {
      type: Number,
    },
  },
  {
    _id: false,
    versionKey: false,
  }
);

const roomInfoSchema = new Schema(
  {
    room_type: {
      type: String,
    },
    room_number: {
      type: String,
    },
    room_price: {
      type: Number,
    },
    single_room_price: {
      type: Number,
    },
    room_count: {
      type: Number,
    },
    room_uid: {
      type: String,
    },
    room_name: {
      type: String,
    },
    extra_services: {
      type: [extraInfoSchema],
    },
  },
  {
    _id: false,
    versionKey: false,
  }
);

const billingInfoSchema = new Schema(
  {
    total_Cost: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
    },
    sgst: {
      type: Number,
    },
    cgst: {
      type: Number,
    },
    igst: {
      type: Number,
    },
    amount_payable: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
    versionKey: false,
  }
);


const gstSchema = new Schema({

  cgst_percent:{
    type:Number
  },
  sgst_percent:{
    type:Number
  },
  igst_percent:{
    type:Number
  }
},
{
  _id: false,
  versionKey: false,
})




const bookingSchema = new Schema(
  {
    booking_id: {
      type: String,
      unique: true,
    },
    invoice_id: {
      type: String,
      unique: true,
    },
    property_uid: {
      type: String,
    },
    property_name: {
      type: String,
    },
    phone_number: {
      type: Number,
    },
    check_in: {
      type: String,
    },
    check_out: {
      type: String,
    },
    number_of_rooms: {
      type: Number,
    },
    adults: {
      type: Number,
    },
    children: {
      type: Number,
    },
    coupon_code: {
      type: String,
    },
    room_info: {
      type: [roomInfoSchema],
    },
    extra_services_info: {
      type: [extraInfoSchema],
    },
    customer_info: {
      type: customerInfoSchema,
    },
    billing_info: {
      type: billingInfoSchema,
    },
    order_id:{
      type:String
    },
    balance_amount: {
      type: Number,
    },
    paid_amount: {
      type: Number,
    },
    is_payment: {
      type: Boolean,
      default: false,
    },
    payment_status: {
      type: String,
      default: "initiated",
    },
    booking_status: {
      type: String,
      default: "confirmed",
    },
    gst_data:{
      type: gstSchema
    },
    transaction_id:{
      type:String,
      required:false
    },
    mode_of_payment:{
      type:String,
      required:false
    },
    pdf_file:{
      type:String
    },
    customer_id:{
      type:String
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Pre-save hook to generate a custom booking ID
bookingSchema.pre("save", async function (next) {
  // Check if booking_id is not set (for new documents)
  if (!this.booking_id) {
    // Get the latest booking ID from the database
    const latestBooking = await this.constructor
      .findOne()
      .sort({ booking_id: -1 });

    // Determine the next booking ID
    const nextBookingId =
      (latestBooking ? parseInt(latestBooking.booking_id) : 0) + 1;

    // Ensure the booking ID has at least 4 digits
    this.booking_id = nextBookingId.toString().padStart(4, "0");
  }

  next();
});

const Booking = model("Booking", bookingSchema);

module.exports = { Booking };
