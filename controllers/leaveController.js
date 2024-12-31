const { Leave } = require("../models/leaveModel");
const { Employee, EmployeeTransfer, EmployeeSwap} = require("../models/employeeModel");

const multer = require("multer");
const createError = require("http-errors");

const io1 = require('socket.io-client')

const socket_hit = io1(process.env.APIURL+":"+process.env.PORT+"/", { transport: ['websocket'] });
// const socket_hit = io1("http://192.168.29.184:3000/", { transport: ['websocket'] });

function dateRange(startDate, endDate, steps = 1) {
  const dateArray = [];
  let currentDate = new Date(startDate);

  while (currentDate <= new Date(endDate)) {
    dateArray.push(new Date(currentDate));
    // Use UTC date to prevent problems with time zones and DST
    currentDate.setUTCDate(currentDate.getUTCDate() + steps);
  }

  return dateArray;
}



exports.fetchDisapprovedLeave = async (req, res) => {
  try {

    var date = new Date().toISOString().split("T")[0];
    var data_array = []
    var search = req.body.search

    var property_id = req.body.property_id
    var find_obj = {}
    if(property_id != undefined){
      find_obj.property_id = property_id
    }
    if(search != undefined){
      find_obj.name = {$regex: new RegExp(search, "i")}
    }

    // if(search == undefined){
    //   var find_obj = {}
    // }else{
    //   var find_obj = {name:{$regex: new RegExp(search,"i")}}
    // }
    var date = new Date()
    var assiging_date = date.getFullYear()+"-01-01";

    const emp_result = await Employee.find(find_obj);

    if(emp_result.length > 0){

      for (var j = 0; j < emp_result.length; j++) {

        var emp_id = emp_result[j]._id.toString()
        var emp_name = emp_result[j].name

        if(emp_result[j].total_paid_leave == undefined || emp_result[j].total_paid_leave == ""){
          var total_leave_given = 0
        }else{
          var total_leave_given = parseInt(emp_result[j].total_paid_leave)
        }


        const taken_leave_result = await Leave.find({emp_id:emp_id, date:{$gte:assiging_date},leave_status:"declined"});

        var total_unpaid_leaves = 0
        var total_paid_leaves = 0
        if(taken_leave_result.length > 0){
          for (var i = 0; i < taken_leave_result.length; i++) {
            if(taken_leave_result[i].leave_type == "UPL"){
              total_unpaid_leaves += 1
            }else if(taken_leave_result[i].leave_type == "PL"){
              total_paid_leaves += 1
            }
          }
        }
        if(total_leave_given == 0){
          var balance_leave = 0
        }else{
          var balance_leave = total_leave_given-total_paid_leaves
        }

        const previous_leave_result = await Leave.find({emp_id:emp_id, date:{$gte:assiging_date,$lte:date},leave_status:"declined"});
        const upcoming_leave_result = await Leave.find({emp_id:emp_id, date:{$gt:date},leave_status:"declined"});

        var previous_disapproved_leave_array = []
        if(previous_leave_result.length > 0){
          for (var i = 0; i < previous_leave_result.length; i++) {
            previous_disapproved_leave_array.push({
              leave_id:previous_leave_result[i]._id.toString(),
              date:previous_leave_result[i].date,
              leave_reason:previous_leave_result[i].leave_reason,
              leave_type:previous_leave_result[i].leave_type,
            })
          }
        }

        var upcoming_disapproved_leave_array = []
        if(upcoming_leave_result.length > 0){
          for (var i = 0; i < upcoming_leave_result.length; i++) {
            upcoming_disapproved_leave_array.push({
              leave_id:upcoming_leave_result[i]._id.toString(),
              date:upcoming_leave_result[i].date,
              leave_reason:upcoming_leave_result[i].leave_reason,
              leave_type:upcoming_leave_result[i].leave_type,
            })
          }
        }

        if(upcoming_disapproved_leave_array.length > 0 || previous_disapproved_leave_array.length > 0){
          data_array.push({emp_id:emp_id,
            emp_name:emp_name,
            previous_disapproved_leave_array:previous_disapproved_leave_array,
            upcoming_disapproved_leave_array:upcoming_disapproved_leave_array,
            total_unpaid_leaves:total_unpaid_leaves,
            total_paid_leaves:total_paid_leaves,
            balance_leave:balance_leave,
          })
        }

        if (j == emp_result.length - 1)
        {
          if(data_array.length > 0){

            res.send({
              status: true,
              message: "Data fetched successfully",
              data:data_array,
            });
          }else{
            res.send({status:false, message:"Data not found"})
          }
        }
      }

    }else{
      res.status(200).json({status:false,message:"Data not found"});
    }

  } catch (error) {
    // console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}



exports.fetchApprovedLeave = async (req, res) => {
  try {

    var date = new Date().toISOString().split("T")[0];
    var data_array = []
    var search = req.body.search

    var property_id = req.body.property_id
    var find_obj = {}
    if(property_id != undefined){
      find_obj.property_id = property_id
    }
    if(search != undefined){
      find_obj.name = {$regex: new RegExp(search, "i")}
    }

    // if(search == undefined){
    //   var find_obj = {}
    // }else{
    //   var find_obj = {name:{$regex: new RegExp(search,"i")}}
    // }


    var date = new Date()
    var assiging_date = date.getFullYear()+"-01-01";

    const emp_result = await Employee.find(find_obj);
    // console.log("emp_result",emp_result);

    if(emp_result.length > 0){

      for (var j = 0; j < emp_result.length; j++) {

        var emp_id = emp_result[j]._id.toString()
        var emp_name = emp_result[j].name

        if(emp_result[j].total_paid_leave == undefined || emp_result[j].total_paid_leave == ""){
          var total_leave_given = 0
        }else{
          var total_leave_given = parseInt(emp_result[j].total_paid_leave)
        }


        const taken_leave_result = await Leave.find({emp_id:emp_id, date:{$gte:assiging_date},leave_status:"approved"});


        var total_unpaid_leaves = 0
        var total_paid_leaves = 0
        if(taken_leave_result.length > 0){
          for (var i = 0; i < taken_leave_result.length; i++) {
            if(taken_leave_result[i].leave_type == "UPL"){
              total_unpaid_leaves += 1
            }else if(taken_leave_result[i].leave_type == "PL"){
              total_paid_leaves += 1
            }
          }
        }
        if(total_leave_given == 0){
          var balance_leave = 0
        }else{
          var balance_leave = total_leave_given-total_paid_leaves
        }

        const previous_leave_result = await Leave.find({emp_id:emp_id, date:{$gte:assiging_date,$lte:date},leave_status:"approved"});
        const upcoming_leave_result = await Leave.find({emp_id:emp_id, date:{$gt:date},leave_status:"approved"});

        var previous_disapproved_leave_array = []
        if(previous_leave_result.length > 0){
          for (var i = 0; i < previous_leave_result.length; i++) {
            previous_disapproved_leave_array.push({
              leave_id:previous_leave_result[i]._id.toString(),
              date:previous_leave_result[i].date,
              leave_reason:previous_leave_result[i].leave_reason,
              leave_type:previous_leave_result[i].leave_type,
            })
          }
        }

        var upcoming_disapproved_leave_array = []
        if(upcoming_leave_result.length > 0){
          for (var i = 0; i < upcoming_leave_result.length; i++) {
            upcoming_disapproved_leave_array.push({
              leave_id:upcoming_leave_result[i]._id.toString(),
              date:upcoming_leave_result[i].date,
              leave_reason:upcoming_leave_result[i].leave_reason,
              leave_type:upcoming_leave_result[i].leave_type,
            })
          }
        }

        if(upcoming_disapproved_leave_array.length > 0 || previous_disapproved_leave_array.length > 0){
          data_array.push({emp_id:emp_id,
            emp_name:emp_name,
            previous_leave_array:previous_disapproved_leave_array,
            upcoming_leave_array:upcoming_disapproved_leave_array,
            total_unpaid_leaves:total_unpaid_leaves,
            total_paid_leaves:total_paid_leaves,
            balance_leave:balance_leave,
          })
        }

        if (j == emp_result.length - 1)
        {
          if(data_array.length > 0){

            res.send({
              status: true,
              message: "Data fetched successfully",
              data:data_array,
            });
          }else{
            res.send({status:false, message:"Data not found"})
          }
        }
      }

    }else{
      res.status(200).json({status:false,message:"Data not found"});
    }

  } catch (error) {
    // console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


exports.approveDeclineLeave = async (req, res) => {
  try {

    var leave_array = req.body.leave_array
    var leave_status = req.body.leave_status

    if(leave_array.length > 0){

      for (var i = 0; i < leave_array.length; i++) {

        var leave_id = leave_array[i].leave_id
        var leave_type = leave_array[i].leave_type

        const updatedLeave = await Leave.findByIdAndUpdate(
        leave_id,
        {leave_status:leave_status, leave_type:leave_type},
        { new: true, runValidators: true });
      }

      socket_hit.emit("fetch_emp_leave_app_module",{data:{hitted_by:"leave function"}})

      res.status(200).json({status:true, message:"Leave data updated succesfully"});
    }else{
      res.status(200).json({status:false,message:"Please select atleast one date"});
    }
  } catch (error) {
    // console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.applyLeave = async (req, res) => {
  try {

    var emp_id = req.body.emp_id
    var start_date = req.body.start_date
    var end_date = req.body.end_date
    var is_halfday = false;
    var is_leave = true;
    var is_sick_leave = req.body.is_sick_leave
    var is_maternity_leave = req.body.is_maternity_leave
    var reason = req.body.reason
    var leave_type = ""
    if(is_maternity_leave == undefined){
      is_maternity_leave = false
    }
    var added_date = new Date().toISOString();


    if(start_date == end_date){
      var date = start_date
      const emp_login_hours_result = await Leave.find({emp_id:emp_id, date:date});

        if(emp_login_hours_result.length > 0){

          const updatedLeave = await Leave.findByIdAndUpdate(
          emp_login_hours_result[0]._id,
          {is_leave:is_leave, is_sick_leave:is_sick_leave, leave_reason:reason, leave_status:"requested", leave_type:leave_type, is_maternity_leave:is_maternity_leave, added_date:added_date},
          { new: true, runValidators: true });

        }else{

          const new_employee = await Leave.create({emp_id:emp_id, date:date, login_time:"", logout_time:"", is_halfday:is_halfday, is_leave:is_leave, is_sick_leave:is_sick_leave, leave_reason:reason, leave_status:"requested", leave_type:leave_type, is_maternity_leave:is_maternity_leave, added_date:added_date});

        }
        socket_hit.emit("fetch_requested_leave_module",{data:{hitted_by:"leave function"}})
        res.status(200).json({status:true, message:"Leave marked succesfully"});

    }else{

      var daterange = dateRange(start_date, end_date);

      for (var i = 0; i < daterange.length; i++) {
        var date = (daterange[i]).toISOString().split("T")[0]
        const new_employee = await Leave.create({emp_id:emp_id, date:date, login_time:"", logout_time:"", is_halfday:is_halfday, is_leave:is_leave, is_sick_leave:is_sick_leave, leave_reason:reason, leave_status:"requested", leave_type:leave_type, is_maternity_leave:is_maternity_leave, added_date:added_date});

      }
      socket_hit.emit("fetch_requested_leave_module",{data:{hitted_by:"leave function"}})

      res.status(200).json({status:true, message:"Leave marked succesfully"});

    }
  } catch (error) {
    // console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
