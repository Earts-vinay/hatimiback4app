const express = require("express");
const {
    getAllPropertyDetails,
    getPropertLocations,
    getPropertyType,
    getPropertyIndoorAminities,
    getPropertyOutdoorAminities,
    getPropertyLocationById,
    getPropertyTypeById,
    getPropertyIndoorAminitieById,
    getPropertyOutdoorAminitieById,
    getPropertyLocationByQuery,
    createPropertyLocation,
    createPropertyType,
    createAndUpdatePropertyIndoorAminities,
    createAndUpdatePropertyOutdoorAminities,
    updatePropertyLocation,
    updatePropertyType,
    deletePropertyOutdoorAminities,
    deletePropertyIndoorAminities,
    deletePropertyType,
    deletePropertyLocation,
    deleteLocationImage
} = require("../controllers/masterPropertyController");
const { uploadImage, updateMultipleImages,} = require("../services/uploadService");
const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const router = express.Router();
router.use(verifyAccessToken);

// Routes
router.get( "/get-all-property-details",getAllPropertyDetails);
router.get( "/get-all-property-locations",getPropertLocations);
router.get( "/get-all-property-types",getPropertyType);
router.get( "/get-all-property-indoor-details",getPropertyIndoorAminities);
router.get( "/get-all-property-outdoor-details",getPropertyOutdoorAminities);

router.get( "/get-property-location/:id",getPropertyLocationById);
router.get( "/get-property-type/:id",getPropertyTypeById);
router.get( "/get-property-indoor/:id",getPropertyIndoorAminitieById);
router.get( "/get-property-outdoor/:id",getPropertyOutdoorAminitieById);

router.get( "/get-location-search",getPropertyLocationByQuery);


router.post( "/create-location",createPropertyLocation);
router.post( "/create-type",createPropertyType);
router.post( "/create-indoor",uploadImage.single("icon"),createAndUpdatePropertyIndoorAminities);
router.post( "/create-outdoor",uploadImage.single("icon"),createAndUpdatePropertyOutdoorAminities);

router.put( "/update-location/:id",updatePropertyLocation);
router.put( "/update-type/:id",updatePropertyType);

router.delete( "/delete-location/:id",deletePropertyLocation);
router.delete( "/delete-type/:id",deletePropertyType);
router.delete( "/delete-indoor/:id",deletePropertyIndoorAminities);
router.delete( "/delete-outdoor/:id",deletePropertyOutdoorAminities);
router.delete("/delete-location-image",deleteLocationImage)
module.exports = router;
