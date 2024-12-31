const { ExtraService } = require("../models/masterExtraServiceModel");
const { uploadImage, updateMultipleImages, deleteMultipleImages } = require('../services/uploadService');
const { PropertyLocation ,PropertyType, IndoorAmenity, OutdoorAmenity } = require("../models/masterPropertyModel");
const { Property } = require("../models/propertyModel");


exports.getExtraServiceById = async (req, res) => {
  try {
    const service = await ExtraService.findById(req.params.id);
    if (!service) {
      return res.status(200).json({status: false, message: 'Extra Service not found' });
    }
    res.status(200).json({ status:true, message: "fached Extra Service data successfully",data:service});
  } catch (error) {
    res.status(500).json({status:false, error: error.message });
  }
};

exports.getAllExtraServices = async (req, res) => {
  try {
    const extraServices = await ExtraService.find().lean();
    if (extraServices.length === 0) {
      return res.status(200).json({ status: false, message: "No extra services found" });
    }

    for (var i = 0; i < extraServices.length; i++) {
      // array[i]

      if(extraServices[i].location == undefined || extraServices[i].location == "" || extraServices[i].location == null){
        extraServices[i].location_id = ""
      }else{
        var result = await PropertyLocation.find({ city:extraServices[i].location});
        extraServices[i].location_id = result[0]._id
      }
    }
    res.status(200).json({ status:true, message: "fached all extra services data successfully",data:extraServices});
  } catch (error) {
    res.status(500).json({ status:false, error: error.message });
  }
};

exports.getAllExtraServicesLocation = async (req, res) => {
  try {
    const extraServices = await ExtraService.find({location:req.body.location}).lean();
    if (extraServices.length === 0) {
      return res.status(200).json({ status: false, message: "No extra services found" });
    }

    for (var i = 0; i < extraServices.length; i++) {
      // array[i]

      if(extraServices[i].location == undefined || extraServices[i].location == "" || extraServices[i].location == null){
        extraServices[i].location_id = ""
      }else{
        var result = await PropertyLocation.find({ city:extraServices[i].location});
        extraServices[i].location_id = result[0]._id
      }
    }
    res.status(200).json({ status:true, message: "fached all extra services data successfully",data:extraServices});
  } catch (error) {
    res.status(500).json({ status:false, error: error.message });
  }
};

exports.getAllExtraServicesProperty = async (req, res) => {
  try {
    // const propertyData = await Property.findOne({ property_uid: req.body.property_uid });
    //
    // if (!propertyData) {
    //   res.status(200).json({ status:false, message: "Property not found" });
    // }else{
    //
    //   const extraServices = await ExtraService.find({location:propertyData.property_city}).lean();
      const extraServices = await ExtraService.find({property_uid:req.body.property_uid}).lean();
      if (extraServices.length === 0) {
        return res.status(200).json({ status: false, message: "No extra services found" });
      }

      for (var i = 0; i < extraServices.length; i++) {
        // array[i]

        if(extraServices[i].property_uid == undefined || extraServices[i].property_uid == "" || extraServices[i].property_uid == null){
          extraServices[i].property_name = ""
        }else{
          var result = await Property.find({ property_uid:extraServices[i].property_uid});
          extraServices[i].property_name = result[0].property_name
        }
      }
      res.status(200).json({ status:true, message: "fetched all extra services data successfully",data:extraServices});
    // }
  } catch (error) {
    res.status(500).json({ status:false, error: error.message });
  }
};

exports.createAndUpdateExtraService = async (req, res) => {
  const formData = req.body;
  const uploadedFile = req.file;

  if (!formData.name) {
    return res.status(400).json({ error: "Name is are required" });
  }

  try {
    let service;
    if (formData.id) {
      if (uploadedFile) {
        const originalKeys = [];
        const updatedFiles = [{ key: uploadedFile.location }];

        await updateMultipleImages(originalKeys, updatedFiles);
        service = await ExtraService.findByIdAndUpdate(
          formData.id,
          {
            name: formData.name,
            logo: uploadedFile.location,
            cost: formData.cost,
            property_uid: formData.property_uid,
          },
          { new: true, runValidators: true }
        );
      } else {
        service = await ExtraService.findByIdAndUpdate(
          formData.id,
          { name: formData.name, cost: formData.cost, property_uid:formData.property_uid },
          { new: true, runValidators: true }
        );
      }
    } else {
      if (uploadedFile) {
        const originalKeys = [];
        const updatedFiles = [{ key: uploadedFile.location }];

        await updateMultipleImages(originalKeys, updatedFiles);
        service = new ExtraService({
          name: formData.name,
          logo: uploadedFile.location,
          cost: formData.cost,
          property_uid: formData.property_uid,
        });
      } else {
        service = new ExtraService({
          name: formData.name,
          cost: formData.cost,
          property_uid: formData.property_uid,
        });
      }
      service = await service.save();
    }

    res.status(200).json({status:true, message: "extra Service created and update successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({status:false, error: "Internal Server Error" });
  }
};

exports.deleteExtraService = async (req, res) => {
    try {
      const serviceId = req.params.id;
      const originalKeys = [];
      const deletedService = await ExtraService.findByIdAndDelete(serviceId);
      if (!deletedService) {
        return res.status(200).json({status: false, message: "Extra Service not found" });
      }
      await deleteMultipleImages(originalKeys);

      res.json({status:true, message: "Extra Service deleted successfully",data:deletedService });
    } catch (error) {
      res.status(500).json({status:false, error: error.message });
    }
  };

exports.getAccommodation = async (req, res) => {
    try {
           const accommodation = await Accommodation.find();
           if (accommodation.length === 0) {
            return res.status(404).json({ status: false, message: "No accommodation found" });
          }
      res.status(200).json({ status:true, message: "fached all accommodation data successfully",data:accommodation});
    } catch (error) {
      res.status(500).json({ status:false, error: error.message });
    }
  };

exports.createAndUpdateAccommodation = async (req, res) => {
    try {
      const formData = req.body;
      const uploadedFile = req.file;

      let service;
      if (formData.id) {
        service = await Accommodation.findByIdAndUpdate(
          formData.id,
          { name: formData.name,logo:uploadedFile.location,
            cost: formData.cost },
          { new: true, runValidators: true }
        );
      } else {
        // Create a new Service
        const newService = new Accommodation({
          name: formData.name,
          logo:uploadedFile.location,
          cost: formData.cost,
        });
        service = await newService.save();
      }

      if (uploadedFile) {
        const originalKeys = [];
        const updatedFiles = [{ key: uploadedFile.location }];

        await updateMultipleImages(originalKeys, updatedFiles);
      }
      res.status(201).json({ message: "Accommodation Service created and update successfully",data:service });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

exports.deleteAccommodation = async (req, res) => {
    try {
      const serviceId = req.params.id;
      const originalKeys = [];
      const deletedService = await Accommodation.findByIdAndDelete(serviceId);
      if (!deletedService) {
        return res.status(404).json({ message: "Accommodation Service not found" });
      }
      await deleteMultipleImages(originalKeys);

      res.json({status:true, message: "Accommodation Service deleted successfully",data:deletedService });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };



exports.getFoodAndBevarage = async (req, res) => {
    try {
      const foodAndBevarage = await FoodAndBevarage.find();
      if (foodAndBevarage.length === 0) {
        return res.status(404).json({ status: false, message: "No food And Bevarage found" });
      }
      res.status(200).json({ status:true, message: "fached all food and Bevarages successfully",data:foodAndBevarage});
    } catch (error) {
      res.status(500).json({ status:false, error: error.message });
    }
  };
exports.createAndUpdateFoodAndBevarage = async (req, res) => {
    try {
      const formData = req.body;
      const uploadedFile = req.file;

      let service;
      if (formData.id) {
        service = await FoodAndBevarage.findByIdAndUpdate(
          formData.id,
          { name: formData.name,logo:uploadedFile.location, cost: formData.cost },
          { new: true, runValidators: true }
        );
      } else {
        // Create a new Service
        const newService = new FoodAndBevarage({
          name: formData.name,
          logo:uploadedFile.location,
          cost: formData.cost,
        });
        service = await newService.save();
      }

      if (uploadedFile) {
        const originalKeys = [];
        const updatedFiles = [{ key: uploadedFile.location }];

        await updateMultipleImages(originalKeys, updatedFiles);
      }
      res.status(201).json({ message: "Food And Bevarage create and update successfully",data:service });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

exports.deleteFoodAndBevarage = async (req, res) => {
    try {
      const serviceId = req.params.id;
      const originalKeys = [];
      const deletedService = await FoodAndBevarage.findByIdAndDelete(serviceId);
      if (!deletedService) {
        return res.status(404).json({ message: "Food And Bevarage not found" });
      }
      await deleteMultipleImages(originalKeys);

      res.json({status:true, message: "Food And Bevarage deleted successfully",data:deletedService });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

exports.getLaundry = async (req, res) => {
    try {
      const laundry = await Laundry.find();
      if (laundry.length === 0) {
        return res.status(404).json({ status: false, message: "No laundry found" });
      }
      res.status(200).json({ status:true, message: "fached all laundrys successfully",data:laundry});
    } catch (error) {
      res.status(500).json({ status:false, error: error.message });
    }
  };
exports.createAndUpdateLaundry = async (req, res) => {
    try {
      const formData = req.body;
      const uploadedFile = req.file;

      let service;
      if (formData.id) {
        service = await Laundry.findByIdAndUpdate(
          formData.id,
          { name: formData.name,logo:uploadedFile.location, cost: formData.cost },
          { new: true, runValidators: true }
        );
      } else {
        // Create a new Service
        const newService = new Laundry({
          name: formData.name,
          logo:uploadedFile.location,
          cost: formData.cost,
        });
        service = await newService.save();
      }

      if (uploadedFile) {
        const originalKeys = [];
        const updatedFiles = [{ key: uploadedFile.location }];

        await updateMultipleImages(originalKeys, updatedFiles);
      }
      res.status(201).json({ message: "Laundry service create and update successfully",data:service });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

exports.deleteLaundry = async (req, res) => {
    try {
      const serviceId = req.params.id;
      const originalKeys = [];
      const deletedService = await Laundry.findByIdAndDelete(serviceId);
      if (!deletedService) {
        return res.status(404).json({ message: "Laundry service  not found" });
      }
      await deleteMultipleImages(originalKeys);

      res.json({status:true, message: "Laundry service deleted successfully",data:deletedService });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

exports.getRental = async (req, res) => {
    try {
     const rental = await Rental.find();
     if (rental.length === 0) {
      return res.status(404).json({ status: false, message: "No rental found" });
    }
      res.status(200).json({ status:true, message: "fached all rentals successfully",data:rental});
    } catch (error) {
      res.status(500).json({ status:false, error: error.message });
    }
  };
exports.createAndUpdateRental = async (req, res) => {
    try {
      const formData = req.body;
      const uploadedFile = req.file;

      let service;
      if (formData.id) {
        service = await Rental.findByIdAndUpdate(
          formData.id,
          { name: formData.name,logo:uploadedFile.location, cost: formData.cost },
          { new: true, runValidators: true }
        );
      } else {
        // Create a new Service
        const newService = new Rental({
          name: formData.name,
          logo:uploadedFile.location,
          cost: formData.cost,
        });
        service = await newService.save();
      }

      if (uploadedFile) {
        const originalKeys = [];
        const updatedFiles = [{ key: uploadedFile.location }];

        await updateMultipleImages(originalKeys, updatedFiles);
      }
      res.status(201).json({ message: "Rental service create and update successfully",data:service });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
exports.deleteRental = async (req, res) => {
    try {
      const serviceId = req.params.id;
      const originalKeys = [];
      const deletedService = await Rental.findByIdAndDelete(serviceId);
      if (!deletedService) {
        return res.status(404).json({ message: "Rental service not found" });
      }
      await deleteMultipleImages(originalKeys);

      res.json({status:true, message: "Rental service deleted successfully",data:deletedService });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
