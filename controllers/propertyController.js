const { Property } = require("../models/propertyModel");
const multer = require("multer");
const createError = require("http-errors");
const searchProperty = require("../models/searchDestinationModel");
const {
  uploadImage,
  deleteMultipleImages,
} = require("../services/uploadService");
const validationErrorHandler = require("../utils/validationErrorHandler");
// Controller to create a property
const createProperty = async (req, res) => {
  let property_images = [];
  try {
    await new Promise((resolve, reject) => {
      uploadImage.array("property_images")(req, res, async function (err) {
        if (req.files && req.files.length > 0) {
          req.files.forEach((file) => {
            property_images.push(file.location);
          });
          const indoor_amenities = req.body.indoor_amenities?.map((obj) => ({
            amenity_name: obj.amenity_name,
            amenity_description: obj.amenity_description,
            amenity_icon: obj.amenity_icon,
          }));
          const outdoor_amenities = req.body.outdoor_amenities?.map((obj) => ({
            amenity_name: obj.amenity_name,
            amenity_description: obj.amenity_description,
            amenity_icon: obj.amenity_icon,
          }));
          const newPropertyDetails = {
            property_name: req.body.property_name,
            property_description: req.body.property_description,
            property_type: req.body.property_type,
            property_state: req.body.property_state,
            property_country: req.body.property_country,
            property_address: req.body.property_address,
            property_city: req.body.property_city,
            property_size: req.body.property_size,
            indoor_amenities: indoor_amenities,
            outdoor_amenities: outdoor_amenities,
            property_images: property_images,
            total_rooms: req.body.total_rooms,
            max_capacity: req.body.max_capacity,
            phone_number: req.body.phone_number,
            check_in_time: req.body.check_in_time,
            check_out_time: req.body.check_out_time,
          };
          const newProperty = new Property({
            ...newPropertyDetails,
          });

          try {
            await newProperty.save();
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
            .json({ status: true, message: "Property created successfully" });
          resolve();
        } else {
          if (err instanceof multer.MulterError) {
            reject(err);
          } else if (err) {
            reject(err);
          } else {
            reject({ message: "Please select file" });
          }
        }
      });
    });
  } catch (error) {
    console.error(error);
    res.json({ status: false, message: error.message });
  }
};

//Controller to get the property with stored ID
const getPropertyWithID = async (req, res) => {
  const { id } = req.params;
  try {
    if (id === undefined) {
      throw createError.BadRequest();
    }
    const propertyData = await Property.findOne({ property_uid: id });
    if (!propertyData) {
      res.json({
        status: false,
        data: propertyData,
        message: "Property data not found.",
      });
    } else {
      res.json({
        status: true,
        data: propertyData,
        message: "Fetched property data successfully",
      });
    }
  } catch (error) {
    console.error(error);
    res.json({
      staus: false,
      error: error.message,
    });
  }
};

//Controller to get the allactiveproperties
const getAllActiveProperties = async (req, res) => {
  try {
    const propertyData = await Property.find().lean();
    if (propertyData.length <= 0) {
      res.json({
        status: false,
        data: propertyData,
        message: "Properties data not found.",
      });
    } else {

      propertyData.forEach(item => {
        // Iterate over each object in the `obj` array
        item.rooms.forEach(innerObj => {
          // Delete the `address` key
          delete innerObj.booking_info;
        });
      });


      res.json({
        status: true,
        data: propertyData,
        message: "Fetched properties successfully",
      });
    }
  } catch (error) {
    console.error(error);
    res.json({ staus: false, error: error.message });
  }
};
//Controller to delete the property with stored ID.
const deletePropertyWithID = async (req, res) => {
  const { id } = req.params;
  try {
    if (id === undefined) {
      throw createError.BadRequest();
    }
    const propertyDetails = await Property.findOne({ property_uid: id });
    if (!propertyDetails) {
      return res.json({ status: false, message: "Property data not found" });
    }
    const urls = propertyDetails.property_images;
    const filenames = urls.map((url) => {
      const matchResult = url.match(/^(https:\/\/[^/]+)(\/.*)$/);
      return matchResult ? matchResult[2].substring(1) : null;
    });

    await deleteMultipleImages(filenames);
    await Property.findOneAndDelete({ property_uid: id });
    res.json({ status: true, message: "Property deleted successfully" });
  } catch (error) {
    console.error(error);
    res.json({ staus: false, error: error.message });
  }
};

//Controller to update the property with stored ID.
const updatePropertyWithID = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      uploadImage.array("property_images")(req, res, async function (err) {
        if (err) {
          console.error(err);
          return reject(err);
        }
        const { property_uid, outdoor_amenities, indoor_amenities, active } =
          req.body;
        if (property_uid === undefined || active === undefined) {
          return reject(
            createError.BadRequest("Required fields are missing...")
          );
        }
        const propertyImages = req.files?.map((file) => file.location) || [];
        const updateFields = {
          $set: {
            ...req.body,
            // outdoor_amenities: undefined,
            // indoor_amenities: undefined,
          },
        };

        if (propertyImages.length > 0) {
          updateFields.$push = {
            ...updateFields.$push,
            property_images: { $each: propertyImages },
          };
        }

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

        const updatedData = await Property.findOneAndUpdate(
          { property_uid },
          updateFields,
          { new: true, returnDocument: "after" }
        );
        if (!updatedData) {
          return res.json({
            status: false,
            message: "Property data does not exist",
          });
        } else {
          res.json({
            status: true,
            message: "Property updated successfully",
            data: updatedData,
          });
        }

        resolve();
      });
    });
  } catch (error) {
    console.error(error);
    res.json({ status: false, error: error.message });
  }
};

//Controller to get the all properties
const getproperties = async (req, res) => {
  const propertiesData = await searchProperty.find();
  res.json({
    status: true,
    message: "Fetched properties data successfully",
    data: propertiesData,
  });
};
const uploadPropertyImage = async (req, res) => {
  const { id } = req.params;
  try {
    await new Promise((resolve, reject) => {
      uploadImage.array("property_images")(req, res, async function (err) {
        if (req.files && req.files.length > 0) {
          const propertyImages = req.files?.map((file) => file.location) || [];

          const updatedData = await Property.findOneAndUpdate(
            { property_uid: id },
            { $push: { property_images: { $each: propertyImages } } },
            { new: true }
          );
          if (!updatedData) {
            return res.json({
              status: false,
              message: "Property data does not exist",
            });
          } else {
            res.status(201).json({
              status: true,
              message: "Property images uploaded successfully",
              data: updatedData,
            });
          }
          resolve();
        } else {
          if (err instanceof multer.MulterError) {
            reject(err);
          } else if (err) {
            reject(err);
          } else {
            reject({ message: "Please select file" });
          }
        }
      });
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
const deletePropertyImage = async (req, res) => {
  const { id } = req.params;
  const { image_url } = req.body;
  try {
    if (!image_url || !id) {
      throw createError.BadRequest();
    }
    const url = image_url;
    const matchResult = url.match(/^(https:\/\/[^/]+)(\/.*)$/);
    const filename = matchResult ? matchResult[2].substring(1) : null;
    const updatedData = await Property.findOneAndUpdate(
      { property_uid: id },
      { $pull: { property_images: image_url } },
      { new: true }
    );
    if (!updatedData) {
      return res.json({
        status: false,
        message: "Property data does not exist",
      });
    } else {
      await deleteMultipleImages(filename);
      res.json({
        status: true,
        message: "Property image deleted successfully",
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

module.exports = {
  createProperty,
  getPropertyWithID,
  getAllActiveProperties,
  deletePropertyWithID,
  updatePropertyWithID,
  getproperties,
  uploadPropertyImage,
  deletePropertyImage,
};
