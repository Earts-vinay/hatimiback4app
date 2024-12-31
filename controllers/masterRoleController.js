const { Role } = require("../models/masterRoleModel");
const multer = require("multer");
const createError = require("http-errors");

const validationErrorHandler = require("../utils/validationErrorHandler");

// Controller to create a Role
// const createRole = async (req, res) => {
exports.createRole = async (req, res) => {

  try {
    const { designation, access_control, is_admin } = req.body;
    const new_role = await Role.create({
      designation,
      access_control,
      is_admin
    });
    res.status(201).json({status:true, message: "Role created successfully",data:new_role });
  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};


exports.updateRole = async (req, res) => {
    try {
        const updatedRole = await Role.findByIdAndUpdate(
        req.body.id,
        req.body,
        { new: true, runValidators: true });
        if (!updatedRole) {
          return res.status(200).json({status: false, message: 'Role not found' });
        }
        res.json({ message: 'Role updated successfully', data: updatedRole });
      } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ message: 'Internal server error' });
      }

  };

exports.deleteRole = async (req, res) => {
  try {
    const deletedRole = await Role.findByIdAndDelete(req.body.id);
    if (!deletedRole) {
      return res.status(200).json({status: false, message: 'Role not found' });
    }
    res.json({ message: 'Role deleted successfully', data: deletedRole });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.getAllRoles =  async (req, res) => {
    try {

      const role = await Role.find();
      if (role.length === 0) {
        return res.status(200).json({ status: false, message: "No roles found" });
      }

      res.status(200).json({ status:true, message: "fached all roles successfully",data:role});
    } catch (error) {
      res.status(500).json({ status:false, error: error.message });
    }
};

exports.getRoleById = async (req, res) => {

  // console.log("req-----------",req);
    try {
      const type = await Role.findById(req.params.id);
      if (!type) {
        return res.status(200).json({status: false, message: 'role  not found' });
      }
      res.status(200).json({ status:true, message: "role fetched successfully",data:type});
    } catch (error) {
      res.status(500).json({status:false, error: error.message });
    }
  };


// module.exports = {
//   createRole,
// };
