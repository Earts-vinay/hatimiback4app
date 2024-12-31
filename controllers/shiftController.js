const { Employee, EmployeeTransfer, EmployeeSwap} = require("../models/employeeModel");
const { Property } = require("../models/propertyModel");
const { Role } = require("../models/masterRoleModel");
const { ShiftModule, ShiftLog } = require("../models/shiftModel");

const multer = require("multer");
const createError = require("http-errors");


exports.createShiftModule = async (req, res) => {

  try {
    const { property_id, shift_name, from_time, to_time} = req.body;
    var added_date = new Date().toISOString();


    const result = await ShiftModule.find({ property_id:property_id, shift_name:shift_name});

    if(result.length > 0){
      res.status(200).json({status:false, message: "Shift Name already exists in this property. Please add shift with another name" });
    }else{
      const new_ShiftModule = await ShiftModule.create({
          property_id,
          shift_name,
          from_time,
          to_time,
          added_date
        });
        res.status(200).json({status:true, message: "Shift added successfully" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};



exports.updateShiftModule = async (req, res) => {
    try {

      const shift_details = await ShiftModule.findById(req.body.id);

      if (!shift_details) {
        return res.status(200).json({status: false, message: 'Shift not found' });
      }

      const updatedShift = await ShiftModule.findByIdAndUpdate(
      req.body.id,
      req.body,
      { new: true, runValidators: true });

      return res.status(200).json({status: true, message: 'Shift update successfully' });

    } catch (error) {
      console.error('Error updating shift:', error);
      res.status(500).json({ status:false,message: 'Internal server error' });
    }
};


exports.deleteShiftModule = async (req, res) => {
  try {
    const deletedShiftModule = await ShiftModule.findByIdAndDelete(req.body.id);
    if (!deletedShiftModule) {
      return res.status(200).json({status: false, message: 'Shift Module not found' });
    }
    res.json({ message: 'Shift Module deleted successfully', data: deletedShiftModule });
  } catch (error) {
    console.error('Error deleting Shift Module:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.getAllShiftModule =  async (req, res) => {
    try {

      var property_id = req.body.property_id
      var shift_array = []
      var mainArray = []
      if(property_id == undefined || property_id == ""){
        var shift = await ShiftModule.find();
      }else{
        var shift = await ShiftModule.find({property_id:property_id});
      }

      if (shift.length === 0) {
        return res.status(200).json({ status: false, message: "No shifts found" });
      }
      var interval_i = 0;


      for (var i = 0; i < shift.length; i++) {
        // setTimeout(async function (i){

          var property_id = shift[i].property_id

          const select_property_details = await Property.findById(property_id);
          if(!select_property_details){
            var property_obj = {
              value:"",
              label:""
            }
          }else{
            var property_obj = {
              value:select_property_details.property_id,
              label:select_property_details.property_name
            }
          }

          var data_obj = {
            _id:shift[i]._id,
            property_id:shift[i].property_id,
            shift_name:shift[i].shift_name,
            from_time:shift[i].from_time,
            to_time:shift[i].to_time,
            added_date:shift[i].added_date,
            property_obj:property_obj
          }
          shift_array.push(data_obj)

          if(mainArray.length > 0){

            let obj = mainArray.find(o => o.property_id === shift[i].property_id);

            if(obj == undefined || obj == null || obj == false){
              mainArray.push({
                property_id:shift[i].property_id,
                property_name:property_obj.label,
                shift_array:[data_obj]
              })
            }else{
              var index = mainArray.findIndex(x => x.property_id === shift[i].property_id);
              mainArray[index].shift_array.push(data_obj)
            }


          }else{
            mainArray.push({
              property_id:shift[i].property_id,
              property_name:property_obj.label,
              shift_array:[data_obj]
            })
          }
        // }, interval_i * i, i);
      }

      res.status(200).json({ status:true, message: "fached all shifts successfully", data:mainArray});
    } catch (error) {
      res.status(500).json({ status:false, error: error.message });
    }
};

exports.updateShiftInEmployee =  async (req, res) => {
  console.log("updateShiftInEmployee",req.body);
  try {

    const {emp_id, shift_id, property_id} = req.body
    var from_date = new Date().toISOString().split("T")[0]
    var added_date = new Date().toISOString()
    var to_date = ''


    const employee_details = await Employee.findById(emp_id);
    const shift_details = await ShiftModule.findById(shift_id);
    // var property_id = employee_details.property_id

    if(!employee_details){
      res.status(200).json({ status:false, message: "Employee not found"});
    }

    if(!shift_details){
      res.status(200).json({ status:false, message: "Shift not found"});
    }

    if(employee_details.shift_array == undefined || employee_details.shift_array == "" || employee_details.shift_array == null){
      var shift_array = [{
        shift_id:shift_id,
        property_id:property_id,
      }]
    }else{
      if(employee_details.shift_array.length > 0){
        var shift_array = employee_details.shift_array
        let obj = shift_array.find(o => o.property_id === property_id);

        if(obj == undefined || obj == false || obj == null || obj == ""){
          shift_array.push({
            shift_id:shift_id,
            property_id:property_id
          })
        }else{
          for (var i = 0; i < shift_array.length; i++) {
            if(shift_array[i].property_id == property_id){
              var previous_shift_id = shift_array[i].shift_id
              shift_array[i].shift_id = shift_id
            }
          }
        }
      }else{
        var shift_array = [{
          shift_id:shift_id,
          property_id:property_id,
        }]
      }
    }

    var updateEmployee = await Employee.findByIdAndUpdate(
      emp_id,
      { shift_id:shift_id, shift_array:shift_array},
      { new: true, runValidators: true }
    );

    const new_ShiftLog = await ShiftLog.create({
        property_id,
        shift_id,
        emp_id,
        from_date,
        to_date,
        added_date,
      });

    if(previous_shift_id != undefined || previous_shift_id != "" || previous_shift_id != null){

      const shift_log_details = await ShiftLog.find({shift_id:previous_shift_id, to_date:""}).sort({_id:-1}).limit(1);
      if(shift_log_details.length > 0){
        const updatedShift = await ShiftLog.findByIdAndUpdate(
        shift_log_details[0]._id,
        {to_date:from_date},
        { new: true, runValidators: true });
      }

    }

    res.status(200).json({ status:true, message: "Shift update successfully"});

  } catch (error) {
    res.status(500).json({ status:false, error: error.message });
  }
};


exports.fetchShiftLog =  async (req, res) => {
  try {

    var mainArray = []
    if(req.body.property_id == undefined || req.body.property_id == ""){
      var shiftLog = await ShiftLog.find();
    }else{
      var shiftLog = await ShiftLog.find({property_id:req.body.property_id});
    }

    if(shiftLog.length > 0){

      for (var i = 0; i < shiftLog.length; i++) {
        var shift_id = shiftLog[i].shift_id
        var property_id = shiftLog[i].property_id
        var emp_id = shiftLog[i].emp_id

        const shift_details = await ShiftModule.findById(shift_id);
        if(!shift_details){
          var shift_obj = {
            value:"",
            label:"",
            from_time:"",
            to_time:"",
          }
        }else{
          var shift_obj = {
            value:shift_details._id,
            label:shift_details.shift_name,
            from_time:shift_details.from_time,
            to_time:shift_details.to_time,
          }
        }

        const select_property_details = await Property.findById(property_id);
        if(!select_property_details){
          var property_obj = {
            value:"",
            label:""
          }
        }else{
          var property_obj = {
            value:select_property_details._id,
            label:select_property_details.property_name
          }
        }

        const select_employee_details = await Employee.findById(emp_id);
        if(!select_employee_details){
          var employee_obj = {
            value:"",
            label:""
          }
        }else{
          var employee_obj = {
            value:select_employee_details._id,
            label:select_employee_details.name
          }
        }

        var obj = {
          _id:shiftLog[i]._id,
          shift_id:shiftLog[i].shift_id,
          property_id:shiftLog[i].property_id,
          emp_id:shiftLog[i].emp_id,
          from_date:shiftLog[i].from_date,
          to_date:shiftLog[i].to_date,
          added_date:shiftLog[i].added_date,
          employee_obj:employee_obj,
          property_obj:property_obj,
          shift_obj:shift_obj,
        }
        mainArray.push(obj)
      }
      res.status(200).json({ status:true, message: "Shift log fetched successfully", data:mainArray});
    }else{
      res.status(200).json({ status:false, message: "Shift log not available"});

    }

  } catch (error) {
    res.status(500).json({ status:false, error: error.message });
  }
};
