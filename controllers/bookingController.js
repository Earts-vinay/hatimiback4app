const path = require("path");
const fs = require("fs");
const { Booking } = require("../models/bookingModel");
const { Property } = require("../models/propertyModel");
const { RazorpayData, PreviousPayment } = require("../models/razorpayModel");
const {
  addInvoiceContentAndSendMail,
  sendEmail,
  updatedInvoice,
} = require("./invoiceController");

const {sendMail} = require("../services/sendEmailService")
const { UpdateCouponStatus } = require("./masterCouponController");
const stripe = require("stripe")("");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const Razorpay = require('razorpay');
const crypto = require("crypto")

var cron = require('node-cron');

cron.schedule("0 */30 * * * *", async function() {
// cron.schedule("0 0 */1 * * *", async function() {
  console.log("cron running**************");
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  var bookingInfo = await Booking.find({
    createdAt: { $lt: oneHourAgo },
    payment_status:'initiated'
  })

  // console.log("*****CRON bookingInfo*****",bookingInfo);
  // console.log("bookingInfo.length", bookingInfo.length);
  if(bookingInfo.length > 0){
    // console.log("************");
    // for (var kl = 0; kl < bookingInfo.length; kl++) {
    //
    //   var is_payment = false
    //   var payment_status = 'failed'
    //   var booking_status = "cancel"
    //   var balance_amount = bookingInfo[kl].billing_info.amount_payable
    //
    //
    //   var newBooking = await Booking.findOneAndUpdate({_id:bookingInfo[kl]._id},{
    //     is_payment: is_payment,
    //     payment_status: payment_status,
    //     booking_status:booking_status,
    //     balance_amount:balance_amount
    //   },{new:true}).lean();
    // }

    const updatePromises = bookingInfo.map((record) => {
      return Booking.findOneAndUpdate(
        { _id: record._id },
        {
          is_payment: false,
          payment_status: "failed",
          booking_status: "cancel",
          balance_amount: record.billing_info?.amount_payable || 0, // Ensure billing_info exists
        },
        { new: true }
      ).lean();
    });

    // Execute all updates concurrently
    const updatedRecords = await Promise.all(updatePromises);
    console.log("Updated Records:", updatedRecords);
  }
})

exports.getReservations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const propertyUid = req.params.id;
    const { startDate, endDate } = req.body;
    // filter based on property_uid
    const filter = propertyUid ? { property_uid: propertyUid } : {};
   // Ensure startDate and endDate are valid date strings
    if (startDate && endDate) {
      // filter.check_in = { $gte: startDate, $lte: endDate };
      // filter.check_out = { $gte: startDate, $lte:endDate };

      filter.check_in = { $lt: endDate },
      filter.check_out = { $gt: startDate }
    }
    const totalBookings = await Booking.countDocuments(filter);
    const totalPages = Math.ceil(totalBookings / pageSize);
    const skip = (page - 1) * pageSize;
    const bookings = await Booking.find(filter)
      .sort({ booking_id: -1 })
      .skip(skip)
      .limit(pageSize);
    if (bookings.length === 0) {
      return res
        .status(200)
        .json({ status: false, message: "No bookings found" });
    }
    // console.log("bookings",bookings)
    return res.status(200).json({
      status: true,
      message: "Fetched bookings data successfully",
      data: bookings,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages,
      totalItems: totalBookings,
    });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};



// Get a specific booking by ID


exports.getBookingById = async (req, res) => {
  // console.log("******getBookingById******",req.params);
  try {
    const booking = await Booking.findById(req.params.id).lean();
    if (!booking) {
      return res
        .status(200)
        .json({ status: false, message: "Booking not found" });
    }

    var room_info = booking.room_info
    var property_uid = booking.property_uid

    for (var i = 0; i < room_info.length; i++) {
      var room_uid = room_info[i].room_uid

      const updatedRoomStatus = await Property.findOne(
        {
          property_uid: property_uid,
          "rooms.room_uid": room_uid,
        })

        // console.log("*********updatedRoomStatus*********",updatedRoomStatus);

        var allRooms = updatedRoomStatus.rooms
        let matchingObj = allRooms.find(obj2 => obj2.room_uid === room_uid);
        if(matchingObj){
          if(matchingObj.extra_bed_count == undefined || matchingObj.extra_bed_count == null || matchingObj.extra_bed_count == ""){
            room_info[i].extra_bed_count = 0
          }else{
            room_info[i].extra_bed_count = matchingObj.extra_bed_count
          }
        }
    }

    booking.room_info = room_info

    // console.log("******booking********",booking.room_info[0].extra_services);
    return res.status(200).json({
      status: true,
      message: "fached booking data successfully",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};



exports.createorder = async (req,res) =>{
  try{

    console.log("createorder",req.body);
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    var amount = req.body.amount;
     amount = Number(amount);
    // console.log("amount",amount);
    var order = req.body.order_id
    var status = req.body.payment_status
    var isBlock = req.body.isBlock
    const { property_uid, room_info } = req.body;

    var booking_id = req.body.booking_id
    var number_of_rooms = req.body.number_of_rooms
    var adults = req.body.adults
    var children = req.body.children
    var coupon_code = req.body.coupon_code
    var customer_info = req.body.customer_info
    var billing_info = req.body.billing_info
    var gst_data = req.body.gst_data
    var customer_id = req.body.customer_id

    if (req.body.isBlock == true) {
      var booking_status = "blocked";
    }else{
      var booking_status = "pending";
    }

    if(customer_id == undefined || customer_id == null){
      customer_id = ""
    }




    const availableRooms = await Property.findOne(
      {
        property_uid: property_uid,
      },
      { property_name: 1, rooms: 1, _id: 0, phone_number: 1 }
    );
    const formattedCheckIn = moment(req.body.check_in, "YYYY/MM/DD").format(
      "YYYY-MM-DD"
    );
    const formattedCheckOut = moment(req.body.check_out, "YYYY/MM/DD").format(
      "YYYY-MM-DD"
    );
    const filteredRooms = availableRooms.rooms.filter(
      (room) => room.active === false
    );
    var filteredRoomsForBooking = []
    for (var i = 0; i < filteredRooms.length; i++) {
      var newRoomUid = filteredRooms[i].room_uid

      var bookingInfo = await Booking.find({
        booking_status: { $ne: 'cancel' },
        "room_info.room_uid":newRoomUid,
        check_in: { $lt: formattedCheckOut },
        check_out: { $gt: formattedCheckIn }

      })


      if(bookingInfo.length == 0){

        filteredRoomsForBooking.push({room_number: filteredRooms[i].room_number,
        room_type: filteredRooms[i].room_type,
        // booking_info: bookingRoom,
        is_booked: filteredRooms[i].is_booked,
        max_guest_occupancy: filteredRooms[i].max_guest_occupancy,
        room_gstin: filteredRooms[i].room_gstin,
        room_charge: filteredRooms[i].room_charge,
        room_uid: filteredRooms[i].room_uid})
      }else{
        for (var kl = 0; kl < bookingInfo.length; kl++) {

          if (bookingInfo[kl].booking_status == "cancel" || bookingInfo[kl].booking_status == "check_out") {


            let obj = filteredRoomsForBooking.find(o => o.room_uid === filteredRooms[i].room_uid);

            if(obj == undefined || obj == null || obj == false){

              filteredRoomsForBooking.push({room_number: filteredRooms[i].room_number,
              room_type: filteredRooms[i].room_type,
              // booking_info: bookingRoom,
              is_booked: filteredRooms[i].is_booked,
              max_guest_occupancy: filteredRooms[i].max_guest_occupancy,
              room_gstin: filteredRooms[i].room_gstin,
              room_charge: filteredRooms[i].room_charge,
              room_uid: filteredRooms[i].room_uid})
            }

          }
        }
      }
    }
    const obj = filteredRoomsForBooking.filter((room) => room !== null);
    const selectedRooms = [];
    let isRoomAvailable = false;
    let roomsType = [];
    let roomInfo = {};

    room_info.forEach((info) => {
      const roomsOfType = obj
    .filter((room) => room.room_type === info.room_type && room.room_charge == info.single_room_price && room.max_guest_occupancy == info.max_guest_occupancy)
        .map((room) => {
          // console.log("room",room);
          return {
            ...room,
            room_price: info.room_price,
            single_room_price: info.single_room_price,
            room_count: info.room_count,
            extra_services: info.extra_services,
          };
        });


    if (roomsOfType?.length >= info.room_count) {
    selectedRooms?.push(...roomsOfType.slice(0, info.room_count));
      } else {
          isRoomAvailable = true;
          roomsType = roomsOfType;
          roomInfo = info;

      }
    });

    if (isRoomAvailable) {
      return res.status(200).json({
        status: false,
        message: `Not enough available rooms for room type ${
          roomInfo.room_type
        }. Required: ${roomInfo.room_count},  We have Available rooms: ${
          roomsType?.length || 0
        }`,
      });
    }

    // console.log(typeof amount);
    // console.log("selectedroom",selectedRooms);



    if(isBlock == undefined || isBlock == "" || isBlock == null){
      isBlock = false
    }


    if(isBlock == true){
      var invoice_id = "-"
    }else{


      var invoiceInfo = await Booking.aggregate([
        {
          $match: {
            invoice_id: { $regex: /^HR\/2425\// } // Match invoice IDs with the desired prefix
          }
        },
        {
          $addFields: {
            numericInvoiceId: {
              $toInt: { $substr: ["$invoice_id", 8, -1] } // Extract the numeric part after the prefix
            }
          }
        },
        {
          $sort: { numericInvoiceId: -1 } // Sort by the numeric part in descending order (greatest first)
        },
        {
          $limit: 1 // Get the greatest one
        }
      ]);
      // console.log("invoiceInfo------------",invoiceInfo);


      // var invoiceInfo = await Booking.find({invoice_id: { $exists: true, $ne: "-" }}).sort({_id: -1 })
      let sequenceNumber = 1;
      if(invoiceInfo.length > 0){
        const latestID = invoiceInfo[0].invoice_id;
        const latestSequence = parseInt(latestID.split('/')[2], 10);
        sequenceNumber = latestSequence + 1;
      }
      var paddedSequence = sequenceNumber.toString().padStart(4, '0');
      var invoice_id = "HR/2425/"+paddedSequence
    }


    const receiptNumber = `receipt#${Date.now()}`;
    const options = {
      amount: Math.round(amount*100),
      currency: "INR",
      receipt: receiptNumber
    };
// console.log("22222222222222222222222",options);
    const res1 = await razorpay.orders.create(options);

    // console.log("res1",res1);

      var order_s;
    if(order !== undefined && order !== null && order !== ""){
       order_s = await Booking.findOne({order_id:order})
    }
// console.log("111111111");
      if(order_s){
          var amt = order_s.paid_amount + amount
          var newBooking = await Booking.findOneAndUpdate({order_id:order},{
          order_id:res1.id,
          // paid_amount:amount,
          payment_status:status
          })

          // console.log("result",res1);


      }else{
// console.log("4444444444444444444444");
        if(isBlock == true){
          amount = 0
        }
          // var newBooking = await Booking.create({
          //   order_id:res1.id,
          //   invoice_id:invoice_id,
          //   paid_amount:amount,
          //   payment_status:"initiated",
          //   is_payment:false,
          //   room_info:selectedRooms,
          //   check_in:formattedCheckIn,
          //   check_out:formattedCheckOut})

            var newBooking = await Booking.create({
              order_id:res1.id,
              booking_id: req.body.booking_id,
              // invoice_id:invoice_id,
              property_uid:property_uid,
              property_name: availableRooms?.property_name,
              phone_number: availableRooms?.phone_number,
              paid_amount:amount,
              payment_status:"initiated",
              is_payment:false,
              room_info:selectedRooms,
              check_in:formattedCheckIn,
              check_out:formattedCheckOut,
              number_of_rooms: req.body.number_of_rooms,
              adults: req.body.adults,
              children: req.body.children,
              coupon_code: req.body.coupon_code,
              customer_info: req.body.customer_info,
              billing_info: {
                total_Cost: req.body.billing_info.total_Cost,
                discount: req.body.billing_info.discount,
                sgst: req.body.billing_info.sgst,
                cgst: req.body.billing_info.cgst,
                igst: req.body.billing_info.igst,
                amount_payable: req.body.billing_info.amount_payable,
              },
              balance_amount:req.body.billing_info.amount_payable,
              booking_status:booking_status,
              gst_data:{
                cgst_percent:req.body.gst_data.cgst_percent,
                sgst_percent:req.body.gst_data.sgst_percent,
                igst_percent:req.body.gst_data.igst_percent
              },
              customer_id:customer_id

            })
    }

    res.send({status:true,message:"Order created successfully",data:{
      id: res1.id,
      currency: res1.currency,
      amount: res1.amount
    }})

  }catch(err){


    var amount = req.body.amount;
     amount = Number(amount);
    // console.log("amount",amount);
    var order = req.body.order_id
    var status = req.body.payment_status
    var isBlock = req.body.isBlock
    const { property_uid, room_info } = req.body;

    var booking_id = req.body.booking_id
    var number_of_rooms = req.body.number_of_rooms
    var adults = req.body.adults
    var children = req.body.children
    var coupon_code = req.body.coupon_code
    var customer_info = req.body.customer_info
    var billing_info = req.body.billing_info
    var gst_data = req.body.gst_data
    var customer_id = req.body.customer_id

    if (req.body.isBlock == true) {
      var booking_status = "blocked";
    }else{
      var booking_status = "pending";
    }

    if(customer_id == undefined || customer_id == null){
      customer_id = ""
    }

    if(isBlock == true){
      // var newBooking = await Booking.create({
      //   order_id:"order_12345",
      //   paid_amount:amount,
      //   payment_status:"initiated",
      //   is_payment:false,
      //   room_info:selectedRooms})

      var newBooking = await Booking.create({
        order_id:'order_12345',
        booking_id: req.body.booking_id,
        // invoice_id:invoice_id,
        property_uid:property_uid,
        property_name: availableRooms?.property_name,
        phone_number: availableRooms?.phone_number,
        paid_amount:amount,
        payment_status:"initiated",
        is_payment:false,
        room_info:selectedRooms,
        check_in:formattedCheckIn,
        check_out:formattedCheckOut,
        number_of_rooms: req.body.number_of_rooms,
        adults: req.body.adults,
        children: req.body.children,
        coupon_code: req.body.coupon_code,
        customer_info: req.body.customer_info,
        billing_info: {
          total_Cost: req.body.billing_info.total_Cost,
          discount: req.body.billing_info.discount,
          sgst: req.body.billing_info.sgst,
          cgst: req.body.billing_info.cgst,
          igst: req.body.billing_info.igst,
          amount_payable: req.body.billing_info.amount_payable,
        },
        balance_amount:req.body.billing_info.amount_payable,
        booking_status:booking_status,
        gst_data:{
          cgst_percent:req.body.gst_data.cgst_percent,
          sgst_percent:req.body.gst_data.sgst_percent,
          igst_percent:req.body.gst_data.igst_percent
        },
        customer_id:customer_id

      })

        res.send({status:true,message:"Order created successfully",data:{
          id: "order_12345",
          currency: 'INR',
          amount: amount
        }})
    }else{

      console.log("**********err***************",err);
      res.send({status:false,message:err.message})
    }

  }
}



//
// exports.createBooking = async (req, res) => {
//   try {
//     let is_payment;
//     let payment_status;
//     // const { token } = req.body;
//
//     // const customer = await stripe.customers.create({
//     //   email: token.email,
//     //   source: token.id,
//     // });
//
//     // const payment = await stripe.charges.create(
//     //   {
//     //     amount: req.body.billing_info.amount_payable * 100,
//     //     customer: customer.id,
//     //     currency: "inr",
//     //     receipt_email: token.email,
//     //   },
//     //   {
//     //     idempotencyKey: uuidv4(),
//     //   }
//     // );
//
//
//
//
//
//     // if(payment) {
//     if (req.body.coupon_code) {
//       await UpdateCouponStatus(req.body.coupon_code);
//     }
//     if (!req.body.property_uid) {
//       return res
//         .status(200)
//         .json({ status: false, error: "property_uid is are required" });
//     }
//     const { property_uid, room_info } = req.body;
//
//     const availableRooms = await Property.findOne(
//       {
//         property_uid: property_uid,
//       },
//       { property_name: 1, rooms: 1, _id: 0, phone_number: 1 }
//     );
//     const formattedCheckIn = moment(req.body.check_in, "YYYY/MM/DD").format(
//       "YYYY-MM-DD"
//     );
//     const formattedCheckOut = moment(req.body.check_out, "YYYY/MM/DD").format(
//       "YYYY-MM-DD"
//     );
//     const filteredRooms = availableRooms.rooms.filter(
//       (room) => room.active === false
//     );
//     const filteredRoomsForBooking = getRoomsInfoForDashboard(
//       filteredRooms,
//       formattedCheckIn,
//       formattedCheckOut
//     );
//     const obj = filteredRoomsForBooking.filter((room) => room !== null);
//     // Check if there are enough available rooms for each room type
//     const selectedRooms = [];
//     let isRoomAvailable = false;
//     let roomsType = [];
//     let roomInfo = {};
//     room_info.forEach((info) => {
//       const roomsOfType = obj
//         .filter((room) => room.room_type === info.room_type)
//         .map((room) => {
//           return {
//             ...room,
//             room_price: info.room_price,
//           };
//         });
//       if (roomsOfType?.length >= info.room_count) {
//         selectedRooms?.push(...roomsOfType.slice(0, info.room_count));
//       } else {
//         isRoomAvailable = true;
//         roomsType = roomsOfType;
//         roomInfo = info;
//       }
//     });
//     if (isRoomAvailable) {
//       return res.status(200).json({
//         status: false,
//         message: `Not enough available rooms for room type ${
//           roomInfo.room_type
//         }. Required: ${roomInfo.room_count},  We have Available rooms: ${
//           roomsType?.length || 0
//         }`,
//       });
//     }
//     is_payment = true;
//     payment_status = "success";
//     let booking_status;
//
//     const Check_time = await Property.findOne(
//       {
//         property_uid: req.body.property_uid,
//       },
//       {
//         check_in_time: 1,
//         check_out_time: 1,
//         _id: 0,
//       }
//     );
//     // Check if the room is blocked
//     if (req.body.isBlockRoom) {
//       booking_status = "pending";
//     }
//
//     const extraInfo = req.body.extra_services_info?.map((data) => {
//       return {
//         ...data,
//       };
//     });
//
//     var newBooking = await Booking.create({
//       booking_id: req.body.booking_id,
//       property_uid: req.body.property_uid,
//       property_name: availableRooms?.property_name,
//       phone_number: availableRooms?.phone_number,
//       room_info: selectedRooms,
//       check_in: formattedCheckIn,
//       check_out: formattedCheckOut,
//       number_of_rooms: req.body.number_of_rooms,
//       adults: req.body.adults,
//       children: req.body.children,
//       coupon_code: req.body.coupon_code,
//       extra_services_info: extraInfo,
//       customer_info: req.body.customer_info,
//       billing_info: {
//         total_Cost: req.body.billing_info.total_Cost,
//         discount: req.body.billing_info.discount,
//         sgst: req.body.billing_info.sgst,
//         cgst: req.body.billing_info.cgst,
//         amount_payable: req.body.billing_info.amount_payable,
//       },
//       balance_amount: req.body.billing_info.amount_payable,
//       paid_amount: 0,
//       is_payment: is_payment,
//       payment_status: payment_status,
//       booking_status: booking_status,
//     });
//     // }
//     const roomData = await Property.findOne({
//       property_uid: req.body.property_uid,
//     });
//
//     if (!roomData) {
//       return res
//         .status(200)
//         .json({ status: false, message: "Property not found" });
//     }
//
//     // Update each room individually
//     for (const selectedRoom of selectedRooms) {
//       await Property.updateOne(
//         {
//           property_uid: req.body.property_uid,
//           "rooms.room_uid": selectedRoom.room_uid,
//         },
//         {
//           $addToSet: {
//             "rooms.$.booking_info": {
//               id: newBooking._id,
//               booking_id: newBooking.booking_id,
//               name: req.body.customer_info?.name,
//               mobile_number: req.body.customer_info?.mobile_number,
//               email: req.body.customer_info?.email,
//               status: newBooking.booking_status,
//               check_in: formattedCheckIn,
//               check_out: formattedCheckOut,
//               check_in_time: Check_time.check_in_time,
//               check_out_time: Check_time.check_out_time,
//             },
//           },
//           $set: {
//             "rooms.$.is_booked": true,
//           },
//         }
//       );
//     }
//     if (newBooking.customer_info !== undefined) {
//       await addInvoiceContentAndSendMail(newBooking);
//     }
//     // await sendEmail(newBooking,filepath);
//     res.status(201).json({
//       status: true,
//       is_payment: true,
//       payment_status: "success",
//       message: "Booking successfully",
//       data: newBooking,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ status: false, error: error.message });
//   }
// };




exports.createBooking = async (req, res) => {
  try {
    console.log("createBooking****************",req.body);
    let is_payment;
    let payment_status;
    let booking_status;


    var order = req.body.order
    var payment_id = req.body.payment_id
    var signature = req.body.signature
    var customer_id = req.body.customer_id

    if(customer_id == undefined || customer_id == null){
      customer_id = ""
    }
    // console.log(req.body);

    if(order !== undefined && order !== null && order !== ""){
      var orders = await Booking.findOne({order_id:order})
    }

    // console.log("orders***********",orders);
    if(orders){

      // if(orders.payment_status !== 'initiated'){
      //   return res.json({
      //     status: false,
      //     message: "Incorrect payment details",
      //   });
      // }
      const key_secret = process.env.RAZORPAY_KEY_SECRET;


      let hmac = crypto.createHmac('sha256', key_secret);

      hmac.update(order + "|" + payment_id);

      const generated_signature = hmac.digest('hex');
      // console.log("generated_signature***********",generated_signature);

      if (signature === generated_signature) {
        is_payment = true
        payment_status = "success"
        var balance = req.body.billing_info.amount_payable - orders.paid_amount

        // var invoiceInfo = await Booking.find({invoice_id: { $exists: true, $ne: "-" }}).sort({_id: -1 })
        // // var invoiceInfo = await Booking.find({invoice_id:invoice_id}).sort({_id: -1 })
        // let sequenceNumber = 1;
        // if(invoiceInfo.length > 0){
        //   const latestID = invoiceInfo[0].invoice_id;
        //   const latestSequence = parseInt(latestID.split('/')[2], 10);
        //   sequenceNumber = latestSequence + 1;
        // }
        // var paddedSequence = sequenceNumber.toString().padStart(4, '0');
        // var invoice_id = "HR/2425/"+paddedSequence
      }else{
        is_payment = false
        payment_status = "pending"
        var balance = req.body.billing_info.amount_payable
        // var invoice_id = "-"
      }

      // console.log("***********invoice_id**************",invoice_id);
      // if (signature === generated_signature) {





              if (req.body.coupon_code) {
                await UpdateCouponStatus(req.body.coupon_code);
              }
              if (!req.body.property_uid) {
                return res
                  .status(200)
                  .json({ status: false, error: "property_uid is  required" });
              }

              const { property_uid, room_info } = req.body;




              const availableRooms = await Property.findOne(
                {
                  property_uid: property_uid,
                },
                { property_name: 1, rooms: 1, _id: 0, phone_number: 1 }
              );
              // console.log("available rooms",availableRooms);
              const formattedCheckIn = moment(req.body.check_in, "YYYY/MM/DD").format(
                "YYYY-MM-DD"
              );
              const formattedCheckOut = moment(req.body.check_out, "YYYY/MM/DD").format(
                "YYYY-MM-DD"
              );
              // const filteredRooms = availableRooms.rooms.filter(
              //   (room) => room.active === false
              //   // (room) => room.active === false && room.is_deleted !== true
              // );
              //
              // // console.log("filterrooms",filteredRooms);
              // // const filteredRoomsForBooking = getRoomsInfoForDashboard(
              // //   filteredRooms,
              // //   formattedCheckIn,
              // //   formattedCheckOut
              // // );
              //
              // var filteredRoomsForBooking = []
              //
              // for (var i = 0; i < filteredRooms.length; i++) {
              //   var newRoomUid = filteredRooms[i].room_uid
              //   // var bookingInfo = await Booking.find({
              //   //   booking_status: { $ne: 'cancel' },
              //   //   "check_in": { $gte: formattedCheckIn },
              //   //   "check_out": { $lte: formattedCheckOut },"room_info.room_uid":newRoomUid
              //   // });
              //
              //
              //   var bookingInfo = await Booking.find({
              //     booking_status: { $ne: 'cancel' },
              //     "room_info.room_uid":newRoomUid,
              //     check_in: { $lt: formattedCheckOut },
              //     check_out: { $gt: formattedCheckIn }
              //     // $or:[
              //     //   {"check_in": { $gte: formattedCheckIn },
              //     //     "check_out":{ $lte: formattedCheckOut }
              //     //   },
              //     //   {"check_in": { $gte: formattedCheckIn },
              //     //     "check_out":{ $gte: formattedCheckOut }
              //     //   },
              //     //   {"check_in": { $lte: formattedCheckIn },
              //     //     "check_out":{ $gte: formattedCheckOut }
              //     //   }
              //     // ]
              //   })
              //
              //
              //   if(bookingInfo.length == 0){
              //
              //     filteredRoomsForBooking.push({room_number: filteredRooms[i].room_number,
              //     room_type: filteredRooms[i].room_type,
              //     // booking_info: bookingRoom,
              //     is_booked: filteredRooms[i].is_booked,
              //     max_guest_occupancy: filteredRooms[i].max_guest_occupancy,
              //     room_gstin: filteredRooms[i].room_gstin,
              //     room_charge: filteredRooms[i].room_charge,
              //     room_uid: filteredRooms[i].room_uid})
              //   }else{
              //     for (var kl = 0; kl < bookingInfo.length; kl++) {
              //       // bookingInfo[i]
              //       if (bookingInfo[kl].booking_status == "cancel" || bookingInfo[kl].booking_status == "check_out") {
              //
              //
              //         let obj = filteredRoomsForBooking.find(o => o.room_uid === filteredRooms[i].room_uid);
              //
              //         if(obj == undefined || obj == null || obj == false){
              //
              //           filteredRoomsForBooking.push({room_number: filteredRooms[i].room_number,
              //           room_type: filteredRooms[i].room_type,
              //           // booking_info: bookingRoom,
              //           is_booked: filteredRooms[i].is_booked,
              //           max_guest_occupancy: filteredRooms[i].max_guest_occupancy,
              //           room_gstin: filteredRooms[i].room_gstin,
              //           room_charge: filteredRooms[i].room_charge,
              //           room_uid: filteredRooms[i].room_uid})
              //         }
              //
              //       }
              //     }
              //   }
              // }
              //
              //
              // const obj = filteredRoomsForBooking.filter((room) => room !== null);
              // // console.log("filteredRoomsForBooking",filteredRoomsForBooking);
              // // Check if there are enough available rooms for each room type
              // const selectedRooms = [];
              // let isRoomAvailable = false;
              // let roomsType = [];
              // let roomInfo = {};
              //
              // // console.log("room_info-----------",room_info);
              // room_info.forEach((info) => {
              //   const roomsOfType = obj
              //   // console.log("roomsOfType-----------",roomsOfType);
              //     // .filter((room) => room.room_uid === info.room_uid )
              //     .filter((room) => room.room_type === info.room_type && room.room_charge == info.single_room_price && room.max_guest_occupancy == info.max_guest_occupancy)
              //
              //     .map((room) => {
              //
              //       console.log("room",room);
              //       // console.log("info",info);
              //
              //       return {
              //         ...room,
              //         room_price: info.room_price,
              //         single_room_price: info.single_room_price,
              //         room_count: info.room_count,
              //         extra_services: info.extra_services,
              //       };
              //     });
              //
              //     // console.log("roomsOfType",roomsOfType);
              //     // console.log("roomsOfType?.length",roomsOfType?.length);
              //     // console.log("info.room_count",info.room_count);
              //   if (roomsOfType?.length >= info.room_count) {
              //     // selectedRooms?.push(...roomsOfType);
              //     selectedRooms?.push(...roomsOfType.slice(0, info.room_count));
              //   } else {
              //     isRoomAvailable = true;
              //     roomsType = roomsOfType;
              //     roomInfo = info;
              //   }
              // });
              //
              //
              // if (isRoomAvailable) {
              //   return res.status(200).json({
              //     status: false,
              //     message: `Not enough available rooms for room type ${
              //       roomInfo.room_type
              //     }. Required: ${roomInfo.room_count},  We have Available rooms: ${
              //       roomsType?.length || 0
              //     }`,
              //   });
              // }
              // is_payment = true;
              // payment_status = "success";

              // console.log("selectedRooms------------",selectedRooms);

              const Check_time = await Property.findOne(
                {
                  property_uid: req.body.property_uid,
                },
                {
                  check_in_time: 1,
                  check_out_time: 1,
                  _id: 0,
                }
              );
              // Check if the room is blocked
              if (req.body.isBlockRoom == true) {
                booking_status = "blocked";
              }else{
                booking_status = "confirmed";

              }

              const extraInfo = req.body.extra_services_info?.map((data) => {
                return {
                  ...data,availableRooms
                };
              });

              var rooms = await Booking.findOne({_id:orders._id})
              if(rooms){
                var selectedRooms = rooms.room_info
                // var invoice_id = rooms.invoice_id
              }


              if(req.body.isBlockRoom == true){
                var invoice_id = "-"
              }else{


                var invoiceInfo = await Booking.aggregate([
                  {
                    $match: {
                      invoice_id: { $regex: /^HR\/2425\// } // Match invoice IDs with the desired prefix
                    }
                  },
                  {
                    $addFields: {
                      numericInvoiceId: {
                        $toInt: { $substr: ["$invoice_id", 8, -1] } // Extract the numeric part after the prefix
                      }
                    }
                  },
                  {
                    $sort: { numericInvoiceId: -1 } // Sort by the numeric part in descending order (greatest first)
                  },
                  {
                    $limit: 1 // Get the greatest one
                  }
                ]);
                // console.log("invoiceInfo------------",invoiceInfo);


                // var invoiceInfo = await Booking.find({invoice_id: { $exists: true, $ne: "-" }}).sort({_id: -1 })
                let sequenceNumber = 1;
                if(invoiceInfo.length > 0){
                  const latestID = invoiceInfo[0].invoice_id;
                  const latestSequence = parseInt(latestID.split('/')[2], 10);
                  sequenceNumber = latestSequence + 1;
                }
                var paddedSequence = sequenceNumber.toString().padStart(4, '0');
                var invoice_id = "HR/2425/"+paddedSequence
              }

              // console.log("*******selectedRooms*******",selectedRooms);


              // var balance = req.body.billing_info.amount_payable - orders.paid_amount
              // console.log("@@@@@@@@invoice_id@@@@@@@@@@",invoice_id);

              // var newBooking = await Booking.findOneAndUpdate({_id:orders._id},{
              //   booking_id: req.body.booking_id,
              //   invoice_id: invoice_id,
              //   transaction_id:req.body.transaction_id,
              //   mode_of_payment:req.body.mode_of_payment,
              //   property_uid: req.body.property_uid,
              //   property_name: availableRooms?.property_name,
              //   phone_number: availableRooms?.phone_number,
              //   room_info: selectedRooms,
              //   check_in: formattedCheckIn,
              //   check_out: formattedCheckOut,
              //   number_of_rooms: req.body.number_of_rooms,
              //   adults: req.body.adults,
              //   children: req.body.children,
              //   coupon_code: req.body.coupon_code,
              //   extra_services_info: extraInfo,
              //   customer_info: req.body.customer_info,
              //   billing_info: {
              //     total_Cost: req.body.billing_info.total_Cost,
              //     discount: req.body.billing_info.discount,
              //     sgst: req.body.billing_info.sgst,
              //     cgst: req.body.billing_info.cgst,
              //     igst: req.body.billing_info.igst,
              //     amount_payable: req.body.billing_info.amount_payable,
              //   },
              //   balance_amount: balance,
              //   // paid_amount: 0,
              //   is_payment: is_payment,
              //   payment_status: payment_status,
              //   booking_status: booking_status,
              //   gst_data:{
              //     cgst_percent:req.body.gst_data.cgst_percent,
              //     sgst_percent:req.body.gst_data.sgst_percent,
              //     igst_percent:req.body.gst_data.igst_percent
              //   },
              //   customer_id:customer_id
              // },{new:true}).lean();

              var newBooking = await Booking.findOneAndUpdate({_id:orders._id},{
                // booking_id: req.body.booking_id,
                invoice_id: invoice_id,
                // transaction_id:req.body.transaction_id,
                // mode_of_payment:req.body.mode_of_payment,
                // property_uid: req.body.property_uid,
                // property_name: availableRooms?.property_name,
                // phone_number: availableRooms?.phone_number,
                // room_info: selectedRooms,
                // check_in: formattedCheckIn,
                // check_out: formattedCheckOut,
                // number_of_rooms: req.body.number_of_rooms,
                // adults: req.body.adults,
                // children: req.body.children,
                // coupon_code: req.body.coupon_code,
                // extra_services_info: extraInfo,
                // customer_info: req.body.customer_info,
                // billing_info: {
                //   total_Cost: req.body.billing_info.total_Cost,
                //   discount: req.body.billing_info.discount,
                //   sgst: req.body.billing_info.sgst,
                //   cgst: req.body.billing_info.cgst,
                //   igst: req.body.billing_info.igst,
                //   amount_payable: req.body.billing_info.amount_payable,
                // },
                balance_amount: balance,
                // paid_amount: 0,
                is_payment: is_payment,
                payment_status: payment_status,
                booking_status: booking_status,
                // gst_data:{
                //   cgst_percent:req.body.gst_data.cgst_percent,
                //   sgst_percent:req.body.gst_data.sgst_percent,
                //   igst_percent:req.body.gst_data.igst_percent
                // },
                // customer_id:customer_id
              },{new:true}).lean();

              const roomData = await Property.findOne({
                property_uid: req.body.property_uid,
              });

              if (!roomData) {
                return res
                  .status(200)
                  .json({ status: false, message: "Property not found" });
              }


              // console.log("selectedRoom",selectedRooms);


              for (let i=0 ; i<selectedRooms.length ; i++) {

                await Property.updateOne(
                  {
                    property_uid: req.body.property_uid,
                    "rooms.room_uid": selectedRooms[i].room_uid,
                  },
                  {
                    $addToSet: {
                      "rooms.$.booking_info": {
                        id: newBooking._id,
                        booking_id: newBooking.booking_id,
                        name: req.body.customer_info?.name,
                        mobile_number: req.body.customer_info?.mobile_number,
                        email: req.body.customer_info?.email,
                        status:newBooking.booking_status,
                        check_in: formattedCheckIn,
                        check_out: formattedCheckOut,
                        check_in_time: Check_time.check_in_time,
                        check_out_time: Check_time.check_out_time,
                        // is_payment:newBooking.is_payment,
                        payment_status:newBooking.payment_status,
                        balance_amount:newBooking.balance_amount
                      },
                    },
                    $set: {
                      "rooms.$.is_booked": true,
                    },
                  }
                );
              }
              // console.log("newBooking.customer_info----------------------------- ",newBooking.customer_info )

              const startDate = req.body.check_in;
              const endDate = req.body.check_out;
              const startMoment = moment(startDate);
              const endMoment = moment(endDate);
              const daysDifference = endMoment.diff(startMoment, "days");

              var newselectedRooms = newBooking.room_info

              for (var i = 0; i < newselectedRooms.length; i++) {
                newselectedRooms[i].room_price_new = newselectedRooms[i].room_price / daysDifference
                newselectedRooms[i].daysDifference = daysDifference
                newselectedRooms[i].index = i+1
              }
              var newextraInfo = extraInfo
              for (var i = 0; i < newextraInfo.length; i++) {
                newextraInfo[i].service_price_new = newextraInfo[i].service_price / daysDifference
                newextraInfo[i].daysDifference = daysDifference
                newextraInfo[i].index = i+1
              }

              // console.log("newselectedRooms",newselectedRooms);
              // console.log("newBooking.booking_id",newBooking.booking_id);

              const seen = new Set();

              // const resultnewselectedRooms = newselectedRooms.filter(obj => {
              //     const isDuplicate = seen.has(obj.room_type);
              //     seen.add(obj.room_type);
              //     return !isDuplicate;
              // });

              const resultnewselectedRooms = newselectedRooms.filter(obj => {
                  // Create a unique key combination string
                  const combination = `${obj.room_type}|${obj.single_room_price}`;

                  const isDuplicate = seen.has(combination);
                  seen.add(combination);

                  return !isDuplicate;
              });

              for (var i = 0; i < resultnewselectedRooms.length; i++) {
                resultnewselectedRooms[i].index = i+1
              }


              var bookingObjectNew = {
                invoice_id: newBooking.invoice_id,
                booking_id: newBooking.booking_id,
                transaction_id:newBooking.transaction_id,
                mode_of_payment:newBooking.mode_of_payment,
                property_uid: newBooking.property_uid,
                property_name: availableRooms?.property_name,
                phone_number: availableRooms?.phone_number,
                room_info: resultnewselectedRooms,
                check_in: formattedCheckIn,
                check_out: formattedCheckOut,
                number_of_rooms: newBooking.number_of_rooms,
                adults: newBooking.adults,
                children: newBooking.children,
                coupon_code: newBooking.coupon_code,
                extra_services_info: newextraInfo,
                customer_info: newBooking.customer_info,
                billing_info: {
                  total_Cost: newBooking.billing_info.total_Cost,
                  discount: newBooking.billing_info.discount,
                  sgst: newBooking.billing_info.sgst,
                  cgst: newBooking.billing_info.cgst,
                  igst: newBooking.billing_info.igst,
                  amount_payable: newBooking.billing_info.amount_payable,
                },
                balance_amount: balance,
                // paid_amount: 0,
                is_payment: is_payment,
                payment_status: payment_status,
                booking_status: booking_status,
                gst_data:{
                  cgst_percent:newBooking.gst_data.cgst_percent,
                  sgst_percent:newBooking.gst_data.sgst_percent,
                  igst_percent:newBooking.gst_data.igst_percent
                },
                customer_id:newBooking.customer_id,
                createdAt:new Date()
              }

              // if (newBooking.customer_info !== undefined) {
                var filepath = await addInvoiceContentAndSendMail(bookingObjectNew,newBooking._id, "createBooking");
              // }
              // console.log("filepath*******",filepath);
              // console.log("newBooking._id*******",newBooking._id);

              // var newBooking =  Booking.findOneAndUpdate({_id:newBooking._id},{
              //   pdf_file: res111
              // },{new:true});

              var type = newBooking.room_info
              var typearray = []
              if(type.length > 0){
                for(let i=0;i<type.length;i++){
                  typearray.push(type[i].room_type)
                }
              }

              if(newBooking.customer_info == undefined || newBooking.customer_info == null || newBooking.customer_info == ""){
                 var custName = ""
              }else{
                var custName = newBooking.customer_info.name
              }

              var mail =
                      `Hello,

                      We are excited to inform you that a new booking has been made for one of your property.
                      Here are the details of the booking:

                      Customer Name: ${custName}
                      Check_in: ${newBooking.check_in}
                      Check_out:${newBooking.check_out}
                      Rooms_book:${type.length}
                      Room Type: ${typearray}
                      Property: ${newBooking.property_name}

                      Thank you,
                      Hatimi Properties Booking System`


              // sendMail("tejaswita@esenseit.in","Booking Details Of Customer",mail)
              // sendMail("accounts@hatimiretreats.com,hsavai.estate@gmail.com,info@hatimiretreats.com","Booking Details Of Customer",mail)


              res.status(201).json({
                status: true,
                is_payment: is_payment,
                payment_status: payment_status,
                message: "Booking successfully",
                data: newBooking,
              });

      // }else {
      //   is_payment = false
      //   payment_status = "failed"
      //
      // }


      console.log("order found");
    }else{
      console.log("Order not found");
    }


  } catch (error) {
    console.log("error",error);
    res.status(500).json({ status: false, error: error.message });
  }
};






exports.updateStatus = async (req, res) => {
  try {
    let is_payment;
    let payment_status;
    let booking_status;



    var order = req.body.order

    console.log("updateStatus",req.body);
    var orders = await Booking.findOne({order_id:order})
    if(orders){

      if(orders.payment_status == 'success'){
        is_payment = orders.is_payment
        payment_status = orders.payment_status
        booking_status = orders.booking_status
        var balance_amount = 0
      }else{

        is_payment = false
        payment_status = "failed"
        booking_status = "cancel"
        var balance_amount = orders.billing_info.amount_payable
      }
      // var booking = await Booking.deleteOne({_id:orders._id})
      var booking = await Booking.findOneAndUpdate({_id:orders._id},{
        payment_status: payment_status,
        is_payment:is_payment,
        booking_status: booking_status,
        balance_amount:balance_amount
      },{new:true}).lean();
      // var property = await Property.findOneAndDelete({property_uid:orders.property_uid,booking_id:orders.booking_id})

      res.status(201).json({
        status: true,
        is_payment: is_payment,
        payment_status: payment_status,
        message: "Booking updated successfully",

      });

    }else{
      res.send({status:false,message:"Order not placed"})
    }

  } catch (error) {
    // console.log("error",error);
    res.status(500).json({ status: false, error: error.message });
  }
};





// Update a booking by ID
exports.updateBooking = async (req, res) => {

  console.log("**********updateBooking*********",req.body);
  try {
    const {
      property_uid,
      booking_status,
      current_room_info,
      new_room_info,
      booking_id,
      check_in,
      order,
      signature,
      payment_id,
      amount

    } = req.body;
    // console.log("orderid",req.body.order);
    // console.log(req.body);
    var is_payment;
    var payment_status;
    var updatedBooking;

    const bookingProperty = await Property.findOne(
      { property_uid }
    );

    var propertyState = bookingProperty.property_state

    const currentDate = moment().format("YYYY/MM/DD");
    if (booking_status === "check_in" && currentDate !== check_in) {
      return res.status(200).json({
        status: false,
        message: `Currently Check-in not allowed, Today ${currentDate}, Your check In date is ${check_in} `,
      });
    }
    if (!current_room_info && !new_room_info) {
      return res.status(200).json({
        status: false,
        message: `required field is missing either current_room_info or new_room_info`,
      });
    }


    var extra = req.body.extraService;
    // console.log("extra---------------",extra);
    var previous_services = req.body.previous_services;
    var bal_amount=0;
    var amt = 0;
    var remove_amt = 0;

    // if(extra && extra.length > 0){
    //   for(let i=0; i<extra.length ;i++){
    //      amt = amt +  parseInt(extra[i].price)
    //      console.log("amt",amt);
    //
    //   }
    // }

    var booking = await Booking.findOne({property_uid:property_uid,booking_id:booking_id})
    var pre_check_in = booking.check_in
    var pre_check_out = booking.check_out
    var gst = booking.gst_data
    var already_paid_amount = booking.paid_amount
    var pre_paid_amount = booking.paid_amount+amount
    var pre_balance_amount = booking.balance_amount
    var pre_amout_without_gst = booking.billing_info.total_Cost
    var payableAmount = booking.billing_info.amount_payable
    var pre_sgst = booking.billing_info.sgst
    var pre_cgst = booking.billing_info.cgst
    var pre_igst = booking.billing_info.igst
    var extra_services_info = booking.extra_services_info
    var new_amout_without_gst = pre_amout_without_gst

    // if(pre_amout_without_gst !== undefined || pre_amout_without_gst !== null && pre_amout_without_gst !== ""){
    //   pre_amout_without_gst += amt
    // }


    var extraAmount = 0
    var newRemoveAmount = 0
    if(current_room_info && current_room_info.length > 0){
      for (var i = 0; i < current_room_info.length; i++) {
        var roomExtraService = current_room_info[i].extra_services

        for (var a = 0; a < roomExtraService.length; a++) {


          // console.log("roomExtraService[a]--------",roomExtraService[a]);
          if(roomExtraService[a].is_new == true){
            // console.log("inside Is NEW");
            // console.log("roomExtraService[a].service_price",roomExtraService[a].service_price);
            var newAmountNew = roomExtraService[a].service_price
            extraAmount += newAmountNew
          }else{

            if(roomExtraService[a].is_update == true){

              // console.log("inside Is UPDATE");

              if(roomExtraService[a].service_count > roomExtraService[a].service_count_old){
                var newExtraCount = roomExtraService[a].service_count-roomExtraService[a].service_count_old
                var newExtraPricePerDay = roomExtraService[a].single_service_price*roomExtraService[a].service_days

                extraAmount += newExtraPricePerDay*newExtraCount

              }else if (roomExtraService[a].service_count < roomExtraService[a].service_count_old){
                var newExtraCount = roomExtraService[a].service_count_old-roomExtraService[a].service_count
                var newExtraPricePerDay = roomExtraService[a].single_service_price*roomExtraService[a].service_days

                newRemoveAmount += newExtraPricePerDay*newExtraCount
              }
            }
          }


          // console.log("extraAmount----------",extraAmount);
        }

        roomExtraService = roomExtraService.filter(obj1 => obj1.service_count !== 0);
        current_room_info[i].extra_services = roomExtraService

        // roomExtraService.forEach(obj1 => {
        //
        //   console.log("obj1--------",obj1);
        //   if(obj1.is_new = true){
        //     console.log("inside Is NEW");
        //     extraAmount += obj1.service_price
        //   }else{
        //
        //     if(obj1.is_update = true){
        //
        //       console.log("inside Is UPDATE");
        //
        //       if(obj1.service_count > obj1.service_count_old){
        //         var newExtraCount = obj1.service_count-obj1.service_count_old
        //         var newExtraPricePerDay = obj1.single_service_price*obj1.service_days
        //
        //         extraAmount += newExtraPricePerDay*newExtraCount
        //
        //       }else if (obj1.service_count < obj1.service_count_old){
        //         var newExtraCount = obj1.service_count_old-obj1.service_count
        //         var newExtraPricePerDay = obj1.single_service_price*obj1.service_days
        //
        //         newRemoveAmount += newExtraPricePerDay*newExtraCount
        //       }
        //     }
        //   }
        //
        //
        //   console.log("extraAmount----------",extraAmount);
        // })
        // roomExtraService = roomExtraService.filter(obj1 => obj1.service_count !== 0);
        // current_room_info[i].extra_services = roomExtraService
      }
    }
    // console.log("new_amout_without_gst---",new_amout_without_gst);
    // console.log("extraAmount---",extraAmount);
    // console.log("newRemoveAmount---",newRemoveAmount);

    new_amout_without_gst += extraAmount
    new_amout_without_gst -= newRemoveAmount

    // console.log("new_amout_without_gst",new_amout_without_gst);

    var grandTotal = 0
    if (propertyState == "Maharashtra" || propertyState == "MAHARASHTRA" || propertyState == "maharashtra") {

      if (new_amout_without_gst <= 7500) {
        var cgst = 6
        var sgst = 6
        var cgstValue = cgst / 100
        var sgtValue = sgst / 100
      } else {
        var cgst = 9
        var sgst = 9
        var cgstValue = cgst / 100
        var sgtValue = sgst / 100
      }

      var cstAmount = cgstValue * new_amout_without_gst
      var sgtAmount = sgtValue * new_amout_without_gst
      var igst = 0
      var igstAmount = 0
      grandTotal = new_amout_without_gst + cstAmount + sgtAmount

      // console.log("cstAmount&&&&&&&",cstAmount);


    } else {
      if (new_amout_without_gst <= 7500) {
        var igst = 12
        var igstValue = igst / 100
      } else {
        var igst = 18
        var igstValue = igst / 100
      }

      var igstAmount = igstValue * new_amout_without_gst
      var cstAmount = 0
      var sgtAmount = 0
      var cgst = 0
      var sgst = 0
      grandTotal = new_amout_without_gst + igstAmount

    }

    // console.log("igstAmount",igstAmount);
    // console.log("cstAmount",cstAmount);
    // console.log("sgtAmount",sgtAmount);

    if(already_paid_amount > 0){

      if(grandTotal >= already_paid_amount){
        var newBalanceAmount = grandTotal-already_paid_amount
      }else{
        var newBalanceAmount = 0
        grandTotal += already_paid_amount-grandTotal
      }
    }else{
      var newBalanceAmount = grandTotal
    }

    // if(extra && extra.length > 0){
    //   extra_services_info.forEach(obj1 => {
    //       let matchingObj = extra.find(obj2 => obj2.service_name === obj1.service_name);
    //       if (matchingObj) {
    //           obj1.service_count += matchingObj.service_count;
    //           obj1.service_price += parseInt(matchingObj.price);
    //       }
    //   });
    //
    //
    //   extra.forEach(obj2 => {
    //       let existsInArray1 = extra_services_info.some(obj1 => obj1.service_name === obj2.service_name);
    //       if (!existsInArray1) {
    //           extra_services_info.push({
    //             service_name:obj2.service_name,
    //             service_price:parseInt(obj2.price),
    //             service_count:obj2.service_count,
    //             service_days:obj2.service_days,
    //           });
    //       }
    //   });
    // }

    const pre_startDate = booking.check_in;
    const pre_endDate = booking.check_out;
    const pre_startMoment = moment(pre_startDate);
    const pre_endMoment = moment(pre_endDate);
    const pre_daysDifference = pre_endMoment.diff(pre_startMoment, "days");

    // if(previous_services && previous_services.length > 0){
    //
    //   extra_services_info.forEach(obj1 => {
    //       let matchingObj = previous_services.find(obj2 => obj2.service_name === obj1.service_name);
    //       if (matchingObj) {
    //
    //         if(matchingObj.service_count_old !== matchingObj.service_count){
    //           var newCount = matchingObj.service_count
    //           var lessCount = matchingObj.service_count_old-matchingObj.service_count
    //
    //           var singleServicePrice = parseInt(obj1.service_price/obj1.service_count)
    //           var subtractAmount = singleServicePrice*lessCount
    //           var updateAmount = singleServicePrice*newCount
    //
    //           if(matchingObj.service_days == undefined || matchingObj.service_days == null || matchingObj.service_days == "" || matchingObj.service_days == 0){
    //             var serviceDayCount = pre_daysDifference
    //           }else{
    //             var serviceDayCount = matchingObj.service_days
    //           }
    //
    //           var singleServicePrice = parseInt((obj1.service_price/obj1.service_count)/serviceDayCount)
    //           var subtractAmount = singleServicePrice*lessCount*serviceDayCount
    //           var updateAmount = singleServicePrice*newCount*serviceDayCount
    //
    //           remove_amt += subtractAmount
    //           obj1.service_count = newCount;
    //           obj1.service_price = updateAmount;
    //
    //           if(pre_amout_without_gst !== undefined || pre_amout_without_gst !== null && pre_amout_without_gst !== ""){
    //             pre_amout_without_gst -= subtractAmount
    //           }
    //         }
    //
    //       }
    //   });
    //
    //   extra_services_info = extra_services_info.filter(obj1 => obj1.service_count !== 0);
    // }

    // if(gst.igst_percent == null || gst.igst_percent == undefined || gst.igst_percent == ""){
    //   gst.igst_percent=0
    // }
    //
    // if(gst.cgst_percent == null || gst.cgst_percent == undefined || gst.cgst_percent ==""){
    //   gst.cgst_percent = 0
    // }
    //
    // if(gst.sgst_percent == null || gst.sgst_percent == undefined || gst.sgst_percent ==""){
    //   gst.sgst_percent = 0
    // }
    //
    //
    // var total_gst = parseInt(gst.cgst_percent + gst.sgst_percent + gst.igst_percent)
    //  bal_amount += amt + (amt * total_gst/100);
    //
    //  pre_sgst = (pre_amout_without_gst * parseInt(gst.sgst_percent)/100);
    //  pre_cgst = (pre_amout_without_gst * parseInt(gst.cgst_percent)/100);
    //  pre_igst = (pre_amout_without_gst * parseInt(gst.igst_percent)/100);
    //
    //  if(remove_amt > 0){
    //    var remove_sgst = (remove_amt * parseInt(gst.sgst_percent)/100);
    //    var remove_cgst = (remove_amt * parseInt(gst.cgst_percent)/100);
    //    var remove_igst = (remove_amt * parseInt(gst.igst_percent)/100);
    //
    //    remove_amt += remove_sgst
    //    remove_amt += remove_cgst
    //    remove_amt += remove_igst
    //  }
    //
    //  bal_amount -= remove_amt
    //  // payableAmount += bal_amount
    //  payableAmount += bal_amount
    //
    //  console.log("bal_amount",bal_amount);
    //  console.log("payableAmount",payableAmount);
    //
    //  if(pre_balance_amount !== undefined || pre_balance_amount !== null && pre_balance_amount !== ""){
    //    bal_amount += pre_balance_amount
    //  }

var updatedBooking;


  if(order !== undefined && order !== null && order !== ""){
    var orders = await Booking.findOne({order_id:order})

  }

  // console.log("orders",orders);
  if(orders){

    const key_secret =  process.env.RAZORPAY_KEY_SECRET;


    let hmac = crypto.createHmac('sha256', key_secret);

    hmac.update(order + "|" + payment_id);

    const generated_signature = hmac.digest('hex');


    if(signature == generated_signature){

      const updateData = {
        booking_status: booking_status,
      };
       updatedBooking = await Booking.findByIdAndUpdate(
        req.params.id,
        {
          $set: updateData,
        },
        { new: true }
      );

      if (!updatedBooking) {
        return res
          .status(200)
          .json({ status: false, message: "Booking not found" });
      }


      if (current_room_info && current_room_info.length > 0) {


        for (let i=0;i<current_room_info.length;i++) {


          const updatedBookingInfo = await Booking.findByIdAndUpdate(
            req.params.id,
            {
              // $push: {
              //   "room_info.$[elem].extra_services":req.body.extraService || []
              //    // current_room_info[i].extra_services || [],
              // },
              $set:{
                // extra_services_info : extra_services_info,
                room_info : current_room_info,
                balance_amount : newBalanceAmount,
                "billing_info.amount_payable" : grandTotal,
                "billing_info.total_Cost" : new_amout_without_gst,
                "billing_info.sgst" : sgtAmount,
                "billing_info.cgst" : cstAmount,
                "billing_info.igst" : igstAmount,
                "gst_data.cgst_percent" : cgst,
                "gst_data.sgst_percent" : sgst,
                "gst_data.igst_percent" : igst,
              }
            },
            // {
            //   arrayFilters: [
            //     {
            //       "elem.room_uid": current_room_info[i].room_uid,
            //     },
            //   ],
            //   new: true,
            // }
          );
          // console.log("updatedbooking",updatedBookingInfo);
        }
      }


      if (new_room_info && new_room_info.length > 0) {
        const bookingInfo = await Booking.findOne(
          { booking_id },
          { room_info: 1 }
        );
        if (bookingInfo) {
          let room_info = bookingInfo.room_info;

          new_room_info.forEach((newRoom) => {
            const index = room_info?.findIndex(
              (oldRoom) => oldRoom.room_uid === newRoom.old_room_uid
            );
            if (index !== -1) {
              room_info[index].room_type = newRoom.room_type;
              room_info[index].room_number = newRoom.room_number;
              room_info[index].room_name = newRoom.room_name;
              room_info[index].room_uid = newRoom.new_room_uid;
              room_info[index].extra_services = newRoom.extra_services;
            }
          });

          // Use findOneAndUpdate for atomic update
          await Booking.findOneAndUpdate(
            { booking_id },
            { $set: { room_info } },
            { new: true }
          );

          // console.log("Booking information updated successfully");
        } else {
          console.error(
            "Booking information not found for booking_id:",
            booking_id
          );
        }

      }



      is_payment = true
      payment_status = "success"
      var bal = orders.balance_amount - amount
      // console.log("order balance amt",orders.balance_amount);
      // console.log("balance",bal);
      await Booking.findOneAndUpdate({order_id:order},
        {
        is_payment:is_payment,
        payment_status:payment_status,
        balance_amount:bal,
        paid_amount:pre_paid_amount
      })

    res.json({
      status: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });

    }else{

      // console.log("one");
        return res.status(200).json({
        status: false,
        message:"Your payment didn't go through as it was declined by the bank. Try another payment method or contact your bank.",
      });
    }

  }else{





      const updateData = {
        booking_status: booking_status,
      };

       updatedBooking = await Booking.findByIdAndUpdate(
        req.params.id,
        {
          $set: updateData,
        },
        { new: true }
      );

      if (!updatedBooking) {
        return res
          .status(200)
          .json({ status: false, message: "Booking not found" });
      }

          if (current_room_info && current_room_info.length > 0) {

            for (let i=0;i<current_room_info.length;i++) {


              // console.log("updatedproperty",updateBookingInfoForRoom);

              const updatedBookingInfo = await Booking.findByIdAndUpdate(
                req.params.id,
                {
                  // $push: {
                  //   "room_info.$[elem].extra_services":req.body.extraService || []
                  //    // current_room_info[i].extra_services || [],
                  // },
                  $set:{
                    // // extra_services_info : extra_services_info,
                    // room_info : current_room_info,
                    // balance_amount : bal_amount,
                    // "billing_info.amount_payable" : payableAmount,
                    // "billing_info.total_Cost" : pre_amout_without_gst,
                    // "billing_info.sgst" : pre_sgst,
                    // "billing_info.cgst" : pre_cgst,
                    // "billing_info.igst" : pre_igst,

                    room_info : current_room_info,
                    balance_amount : newBalanceAmount,
                    "billing_info.amount_payable" : grandTotal,
                    "billing_info.total_Cost" : new_amout_without_gst,
                    "billing_info.sgst" : sgtAmount,
                    "billing_info.cgst" : cstAmount,
                    "billing_info.igst" : igstAmount,
                    "gst_data.cgst_percent" : cgst,
                    "gst_data.sgst_percent" : sgst,
                    "gst_data.igst_percent" : igst,
                  }
                },
                // {
                //   arrayFilters: [
                //     {
                //       "elem.room_uid": current_room_info[i].room_uid,
                //     },
                //   ],
                //   new: true,
                // }
              );
              // console.log("updatedbooking",updatedBookingInfo);
            }
          }


      if (new_room_info && new_room_info.length > 0) {
        const bookingInfo = await Booking.findOne(
          { booking_id },
          { room_info: 1 }
        );
        if (bookingInfo) {
          let room_info = bookingInfo.room_info;

          new_room_info.forEach((newRoom) => {
            const index = room_info?.findIndex(
              (oldRoom) => oldRoom.room_uid === newRoom.old_room_uid
            );
            if (index !== -1) {
              room_info[index].room_type = newRoom.room_type;
              room_info[index].room_number = newRoom.room_number;
              room_info[index].room_name = newRoom.room_name;
              room_info[index].room_uid = newRoom.new_room_uid;
              room_info[index].extra_services = newRoom.extra_services;
            }
          });

          // Use findOneAndUpdate for atomic update
          await Booking.findOneAndUpdate(
            { booking_id },
            { $set: { room_info } },
            { new: true }
          );

          // console.log("Booking information updated successfully");
        } else {
          console.error(
            "Booking information not found for booking_id:",
            booking_id
          );
        }

      }



// console.log("updatedbooking",updatedBooking);
    res.json({
      status: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });

    // console.log("Order not found")
  }







  // }else{
  //   res.send({status:false,message:"You have not paid for booking"})
  // }
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};




// Update a Reservation Status by ID
exports.updateReservationStatus = async (req, res) => {
  try {
    const updatedReservationStatus = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          booking_status: req.body.booking_status,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedReservationStatus) {
      return res
        .status(200)
        .json({ status: false, message: "Reservation data not found" });
    }
    const updatedRoomStatus = await Property.findOneAndUpdate(
      {
        property_uid: req.body.property_uid,
        "rooms.room_uid": req.body.room_uid,
      },
      {
        $set: {
          "rooms.$.is_booked":
            req.body.booking_status === "cancel" ||
            req.body.booking_status === "check_out"
              ? false
              : true,
          "rooms.$.booking_info.$[elem].status": req.body.booking_status,
        },
      },
      {
        arrayFilters: [{ "elem.booking_id": req.body.booking_id }],
      }
    );
    res.json({
      status: true,
      message: "Reservation updated successfully",
    });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};





exports.getRoomNumbersByPropertyIdAndRoomType = async (req, res) => {
  try {
    let availableForBookings = [];
    const property_uid = req.params.id;
    const { room_type, check_in, check_out } = req.body;
    const propertyRooms = await Property.findOne(
      { property_uid },
      { rooms: 1, _id: 0 }
    );

    if (!propertyRooms) {
      return res
        .status(200)
        .json({ status: false, message: "Property not found" });
    }
    const availableRooms = propertyRooms.rooms?.filter(
      (room) => room.room_type === room_type
    );
    //console.log(check_in,check_out);
    // Extract room numbers from the available rooms
    const roomsInfo = availableRooms.map((room) => {
      const bookingRoom = room.booking_info.filter((booking) => {
        const bookingStartDate = new Date(booking.check_in);
        const bookingEndDate = new Date(booking.check_out);
        const filterStartDate = new Date(check_in);
        const filterEndDate = new Date(check_out);
        if (
          bookingStartDate < filterStartDate &&
          bookingEndDate <= filterStartDate
        ) {
          return {
            ...booking,
          };
        } else {
          if (booking.status === "check_out" || booking.status === "cancel") {
            return {
              ...booking,
            };
          }
        }
      });
      if (bookingRoom.length === room.booking_info.length) {
        return {
          room_number: room.room_number,
          room_uid: room.room_uid,
          room_type: room.room_type,
          room_name: room.room_name,
        };
      } else {
        return {};
      }
    });
    roomsInfo.forEach((roomInfo) => {
      if (Object.keys(roomInfo).length !== 0) {
        availableForBookings.push(roomInfo);
      }
    });
    res.status(200).json({
      status: true,
      message: "fached Data successfully",
      data: availableForBookings,
    });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};




exports.getNameAndIdByQuery = async (req, res) => {
  const { query, page = 1, pageSize = 10 } = req.query;
  const { startDate, endDate } = req.body;
  const propertyUid = req.params.id;
  try {
    let queryFilter = propertyUid ? { property_uid: propertyUid } : {};

    if (startDate && endDate) {
      queryFilter.check_in = { $gte: startDate, $lte: endDate };
      queryFilter.check_out = { $gte: startDate, $lte:endDate };
    }
    if (query) {
      queryFilter.$or = [
        { booking_id: { $regex: query, $options: "i" } },
        { "customer_info.name": { $regex: query, $options: "i" } },
      ];
    }
    const [result, totalCount] = await Promise.all([
      Booking.find(queryFilter)
        .sort({ booking_id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      Booking.countDocuments(queryFilter),
    ]);

    res.status(200).json({
      status: true,
      message: "Search successful",
      result,
      totalCount,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};







// exports.getFrontDeskInfo = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const roomsData = await Property.findOne(
//       {
//         property_uid: id,
//       },
//       {
//         rooms: 1,
//         _id: 0,
//       }
//     );
//     if (!roomsData) {
//       return res
//         .status(200)
//         .json({ status: false, message: "front desk data not found" });
//     }
//
//     const { startDate, endDate } = req.body;
//
//     const filteredRooms = roomsData.rooms.map((room, ind) => {
//       const bookingInfo = room.booking_info.filter((booking) => {
//         const bookingStartDate = new Date(booking.check_in);
//         const bookingEndDate = new Date(booking.check_out);
//         const filterStartDate = new Date(startDate);
//         const filterEndDate = new Date(endDate);
//
//         return (
//           bookingStartDate >= filterStartDate &&
//           bookingEndDate <= filterEndDate &&
//           booking.status !== "cancel"
//         );
//       });
//       // console.log(ind,room.room_number,bookingInfo);
//       return {
//         room_type: room.room_type,
//         booking_info: bookingInfo,
//         room_number: room.room_number,
//       };
//     });
//     const filterBookingData = filteredRooms.filter(
//       (room) => room.booking_info.length > 0
//     );
//     var room_array = [];
//
//     filterBookingData.forEach(function (room) {
//       var roomObj = room_array.find((r) => r.room_type === room.room_type);
//       if (!roomObj) {
//         roomObj = {
//           room_type: room.room_type,
//           room_no_array: [],
//         };
//         room_array.push(roomObj);
//       }
//
//       roomObj.room_no_array.push({
//         room_no: room.room_number,
//         room_details: room.booking_info.map(function (booking) {
//           return {
//             ...booking.toObject(),
//           };
//         }),
//       });
//     });
//     //
//     // console.log("Room array1",room_array[0].room_no_array[0])
//     // console.log("Room array2",room_array[0].room_no_array[1])
//
//     res.json({
//       status: true,
//       message: "Fetched front desk data successfully",
//       data: room_array,
//     });
//
//   } catch (error) {
//     console.log(error);
//     res.status(error.status ? error.status : 500).json({
//       staus: false,
//       error: error.message,
//     });
//   }
// };
//


exports.getFrontDeskInfo = async (req, res) => {
  const { id } = req.params;
  try {
    const roomsData = await Property.findOne(
      {
        property_uid: id,
      },
      {
        rooms: 1,
        _id: 0,
      }
    );
    if (!roomsData) {
      return res
        .status(200)
        .json({ status: false, message: "front desk data not found" });
    }

    // console.log("getFrontDeskInfo",req.body);
    const { startDate, endDate } = req.body;


    var allRooms = roomsData.rooms
    var allDataArray = []

    allRooms.forEach(function (room) {
      var roomObj = allDataArray.find((r) => r.room_type === room.room_type);
      if (!roomObj) {
        roomObj = {
          room_type: room.room_type,
          room_no_array: [],
        };
        allDataArray.push(roomObj);
      }

      roomObj.room_no_array.push({
        room_uid: room.room_uid,
        room_no: room.room_number,
        room_details: []
      });
    });

    // console.log("allDataArray",allDataArray);

    var finalDataArray = []


    async function processRooms(allDataArray, startDate, endDate) {
      const finalDataArray = [];

      const promises = allDataArray.map(async (singleRoom) => {
        var room_no_array = singleRoom.room_no_array;

        for (var i = 0; i < room_no_array.length; i++) {
          var room_uid = room_no_array[i].room_uid;

          // const bookingDetails = await Booking.find({
          //   "room_info.room_uid": room_uid,
          //   booking_status: { $ne: 'cancel' },
          //   check_in: { $gte: startDate },
          //   check_out: { $lte: endDate }
          // }).lean().sort({check_in:1});

          var bookingDetails = await Booking.find({
            booking_status: { $ne: 'cancel' },
            "room_info.room_uid":room_uid,
            check_in: { $lt: endDate },
            check_out: { $gt: startDate }
            // $or:[
            //   {"check_in": { $gte: startDate },
            //     "check_out":{ $lte: endDate }
            //   },
            //   {"check_in": { $gte: startDate },
            //     "check_out":{ $gte: endDate }
            //   },
            //   {"check_in": { $lte: startDate },
            //     "check_out":{ $gte: endDate }
            //   }
            // ]
          }).lean().sort({check_in:1});

          if (bookingDetails.length > 0) {
            for (var op = 0; op < bookingDetails.length; op++) {
              bookingDetails[op].status = bookingDetails[op].booking_status
              bookingDetails[op].id = bookingDetails[op]._id
              if(bookingDetails[op].customer_info !== undefined){
                bookingDetails[op].name = bookingDetails[op].customer_info.name
                bookingDetails[op].email = bookingDetails[op].customer_info.email
                bookingDetails[op].mobile_number = bookingDetails[op].customer_info.mobile_number
              }
              room_no_array[i].room_details.push(bookingDetails[op]);
            }
          }
        }

        singleRoom.room_no_array = room_no_array;

        finalDataArray.push({
          room_type: singleRoom.room_type,
          room_no_array: room_no_array
        });
      });

      await Promise.all(promises);

      // console.log("All data has been processed and pushed to finalDataArray");
      return finalDataArray;
    }


    processRooms(allDataArray, startDate, endDate).then((finalDataArray) => {
      // console.log(finalDataArray);
      // console.log('Next line of code');

      res.json({
        status: true,
        message: "Fetched front desk data successfully",
        data: finalDataArray,
        // data: room_array,
        // allDataArray: finalDataArray,
      });
    });

  } catch (error) {
    console.log(error);
    res.status(error.status ? error.status : 500).json({
      staus: false,
      error: error.message,
    });
  }
};






exports.updateInvoice = async (req, res) => {
  try {

    // console.log("*********update invoice*********",req.headers);
    const booking_id = req.params.id ? req.params.id : null;

    if (!booking_id) {
      return res
        .status(200)
        .json({ status: true, message: "booking_id is required" });
    }

    const booking = await Booking.findById(booking_id).lean();
    if (!booking) {
      return res
        .status(200)
        .json({ status: false, message: "Booking data not found" });
    }

    const pdf_file = booking.pdf_file;
    const startDate = booking.check_in;
    const endDate = booking.check_out;
    const startMoment = moment(startDate);
    const endMoment = moment(endDate);
    const daysDifference = endMoment.diff(startMoment, "days");

    var newselectedRooms = booking.room_info
    for (var i = 0; i < newselectedRooms.length; i++) {
      newselectedRooms[i].room_price_new = newselectedRooms[i].room_price / daysDifference
      newselectedRooms[i].daysDifference = daysDifference
      newselectedRooms[i].index = i+1
    }
    var newextraInfo = booking.extra_services_info
    for (var i = 0; i < newextraInfo.length; i++) {
      newextraInfo[i].service_price_new = newextraInfo[i].service_price / daysDifference
      newextraInfo[i].daysDifference = daysDifference
      newextraInfo[i].index = i+1
    }

    const seen = new Set();

    // const resultnewselectedRooms = newselectedRooms.filter(obj => {
    //     const isDuplicate = seen.has(obj.room_type);
    //     seen.add(obj.room_type);
    //     return !isDuplicate;
    // });

    const resultnewselectedRooms = newselectedRooms
    // const resultnewselectedRooms = newselectedRooms.filter(obj => {
    //     // Create a unique key combination string
    //     const combination = `${obj.room_type}|${obj.single_room_price}`;
    //
    //     const isDuplicate = seen.has(combination);
    //     seen.add(combination);
    //
    //     return !isDuplicate;
    // });


    for (var i = 0; i < resultnewselectedRooms.length; i++) {
      resultnewselectedRooms[i].index = i+1
    }

    booking.extra_services_info = newextraInfo
    booking.room_info = resultnewselectedRooms
    // booking.room_info = newselectedRooms

    if(booking.invoice_id == undefined || booking.invoice_id == null){
      if(booking.booking_status == 'blocked'){
        booking.invoice_id = '-'
      }else{
        booking.invoice_id = ''
      }
    }

    // console.log("**************&&&&&&&&&&&&&&&&&&");
    console.log("booking*************",booking);
    var filePath = await addInvoiceContentAndSendMail(booking,booking._id, "updateInvoice");
    // const filePath = await updatedInvoice(booking);
    // console.log("filePath-------------------",filePath);
    const outputPath = path.join(__dirname, "../public/createinvoice/");
    const outputFilePath = path.join(outputPath, filePath);
    const removeFilePath = path.join(outputPath, pdf_file);

    // console.log("outputFilePath",outputFilePath);
    // console.log("removeFilePath",removeFilePath);

    // await fs.unlink(removeFilePath);
    // fs.unlink(removeFilePath, (err) => {
    //   if (err) {
    //     console.error(`Error deleting file ${filePath}:`, err);
    //     return;
    //   }
    // });

    // fs.readFile(filePath, (err, data) => {
    //   if (err) {
    //     console.error(err);
    //     res.status(500).send("Internal Server Error");
    //     return;
    //   }
    //
    //   console.log("data-------",data);
    //
    //   // Set Content-Type header to indicate the type of content being sent
    //   res.contentType("application/pdf");
    //
    //   // Send the PDF file as a response
    //   // res.send({status:true, message:"PDF created successfully", data:filePath});
    // });
    return res.sendFile(outputFilePath);
  } catch (error) {
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};






exports.updateProperyBookingInfo = async (req, res) => {
  try {
    const getPropertyData = await Property.find();
    if (getPropertyData.length <= 0) {
      return res.json({
        status: false,
        data: getPropertyData,
        message: "Properties data not found.",
      });
    } else {
      const currentDate = new Date();
      let oneMonthAgo = new Date(currentDate);
      oneMonthAgo.setMonth(currentDate.getMonth() - 1);
      if (currentDate.getMonth() === 0) {
        oneMonthAgo = new Date(
          currentDate.getFullYear() - 1,
          11,
          currentDate.getDate(),
          currentDate.getHours(),
          currentDate.getMinutes(),
          currentDate.getSeconds()
        );
      }
      await getPropertyData.forEach(async (doc) => {
        doc.rooms = doc.rooms?.map((roomObj, ind) => {
          const updatedBooking = roomObj.booking_info?.filter((booking) => {
            const bookingDate = new Date(booking.createdAt);
            return bookingDate > oneMonthAgo;
          });
          return {
            ...roomObj,
            booking_info: updatedBooking,
          };
        });
        await doc.save();
      });
      const balance_data = getPropertyData[0].rooms.map(
        (room) => room.booking_info
      );
      return res.json({
        status: true,
        message: "Updated properties successfully",
      });
    }
  } catch (error) {
    console.error(
      "BookingController.js file >> updateProperyBookingInfo Api error - 785",
      error
    );
    res.status(500).json({ status: false, error: "Internal Server Error" });
  }
};




exports.getCustomerBooking = async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const pageSize = 10;
    const customer_id = req.body.customer_id;
    // const { startDate, endDate } = req.body;
    const filter = {customer_id:customer_id};
    // const filter = propertyUid ? { property_uid: propertyUid } : {};
    // if (startDate && endDate) {
    //   filter.check_in = { $gte: startDate, $lte: endDate };
    //   filter.check_out = { $gte: startDate, $lte:endDate };
    // }

    const totalBookings = await Booking.countDocuments(filter);
    const totalPages = Math.ceil(totalBookings / pageSize);
    const skip = (page - 1) * pageSize;

    const bookings = await Booking.find(filter)
      .sort({ booking_id: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();
    if (bookings.length === 0) {
      return res
        .status(200)
        .json({ status: false, message: "No bookings found" });
    }
    // console.log("bookings",bookings)
    for (var i = 0; i < bookings.length; i++) {
      var index = i
      var property_uid = bookings[i].property_uid
      var room_info = bookings[i].room_info

      const propertyData = await Property.findOne({
        property_uid: property_uid,
      });

      var propertyRooms = propertyData.rooms

      for (var j = 0; j < room_info.length; j++) {
        var room_uid = room_info[j].room_uid

        let obj = propertyRooms.find(o => o.room_uid == room_uid);
        room_info[j].roomImages = obj.room_images
      }
      bookings[i].room_info = room_info

      if(index == bookings.length-1){
        return res.status(200).json({
          status: true,
          message: "Fetched bookings data successfully",
          data: bookings,
          page: page,
          pageSize: pageSize,
          totalPages: totalPages,
          totalItems: totalBookings,
        });
      }
    }
    // return res.status(200).json({
    //   status: true,
    //   message: "Fetched bookings data successfully",
    //   data: bookings,
    //   page: page,
    //   pageSize: pageSize,
    //   totalPages: totalPages,
    //   totalItems: totalBookings,
    // });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};

const xlsx = require('xlsx');

// Function to convert XLSX to JSON
function convertXlsxToJson(xlsxFilePath) {
  // Read the XLSX file
  const workbook = xlsx.readFile(xlsxFilePath);

  // Convert the first sheet to JSON
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(worksheet);

  return jsonData;
}


exports.previousBooking = async (req, res) => {
  try {

    // // Specify the path to your XLSX file
    // const xlsxFilePath = '/var/www/html/pms-backend/booking.xlsx'; // Replace with your XLSX file path
    //
    // // Get the JSON object
    // const jsonObject = convertXlsxToJson(xlsxFilePath);
    //
    // // Use the JSON object as needed
    // console.log(jsonObject);


    const crypto = require('crypto');
    const TOKEN_SECRET = crypto.randomBytes(64).toString('hex');
    console.log(TOKEN_SECRET);

  }catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
}


exports.razorpayWebhook = async (req, res) => {
  try {
    const WEBHOOK_SECRET = "HatimiWebhook53";
    var receivedSignature = req.headers["x-razorpay-signature"];
    var payload = JSON.stringify(req.body);


    const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

    // Verify signature
    if (receivedSignature === expectedSignature) {
      console.log("Webhook verified successfully!");
      // Handle event
      const event = req.body;



      var order_id = event.payload.payment.entity.order_id
      var transaction_id = event.payload.payment.entity.id
      var mode_of_payment = event.payload.payment.entity.method

      var orderDetails = await Booking.findOne({order_id:order_id})
      if(orderDetails){


        if (event.event === "payment.captured") {
          console.log("Payment captured:", event.payload.payment.entity);
          var status = 'Payment captured'
          var is_payment = true
          var payment_status = 'success'
          var booking_status = 'confirmed'

          var newBooking = await Booking.findOneAndUpdate({_id:orderDetails._id},{
            is_payment: is_payment,
            payment_status: payment_status,
            transaction_id:transaction_id,
            mode_of_payment:mode_of_payment,
            booking_status:booking_status,
            balance_amount:0
          },{new:true}).lean();

        }else{
          console.log("Payment failed:", event.payload.payment.entity);
          var status = 'Payment failed'

          if(orderDetails.payment_status !== 'success'){
            var is_payment = false
            var payment_status = 'failed'
            var booking_status = "cancel"
            var balance_amount = orderDetails.billing_info.amount_payable


            var newBooking = await Booking.findOneAndUpdate({_id:orderDetails._id},{
              is_payment: is_payment,
              payment_status: payment_status,
              booking_status:booking_status,
              balance_amount:balance_amount
            },{new:true}).lean();
          }

        }

        var newRecord = await RazorpayData.create({
          receivedSignature:receivedSignature,
          payload:payload,
          status:status
        })

        res.status(200).json({ status: true, message: "Api hitted successfully" });
      }else{
        var status = 'Order not found'
        var newRecord = await RazorpayData.create({
          receivedSignature:receivedSignature,
          payload:payload,
          status:status
        })
      }




      // You can handle other events here

      // res.status(200).send("Webhook received and verified");
    } else {
      console.log("Invalid signature");
      var status = 'Invalid signature'
      var newRecord = await RazorpayData.create({
        receivedSignature:receivedSignature,
        payload:payload,
        status:status
      })
      res.status(400).send("Invalid signature");
    }



  }catch (error) {

    var newRecord = await RazorpayData.create({
      // receivedSignature:receivedSignature,
      payload:JSON.stringify(error.message),
      status:'CATCH'
    })
    res.status(500).json({ status: false, error: error.message });
  }
}


exports.newPayment = async (req,res) =>{
  try{

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    var bookingId = req.body.bookingId;

    var bookingDetails = await Booking.findOne({_id:bookingId})

    if(bookingDetails){

      var amount = bookingDetails.billing_info.amount_payable;
       amount = Number(amount);
      // console.log("amount",amount);
      var order_id = bookingDetails.order_id
      var payment_status = bookingDetails.payment_status
      var isBlock = bookingDetails.isBlock
      var property_uid = bookingDetails.property_uid
      var room_info = bookingDetails.room_info;

      var booking_id = bookingDetails.booking_id
      var number_of_rooms = bookingDetails.number_of_rooms
      var adults = bookingDetails.adults
      var children = bookingDetails.children
      var coupon_code = bookingDetails.coupon_code
      var customer_info = bookingDetails.customer_info
      var billing_info = bookingDetails.billing_info
      var gst_data = bookingDetails.gst_data
      var customer_id = bookingDetails.customer_id
      var check_in = bookingDetails.check_in
      var check_out = bookingDetails.check_out

      var booking_status = "confirmed";


      const availableRooms = await Property.findOne(
        {
          property_uid: property_uid,
        },
        { property_name: 1, rooms: 1, _id: 0, phone_number: 1 }
      );
      const formattedCheckIn = moment(check_in, "YYYY/MM/DD").format(
        "YYYY-MM-DD"
      );
      const formattedCheckOut = moment(check_out, "YYYY/MM/DD").format(
        "YYYY-MM-DD"
      );
      const filteredRooms = availableRooms.rooms.filter(
        (room) => room.active === false
      );
      var filteredRoomsForBooking = []
      for (var i = 0; i < filteredRooms.length; i++) {
        var newRoomUid = filteredRooms[i].room_uid

        var bookingInfo = await Booking.find({
          booking_status: { $ne: 'cancel' },
          "room_info.room_uid":newRoomUid,
          check_in: { $lt: formattedCheckOut },
          check_out: { $gt: formattedCheckIn }

        })


        if(bookingInfo.length == 0){

          filteredRoomsForBooking.push({room_number: filteredRooms[i].room_number,
          room_type: filteredRooms[i].room_type,
          // booking_info: bookingRoom,
          is_booked: filteredRooms[i].is_booked,
          max_guest_occupancy: filteredRooms[i].max_guest_occupancy,
          room_gstin: filteredRooms[i].room_gstin,
          room_charge: filteredRooms[i].room_charge,
          room_uid: filteredRooms[i].room_uid})
        }else{
          for (var kl = 0; kl < bookingInfo.length; kl++) {

            if (bookingInfo[kl].booking_status == "cancel" || bookingInfo[kl].booking_status == "check_out") {


              let obj = filteredRoomsForBooking.find(o => o.room_uid === filteredRooms[i].room_uid);

              if(obj == undefined || obj == null || obj == false){

                filteredRoomsForBooking.push({room_number: filteredRooms[i].room_number,
                room_type: filteredRooms[i].room_type,
                // booking_info: bookingRoom,
                is_booked: filteredRooms[i].is_booked,
                max_guest_occupancy: filteredRooms[i].max_guest_occupancy,
                room_gstin: filteredRooms[i].room_gstin,
                room_charge: filteredRooms[i].room_charge,
                room_uid: filteredRooms[i].room_uid})
              }

            }
          }
        }
      }
      const obj = filteredRoomsForBooking.filter((room) => room !== null);
      const selectedRooms = [];
      let isRoomAvailable = false;
      let roomsType = [];
      let roomInfo = {};

      room_info.forEach((info) => {
        const roomsOfType = obj
      .filter((room) => room.room_type === info.room_type && room.room_charge == info.single_room_price && room.max_guest_occupancy == info.max_guest_occupancy)
          .map((room) => {
            // console.log("room",room);
            return {
              ...room,
              room_price: info.room_price,
              single_room_price: info.single_room_price,
              room_count: info.room_count,
              extra_services: info.extra_services,
            };
          });


      if (roomsOfType?.length >= info.room_count) {
      selectedRooms?.push(...roomsOfType.slice(0, info.room_count));
        } else {
            isRoomAvailable = true;
            roomsType = roomsOfType;
            roomInfo = info;

        }
      });

      if (isRoomAvailable) {
        return res.status(200).json({
          status: false,
          message: `Not enough available rooms for room type ${
            roomInfo.room_type
          }. Required: ${roomInfo.room_count},  We have Available rooms: ${
            roomsType?.length || 0
          }`,
        });
      }


      const receiptNumber = `receipt#${Date.now()}`;
      const options = {
        amount: Math.round(amount*100),
        currency: "INR",
        receipt: receiptNumber
      };
      const res1 = await razorpay.orders.create(options);

      var addPreviousPayment = await PreviousPayment.create({
        bookingId:bookingId,
        order_id:order_id,
        payment_status:payment_status,
      })

      var newBooking = await Booking.findOneAndUpdate({_id:bookingId},{
      order_id:res1.id,
      balance_amount:amount,
      payment_status:'initiated'
      })

      res.send({status:true,message:"Order created successfully",data:{
        id: res1.id,
        currency: res1.currency,
        amount: res1.amount
      }})
    }else{
      res.send({status:false,message:"Booking not found"})
    }

  }catch(err){
    res.send({status:false,message:"Something went wrong"})
  }
}

// const getRoomsInfoForDashboard = (availableRooms, startDate, endDate) => {
//   const start = new Date(startDate);
//   const end = new Date(endDate);
//   const roomsInfo = availableRooms.map((room) => {
//     const bookingRoom = room.booking_info.filter((booking) => {
//       const { check_in } = booking;
//       const bookingStartDate = new Date(check_in);
//       return (
//         bookingStartDate.getFullYear() === start.getFullYear() &&
//         bookingStartDate.getMonth() === start.getMonth()
//       );
//     });
//     if (bookingRoom.length === 0) {
//       return {
//         room_uid: room.room_uid,
//         room_number: room.room_number,
//         room_type: room.room_type,
//         booking_info: bookingRoom,
//         is_booked: room.is_booked,
//         max_guest_occupancy: room.max_guest_occupancy,
//         room_gstin: room.room_gstin,
//         room_charge: room.room_charge,
//         room_name: room.room_name,
//       };
//     } else {
//       let isAvailable = true;
//
//       for (const booking of bookingRoom) {
//         const checkInDate = new Date(booking.check_in);
//         const checkOutDate = new Date(booking.check_out);
//         if (
//           (start >= checkInDate && start <= checkOutDate) ||
//           (end > checkInDate && end <= checkOutDate) ||
//           (start <= checkInDate && end >= checkOutDate)
//         ) {
//           if (booking.status === "cancel" || booking.status === "check_out") {
//             isAvailable = true;
//             break;
//           }
//           isAvailable = false;
//           break;
//         }
//       }
//       if (isAvailable) {
//         return {
//           room_uid: room.room_uid,
//           room_number: room.room_number,
//           room_type: room.room_type,
//           booking_info: bookingRoom,
//           is_booked: room.is_booked,
//           max_guest_occupancy: room.max_guest_occupancy,
//           room_gstin: room.room_gstin,
//           room_charge: room.room_charge,
//           room_name: room.room_name,
//         };
//       } else {
//         return null;
//       }
//     }
//   });
//   return roomsInfo;
// };

const getRoomsInfoForDashboard = async (availableRooms, startDate, endDate) => {
  const start = new Date(startDate).toISOString().split("T")[0];
  const end = new Date(endDate).toISOString().split("T")[0];

  var array = []
  const roomsInfo = availableRooms.map(async (room) => {


    var newRoomUid = room.room_uid


    // var bookingInfo = await Booking.find({
    //   "check_in": { $gte: "2024-08-27" },
    //   "check_out": { $lte: "2024-08-28" },"room_info.room_uid":"3cf73032-653a-45ed-86dd-0fe325f9e51f"
    // });
    var bookingInfo = await Booking.find({
      "check_in": { $gte: start },
      "check_out": { $lte: end },"room_info.room_uid":newRoomUid
    });

    if(bookingInfo.length == 0){

      array.push({room_number: room.room_number,
      room_type: room.room_type,
      // booking_info: bookingRoom,
      is_booked: room.is_booked,
      max_guest_occupancy: room.max_guest_occupancy,
      room_gstin: room.room_gstin,
      room_charge: room.room_charge,
      room_uid: room.room_uid})
    }



    // const bookingRoom = room.booking_info.filter((booking) => {
    //   const { check_in } = booking;
    //   const bookingStartDate = new Date(check_in);
    //   return (
    //     bookingStartDate.getFullYear() === start.getFullYear() &&
    //     bookingStartDate.getMonth() === start.getMonth()
    //
    //   );
    // });
    //
    // // console.log("bookingRoom",bookingRoom);
    // if (bookingRoom.length === 0) {
    //   return {
    //     room_number: room.room_number,
    //     room_type: room.room_type,
    //     booking_info: bookingRoom,
    //     is_booked: room.is_booked,
    //     max_guest_occupancy: room.max_guest_occupancy,
    //     room_gstin: room.room_gstin,
    //     room_charge: room.room_charge,
    //     room_uid: room.room_uid,
    //   };
    // } else {
    //   let isAvailable = true;
    //
    //   for (const booking of bookingRoom) {
    //     const checkInDate = new Date(booking.check_in);
    //     const checkOutDate = new Date(booking.check_out);
    //     if (
    //       (start >= checkInDate && start <= checkOutDate) ||
    //       (end > checkInDate && end <= checkOutDate) ||
    //       (start <= checkInDate && end >= checkOutDate)
    //     ) {
    //       if (booking.status === "cancel" || booking.status === "check_out") {
    //         isAvailable = true;
    //         break;
    //       }
    //       isAvailable = false;
    //       break;
    //     }
    //   }
    //   if (isAvailable) {
    //     return {
    //       room_number: room.room_number,
    //       room_type: room.room_type,
    //       booking_info: bookingRoom,
    //       is_booked: room.is_booked,
    //       max_guest_occupancy: room.max_guest_occupancy,
    //       room_gstin: room.room_gstin,
    //       room_charge: room.room_charge,
    //       room_uid: room.room_uid,
    //     };
    //   } else {
    //     return null;
    //   }
    // }
  });
  return array;
  // return roomsInfo;
};
