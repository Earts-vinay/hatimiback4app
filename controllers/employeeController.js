const { Employee, EmployeeTransfer, EmployeeSwap} = require("../models/employeeModel");
const { Property } = require("../models/propertyModel");
const { Role } = require("../models/masterRoleModel");
const { ShiftModule } = require("../models/shiftModel");
const { Task, TaskConversation} = require("../models/taskModel");
const { Leave } = require("../models/leaveModel");
const {
  signAccessToken,
  verifyAccessToken,
} = require("../services/JWT/jwt.tokens");


const multer = require("multer");
const createError = require("http-errors");

const validationErrorHandler = require("../utils/validationErrorHandler");
const {sendEmail
} = require("../services/sendEmailService");
var crypto = require('crypto');


const {
  uploadImage,
  updateMultipleImages,
  deleteMultipleImages,
} = require("../services/uploadService");

function encrypt(plainText){

  // var myKey = "E18EB90C709D355E8B8B6FA31B495AE1"
  //
  // const iv = crypto.randomBytes(16);
  //
  // var cipher=crypto.createCipheriv("aes-256-cbc",Buffer.from(myKey),iv);
  // var encrypt=cipher.update(plainText,"utf-8","hex");
  // encrypt+=cipher.final("hex");
  // return encrypt;


  var algorithm = 'aes256'; // or any other algorithm supported by OpenSSL
  var key = 'password';

  var cipher = crypto.createCipher(algorithm, key);
  var encrypted = cipher.update(plainText, 'utf8', 'hex') + cipher.final('hex');
  return encrypted;




  // const password = "workingKey";
  // const key = crypto.scryptSync(password, 'salt', 32);
  //
  // const iv = crypto.randomBytes(16);
  // const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  // var encrypted = cipher.update(plainText, 'utf8', 'hex') + cipher.final('hex');
  // return encrypted;
}

function decrypt(encText){

  // var myKey = "E18EB90C709D355E8B8B6FA31B495AE1"
  //
  // const iv = crypto.randomBytes(16);
  //
  // var cipher=crypto.createDecipheriv("aes-256-cbc",Buffer.from(myKey),iv);
  // var encrypt=cipher.update(encText,"utf-8","hex");
  // encrypt+=cipher.final("hex");
  // return encrypt;



  var algorithm = 'aes256'; // or any other algorithm supported by OpenSSL
  var key = 'password';

  var decipher = crypto.createDecipher(algorithm, key);
  var decrypted = decipher.update(encText, 'hex', 'utf8') + decipher.final('utf8');
  return decrypted;


  // const password = "workingKey";
  // const key = crypto.scryptSync(password, 'salt', 32);
  //
  // const iv = crypto.randomBytes(16);
  // const cipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  // var encrypted = cipher.update(encText, 'utf8', 'hex') + cipher.final('hex');
  // return encrypted;
}

// Controller to create a Employee
exports.createEmployee = async (req, res) => {

  try {
    const { name, role, mobile_no, email, property_id, password, total_paid_leave} = req.body;
    var encryptedPassword = encrypt(password);

    // console.log("encryptedPassword",encryptedPassword);


    const result = await Employee.find({ mobile_no:mobile_no });

    // console.log("result",result);
    if(result.length > 0){
      res.status(200).json({status:false, message: "Employee already exist with same mobile number" });
    }else{

      const new_employee = await Employee.create({
          name:name,
          role:role,
          mobile_no:mobile_no,
          email:email,
          property_id:property_id,
          password:encryptedPassword,
          total_paid_leave:total_paid_leave
        });

        var subject = 'Login Credentials'
        var message = `Hello ${name},

        Your account has been created to access the hatimi web/mobile application.

        Use below credentials to login:

        Mobile No: ${mobile_no}
        Password: ${password}

        Thanks & Regards
        Hatimi Properties`
        await sendEmail(email, subject, message);

        res.status(201).json({status:true, message: "Employee created successfully",data:new_employee });
    }

  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};


exports.updateEmployee = async (req, res) => {
    try {

      var d = new Date();
      var current_time = d.toLocaleString([], {timeZone: 'Asia/Kolkata', hour12: true,hour: 'numeric',minute: 'numeric'});

      const yyyy = d.getFullYear();
      let mm = d.getMonth() + 1;
      let dd = d.getDate();

      if (dd < 10) dd = '0' + dd;
      if (mm < 10) mm = '0' + mm;

      const current_date = dd + '-' + mm + '-' + yyyy;

      const employee_details = await Employee.findById(req.body.id);
      // console.log("employee_details",employee_details);
      req.body.password = encrypt(req.body.password)


        const updatedEmployee = await Employee.findByIdAndUpdate(
        req.body.id,
        req.body,
        { new: true, runValidators: true });
        if (!updatedEmployee) {
          return res.status(200).json({status: false, message: 'Employee not found' });
        }

        if(req.body.property_update == true){

          const updated_by = await Employee.findById(req.body.updated_by);
          var updated_by_name = updated_by.name


          var previous_property_id = employee_details.property_id
          if(previous_property_id.length > 0){
            var previous_property_name = ""

            for (var i = 0; i < previous_property_id.length; i++) {
              var pp_p_id = previous_property_id[i]
              var ind = i
              const previous_property_details = await Property.findById(pp_p_id);
              if(!previous_property_details){
              }else{
                var p_property_name = previous_property_details.property_name
                if(ind == previous_property_id.length-1){
                  previous_property_name += p_property_name
                }else{
                  previous_property_name += p_property_name
                  previous_property_name += ", "
                }
              }
            }
          }else{
            var previous_property_name = ""
          }


          var latest_property_id = req.body.property_id
          if(latest_property_id.length > 0){
            var latest_property_name = ""

            for (var i = 0; i < latest_property_id.length; i++) {
              var ll_p_id = latest_property_id[i]
              var ind = i
              const latest_property_details = await Property.findById(ll_p_id);
              if(!latest_property_details){
              }else{
                var l_property_name = latest_property_details.property_name
                if(ind == latest_property_id.length-1){
                  latest_property_name += l_property_name
                }else{
                  latest_property_name += l_property_name
                  latest_property_name += ", "
                }
              }
            }
          }else{
            var latest_property_name = ""
          }

          // const latest_property_details = await Property.findById(req.body.property_id);
          // var latest_property_name = latest_property_details.property_name

          // var log = "Updated by "+updated_by_name+" from property "+previous_property_name+" to property "+latest_property_name+" at "+current_date+" "+current_time
          var emp_id = req.body.id
          var emp_id_12 = req.body.id
          var date_time = current_date+" "+current_time
          const new_employee = await EmployeeTransfer.create({
              emp_id,
              updated_by_name,
              previous_property_name,
              latest_property_name,
              date_time,
            });

        }

        if(req.body.credentials_update == true){

          if(req.body.password_update == true){
            var newPassword = req.body.password
          }else{
            var newPassword = decrypt(employee_details.password)
          }

          var subject = 'Credentials update'
          var message = `Hello ${req.body.name},

          Your credentials has been update to access the hatimi web/mobile application.

          Use below credentials to login:

          Mobile No: ${req.body.mobile_no}
          Password: ${newPassword}

          Thanks & Regards
          Hatimi Properties`
          await sendEmail(req.body.email, subject, message);
        }
        res.json({status:true, message: 'Employee updated successfully', data: updatedEmployee });
      } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ status:false,message: 'Internal server error' });
      }

  };

exports.deleteEmployee = async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.body.id);
    if (!deletedEmployee) {
      return res.status(200).json({status: false, message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully', data: deletedEmployee });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.getAllEmployees =  async (req, res) => {
    try {

      const employee = await Employee.find();
      if (employee.length === 0) {
        return res.status(200).json({ status: false, message: "No employees found" });
      }

      res.status(200).json({ status:true, message: "fached all employees successfully",data:employee});
    } catch (error) {
      res.status(500).json({ status:false, error: error.message });
    }
};


exports.getEmployeeById = async (req, res) => {
    try {
      var data_obj = {}
      var type = await Employee.findById(req.params.id);
      const transfer_details = await EmployeeTransfer.find({emp_id:req.params.id});
      const swap_details = await EmployeeSwap.find({emp_id:req.params.id});
      var role = type.role
      var properties = type.property_id
      var property_array = []

      if(properties.length > 0){
        for (var i = 0; i < properties.length; i++) {
          var property_id = properties[i]

          const select_property_details = await Property.findById(property_id);
          if(!select_property_details){

          }else{
            property_array.push({
              value:property_id,
              label:select_property_details.property_name
            })
          }
        }
      }

      if(type.shift_array == undefined || type.shift_array == null || type.shift_array == ''){
        var shift_array = []
      }else{
        if(type.shift_array.length > 0){
          var shift_array = []
          var shift_array_main = type.shift_array
          for (var i = 0; i < shift_array_main.length; i++) {
            var shift_id = shift_array_main[i].shift_id
            var property_id = shift_array_main[i].property_id
            const select_shift_details_new = await ShiftModule.findById(shift_id);
            const select_property_details_new = await Property.findById(property_id);

            if(!select_property_details_new){
              var property_name = ""
            }else{
              var property_name = select_property_details_new.property_name
            }
            if(!select_shift_details_new){
              var shift_obj = {
                value:"",
                label:"",
                from_time:"",
                to_time:"",
                property_name:property_name,
              }
            }else{
              var shift_obj = {
                value:select_shift_details_new._id,
                label:select_shift_details_new.shift_name,
                from_time:select_shift_details_new.from_time,
                to_time:select_shift_details_new.to_time,
                property_name:property_name
              }
            }
            shift_array.push(shift_obj)
          }

        }else{
          var shift_array = []
        }
      }


      if(type.shift_id == undefined || type.shift_id == null || type.shift_id == ''){
        var shift_obj = {
          value:"",
          label:"",
          from_time:"",
          to_time:"",
        }
      }else{
        const select_shift_details = await ShiftModule.findById(type.shift_id);

        if(!select_shift_details){
          var shift_obj = {
            value:"",
            label:"",
            from_time:"",
            to_time:"",
          }
        }else{
          var shift_obj = {
            value:select_shift_details._id,
            label:select_shift_details.shift_name,
            from_time:select_shift_details.from_time,
            to_time:select_shift_details.to_time,
          }
        }
      }

      var properties_dock_view = false
      var properties_dock_control = false
      var reservation_control = false
      var reservation_view = false
      var front_desk_view = false
      var front_desk_control = false
      var coupon_view = false
      var coupon_control = false
      var employee_view = false
      var employee_control = false
      var master_view = false
      var master_control = false
      var role_obj = {}
      if(role.length > 0){
        for (var i = 0; i < role.length; i++) {
          var role_id = role[i]
          var role_details = await Role.findById(role_id);
          var access_control = role_details.access_control
          if(i==0){
            role_obj = {
              value:role_id,
              label:role_details.designation,
            }
          }

          if(access_control.properties_dock_view == true){
            properties_dock_view = true
          }

          if(access_control.properties_dock_control == true){
            properties_dock_control = true
          }

          if(access_control.reservation_control == true){
            reservation_control = true
          }

          if(access_control.reservation_view == true){
            reservation_view = true
          }

          if(access_control.front_desk_view == true){
            front_desk_view = true
          }

          if(access_control.front_desk_control == true){
            front_desk_control = true
          }

          if(access_control.coupon_view == true){
            coupon_view = true
          }

          if(access_control.coupon_control == true){
            coupon_control = true
          }

          if(access_control.employee_view == true){
            employee_view = true
          }

          if(access_control.employee_control == true){
            employee_control = true
          }

          if(access_control.master_view == true){
            master_view = true
          }

          if(access_control.master_control == true){
            master_control = true
          }

        }
      }
      var new_access = {
        properties_dock_view:properties_dock_view,
        properties_dock_control:properties_dock_control,
        reservation_control:reservation_control,
        reservation_view:reservation_view,
        front_desk_view:front_desk_view,
        front_desk_control:front_desk_control,
        coupon_view:coupon_view,
        coupon_control:coupon_control,
        employee_view:employee_view,
        employee_control:employee_control,
        master_view:master_view,
        master_control:master_control,
      }

      var swap_array = []
      if(swap_details.length > 0){
        for (var i = 0; i < swap_details.length; i++) {
          // console.log("swap_details",swap_details);
          var role_id_new = swap_details[i].role
          var role_details_new = await Role.findById(role_id_new);
          var designation = role_details_new.designation
          // swap_details[i].role_name = designation

          if(swap_details[i].approved_by == ""){
            var approved_by_name  = ''
          }else{
            var approved_by_details = await Employee.findById(swap_details[i].approved_by);
            var approved_by_name  = approved_by_details.name
          }

          var swap_obj = {
            _id:swap_details[i]._id,
            emp_id:swap_details[i].emp_id,
            role:swap_details[i].role,
            till_date:swap_details[i].till_date,
            swap_date:swap_details[i].swap_date,
            initiated_by:swap_details[i].initiated_by,
            approved_by:swap_details[i].approved_by,
            approved_by_name:approved_by_name,
            status:swap_details[i].status,
            is_cancel:swap_details[i].is_cancel,
            role_name:designation
          }
          swap_array.push(swap_obj)
        }
      }
      if(type.id_proof == undefined || type.id_proof == null){
        var id_proof = ""
      }else {
        var id_proof = type.id_proof
      }


      data_obj._id = type._id
      data_obj.name = type.name
      data_obj.role = type.role
      data_obj.role_obj = role_obj
      data_obj.mobile_no = type.mobile_no
      data_obj.email = type.email
      data_obj.property_id = type.property_id
      data_obj.alternate_no = type.alternate_no
      data_obj.id_proof = id_proof
      data_obj.property_obj = property_array
      data_obj.shift_obj = shift_obj
      data_obj.shift_array = shift_array
      // data_obj.password = type.password
      data_obj.password = decrypt(type.password)
      data_obj.total_paid_leave = type.total_paid_leave
      data_obj.createdAt = type.createdAt
      data_obj.updatedAt = type.updatedAt
      data_obj.access = new_access
      data_obj.transfer_details = transfer_details
      data_obj.swap_details = swap_array


      if (!type) {
        return res.status(200).json({status: false, message: 'employee  not found' });
      }
      res.status(200).json({ status:true, message: "employee fetched successfully",data:data_obj});
    } catch (error) {
      res.status(500).json({status:false, error: error.message });
    }
  };


exports.updateDetails = async (req, res) => {
    const formData = req.body;
    const uploadedFile = req.file;

    // console.log("req.file",req.file);

    try {

      let employee;

      if (formData.id) {
        if (uploadedFile) {
          const originalKeys = [];
          const updatedFiles = [{ key: uploadedFile.location }];
          await updateMultipleImages(originalKeys, updatedFiles);
          if(formData.alternate_no){
            var alternate_no = (formData.alternate_no).toString()
          }else{
            var alternate_no = ''
          }

          employee = await Employee.findByIdAndUpdate(
            formData.id,
            { alternate_no: alternate_no,id_proof:uploadedFile.location},
            { new: true, runValidators: true }
          );
        } else {
          employee = await Employee.findByIdAndUpdate(
            formData.id,
            { alternate_no: formData.alternate_no},
            { new: true, runValidators: true }
          );
        }
        res.status(200).json({status:true, message: "Details update successfully" });
      } else {

        res.status(200).json({status:false, message: "Employee not found" });
      }

    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({status:false, error: "Internal Server Error" });
    }
};

exports.roleSwap = async (req, res) => {
  try {

    var d = new Date();
    var current_time = d.toLocaleString([], {timeZone: 'Asia/Kolkata',  hour12: true,hour: 'numeric',minute: 'numeric'});

    const yyyy = d.getFullYear();
    let mm = d.getMonth() + 1;
    let dd = d.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    const current_date = dd + '-' + mm + '-' + yyyy;
    var swap_date = current_date+" "+current_time

    const { id, role, till_date, initiated_by } = req.body;
    var status = 'pending'
    var is_cancel = false
    var approved_by = ""

    const employee = await Employee.findById(id);

    if (employee.length === 0) {
      return res.status(200).json({ status: false, message: "No employees found" });
    }

    const initiated_by_details = await Employee.findById(initiated_by);
    var initiated_by_name = initiated_by_details.name

    const new_employee_swap = await EmployeeSwap.create({
        emp_id:id,
        role:role,
        till_date:till_date,
        swap_date:swap_date,
        initiated_by:initiated_by_name,
        approved_by:approved_by,
        status:status,
        is_cancel:is_cancel,
    });

    res.status(200).json({ status:true, message: "Role swapped successfully",data:employee});
  } catch (error) {
    res.status(500).json({ status:false, error: error.message });
  }
}

exports.updateroleSwap = async (req, res) => {
  try {
    const { id, status, approved_by } = req.body;
    if(status == 'cancelled'){
      var is_cancel = true
    }else{
      var is_cancel = false
    }

    const employee_swap = await EmployeeSwap.findById(id);

    if (employee_swap.length === 0) {
      return res.status(200).json({ status: false, message: "ID not found" });
    }

    const updatedEmployeeSwap = await EmployeeSwap.findByIdAndUpdate(
    id,
    {status:status,
      is_cancel:is_cancel,
      approved_by:approved_by},
    { new: true, runValidators: true });

      var emp_id = employee_swap.emp_id
      var role = employee_swap.role
      const employee = await Employee.findById(emp_id);
      var previous_role = employee.role

      if(status == 'approved'){
        previous_role.push(role)
      }else{
        previous_role = previous_role.filter(e => e !== role)
      }

      const updatedEmployee = await Employee.findByIdAndUpdate(
      emp_id,
      {role:previous_role},
      { new: true, runValidators: true });

    return res.status(200).json({ status: true, message: "Update successfully" });

  } catch (error) {
    res.status(500).json({ status:false, error: error.message });
  }
}

exports.fetchSwap = async (req, res) => {
  try {
    const swap_array = []
    const employee_swap = await EmployeeSwap.find({status:{$ne:"cancelled"}});

    if(employee_swap.length > 0){
      for (var i = 0; i < employee_swap.length; i++) {
        var emp_id = employee_swap[i].emp_id
        var role = employee_swap[i].role

        const emp_details = await Employee.findById(emp_id);
        var role_details = await Role.findById(role);
        const select_property_details = await Property.findById(emp_details.property_id);


        var emp_name = emp_details.name
        var role_name = role_details.designation

        if(employee_swap[i].approved_by == ''){
          var approved_by_name = ''
        }else{
          const approved_by_details = await Employee.findById(employee_swap[i].approved_by);
          var approved_by_name = approved_by_details.name
        }

        var data_obj = {
          _id:employee_swap[i]._id,
          emp_id:employee_swap[i].emp_id,
          property_name:select_property_details.property_name,
          role:employee_swap[i].role,
          till_date:employee_swap[i].till_date,
          swap_date:employee_swap[i].swap_date,
          initiated_by:employee_swap[i].initiated_by,
          approved_by:employee_swap[i].approved_by,
          status:employee_swap[i].status,
          is_cancel:employee_swap[i].is_cancel,
          emp_name:emp_name,
          role_name:role_name,
          approved_by_name:approved_by_name
        }
        swap_array.push(data_obj)

      }

      res.status(200).json({ status:true, message: "Data fetched succesfully", data:swap_array});
    }else{
      res.status(200).json({ status:false, message: "Data not found"});
    }

  } catch (error) {
    res.status(500).json({ status:false, error: error.message });
  }
}

// exports.logIn = async (req, res) => {
//   try {
//
//     const { mobile_no, password} = req.body;
//     var encryptedPassword = encrypt(password);
//
//
//     const result = await Employee.find({ mobile_no:mobile_no });
//
//     if(result.length == 0){
//       res.status(200).json({status:false, message: "Mobile number not exists" });
//     }else{
//       if(result[0].password == encryptedPassword){
//
//         // console.log("encryptedPassword");
//
//         var data_obj = {}
//         var type = await Employee.findById(result[0]._id);
//         var role = type.role
//         var properties = type.property_id
//         var property_array = []
//
//         if(properties.length > 0){
//           for (var i = 0; i < properties.length; i++) {
//             var property_id = properties[i]
//
//             const select_property_details = await Property.findById(property_id);
//             if(!select_property_details){
//
//             }else{
//               property_array.push({
//                 value:property_id,
//                 label:select_property_details.property_name,
//                 property_uid:select_property_details.property_uid,
//                 property_state:select_property_details.property_state
//               })
//             }
//           }
//         }
//
//         if(type.shift_id == undefined || type.shift_id == null || type.shift_id == ''){
//           var shift_obj = {
//             value:"",
//             label:"",
//             from_time:"",
//             to_time:"",
//           }
//         }else{
//           const select_shift_details = await ShiftModule.findById(type.shift_id);
//
//           if(!select_shift_details){
//             var shift_obj = {
//               value:"",
//               label:"",
//               from_time:"",
//               to_time:"",
//             }
//           }else{
//             var shift_obj = {
//               value:select_shift_details._id,
//               label:select_shift_details.shift_name,
//               from_time:select_shift_details.from_time,
//               to_time:select_shift_details.to_time,
//             }
//           }
//         }
//
//         var is_admin = false
//         var properties_dock_view = false
//         var properties_dock_control = false
//         var reservation_control = false
//         var reservation_view = false
//         var front_desk_view = false
//         var front_desk_control = false
//         var coupon_view = false
//         var coupon_control = false
//         var employee_view = false
//         var employee_control = false
//         var master_view = false
//         var master_control = false
//         var leave_view = false
//         var leave_control = false
//         var attendance_view = false
//         var attendance_control = false
//         var swap_view = false
//         var swap_control = false
//         var hrm_view = false
//         var hrm_control = false
//         var task_view = false
//         var task_control = false
//         var role_obj = {}
//         if(role.length > 0){
//           for (var i = 0; i < role.length; i++) {
//             var role_id = role[i]
//             var role_details = await Role.findById(role_id);
//             var access_control = role_details.access_control
//             if(role_details.is_admin == true){
//               is_admin = true
//             }
//             if(i==0){
//               role_obj = {
//                 value:role_id,
//                 label:role_details.designation,
//               }
//             }
//
//             if(access_control.properties_dock_view == true){
//               properties_dock_view = true
//             }
//
//             if(access_control.properties_dock_control == true){
//               properties_dock_control = true
//             }
//
//             if(access_control.reservation_control == true){
//               reservation_control = true
//             }
//
//             if(access_control.reservation_view == true){
//               reservation_view = true
//             }
//
//             if(access_control.front_desk_view == true){
//               front_desk_view = true
//             }
//
//             if(access_control.front_desk_control == true){
//               front_desk_control = true
//             }
//
//             if(access_control.coupon_view == true){
//               coupon_view = true
//             }
//
//             if(access_control.coupon_control == true){
//               coupon_control = true
//             }
//
//             if(access_control.employee_view == true){
//               employee_view = true
//             }
//
//             if(access_control.employee_control == true){
//               employee_control = true
//             }
//
//             if(access_control.master_view == true){
//               master_view = true
//             }
//
//             if(access_control.master_control == true){
//               master_control = true
//             }
//
//             if(access_control.leave_view == true){
//               leave_view = true
//             }
//
//             if(access_control.leave_control == true){
//               leave_control = true
//             }
//
//             if(access_control.attendance_view == true){
//               attendance_view = true
//             }
//
//             if(access_control.attendance_control == true){
//               attendance_control = true
//             }
//
//             if(access_control.swap_view == true){
//               swap_view = true
//             }
//
//             if(access_control.swap_control == true){
//               swap_control = true
//             }
//             if(access_control.hrm_view == true){
//               hrm_view = true
//             }
//
//             if(access_control.hrm_control == true){
//               hrm_control = true
//             }
//
//             if(access_control.task_view == true){
//               task_view = true
//             }
//
//             if(access_control.task_control == true){
//               task_control = true
//             }
//
//           }
//         }
//         var new_access = {
//           is_admin:is_admin,
//           properties_dock_view:properties_dock_view,
//           properties_dock_control:properties_dock_control,
//           reservation_control:reservation_control,
//           reservation_view:reservation_view,
//           front_desk_view:front_desk_view,
//           front_desk_control:front_desk_control,
//           coupon_view:coupon_view,
//           coupon_control:coupon_control,
//           employee_view:employee_view,
//           employee_control:employee_control,
//           master_view:master_view,
//           master_control:master_control,
//           leave_view:leave_view,
//           leave_control:leave_control,
//           attendance_view:attendance_view,
//           attendance_control:attendance_control,
//           swap_view:swap_view,
//           swap_control:swap_control,
//           hrm_view:hrm_view,
//           hrm_control:hrm_control,
//           task_view:task_view,
//           task_control:task_control,
//         }
//
//
//         data_obj._id = type._id
//         data_obj.name = type.name
//         data_obj.role = type.role
//         data_obj.role_obj = role_obj
//         data_obj.mobile_no = type.mobile_no
//         data_obj.email = type.email
//         data_obj.alternate_no = type.alternate_no
//         data_obj.property_id = type.property_id
//         data_obj.property_obj = property_array
//         data_obj.shift_obj = shift_obj
//         data_obj.password = decrypt(type.password)
//         data_obj.total_paid_leave = type.total_paid_leave
//         data_obj.createdAt = type.createdAt
//         data_obj.updatedAt = type.updatedAt
//         data_obj.access = new_access
//
//
//         const accesstoken = await signAccessToken({
//           userId: data_obj._id
//         });
//
//         res.status(200).json({status:true, message: "Login succesfully" ,data:data_obj, accesstoken:accesstoken});
//       }else{
//         res.status(200).json({status:false, message: "Incorrect password" });
//       }
//     }
//
//   } catch (error) {
//     res.status(500).json({ status:false, error: error.message });
//   }
// }

exports.logIn = async (req, res) => {
  try {
    const { mobile_no, password } = req.body;
    const encryptedPassword = encrypt(password);

    const employee = await Employee.findOne({ mobile_no }).lean();
    if (!employee) {
      return res.status(200).json({ status: false, message: "Mobile number does not exist" });
    }

    // Check password
    if (employee.password !== encryptedPassword) {
      return res.status(200).json({ status: false, message: "Incorrect password" });
    }

    // Fetch properties in parallel
    const propertyDetailsPromises = employee.property_id.map(property_id =>
      Property.findById(property_id).lean()
    );
    const propertyDetails = await Promise.all(propertyDetailsPromises);

    const property_array = propertyDetails
      .filter(property => property)
      .map(property => ({
        value: property._id,
        label: property.property_name,
        property_uid: property.property_uid,
        property_state: property.property_state
      }));

      // var properties = employee.property_id
      // var property_array = []
      // //
      // if(properties.length > 0){
      //   for (var i = 0; i < properties.length; i++) {
      //     var property_id = properties[i]
      //
      //     const select_property_details = await Property.findById(property_id);
      //     if(!select_property_details){
      //
      //     }else{
      //       property_array.push({
      //         value:property_id,
      //         label:select_property_details.property_name,
      //         property_uid:select_property_details.property_uid,
      //         property_state:select_property_details.property_state
      //       })
      //     }
      //   }
      // }

    // Fetch shift details
    const shift_obj = employee.shift_id
      ? await ShiftModule.findById(employee.shift_id).lean()
      : null;

    const shift_details = shift_obj
      ? {
          value: shift_obj._id,
          label: shift_obj.shift_name,
          from_time: shift_obj.from_time,
          to_time: shift_obj.to_time
        }
      : {
          value: "",
          label: "",
          from_time: "",
          to_time: ""
        };

    // Fetch roles and access control in parallel
    const roleDetailsPromises = employee.role.map(role_id =>
      Role.findById(role_id).lean()
    );
    const roleDetails = await Promise.all(roleDetailsPromises);

    // console.log("roleDetails",roleDetails);

    let is_admin = false;
    // let new_access = {};
    // roleDetails.forEach(role => {
    //   const access = role.access_control;
    //   if (role.is_admin) is_admin = true;
    //
    //   new_access = {
    //     ...new_access,
    //     properties_dock_view: access.properties_dock_view || new_access.properties_dock_view,
    //     properties_dock_control: access.properties_dock_control || new_access.properties_dock_control,
    //     reservation_control: access.reservation_control || new_access.reservation_control,
    //     reservation_view: access.reservation_view || new_access.reservation_view,
    //     front_desk_view: access.front_desk_view || new_access.front_desk_view,
    //     front_desk_control: access.front_desk_control || new_access.front_desk_control,
    //     coupon_view: access.coupon_view || new_access.coupon_view,
    //     coupon_control: access.coupon_control || new_access.coupon_control,
    //     employee_view: access.employee_view || new_access.employee_view,
    //     employee_control: access.employee_control || new_access.employee_control,
    //     master_view: access.master_view || new_access.master_view,
    //     master_control: access.master_control || new_access.master_control,
    //     leave_view: access.leave_view || new_access.leave_view,
    //     leave_control: access.leave_control || new_access.leave_control,
    //     attendance_view: access.attendance_view || new_access.attendance_view,
    //     attendance_control: access.attendance_control || new_access.attendance_control,
    //     swap_view: access.swap_view || new_access.swap_view,
    //     swap_control: access.swap_control || new_access.swap_control,
    //     hrm_view: access.hrm_view || new_access.hrm_view,
    //     hrm_control: access.hrm_control || new_access.hrm_control,
    //     task_view: access.task_view || new_access.task_view,
    //     task_control: access.task_control || new_access.task_control,
    //   };
    // });

    let new_access = roleDetails[0].access_control;
    const role_obj = roleDetails.length > 0 ? {
      value: roleDetails[0]._id,
      label: roleDetails[0].designation
    } : {};

    // const data_obj = {
    //   _id: employee._id,
    //   name: employee.name,
    //   role: employee.role,
    //   role_obj,
    //   mobile_no: employee.mobile_no,
    //   email: employee.email,
    //   alternate_no: employee.alternate_no,
    //   property_id: employee.property_id,
    //   property_obj: property_array,
    //   shift_obj: shift_details,
    //   password: decrypt(employee.password),
    //   total_paid_leave: employee.total_paid_leave,
    //   createdAt: employee.createdAt,
    //   updatedAt: employee.updatedAt,
    //   access: new_access
    // };
    employee.role_obj = role_obj
    employee.property_obj = property_array
    employee.shift_obj = shift_details
    employee.password = decrypt(employee.password)
    employee.access = new_access
    // employee.property_obj = property_array
    // employee.property_obj = property_array

    const accesstoken = await signAccessToken({
      userId: employee._id
    });

    return res.status(200).json({
      status: true,
      message: "Login successfully",
      data: employee,
      accesstoken
    });

  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};




exports.getEmployeeByRole = async (req, res) => {
  // console.log("req++++++++++",req.body);
  var property_id = req.body.property_id
    try {
      var dateArray = []
      if(req.body.property_id == undefined || req.body.property_id == ""){
        var employee = await Employee.find({"role.0":req.body.role});
      }else{
        var employee = await Employee.find({"role.0":req.body.role, property_id:{$in: [req.body.property_id]}});
        // var employee = await Employee.find({"role.0":req.body.role, property_id:req.body.property_id});
      }
      if(employee.length > 0){
        for (var i = 0; i < employee.length; i++) {

          var role = employee[i].role


          // if(employee[i].shift_id == undefined || employee[i].shift_id == null || employee[i].shift_id == ''){
          //   var shift_obj = ""
          // }else{
          //   const select_shift_details = await ShiftModule.findById(employee[i].shift_id);
          //
          //   if(!select_shift_details){
          //     var shift_obj = ""
          //   }else{
          //     var shift_obj = {
          //       value:select_shift_details._id,
          //       label:select_shift_details.shift_name,
          //       from_time:select_shift_details.from_time,
          //       to_time:select_shift_details.to_time,
          //     }
          //   }
          // }


          if(employee[i].shift_array == undefined || employee[i].shift_array == "" || employee[i].shift_array == null){
            var shift_obj = ""
          }else{
            if(employee[i].shift_array.length > 0){
              var shift_array = employee[i].shift_array
              let obj = shift_array.find(o => o.property_id === property_id);

              if(obj == undefined || obj == false || obj == null || obj == ""){
                var shift_obj = ""
              }else{
                var shift_id = obj.shift_id

                const select_shift_details = await ShiftModule.findById(shift_id);

                if(!select_shift_details){
                  var shift_obj = ""
                }else{
                  var shift_obj = {
                    value:select_shift_details._id,
                    label:select_shift_details.shift_name,
                    from_time:select_shift_details.from_time,
                    to_time:select_shift_details.to_time,
                  }
                }
              }
            }else{
              var shift_obj = ""
            }
          }

          var data_obj = {
            _id : employee[i]._id,
            name : employee[i].name,
            role : employee[i].role,
            shift_obj : shift_obj
          }
          dateArray.push(data_obj)

        }

        res.status(200).json({ status:true, message: "employee fetched successfully",data:dateArray});
      }else{
        return res.status(200).json({status: false, message: 'employee  not found for this role' });
      }

    } catch (error) {
      res.status(500).json({status:false, error: error.message });
    }
  };



  exports.getEmployeeByProperty = async (req, res) => {
    // console.log("req++++++++++",req.body);
      try {
        var dateArray = []
        if(req.body.property_id == undefined || req.body.property_id == ""){
          var employee = await Employee.find({});
        }else{
          var employee = await Employee.find({property_id:{$in: [req.body.property_id]}});
        }
        if(employee.length > 0){
          for (var i = 0; i < employee.length; i++) {

            var role = employee[i].role


            if(employee[i].shift_id == undefined || employee[i].shift_id == null || employee[i].shift_id == ''){
              var shift_obj = ""
            }else{
              const select_shift_details = await ShiftModule.findById(employee[i].shift_id);

              if(!select_shift_details){
                var shift_obj = ""
              }else{
                var shift_obj = {
                  value:select_shift_details._id,
                  label:select_shift_details.shift_name,
                  from_time:select_shift_details.from_time,
                  to_time:select_shift_details.to_time,
                }
              }
            }

            var data_obj = {
              _id : employee[i]._id,
              name : employee[i].name,
              role : employee[i].role,
              shift_obj : shift_obj
            }
            dateArray.push(data_obj)

          }

          res.status(200).json({ status:true, message: "employee fetched successfully",data:dateArray});
        }else{
          return res.status(200).json({status: false, message: 'employee  not found for this role' });
        }

      } catch (error) {
        res.status(500).json({status:false, error: error.message });
      }
    };


  exports.updateEmployeeDeviceID = async (req, res) => {
      try {

        const employee_details = await Employee.findById(req.body.id);

          const updatedEmployee = await Employee.findByIdAndUpdate(
          req.body.id,
          {device_id:req.body.device_id},
          { new: true, runValidators: true });
          if (!updatedEmployee) {
            return res.status(200).json({status: false, message: 'Employee not found' });
          }

          res.json({status:true, message: 'Device ID updated successfully' });
        } catch (error) {
          console.error('Error updating employee:', error);
          res.status(500).json({ status:false,message: 'Internal server error' });
        }

    };

exports.dashboardCount = async (req, res) => {
  try {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth()+1;
    if(month < 10){
      month = "0"+month
    }
    var current_date = year+"-"+month

    const employee_details = await Employee.findById(req.body.emp_id);

    var task = await Task.find({emp_id:req.body.emp_id});

    const emp_login_hours_result = await Leave.find({emp_id:req.body.emp_id, login_time:{$ne:""}, date:{$regex: new RegExp(current_date, "i")}});

      if(!employee_details){
        var setting_count = 0
      }else{
        if(employee_details.id_proof == undefined || employee_details.id_proof == "" || employee_details.id_proof == null){
          var setting_count = 1
        }else{
          var setting_count = 0
        }
      }
      var attendance_count = emp_login_hours_result.length
      var task_count = task.length

      return res.status(200).json({status: true, message: 'Data found', task_count:task_count, attendance_count:attendance_count, setting_count:setting_count});

  } catch (error) {
    console.error('Error dashboard count:', error);
    res.status(500).json({ status:false,message: 'Internal server error' });
  }
};

// module.exports = {
//   createEmployee,
// };
