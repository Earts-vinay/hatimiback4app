const { Company } = require("../models/masterCompanyDetailsModel");
const { updateMultipleImages } = require("../services/uploadService");

const getMasterCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(200).json({status: false, message: 'Company details not found' });
    }
    res.status(200).json({ status:true, message: "fached Company details successfully",data:company});
  } catch (error) {
    res.status(500).json({status:false, error: error.message });
  }
};
const createMasterCompanyDetails = async (req, res) => {
  const formData = req.body;
  const uploadedFile = req.file;

  try {

    if (!formData.company_name) {
      return res.status(200).json({status: false, error: "Company name is required" });
    }

    let company;

    // Create a new company
    if (uploadedFile) {
      const originalKeys = [];
      const updatedFiles = [{ key: uploadedFile.location }];
      await updateMultipleImages(originalKeys, updatedFiles);

      company = new Company({
        company_name: formData.company_name,
        office_address: formData.office_address,
        office_number: formData.office_number,
        phone_number: formData.phone_number,
        email: formData.email,
        gstin: formData.gstin,
        pan: formData.pan,
        tan: formData.tan,
        logo: uploadedFile.location,
        cin: formData.cin,
        hsn: formData.hsn,
        its: formData.its,
      });
    } else {
      company = new Company({
        company_name: formData.company_name,
        office_address: formData.office_address,
        office_number: formData.office_number,
        phone_number: formData.phone_number,
        email: formData.email,
        gstin: formData.gstin,
        pan: formData.pan,
        tan: formData.tan,
        cin: formData.cin,
        hsn: formData.hsn,
        its: formData.its,
      });
    }

    company = await company.save();

    res.status(201).json({
      status: true,
      message: "Company details created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: error.message });
  }
};

const updateMasterCompanyDetails = async (req, res) => {
  const companyId = req.body.id;
  const formData = req.body;
  const uploadedFile = req.file;

  try {
    const logoFilePath = uploadedFile ? uploadedFile.location : null;

    if (!companyId) {
      return res.status(200).json({ status: false, error: "Company ID is required" });
    }

    let updateFields = {
      company_name: formData.company_name,
      office_address: formData.office_address,
      office_number: formData.office_number,
      phone_number: formData.phone_number,
      email: formData.email,
      gstin: formData.gstin,
      pan: formData.pan,
      tan: formData.tan,
      cin: formData.cin,
      hsn: formData.hsn,
      its: formData.its,
    };

    if (uploadedFile) {
      const originalKeys = []; // You might need to implement logic to get original keys
      const updatedFiles = [{ key: uploadedFile.location }];

      // Assuming you have a function updateMultipleImages that handles updating images
      await updateMultipleImages(originalKeys, updatedFiles);

      // Add logo to the updateFields
      updateFields.logo = logoFilePath;
    }

    // Using findByIdAndUpdate to update the company details
    const updatedCompany = await Company.findByIdAndUpdate(companyId, updateFields, { new: true });

    if (!updatedCompany) {
      return res.status(404).json({ status: false, error: "Company not found" });
    }

    res.json({
      status: true,
      message: "Company details updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: error.message });
  }
};

const getMasterCompanyDetails = async (req, res) => {
  try {
    const data = await Company.find();
    if (data.length <= 0) {
      throw createError.NotFound("company data not found");
    }
    res.json({
      status: true,
      data: data,
      message: "Fetched company details successfully",
    });
  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ staus: false, error: error.message });
  }
};


module.exports = {
  createMasterCompanyDetails,
  updateMasterCompanyDetails,
  getMasterCompanyDetails,
  getMasterCompanyById
};
