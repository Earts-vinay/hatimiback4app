const { Property } = require("../models/propertyModel");
const { Tax } = require("../models/masterCompanyDetailsModel");
const createError = require("http-errors");
const moment = require("moment");
const multer = require("multer");
const {
  uploadImage,
  updateMultipleImages,
  deleteMultipleImages,
} = require("../services/uploadService");
const validationErrorHandler = require("../utils/validationErrorHandler");
const { log } = require("console");

const { Booking } = require("../models/bookingModel");
const { ExtraService } = require("../models/masterExtraServiceModel");









// Controller to create a room for property
const createRoomProperty = async (req, res) => {

  let room_images = [];
  let original_keys = [];
  try {
    await new Promise((resolve, reject) => {
      uploadImage.array("room_images")(req, res, async function (err) {
        if (req.files && req.files.length > 0) {
          req.files?.forEach((file) => {
            room_images.push(file.location);
            original_keys.push(file.key);
          });
          const room_amenities = req.body.room_amenities?.map((obj) => ({
            amenity_name: obj.amenity_name,
            amenity_description: obj.amenity_description,
            amenity_icon: obj.amenity_icon,
            amenity_price: obj.amenity_price,
          }));

          console.log("create room ====", req.body);

          const newRoomDetails = {
            property_uid: req.body.property_uid,
            room_name: req.body.room_name,
            room_type: req.body.room_type,
            room_typeid: req.body.room_typeid,
            is_deleted:false,
            max_guest_occupancy: req.body.max_guest_occupancy,
            base_guest_occupancy: req.body.base_guest_occupancy,
            extra_bed_count: req.body.extra_bed_count,
            room_charge: req.body.room_charge,
            bed_size: req.body.bed_size,
            room_size: req.body.room_size,
            room_description: req.body.room_description,
            room_amenities: room_amenities,
            room_images: room_images,
            room_number: req.body.room_number,
            room_gstin: req.body.room_gstin,
          };
          try {
            const getPropertyDetails = await Property.findOne({
              property_uid: newRoomDetails.property_uid,
            });
            if (!getPropertyDetails) {
              await deleteMultipleImages(original_keys);
              return res.json({
                status: false,
                data: getPropertyDetails,
                message: "Property data not found.",
              });
            }
            getPropertyDetails.rooms.push(newRoomDetails);
            await getPropertyDetails.save();
          } catch (validationError) {
            if (validationError.name === "ValidationError") {
              // Handle validation errors here
              const validationErrors = validationErrorHandler(validationError);
              await deleteMultipleImages(original_keys);
              res.status(400).json({
                status: false,
                message: "Validation failed. Please check your input.",
                errors: validationErrors,
              });
              return;
            }
            throw validationError;
          }

          res.status(201).json({
            status: true,
            message: "Property room created successfully",
          });

          resolve();
        } else {
          if (err instanceof multer.MulterError) {
            reject(err);
          } else if (err) {
            reject(createError.BadRequest(err));
          } else {
            reject(createError.BadRequest("Please select file"));
          }
        }
      });
    });
  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};




const getTaxInfo = async (gstid) => {
  try {
    const taxInfo = await Tax.findById(gstid);
    return taxInfo;
  } catch (err) {
    if (err.name === "CastError") {
      return null;
    }
  }
};






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
//
//     // console.log("bookingRoom",bookingRoom);
//     if (bookingRoom.length === 0) {
//       return {
//         room_number: room.room_number,
//         room_type: room.room_type,
//         booking_info: bookingRoom,
//         is_booked: room.is_booked,
//         max_guest_occupancy: room.max_guest_occupancy,
//         room_gstin: room.room_gstin,
//         room_charge: room.room_charge,
//         room_uid: room.room_uid,
//       };
//     } else {
//       let isAvailable = true;
//
//       for (const booking of bookingRoom) {
//         // console.log("booking",booking);
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
//           room_number: room.room_number,
//           room_type: room.room_type,
//           booking_info: bookingRoom,
//           is_booked: room.is_booked,
//           max_guest_occupancy: room.max_guest_occupancy,
//           room_gstin: room.room_gstin,
//           room_charge: room.room_charge,
//           room_uid: room.room_uid,
//         };
//       } else {
//         return null;
//       }
//     }
//   });
//
//   // console.log("roomsInfo",roomsInfo);
//   return roomsInfo;
// };


const getRoomsInfoForDashboardBackup = (availableRooms, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const roomsInfo = availableRooms.map((room) => {
    const bookingRoom = room.booking_info.filter((booking) => {
      const { check_in } = booking;
      const bookingStartDate = new Date(check_in);
      return (
        bookingStartDate.getFullYear() === start.getFullYear() &&
        bookingStartDate.getMonth() === start.getMonth()

      );
    });

    if(room.base_guest_occupancy == undefined || room.base_guest_occupancy == "" || room.base_guest_occupancy == null){
      var base_guest_occupancy = ""
    }else{
      var base_guest_occupancy = room.base_guest_occupancy
    }
    if(room.extra_bed_count == undefined || room.extra_bed_count == "" || room.extra_bed_count == null){
      var extra_bed_count = ""
    }else{
      var extra_bed_count = room.extra_bed_count
    }
    // console.log("bookingRoom",bookingRoom);
    if (bookingRoom.length === 0) {

      return {
        room_number: room.room_number,
        room_type: room.room_type,
        booking_info: bookingRoom,
        is_booked: room.is_booked,
        max_guest_occupancy: room.max_guest_occupancy,
        base_guest_occupancy:base_guest_occupancy,
        extra_bed_count:extra_bed_count,
        room_gstin: room.room_gstin,
        room_charge: room.room_charge,
        room_uid: room.room_uid,
      };
    } else {
      let isAvailable = true;

      for (const booking of bookingRoom) {
        const checkInDate = new Date(booking.check_in);
        const checkOutDate = new Date(booking.check_out);
        if (
          (start >= checkInDate && start <= checkOutDate) ||
          (end > checkInDate && end <= checkOutDate) ||
          (start <= checkInDate && end >= checkOutDate)
        ) {
          if (booking.status === "cancel" || booking.status === "check_out") {
            isAvailable = true;
            break;
          }
          isAvailable = false;
          break;
        }
      }
      if (isAvailable) {
        return {
          room_number: room.room_number,
          room_type: room.room_type,
          booking_info: bookingRoom,
          is_booked: room.is_booked,
          max_guest_occupancy: room.max_guest_occupancy,
          base_guest_occupancy:base_guest_occupancy,
          extra_bed_count:extra_bed_count,
          room_gstin: room.room_gstin,
          room_charge: room.room_charge,
          room_uid: room.room_uid,
        };
      } else {
        return null;
      }
    }
  });
  return roomsInfo;
};



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

    if(room.base_guest_occupancy == undefined || room.base_guest_occupancy == "" || room.base_guest_occupancy == null){
      var base_guest_occupancy = ""
    }else{
      var base_guest_occupancy = room.base_guest_occupancy
    }
    if(room.extra_bed_count == undefined || room.extra_bed_count == "" || room.extra_bed_count == null){
      var extra_bed_count = ""
    }else{
      var extra_bed_count = room.extra_bed_count
    }

    if(bookingInfo.length == 0){

      array.push({room_number: room.room_number,
      room_type: room.room_type,
      // booking_info: bookingRoom,
      is_booked: room.is_booked,
      max_guest_occupancy: room.max_guest_occupancy,
      base_guest_occupancy:base_guest_occupancy,
      extra_bed_count:extra_bed_count,
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


const getRoomsInfoForFrontend = (availableRooms, startDate, endDate) => {
  let availableRoomsForBooking = [];
  let nonAvailableRoomsForBooking = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  availableRooms.forEach((room) => {
    const bookingRoom = room.booking_info.filter((booking) => {
      const { check_in } = booking;
      const bookingStartDate = new Date(check_in);
      return (
        bookingStartDate.getFullYear() === start.getFullYear() &&
        bookingStartDate.getMonth() === start.getMonth()
      );
    });
    if (bookingRoom.length === 0) {
      availableRoomsForBooking.push(room);
    } else {
      let isAvailable = true;
      for (const booking of bookingRoom) {
        const checkInDate = new Date(booking.check_in);
        const checkOutDate = new Date(booking.check_out);
        if (
          (start >= checkInDate && start < checkOutDate) ||
          (end > checkInDate && end <= checkOutDate) ||
          (start <= checkInDate && end >= checkOutDate)
        ) {
          if (booking.status === "cancel" || booking.status === "check_out") {
            isAvailable = true;
            break;
          }
          isAvailable = false;
          break;
        }
      }
      if (isAvailable) {
        availableRoomsForBooking.push(room);
      } else {
        nonAvailableRoomsForBooking.push(room);
      }
    }
  });
  return { availableRoomsForBooking, nonAvailableRoomsForBooking };
};















//Controller to get the room details with stored ID
const getRoomPropertyWithID = async (req, res) => {
  const { property_uid, room_uid } = req.params;
  try {
    if (property_uid === undefined || room_uid === undefined) {
      throw createError.BadRequest();
    }
    const propertyData = await Property.findOne({ property_uid: property_uid });
    if (!propertyData) {
      return res.json({ status: false, message: "Property data not found." });
    }
    const val = propertyData.rooms.find((obj) => obj.room_uid === room_uid);
    if (!val)
      return res.json({
        status: false,
        message: "Property room data not found.",
      });

    const roomData = {
      ...val.toObject(),
      taxInfo: await getTaxInfo(val.room_gstin),
    };
    res.json({
      status: true,
      data: roomData,
      message: "Fetched property room data successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(error.status ? error.status : 500).json({
      staus: false,
      error: error.message,
    });
  }
};















//Controller to get the all active rooms with stored ID
const getAllRoomsWithID = async (req, res) => {
  const { id } = req.params;
  console.log("idddd",id);
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
      return res.json({ status: false, message: "Property data not found" });
    }

    const updatedRoomsData = await Promise.all(
      roomsData?.rooms?.filter(room => room.is_deleted !== true).map(async (room) => {
        const { room_gstin } = room;
        const taxInfo = await getTaxInfo(room_gstin);
        return {
          ...room.toObject(),
          taxInfo,
        };
      })
    );
    res.json({
      status: true,
      data: updatedRoomsData,
      message: "Fetched property rooms data successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(error.status ? error.status : 500).json({
      staus: false,
      error: error.message,
    });
  }
};














//Controller to update the room details with stored ID
const updateRoomPropertyWithID = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      // console.log("paramssssss",req.body);
      uploadImage.array("room_images")(req, res, async function (err) {
        if (err) {
          console.error(err);
          return reject(err);
        }
        const { property_uid, room_uid, active } = req.body;
        if (
          property_uid === undefined ||
          active === undefined ||
          room_uid === undefined
        ) {
          return reject(
            createError.BadRequest("Required fields are missing...")
          );
        }
        const roomImages = req.files?.map((file) => file.location) || [];
        const updateFields = {
          $set: {
            ...Object.keys(req.body).reduce((acc, key) => {
              acc[`rooms.$.${key}`] = req.body[key];
              return acc;
            }, {}),
            // "rooms.$.room_amenities": undefined,
          },
        };
        if (roomImages.length > 0) {
          updateFields.$push = {
            ...updateFields.$push,
            "rooms.$.room_images": { $each: roomImages },
          };
        }
        // if (room_amenities && room_amenities.length > 0) {
        //   updateFields.$push = {
        //     ...updateFields.$push,
        //     "rooms.$.room_amenities": { $each: room_amenities },
        //   };
        // }
        const updatedData = await Property.findOneAndUpdate(
          { property_uid: property_uid, "rooms.room_uid": room_uid },
          updateFields,
          { new: true, returnDocument: "after" }
        );
        if (!updatedData) {
          return res.json({
            status: false,
            message: "Property data not found",
          });
        }
        const updateRoomData = updatedData?.rooms?.find(
          (roomObj) => roomObj.room_uid === room_uid
        );

        res.json({
          status: true,
          message: "Property room  updated successfully",
          data: updateRoomData,
        });

        resolve();
      });
    });
  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};









//Controller to delete the room details with stored ID
const deleteRoomPropertyWithID = async (req, res) => {
  console.log("req.prams for delete room",req.params);
  const { property_uid, room_uid } = req.params;
  try {
    if (property_uid === undefined || room_uid === undefined) {
      throw createError.BadRequest();
    }
    const propertyRoomData = await Property.findOne(
      {
        property_uid: property_uid,
        "rooms.room_uid": room_uid,
      },
      {
        "rooms.$": 1,
      }
    );
    if (!propertyRoomData) {
      return res.json({
        status: false,
        message: "Property room data not found",
      });
    }
    const urls = propertyRoomData.rooms[0].room_images;
    const filenames = urls.map((url) => {
      const matchResult = url.match(/^(https:\/\/[^/]+)(\/.*)$/);
      return matchResult ? matchResult[2].substring(1) : null;
    });
    // console.log("filenames",filenames);
    await deleteMultipleImages(filenames);
    // await Property.findOneAndUpdate(
    //   {
    //     property_uid: property_uid,
    //     "rooms.room_uid": room_uid,
    //   },
    //   {
    //     $pull: {
    //       rooms: { room_uid },
    //     },
    //   },
    //   { new: true }
    // );

    await Property.findOneAndUpdate(
      {
        property_uid: property_uid,
        "rooms.room_uid": room_uid,
      },
      {
        $set:{
          "rooms.$.is_deleted": true,
          "rooms.$.room_images":[]
        },
      },
      { new: true }
    );
    res.json({ status: true, message: "Deleted room successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ staus: false, error: error.message });
  }
};










const deletePropertyRoomImage = async (req, res) => {
  const { property_uid, room_uid } = req.params;
  const { image_url } = req.body;
  try {
    if (!image_url || !property_uid || !room_uid) {
      throw createError.BadRequest();
    }
    const url = image_url;
    const matchResult = url.match(/^(https:\/\/[^/]+)(\/.*)$/);
    const filename = matchResult ? matchResult[2].substring(1) : null;
    console.log(filename);
    const updatedData = await Property.findOneAndUpdate(
      { property_uid, "rooms.room_uid": room_uid },
      { $pull: { "rooms.$.room_images": image_url } },
      { new: true }
    );
    if (!updatedData) {
      return res.json({
        status: false,
        message: "Property room data not found",
      });
    }
    await deleteMultipleImages([filename]);
    res.json({
      status: true,
      message: "Property image deleted successfully",
    });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      error.status = 400;
    }
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};









const getRoomMaxCapacity = async (req, res) => {
  const { property_uid } = req.params;
  try {
    if (!property_uid) throw createError.BadRequest("Property_uid is required");
    const propertyRoomData = await Property.findOne(
      { property_uid },
      { rooms: 1 }
    );

    if (!propertyRoomData) {
      return res.json({
        status: false,
        message: "Property room data not found",
      });
    }
    // Filter rooms where is_booked is false
    // const availableRooms = propertyRoomData?.rooms?.filter(
    //   (room) => !room.is_booked
    // );
    const availableRooms = propertyRoomData?.rooms;
    // Sort available rooms by max_guest_occupancy in descending order
    const sortedRooms = availableRooms.sort(
      (a, b) =>
        parseInt(b.max_guest_occupancy) - parseInt(a.max_guest_occupancy)
    );
    if (sortedRooms.length > 0) {
      res.json({
        status: true,
        max_capacity: Number(sortedRooms[0]?.max_guest_occupancy),
      });
    } else {
      res.json({
        status: false,
        max_capacity: 0,
        message: "Rooms are not Available",
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};










// const getAvailableRoomsForBooking = async (req, res) => {
//   console.log("getAvailableRoomsForBooking",req.body);
//   const { property_uid } = req.params;
//   const { startDate, endDate, adults, children, no_of_rooms } = req.body;
//   try {
//     if (!property_uid) throw createError.BadRequest("Property_uid is required");
//
//     const propertyRoomData = await Property.findOne(
//       { property_uid },
//       { rooms: 1, _id: 0 }
//     );
//
//     if (!propertyRoomData) {
//       return res.json({
//         status: false,
//         message: "Property rooms not available",
//       });
//     }
//     let formatStartDate = moment(startDate).format("YYYY-MM-DD");
//     let formatEndDate = moment(endDate).format("YYYY-MM-DD");
//     const availableRooms = propertyRoomData?.rooms.filter(
//       // (room) => room.active === false && room.is_deleted === false
//       (room) => room.active === false && room.is_deleted !== true
//     );
//     // console.log("availableroomsssssss",availableRooms);
//     const roomsInfo = getRoomsInfoForDashboard(
//       availableRooms,
//       formatStartDate,
//       formatEndDate
//     );
//
//     //***********************new change**********************
//
//     // const start = new Date(startDate);
//     // const end = new Date(endDate);
//     // var new_start = new Date(startDate).toISOString().split("T")[0];
//     // var new_end = new Date(endDate).toISOString().split("T")[0];
//     // var newArray = []
//     //
//     // for (var i = 0; i < availableRooms.length; i++) {
//     //   var bookingRoom = await Booking.find({"$and":[
//     //     {"room_info.room_uid":availableRooms[i].room_uid},
//     //     // {booking_status: { $ne: 'check_in'}},
//     //     // {booking_status: { $ne: 'confirmed'}},
//     //     { check_in: { $not: { $gte: new_start } } },
//     //     { check_out: { $not: { $lte: new_end } } },
//     //     // {check_in: { $gte: new_start }},
//     //     // {check_out: { $lte: new_end }}
//     //   ]}).lean()
//     //
//     //   console.log("availableRooms[i]",availableRooms[i]);
//     //   console.log("bookingRoom",bookingRoom);
//     //
//     //   if (bookingRoom.length == 0) {
//     //     // return {
//     //     //   room_number: room.room_number,
//     //     //   room_type: room.room_type,
//     //     //   booking_info: bookingRoom,
//     //     //   is_booked: room.is_booked,
//     //     //   max_guest_occupancy: room.max_guest_occupancy,
//     //     //   room_gstin: room.room_gstin,
//     //     //   room_charge: room.room_charge,
//     //     //   room_uid: room.room_uid,
//     //     // };
//     //
//     //     newArray.push({
//     //       room_number: availableRooms[i].room_number,
//     //       room_type: availableRooms[i].room_type,
//     //       booking_info: bookingRoom,
//     //       is_booked: availableRooms[i].is_booked,
//     //       max_guest_occupancy: availableRooms[i].max_guest_occupancy,
//     //       room_gstin: availableRooms[i].room_gstin,
//     //       room_charge: availableRooms[i].room_charge,
//     //       room_uid: availableRooms[i].room_uid,
//     //     })
//     //   } else {
//     //     let isAvailable = true;
//     //
//     //     for (const booking of bookingRoom) {
//     //
//     //       // console.log("**booking**",booking);
//     //       const checkInDate = new Date(booking.check_in);
//     //       const checkOutDate = new Date(booking.check_out);
//     //       if (
//     //         (start >= checkInDate && start <= checkOutDate) ||
//     //         (end > checkInDate && end <= checkOutDate) ||
//     //         (start <= checkInDate && end >= checkOutDate)
//     //       ) {
//     //         if (booking.status === "cancel" || booking.status === "check_out") {
//     //           isAvailable = true;
//     //           break;
//     //
//     //           // newArray.push({
//     //           //   room_number: availableRooms[i].room_number,
//     //           //   room_type: availableRooms[i].room_type,
//     //           //   booking_info: bookingRoom,
//     //           //   is_booked: availableRooms[i].is_booked,
//     //           //   max_guest_occupancy: availableRooms[i].max_guest_occupancy,
//     //           //   room_gstin: availableRooms[i].room_gstin,
//     //           //   room_charge: availableRooms[i].room_charge,
//     //           //   room_uid: availableRooms[i].room_uid,
//     //           // })
//     //         }
//     //         isAvailable = false;
//     //         break;
//     //       }
//     //     }
//     //     if (isAvailable) {
//     //       // return {
//     //       //   room_number: availableRooms[i].room_number,
//     //       //   room_type: availableRooms[i].room_type,
//     //       //   booking_info: bookingRoom,
//     //       //   is_booked: availableRooms[i].is_booked,
//     //       //   max_guest_occupancy: availableRooms[i].max_guest_occupancy,
//     //       //   room_gstin: availableRooms[i].room_gstin,
//     //       //   room_charge: availableRooms[i].room_charge,
//     //       //   room_uid: availableRooms[i].room_uid,
//     //       // };
//     //       newArray.push({
//     //         room_number: availableRooms[i].room_number,
//     //         room_type: availableRooms[i].room_type,
//     //         booking_info: bookingRoom,
//     //         is_booked: availableRooms[i].is_booked,
//     //         max_guest_occupancy: availableRooms[i].max_guest_occupancy,
//     //         room_gstin: availableRooms[i].room_gstin,
//     //         room_charge: availableRooms[i].room_charge,
//     //         room_uid: availableRooms[i].room_uid,
//     //       })
//     //     } else {
//     //       // return null;
//     //     }
//     //   }
//     // }
//     // var roomsInfo = newArray
//
//     //***********************new change**********************
//     // console.log("roomsInfo",roomsInfo);
//     const filteredRooms = roomsInfo.filter((room) => room !== null);
//
//     const aggregatedRooms = [];
//     filteredRooms.forEach((room) => {
//       const existingRoom = aggregatedRooms.find(
//         (aggregatedRoom) =>
//           aggregatedRoom.roomType === room.room_type &&
//           aggregatedRoom.price === room.room_charge &&
//           aggregatedRoom.max_guest_occupancy === room.max_guest_occupancy
//
//       );
//
//       if (existingRoom) {
//         existingRoom.availableRooms += 1;
//         existingRoom.room_uids.push(room.room_uid);
//       } else {
//         aggregatedRooms.push({
//
//           roomType: room.room_type,
//           availableRooms: 1,
//           price: room.room_charge,
//           max_guest_occupancy: room.max_guest_occupancy,
//           room_gstin: room.room_gstin,
//           room_uids: [room.room_uid],
//         });
//       }
//     });
//
//     const resultArray = await Promise.all(
//       aggregatedRooms.map(async (roomInfo) => {
//         const taxInfo = await getTaxInfo(roomInfo?.room_gstin);
//         return {
//           ...roomInfo,
//           taxInfo,
//         };
//       })
//     );
//     const maxCapacity = adults + children;
//     let filteredRoomsForBookings = [];
//     if (no_of_rooms === 1) {
//       filteredRoomsForBookings = resultArray
//         .map((roomInfo) => {
//           if (roomInfo.max_guest_occupancy >= maxCapacity) {
//             return roomInfo;
//           }
//         })
//         .filter((room) => {
//           if (room !== null) {
//             return room;
//           }
//         });
//     } else {
//       filteredRoomsForBookings = resultArray;
//     }
//
//     if (filteredRoomsForBookings.length > 0) {
//       res.json({
//         status: true,
//         data: filteredRoomsForBookings,
//       });
//     } else {
//       res.json({
//         status: false,
//         message: `Not enough available rooms for ${maxCapacity} persons`,
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     res
//       .status(error.status ? error.status : 500)
//       .json({ status: false, error: error.message });
//   }
// };
//


const getAvailableRoomsForBooking = async (req, res) => {
  const { property_uid } = req.params;
  const { startDate, endDate, adults, children, no_of_rooms } = req.body;
  try {
    if (!property_uid) throw createError.BadRequest("Property_uid is required");

    const propertyRoomData = await Property.findOne(
      { property_uid },
      { rooms: 1, _id: 0 }
    );

    if (!propertyRoomData) {
      return res.json({
        status: false,
        message: "Property rooms not available",
      });
    }
    let formatStartDate = moment(startDate).format("YYYY-MM-DD");
    let formatEndDate = moment(endDate).format("YYYY-MM-DD");
    const availableRooms = propertyRoomData?.rooms.filter(
      (room) => room.active === false && room.is_deleted !== true
    );

    // const roomsInfo = getRoomsInfoForDashboard(
    //   availableRooms,
    //   formatStartDate,
    //   formatEndDate
    // );

    var roomsInfo = []

    for (var i = 0; i < availableRooms.length; i++) {
      var newRoomUid = availableRooms[i].room_uid

      // console.log("********newRoomUid***********",newRoomUid);
      // var bookingInfo = await Booking.find({
      //   booking_status: { $ne: 'cancel' },
      //   "check_in": { $gte: formatStartDate },
      //   "check_out": { $lte: formatEndDate },"room_info.room_uid":newRoomUid
      // });
      var bookingInfo = await Booking.find({
        booking_status: { $ne: 'cancel' },
        "room_info.room_uid":newRoomUid,
        check_in: { $lt: formatEndDate },
        check_out: { $gt: formatStartDate }
        // $or:[
        //   {"check_in": { $gt: formatStartDate },
        //     "check_out":{ $gt: formatEndDate },
        //     "check_in":formatEndDate
        //   },
        //   {"check_in": { $gt: formatStartDate },
        //     "check_out":{ $gt: formatEndDate },
        //     "check_out":formatStartDate
        //   },
        //   {"check_in": { $gte: formatStartDate },
        //     "check_out":{ $gte: formatEndDate }
        //   },
        //   {"check_in": { $gt: formatStartDate },
        //     "check_out":{ $lt: formatEndDate }
        //   },
        //
        //   {"check_in": { gte: formatStartDate },
        //     "check_out":{ $lte: formatEndDate }
        //   }
        // ]
      });

  //     check_in: { $lt: endDate },
  // check_out: { $gt: startDate }

    if(availableRooms[i].base_guest_occupancy == undefined || availableRooms[i].base_guest_occupancy == "" || availableRooms[i].base_guest_occupancy == null){
      var base_guest_occupancy = ""
    }else{
      var base_guest_occupancy = availableRooms[i].base_guest_occupancy
    }
    if(availableRooms[i].extra_bed_count == undefined || availableRooms[i].extra_bed_count == "" || availableRooms[i].extra_bed_count == null){
      var extra_bed_count = ""
    }else{
      var extra_bed_count = availableRooms[i].extra_bed_count
    }

      // console.log("********bookingInfo***********",bookingInfo);
      if(bookingInfo.length == 0){

        roomsInfo.push({room_number: availableRooms[i].room_number,
        room_type: availableRooms[i].room_type,
        // booking_info: bookingRoom,
        is_booked: availableRooms[i].is_booked,
        max_guest_occupancy: availableRooms[i].max_guest_occupancy,
        base_guest_occupancy:base_guest_occupancy,
        extra_bed_count:extra_bed_count,
        room_gstin: availableRooms[i].room_gstin,
        room_charge: availableRooms[i].room_charge,
        room_uid: availableRooms[i].room_uid})
      }else{

        for (var kl = 0; kl < bookingInfo.length; kl++) {
          // bookingInfo[i]
          if (bookingInfo[kl].booking_status == "cancel" || bookingInfo[kl].booking_status == "check_out") {


            let obj = roomsInfo.find(o => o.room_uid === availableRooms[i].room_uid);

            if(obj == undefined || obj == null || obj == false){

              roomsInfo.push({room_number: availableRooms[i].room_number,
                room_type: availableRooms[i].room_type,
                // booking_info: bookingRoom,
                is_booked: availableRooms[i].is_booked,
                max_guest_occupancy: availableRooms[i].max_guest_occupancy,
                base_guest_occupancy:base_guest_occupancy,
                extra_bed_count:extra_bed_count,
                room_gstin: availableRooms[i].room_gstin,
                room_charge: availableRooms[i].room_charge,
                room_uid: availableRooms[i].room_uid})
            }

          }
        }
      }
    }
    // console.log("roomsInfo",roomsInfo);
    const filteredRooms = roomsInfo.filter((room) => room !== null);
    // console.log("filteredRooms",filteredRooms);
    const aggregatedRooms = [];
    for (const room of filteredRooms) {
    // filteredRooms.forEach((room) => {


      if(room.base_guest_occupancy == undefined || room.base_guest_occupancy == "" || room.base_guest_occupancy == null){
        var base_guest_occupancyNew = 0
      }else{
        var base_guest_occupancyNew = room.base_guest_occupancy
      }

      if(room.extra_bed_count == undefined || room.extra_bed_count == "" || room.extra_bed_count == null){
        var extra_bed_countNew = 0
      }else{
        var extra_bed_countNew = room.extra_bed_count
      }

      var extraSerivceArray = []
      if(extra_bed_countNew > 0){
        const extraServices = await ExtraService.find({property_uid:property_uid}).lean();
        // extraSerivceArray.push(extraServices[0])
        extraSerivceArray = extraServices
      }

      const existingRoom = aggregatedRooms.find(
        (aggregatedRoom) =>
          aggregatedRoom.roomType === room.room_type &&
          aggregatedRoom.price === room.room_charge &&
          aggregatedRoom.max_guest_occupancy === room.max_guest_occupancy
      );

      if (existingRoom) {
        existingRoom.availableRooms += 1;
        existingRoom.extra_bed_count += extra_bed_countNew;
        existingRoom.room_uids.push(room.room_uid);
      } else {
        aggregatedRooms.push({
          roomType: room.room_type,
          availableRooms: 1,
          price: room.room_charge,
          max_guest_occupancy: room.max_guest_occupancy,
          base_guest_occupancy:base_guest_occupancyNew,
          extra_bed_count:extra_bed_countNew,
          room_gstin: room.room_gstin,
          room_uids: [room.room_uid],
          extraSerivceArray:extraSerivceArray
        });
      }
    // });
    }

    // console.log("aggregatedRooms",aggregatedRooms);
    const resultArray = await Promise.all(
      aggregatedRooms.map(async (roomInfo) => {
        const taxInfo = await getTaxInfo(roomInfo?.room_gstin);
        return {
          ...roomInfo,
          taxInfo,
        };
      })
    );

    // console.log("resultArray",resultArray);
    const maxCapacity = parseInt(adults) + parseInt(children);
    let filteredRoomsForBookings = [];
    if (parseInt(no_of_rooms) === 1) {
      filteredRoomsForBookings = resultArray
        .map((roomInfo) => {
          // console.log("roomInfo.max_guest_occupancy",roomInfo.max_guest_occupancy);
          // console.log("maxCapacity",maxCapacity);
          if (roomInfo.max_guest_occupancy >= maxCapacity) {
            return roomInfo;
          }
        })
        .filter((room) => {
          if (room !== null) {
            return room;
          }
        });
    } else {
      filteredRoomsForBookings = resultArray;
    }

    // console.log("filteredRoomsForBookings",filteredRoomsForBookings);

    if (filteredRoomsForBookings.length > 0) {
      res.json({
        status: true,
        data: filteredRoomsForBookings,
      });
    } else {
      res.json({
        status: false,
        message: `Not enough available rooms for ${maxCapacity} persons`,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};







const getRoomsInfoForBooking = async (req, res, next) => {
  try {
    const { property_uid } = req.params;
    const { startDate, endDate, adults, children, no_of_rooms } = req.body;
    let formatStartDate = moment(startDate).format("YYYY-MM-DD");
    let formatEndDate = moment(endDate).format("YYYY-MM-DD");
    if (!property_uid) throw createError.BadRequest("Property_uid is required");

    const propertyRoomData = await Property.findOne(
      { property_uid },
      {
        property_city: 1,
        property_name: 1,
        property_images: 1,
        rooms: 1,
        _id: 0,
      }
    );

    if (!propertyRoomData) {
      return res.json({
        status: false,
        message: "Property room data not found",
      });
    }
    const availableRooms = propertyRoomData?.rooms.filter(
      (room) => room.active === false
    );

    // const { availableRoomsForBooking, nonAvailableRoomsForBooking } =
    //   getRoomsInfoForFrontend(availableRooms, formatStartDate, formatEndDate);

    // console.log('availableRooms',availableRooms);


      var availableRoomsForBooking = []
      var nonAvailableRoomsForBooking = []

      for (var i = 0; i < availableRooms.length; i++) {
        var newRoomUid = availableRooms[i].room_uid
        // var bookingInfo = await Booking.find({
        //   booking_status: { $ne: 'cancel' },
        //   "check_in": { $gte: formatStartDate },
        //   "check_out": { $lte: formatEndDate },"room_info.room_uid":newRoomUid
        // }).lean();

        var bookingInfo = await Booking.find({
          booking_status: { $ne: 'cancel' },
          "room_info.room_uid":newRoomUid,
          check_in: { $lt: formatEndDate },
          check_out: { $gt: formatStartDate }
        }).lean();

        // console.log("bookingInfo",bookingInfo);


        //-----------------------IFREQUIRED-----------------------
        // if(availableRooms[i].base_guest_occupancy == undefined || availableRooms[i].base_guest_occupancy == "" || availableRooms[i].base_guest_occupancy == null){
        //   availableRooms[i].base_guest_occupancy = ""
        // }else{
        //   availableRooms[i].base_guest_occupancy = availableRooms[i].base_guest_occupancy
        // }
        //
        // if(availableRooms[i].extra_bed_count == undefined || availableRooms[i].extra_bed_count == "" || availableRooms[i].extra_bed_count == null){
        //   availableRooms[i].extra_bed_count = ""
        // }else{
        //   availableRooms[i].extra_bed_count = availableRooms[i].extra_bed_count
        // }
        //-----------------------IFREQUIRED-----------------------

        if(bookingInfo.length == 0){

          console.log("availableRooms[i]",availableRooms[i]);

          // if (availableRooms[i].hasOwnProperty('booking_info')) {
          //     delete availableRooms[i].booking_info;
          //     console.log("booking_info deleted.");
          // }

          availableRooms[i].booking_info = null;


          // delete availableRooms[i].booking_info
          availableRoomsForBooking.push(availableRooms[i])
          // availableRoomsForBooking.push({room_number: availableRooms[i].room_number,
          // room_type: availableRooms[i].room_type,
          // // booking_info: bookingRoom,
          // is_booked: availableRooms[i].is_booked,
          // max_guest_occupancy: availableRooms[i].max_guest_occupancy,
          // room_gstin: availableRooms[i].room_gstin,
          // room_charge: availableRooms[i].room_charge,
          // room_uid: availableRooms[i].room_uid})
        }else{
          availableRooms[i].booking_info = null;

          for (var kl = 0; kl < bookingInfo.length; kl++) {
            if (bookingInfo[kl].booking_status === "cancel" || bookingInfo[kl].booking_status === "check_out") {

              let obj = availableRoomsForBooking.find(o => o.room_uid === availableRooms[i].room_uid);

              if(obj == undefined || obj == null || obj == false){
                availableRoomsForBooking.push(availableRooms[i])
              }
            }else{
              // nonAvailableRoomsForBooking.push(availableRooms[i])
              let obj = nonAvailableRoomsForBooking.find(o => o.room_uid === availableRooms[i].room_uid);

              if(obj == undefined || obj == null || obj == false){
                nonAvailableRoomsForBooking.push(availableRooms[i])
              }

            }
          }



          // nonAvailableRoomsForBooking.push({room_number: availableRooms[i].room_number,
          // room_type: availableRooms[i].room_type,
          // // booking_info: bookingRoom,
          // is_booked: availableRooms[i].is_booked,
          // max_guest_occupancy: availableRooms[i].max_guest_occupancy,
          // room_gstin: availableRooms[i].room_gstin,
          // room_charge: availableRooms[i].room_charge,
          // room_uid: availableRooms[i].room_uid})
        }
      }



      // console.log("availableRoomsForBooking",availableRoomsForBooking);
      // console.log("nonAvailableRoomsForBooking",nonAvailableRoomsForBooking);

    const aggregatedRooms = [];
    for (const room of availableRoomsForBooking) {
    // availableRoomsForBooking.forEach((room) => {

      if(room.base_guest_occupancy == undefined || room.base_guest_occupancy == "" || room.base_guest_occupancy == null){
        room.base_guest_occupancy = ""
      }else{
        room.base_guest_occupancy = room.base_guest_occupancy
      }
      if(room.extra_bed_count == undefined || room.extra_bed_count == "" || room.extra_bed_count == null){
        room.extra_bed_count = ""
        var extra_bed_countNew = 0
      }else{
        room.extra_bed_count = room.extra_bed_count
        var extra_bed_countNew = room.extra_bed_count
      }

      var extraSerivceArray = []
      if(extra_bed_countNew > 0){
        const extraServices = await ExtraService.find({property_uid:property_uid}).lean();
        // extraSerivceArray.push(extraServices[0])
        extraSerivceArray = extraServices
      }

      room.extraSerivceArray = extraSerivceArray

      const existingRoom = aggregatedRooms.find(
        (aggregatedRoom) =>
          aggregatedRoom.room_type === room.room_type &&
          aggregatedRoom.room_charge === room.room_charge &&
          aggregatedRoom.max_guest_occupancy === room.max_guest_occupancy
      );

      // console.log("existingRoom",existingRoom);
      // console.log("room",room);

      if (existingRoom) {
        existingRoom.availableRooms += 1;
        existingRoom.extra_bed_count = room.extra_bed_count;

      } else {
        aggregatedRooms.push({
          // ...room,
          ...room.toObject(),
          availableRooms: 1,
        });
      }
    // });
    }
    const maxCapacity = parseInt(adults) + parseInt(children);
    let filteredRoomsForBookings = [];
    if (parseInt(no_of_rooms) === 1) {
      filteredRoomsForBookings = aggregatedRooms
        .map((roomInfo) => {
          if (roomInfo.max_guest_occupancy >= maxCapacity) {
            return roomInfo;
          }
        })
        .filter((room) => {
          if (room !== null) {
            return room;
          }
        });
    } else {
      filteredRoomsForBookings = aggregatedRooms;
    }

    filteredRoomsForBookings = filteredRoomsForBookings.filter(obj => obj.is_deleted !== true);
    nonAvailableRoomsForBooking = nonAvailableRoomsForBooking.filter(obj => obj.is_deleted !== true);

    // console.log("filteredRoomsForBookings",filteredRoomsForBookings);
    if (filteredRoomsForBookings.length > 0) {
      res.json({
        status: true,
        propertyData: {
          property_name: propertyRoomData.property_name,
          property_city: propertyRoomData.property_city,
          property_image_url: propertyRoomData.property_images[0],
        },
        availableRooms: filteredRoomsForBookings,
        soldOutRooms: nonAvailableRoomsForBooking,
      });
    } else {
      res.json({
        status: false,
        availableRooms: 0,
        soldOutRooms: nonAvailableRoomsForBooking,
        propertyData: {
          property_name: propertyRoomData.property_name,
          property_city: propertyRoomData.property_city,
          property_image_url: propertyRoomData.property_images[0],
        },
        message: `Not enough available rooms for ${maxCapacity} persons`,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};

module.exports = {
  createRoomProperty,
  getRoomPropertyWithID,
  updateRoomPropertyWithID,
  deleteRoomPropertyWithID,
  getAllRoomsWithID,
  deletePropertyRoomImage,
  getRoomMaxCapacity,
  getAvailableRoomsForBooking,
  getRoomsInfoForBooking,
};
