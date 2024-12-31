const { PropertyLocation ,PropertyType, IndoorAmenity, OutdoorAmenity } = require("../models/masterPropertyModel");
const { uploadImage, updateMultipleImages, deleteMultipleImages,deleteSingleImage } = require('../services/uploadService');
const multer = require("multer");
const createError = require("http-errors");
const searchProperty = require("../models/searchDestinationModel");

const validationErrorHandler = require("../utils/validationErrorHandler");

exports.getPropertyLocationByQuery = async (req, res) => {
  const { query } = req.query;
  try {
    const result = await PropertyLocation.find({ city: { $regex: query, $options: 'i' } }).limit(10);
    res.status(200).json({ status:true, message: "fached Property Location successfully",result});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getPropertyLocationById = async (req, res) => {
  try {
    const location = await PropertyLocation.findById(req.params.id);
    if (!location) {
      return res.status(200).json({status: false, message: 'Property Location not found' });
    }
    res.status(200).json({ status:true, message: "fached Property Location successfully",data:location});
  } catch (error) {
    res.status(500).json({status:false, error: error.message });
  }
};


exports.getAllPropertyDetails = async (req, res) => {
    try {
      const location = await PropertyLocation.find();
      const type = await PropertyType.find();
      const indooramenities = await IndoorAmenity.find();
      const outdooramenities = await OutdoorAmenity.find();
      res.status(200).json({ status:true, message: "fached all property data successfully",data:{locations:location,types:type,indoor:indooramenities,outdoor:outdooramenities}});
    } catch (error) {
      res.status(500).json({ status:false, error: error.message });
    }
  };

exports.getPropertLocations = async (req, res) => {
    try {
      const location = await PropertyLocation.find().lean();

      if (location.length === 0) {
        return res.status(200).json({ status: false, message: "No location found" });
      }
      res.status(200).json({ status:true, message: "fached all property data successfully",data:location});
    } catch (error) {
      res.status(500).json({ status:false, error: error.message });
    }
  };
//
// exports.createPropertyLocation = async (req, res) => {
//     try {
//       const { city, state, country,description } = req.body;
//       const location = await PropertyLocation.create({
//         city,
//         state,
//         country,
//         description
//
//       });
//       res.status(201).json({status:true, message: "Property locations created successfully",data:location });
//     } catch (error) {
//       res.status(500).json({ status:false, error: error.message });
//     }
//   };
//



  exports.createPropertyLocation = async (req, res) => {
      try {
        var image;
        await new Promise((resolve, reject) => {
          uploadImage.array('image')(req, res, async function (err) {

            if (req.files && req.files.length > 0 ) {
              var file = req.files[0]
                 image = file.location;



              const newPropertyLocation = {
                city: req.body.city,
                state: req.body.state,
                country: req.body.country,
                description: req.body.description,
                image:image
              };

              const newLocation = new PropertyLocation({
                ...newPropertyLocation,
              });

              try {
                await newLocation.save();
              } catch (validationError) {
                if (validationError.name === "ValidationError") {
                  // Handle validation errors here
                  const validationErrors = validationErrorHandler(validationError);
                  res.status(400).json({
                    status: false,
                    message: "Validation failed. Please check your input.",
                    errors: validationErrors,
                  });
                  return;
                }
                throw validationError;
              }
              res
                .status(201)
                .json({ status: true, message: "PropertyLocation created successfully" });
              resolve();
            } else {


              try {
                const newLocation =  PropertyLocation.create({
                  city: req.body.city,
                  state: req.body.state,
                  country: req.body.country,
                  description: req.body.description,
                  image:""
                })


              } catch (validationError) {
                if (validationError.name === "ValidationError") {
                  // Handle validation errors here
                  const validationErrors = validationErrorHandler(validationError);
                  res.status(400).json({
                    status: false,
                    message: "Validation failed. Please check your input.",
                    errors: validationErrors,
                  });
                  return;
                }
                throw validationError;
              }
              res
                .status(201)
                .json({ status: true, message: "PropertyLocation created successfully" });
              resolve();
            }
          });
        });

      } catch (error) {
        res.status(500).json({ status:false, error: error.message });
      }
    };



    exports.deleteLocationImage = async (req, res) => {
      const { id } = req.body;
      const { image_url } = req.body;
      try {
        if (!image_url || !id) {
          throw createError.BadRequest();
        }
        const url = image_url;
        const matchResult = url.match(/^(https:\/\/[^/]+)(\/.*)$/);
        console.log("matchresult",matchResult);
        const filename = matchResult ? matchResult[2].substring(1) : null;
        console.log("filename",filename);
        const updatedData = await PropertyLocation.findOneAndUpdate(
          { _id: id },
          {  image: ""},
          { new: true }
        );
        if (!updatedData) {
          return res.json({
            status: false,
            message: "Property data does not exist",
          });
        } else {
          await deleteSingleImage(filename);
          res.json({
            status: true,
            message: "PropertyLocation image deleted successfully",
          });
        }
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



//
// exports.updatePropertyLocation = async (req, res) => {
//     try {
//       const locationId = req.params.id;
//       const { city, state, country,description } = req.body;
//
//
//         const updatedLocation = await PropertyLocation.findByIdAndUpdate(
//           locationId,
//           { city, state, country ,description},
//           { new: true, runValidators: true }
//         );
//
//
//       if (!updatedLocation) {
//         return res.status(200).json({status: false, message: "Property location not found" });
//       }
//
//       res.json({status:true, message: "Property location updated successfully", data: updatedLocation });
//     } catch (error) {
//       res.status(500).json({status:false, error: error.message });
//     }
//   };



exports.updatePropertyLocation = async (req, res) => {
    try {
      const locationId = req.params.id;

      console.log(req.body);
      var location = await PropertyLocation.findOne({_id:locationId})
      await new Promise((resolve, reject) => {
        uploadImage.array("image")(req, res, async function (err) {
          if (err) {
            console.error(err);
            return reject(err);
          }
          const { city, state, country,description } = req.body;
          if (locationId === undefined || locationId === null) {
            return reject(
              createError.BadRequest("Required fields are missing...")
            );
          }
          var locationimages;
          if(location){
            if(req.files && req.files.length > 0){
               locationimages = req.files[0].location

            }else{
                 locationimages = location.image
            }
          }



          const updateFields = {
            $set: {
              ...req.body,
              image:locationimages
              // outdoor_amenities: undefined,
              // indoor_amenities: undefined,
            },
          };

          // if (locationimages) {
          //   updateFields.$push = {
          //     ...updateFields.$push,
          //     image:locationimages,
          //   };
          // }

          // if (indoor_amenities && indoor_amenities.length > 0) {
          //   updateFields.$push = {
          //     ...updateFields.$push,
          //     indoor_amenities: { $each: indoor_amenities },
          //   };
          // }

          // if (outdoor_amenities && outdoor_amenities.length > 0) {
          //   updateFields.$push = {
          //     ...updateFields.$push,
          //     outdoor_amenities: { $each: outdoor_amenities },
          //   };
          // }

          const updatedData = await PropertyLocation.findOneAndUpdate(
            { _id:locationId },
            updateFields,
            { new: true, returnDocument: "after" }
          );


          if (!updatedData) {
            return res.json({
              status: false,
              message: "PropertyLoction data does not exist",
            });
          } else {
            res.json({
              status: true,
              message: "PropertyLocation updated successfully",
              data: updatedData,
            });
          }

          resolve();
        });
      });



    } catch (error) {
      res.status(500).json({status:false, error: error.message });
    }
  };



exports.deletePropertyLocation = async (req, res) => {
  const locationId = req.params.id;
  const deletedLocation = await PropertyLocation.findByIdAndDelete(locationId);

  try {
    if (locationId === undefined) {
      throw createError.BadRequest();
    }
    const locationDetails = await PropertyLocation.findOne({ _id: locationId });
    if (!locationDetails) {
      return res.json({ status: false, message: "PropertyLocation data not found" });
    }
    const urls = locationDetails.image;

    const matchResult = urls.match(/^(https:\/\/[^/]+)(\/.*)$/);
    const filename = matchResult ? matchResult[2].substring(1) : null;


    await deleteSingleImage(filename);
    await PropertyLocation.findOneAndDelete({ _id: locationId });
    res.json({ status: true, message: "PropertyLocation deleted successfully" });
  } catch (error) {
    console.error(error);
    res.json({ staus: false, error: error.message });
  }
  };



exports.getPropertyTypeById = async (req, res) => {
    try {
      const type = await PropertyType.findById(req.params.id);
      if (!type) {
        return res.status(200).json({status: false, message: 'Property type not found' });
      }
      res.status(200).json({ status:true, message: "fached Property type successfully",data:type});
    } catch (error) {
      res.status(500).json({status:false, error: error.message });
    }
  };

exports.getPropertyType = async (req, res) => {
    try {
      const type = await PropertyType.find();
      if (type.length === 0) {
        return res.status(200).json({ status: false, message: "No type found" });
      }
      res.status(200).json({ status:true, message: "fached all property types data successfully",data:type});
    } catch (error) {
      res.status(500).json({ status:false, error: error.message });
    }
  };
exports.createPropertyType = async (req, res) => {
    try {
      const newAmenity = new PropertyType(req.body);
      const type = await newAmenity.save();
      res.status(201).json({status:true, message: "Property type created successfully",data:type });
    } catch (error) {
      res.status(500).json({status:false, error: error.message });
    }
  };

exports.updatePropertyType = async (req, res) => {
    try {
      const typeId = req.params.id;
      const { type } = req.body;
      const updatedType = await PropertyType.findByIdAndUpdate(
        typeId,
        { type },
        { new: true, runValidators: true }
      );
      if (!updatedType) {
        return res.status(200).json({status: false, message: "Property type not found" });
      }

      res.json({status:true, message: "Property type updated successfully", data: updatedType });
    } catch (error) {
      res.status(500).json({status:false, error: error.message });
    }
  };

exports.deletePropertyType = async (req, res) => {
    try {
      const typeId = req.params.id;

      const deleteType = await PropertyType.findByIdAndDelete(typeId);

      if (!deleteType) {
        return res.status(200).json({status: false, message: "Property type not found" });
      }

      res.json({status:true, message: "Property type deleted successfully" });
    } catch (error) {
      res.status(500).json({status:false, error: error.message });
    }
  };

exports.getPropertyIndoorAminitieById = async (req, res) => {
    try {
      const indoor = await IndoorAmenity.findById(req.params.id);
      if (!indoor) {
        return res.status(200).json({status: false, message: 'Indoor amenity not found' });
      }
      res.status(200).json({ status:true, message: "fached indoor amenity successfully",data:indoor});
    } catch (error) {
      res.status(500).json({status:false, error: error.message });
    }
  };
exports.getPropertyIndoorAminities = async (req, res) => {
    try {
      const indooramenities = await IndoorAmenity.find();
      if (indooramenities.length === 0) {
        return res.status(200).json({ status: false, message: "No indoor amenities found" });
      }
      res.status(200).json({ status:true, message: "fached all property indoor aminities successfully",data:indooramenities});
    } catch (error) {
      res.status(500).json({ status:false, error: error.message });
    }
  };
exports.createAndUpdatePropertyIndoorAminities = async (req, res) => {
    const formData = req.body;
    const uploadedFile = req.file;

    if (!formData.name) {
      return res.status(400).json({ error: "Name is are required" });
    }

    try {

      let indoor;

      if (formData.id) {
        if (uploadedFile) {
          const originalKeys = [];
          const updatedFiles = [{ key: uploadedFile.location }];
          await updateMultipleImages(originalKeys, updatedFiles);

          indoor = await IndoorAmenity.findByIdAndUpdate(
            formData.id,
            { name: formData.name,icon:uploadedFile.location,
              description: formData.description },
            { new: true, runValidators: true }
          );
        } else {
          indoor = await IndoorAmenity.findByIdAndUpdate(
            formData.id,
            { name: formData.name, description: formData.description },
            { new: true, runValidators: true }
          );
        }
      } else {
        if (uploadedFile) {
          const originalKeys = [];
          const updatedFiles = [{ key: uploadedFile.location }];
          await updateMultipleImages(originalKeys, updatedFiles);

          indoor = new IndoorAmenity({
            name: formData.name,
            description: formData.description,
            icon:uploadedFile.location
          });
        } else {

          indoor = new IndoorAmenity({
            name: formData.name,
            description: formData.description,
          });
        }
        indoor = await indoor.save();
      }

      res.status(200).json({status:true, message: "Property Indoor aminities created and update successfully" });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({status:false, error: "Internal Server Error" });
    }
    };

exports.deletePropertyIndoorAminities = async (req, res) => {
    try {
      const indoorId = req.params.id;
      const originalKeys = [];
      const deletedAmenity = await IndoorAmenity.findByIdAndDelete(indoorId);
      if (!deletedAmenity) {
        return res.status(200).json({status: false, message: "Property indoor amenity not found" });
      }
      await deleteMultipleImages(originalKeys);

      res.json({status:true, message: "Property indoor aminitie deleted successfully",data:deletedAmenity });
    } catch (error) {
      res.status(500).json({status:false, error: error.message });
    }
  };

exports.getPropertyOutdoorAminitieById = async (req, res) => {
    try {
      const outdoor = await OutdoorAmenity.findById(req.params.id);
      if (!outdoor) {
        return res.status(200).json({status: false, message: 'Outdoor amenity not found' });
      }
      res.status(200).json({ status:true, message: "fached Outdoor amenity successfully",data:outdoor});
    } catch (error) {
      res.status(500).json({status:false, error: error.message });
    }
  };
exports.getPropertyOutdoorAminities = async (req, res) => {
    try {
      const outdooramenities = await OutdoorAmenity.find();
      if (outdooramenities.length === 0) {
        return res.status(200).json({ status: false, message: "No outdoor amenities found" });
      }
      res.status(200).json({ status:true, message: "fached all property outdoor aminities successfully",data:outdooramenities});
    } catch (error) {
      res.status(500).json({ status:false, error: error.message });
    }
  };
exports.createAndUpdatePropertyOutdoorAminities = async (req, res) => {

  const formData = req.body;
  const uploadedFile = req.file;

  if (!formData.name) {
    return res.status(400).json({ error: "Name is are required" });
  }

  try {
    let outdoor;

    if (formData.id) {
      if (uploadedFile) {
        const originalKeys = [];
        const updatedFiles = [{ key: uploadedFile.location }];
        await updateMultipleImages(originalKeys, updatedFiles);

        outdoor = await OutdoorAmenity.findByIdAndUpdate(
          formData.id,
          { name: formData.name,icon:uploadedFile.location,
            description: formData.description },
          { new: true, runValidators: true }
        );
      } else {
        outdoor = await OutdoorAmenity.findByIdAndUpdate(
          formData.id,
          { name: formData.name, description: formData.description },
          { new: true, runValidators: true }
        );
      }
    } else {
      if (uploadedFile) {
        const originalKeys = [];
        const updatedFiles = [{ key: uploadedFile.location }];
        await updateMultipleImages(originalKeys, updatedFiles);

        outdoor = new OutdoorAmenity({
          name: formData.name,
          description: formData.description,
          icon:uploadedFile.location
        });
      } else {

        outdoor = new OutdoorAmenity({
          name: formData.name,
          description: formData.description,
        });
      }
      outdoor = await outdoor.save();
    }

    res.status(200).json({status:true, message: "Property outdoor aminities created and update successfully" });
  } catch (error) {
      res.status(500).json({status:false, error: error.message });
    }
  };

exports.deletePropertyOutdoorAminities = async (req, res) => {
    try {
      const outdoorId = req.params.id;
      const originalKeys = [];

      const deletedAmenity = await OutdoorAmenity.findByIdAndDelete(outdoorId);

      if (!deletedAmenity) {
        return res.status(200).json({status: false, message: "Property outdoor amenity not found" });
      }

      await deleteMultipleImages(originalKeys);

      res.json({status:true, message: "Property outdoor aminities deleted successfully",data:deletedAmenity });
    } catch (error) {
      res.status(500).json({status:false, error: error.message });
    }
  };
