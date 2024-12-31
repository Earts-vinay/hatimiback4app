const { AddRoom, RoomAmenity } = require("../models/masterRoomModel");
const { uploadImage, updateMultipleImages, deleteMultipleImages } = require('../services/uploadService');
const { Property } = require("../models/propertyModel");



exports.getAllRoomDetails =  async (req, res) => {
    try {

      const room = await AddRoom.find();
      const roomamenities = await IndoorRoomAmenity.find();
      res.status(200).json({ status:true, message: "fached all property data successfully",data:{rooms:room,roomamenities:roomamenities}});
    } catch (error) {
      res.status(500).json({ status:false, error: error.message });
    }
  };



exports.getRoomById = async (req, res) => {
    try {
      const room = await AddRoom.findById(req.params.id);
      if (!room) {
        return res.status(200).json({status: false, message: 'room not found' });
      }
      res.status(200).json({ status:true, message: "fached room successfully",data:room});
    } catch (error) {
      res.status(500).json({status:false, error: error.message });
    }
  };



exports.getAllRooms =  async (req, res) => {
    try {

      const room = await AddRoom.find();
      if (room.length === 0) {
        return res.status(200).json({ status: false, message: "No rooms found" });
      }

      res.status(200).json({ status:true, message: "fached all rooms successfully",data:room});
    } catch (error) {
      res.status(500).json({ status:false, error: error.message });
    }
  };


exports.createRoom = async (req, res) => {
    try {
      if (!req.body.type_title ) {
        return res.status(200).json({ status:false, message: " type_title are required"});
      }
        const newRoom = await AddRoom.create(req.body);
         res.status(201).json({ message: 'Room added successfully', data: newRoom });
      } catch (error) {
        console.error('Error adding room:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    };



exports.updateRoom = async (req, res) => {
    try {
        const updatedRoom = await AddRoom.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true });
        if (!updatedRoom) {
          return res.status(200).json({status: false, message: 'Room not found' });
        }
        res.json({ message: 'Room updated successfully', data: updatedRoom });
      } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ message: 'Internal server error' });
      }

  };




exports.deleteRoom = async (req, res) => {
    try {
      const roomData = await AddRoom.findById(req.params.id);
      if (roomData) {
        const typeTitle = roomData.type_title;

        // Aggregate to find all rooms that match the typeTitle
        // const matchingRooms = await Property.aggregate([
        //   { $unwind: "$rooms" },
        //   { $match: { "rooms.room_type": typeTitle } },
        //   {
        //     $project: {
        //       _id: 0,
        //       "rooms.property_uid": 1,
        //       "rooms.room_uid": 1,
        //       "rooms.room_name": 1,
        //       "rooms.room_type": 1,
        //       "rooms.max_guest_occupancy": 1,
        //       "rooms.room_charge": 1,
        //       "rooms.bed_size": 1,
        //       "rooms.room_size": 1,
        //       "rooms.is_booked": 1,
        //     },
        //   },
        // ]);
        // console.log("typeTitle",typeTitle);
        const matchingRooms = await Property.aggregate([
          { $unwind: "$rooms" },
          { $match: { "rooms.room_type": typeTitle,
                      "rooms.is_deleted":false,
                    } },
        ]);


        // console.log("matchingRooms",matchingRooms);

        if (matchingRooms.length > 0) {
          return res.status(200).json({
            status: false,
            message:
              "Before deleting this room type, make sure all rooms of this type have been deleted from the properties, because it already exists there",
          });
        }

      }
        const deletedRoom = await AddRoom.findByIdAndDelete(req.params.id);
        if (!deletedRoom) {
          return res.status(200).json({status: false, message: 'Room not found' });
        }
        res.json({ status:true,message: 'Room type  deleted successfully', data: deletedRoom });
      } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ status:false,message: 'Internal server error' });
      }
    }





exports.getAllRoomAmenities = async (req, res) => {
      try {
        const roomamenities = await RoomAmenity.find();
        if (roomamenities.length === 0) {
          return res.status(200).json({ status: false, message: "No room aminities found" });
        }
        res.status(200).json({ status:true, message: "fached all property data successfully",data:roomamenities});
      } catch (error) {
        res.status(500).json({ status:false, error: error.message });
      }
    };

exports.getRoomAmenitieById = async (req, res) => {
      try {
        const Amenity = await RoomAmenity.findById(req.params.id);
        if (!Amenity) {
          return res.status(200).json({status: false, message: 'Room Amenity not found' });
        }
        res.status(200).json({ status:true, message: "fached Room Amenity successfully",data:Amenity});
      } catch (error) {
        res.status(500).json({status:false, error: error.message });
      }
    };

exports.createAndUpdateRoomAminities = async (req, res) => {
  const formData = req.body;
  const uploadedFile = req.file;

  if (!formData.name) {
    return res.status(200).json({status: false, error: "Name is are required" });
  }

  try {

    let indoor;

    if (formData.id) {
      if (uploadedFile) {
        const originalKeys = [];
        const updatedFiles = [{ key: uploadedFile.location }];
        await updateMultipleImages(originalKeys, updatedFiles);

        indoor = await RoomAmenity.findByIdAndUpdate(
          formData.id,
          { name: formData.name,icon:uploadedFile.location,
            cost: formData.cost },
          { new: true, runValidators: true }
        );
      } else {
        indoor = await RoomAmenity.findByIdAndUpdate(
          formData.id,
          { name: formData.name, cost: formData.cost },
          { new: true, runValidators: true }
        );
      }
    } else {
      if (uploadedFile) {
        const originalKeys = [];
        const updatedFiles = [{ key: uploadedFile.location }];
        await updateMultipleImages(originalKeys, updatedFiles);

        indoor = new RoomAmenity({
          name: formData.name,
          cost: formData.cost,
          icon:uploadedFile.location
        });
      } else {

        indoor = new RoomAmenity({
          name: formData.name,
          cost: formData.cost,
        });
      }
      indoor = await indoor.save();
    }

          res.status(201).json({ status:true, message: "Room Indoor aminities created and updated successfully" });
        } catch (error) {
          res.status(500).json({status:false, error: error.message });
        }
      };

exports.deleteRoomAminities = async (req, res) => {
        try {
          const indoorId = req.params.id;
          const originalKeys = [];
          const deletedAmenity = await RoomAmenity.findByIdAndDelete(indoorId);
          if (!deletedAmenity) {
            return res.status(200).json({status: false, message: "Property outdoor amenity not found" });
          }
          await deleteMultipleImages(originalKeys);

          res.json({status:true, message: "Property indoor aminitie deleted successfully",data:deletedAmenity });
        } catch (error) {
          res.status(500).json({status:false, error: error.message });
        }
      };
