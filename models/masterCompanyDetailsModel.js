const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const companySchema = new mongoose.Schema(
  {
    company_uid: { type: String, default: uuidv4, required: true },
    company_name: { type: String, required: true },
    office_address: { type: String, required: true },
    office_number: { type: Number, required: true },
    phone_number: { type: Number, required: true },
    email: { type: String, required: true },
    gstin: { type: String, required: true },
    pan: { type: String, required: true },
    tan: { type: String, required: true },
    logo: { type: String },
    cin: { type: String },
    hsn: { type: String},
    its: { type: String},
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const otherTaxSchema = new mongoose.Schema({
  tds: {
    type: Number,
},
ptec: {
    type: Number,
},
ptrc: {
    type: Number,
},
pf: {
  type: Number,
},
service_charge: {
  type: Number,
},
}, {
  timestamps: true,
  versionKey: false,
});

const taxSchema = new mongoose.Schema({
  gstin_name:{
   type: String,
  },
   sgst: {
       type: Number,
   },
   cgst: {
       type: Number,
   },
   igst: {
       type: Number,
   },
   type:{
    type: String,
   }
 }, {
   timestamps: true,
   versionKey: false,
 });
const Company = mongoose.model("masterCompanyDetails", companySchema);
const Tax = mongoose.model("masterTaxDetails", taxSchema);
const OtherTaxes = mongoose.model("other-Taxes", otherTaxSchema);


module.exports = {Company, Tax, OtherTaxes}
