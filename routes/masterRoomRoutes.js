const express = require("express");
const {
    getAllRoomDetails,
    getAllRooms,
    getAllRoomAmenities,
    getRoomAmenitieById,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
    createAndUpdateRoomAminities,
    deleteRoomAminities,

} = require("../controllers/masterRoomController");
const { uploadImage, updateMultipleImages,} = require("../services/uploadService");
const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const router = express.Router();
router.use(verifyAccessToken);


// Routes
router.get( "/get-all-room-details",getAllRoomDetails);
router.get( "/get-all-rooms",getAllRooms);
router.get( "/get-room-aminities",getAllRoomAmenities);

router.get( "/get-room/:id",getRoomById);
router.get( "/get-room-aminitie/:id",getRoomAmenitieById);

router.post( "/create-room",createRoom);
router.post( "/create-room-aminitie",uploadImage.single("icon"),createAndUpdateRoomAminities);

router.put( "/update-room/:id",updateRoom);

router.delete( "/delete-room/:id",deleteRoom);
router.delete( "/delete-room-aminitie/:id",deleteRoomAminities);


module.exports = router;
