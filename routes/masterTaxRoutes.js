const express = require("express");
const {
    getAllTaxDetails,
    createTax,
    updateTax,
    createOrUpdateOtherTax,
    deleteTax
} = require("../controllers/masterTaxController");
const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const router = express.Router();
router.use(verifyAccessToken);

router.get( "/get-all-taxes",getAllTaxDetails);
router.post( "/create-tax",createTax);
router.post( "/create-other-tax",createOrUpdateOtherTax);

router.put( "/update-tax/:id",updateTax);
router.delete( "/delete-tax/:id",deleteTax);


module.exports = router;
