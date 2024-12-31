const { Tax, OtherTaxes } = require("../models/masterCompanyDetailsModel");



exports.getAllTaxDetails = async (req, res) => {
    try {
      const tax = await Tax.find();
      const otherTax = await OtherTaxes.find();
      res.status(200).json({ status:true, message: "fached all tax data successfully",data:{GSTIN:tax,OtherTaxes:otherTax}});
    } catch (error) {
      res.status(500).json({ status:false, error: error.message });
    }
  };
exports.createTax = async (req, res) => {
    try {
      const { gstin_name, sgst, cgst, igst, type } = req.body;
      const tax = await Tax.create({
        gstin_name,
        sgst,
        cgst,
        igst,
        type
      });
      res.status(201).json({status:true, message: "Tax created successfully",data:tax });
    } catch (error) {
      res.status(500).json({status:false, error: error.message });
    }
  };              
exports.updateTax = async (req, res) => {
    try {
      const taxId = req.params.id;
      const { gstin_name, sgst, cgst, igst,type } = req.body;
      const updatedTax = await Tax.findByIdAndUpdate(
        taxId,
        { gstin_name, sgst, cgst, igst,type },
        { new: true, runValidators: true }
      );
      if (!updatedTax) {
        return res.status(200).json({status: false, message: "Tax not found" });
      }
  
      res.json({status:true, message: "Tax updated successfully", data:updatedTax });
    } catch (error) {
      res.status(500).json({status:false, error: error.message });
    }
  };
exports.createOrUpdateOtherTax = async (req, res) => {
  try {
    const { tds, ptec, ptrc, pf, service_charge } = req.body;

    let existingOtherTax = await OtherTaxes.findOne();

    if (existingOtherTax) {
        existingOtherTax = await OtherTaxes.findOneAndUpdate(
            {},
            { $set: { tds, ptec, ptrc, pf, service_charge } },
            { new: true }
        );
        res.status(200).json({ status: true, message: "Other Tax updated successfully", data:existingOtherTax });
    } else {
        const newOtherTax = await OtherTaxes.create({
            tds,
            ptec,
            ptrc,
            pf,
            service_charge,
        });
        res.status(201).json({ status: true, message: "Other Tax created successfully", data:newOtherTax });
    }
} catch (error) {
    res.status(500).json({ status: false, error: error.message });
}
};
exports.deleteTax = async (req, res) => {
    try {
      const taxId = req.params.id; 
  
      const deletedTax = await Tax.findByIdAndDelete(taxId);
  
      if (!deletedTax) {
        return res.status(200).json({status: false, message: "Tax not found" });
      }
  
      res.json({status:true, message: "Tax deleted successfully" });
    } catch (error) {
      res.status(500).json({status:false, error: error.message });
    }
  };