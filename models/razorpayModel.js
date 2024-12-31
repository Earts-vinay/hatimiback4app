const { Schema, model } = require("mongoose");

const razorpaySchema = new Schema({

  receivedSignature:{
    type:String
  },
  payload:{
    type:String
  },
  status:{
    type:String
  }
},
{
  timestamps: true,
  versionKey: false,
})


const previousPaymentSchema = new Schema({

  bookingId:{
    type:String
  },
  order_id:{
    type:String
  },
  payment_status:{
    type:String
  }
},
{
  timestamps: true,
  versionKey: false,
})


const RazorpayData = model("RazorpayData", razorpaySchema);
const PreviousPayment = model("PreviousPayment", previousPaymentSchema);

module.exports = { RazorpayData, PreviousPayment };
