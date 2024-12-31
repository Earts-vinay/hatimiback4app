const express = require("express");
const {
    getAllExtraServices,
    createAndUpdateExtraService,
    deleteExtraService,
    getAccommodation,
    getFoodAndBevarage,
    getLaundry,
    getRental,
    createAndUpdateAccommodation,
    deleteAccommodation,
    createAndUpdateFoodAndBevarage,
    deleteFoodAndBevarage,
    createAndUpdateLaundry,
    deleteLaundry,
    createAndUpdateRental,
    deleteRental,
    getExtraServiceById,
    getAllExtraServicesLocation,
    getAllExtraServicesProperty
} = require("../controllers/masterExtraServiceController");
const { uploadImage, updateMultipleImages,} = require("../services/uploadService");
const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const router = express.Router();
router.use(verifyAccessToken);

// Routes
router.get( "/get-all-extra-services",getAllExtraServices);
router.get( "/get-extra-service/:id",getExtraServiceById);

// router.get( "/get-accommodation",getAccommodation);
// router.get( "/get-food-and-bevarage",getFoodAndBevarage);
// router.get( "/get-laundry",getLaundry);
// router.get( "/get-rental",getRental);

router.post( "/create-extra-service",uploadImage.single("logo"),createAndUpdateExtraService);
// router.post( "/create-accommodation",uploadImage.single("logo"),createAndUpdateAccommodation);
// router.post( "/create-food-and-bevarage",uploadImage.single("logo"),createAndUpdateFoodAndBevarage);
// router.post( "/create-laundry",uploadImage.single("logo"),createAndUpdateLaundry);
// router.post( "/create-rental",uploadImage.single("logo"),createAndUpdateRental);

router.delete( "/delete-extra-service/:id",deleteExtraService);
// router.delete( "/delete-accommodation/:id",deleteAccommodation);
// router.delete( "/delete-food-and-bevarage/:id",deleteFoodAndBevarage);
// router.delete( "/delete-laundry/:id",deleteLaundry);
// router.delete( "/delete-rental/:id",deleteRental);

router.post( "/get-all-extra-services-location",getAllExtraServicesLocation);
router.post( "/get-all-extra-services-property",getAllExtraServicesProperty);





module.exports = router;
