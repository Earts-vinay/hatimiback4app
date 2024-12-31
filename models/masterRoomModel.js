const { Schema, model } = require("mongoose");


const addRoomSchema = new Schema({
    type_title: {
      type: String,
      required: true,
    },
 
  }, {
    timestamps: true,
    versionKey: false,
  });

  const roomAmenitySchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
    },
    cost: {
        type: String,
    },
  }, {
    timestamps: true,
    versionKey: false,
  });

  const AddRoom = model('AddRoom', addRoomSchema);
  const RoomAmenity  = model('RoomAmenity',roomAmenitySchema)

  module.exports = { AddRoom,RoomAmenity};
