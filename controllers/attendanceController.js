const { Leave } = require("../models/leaveModel");
const { Employee, EmployeeTransfer, EmployeeSwap} = require("../models/employeeModel");
var jsonexport = require('jsonexport');
const fs = require('fs');

const multer = require("multer");
const createError = require("http-errors");

const io1 = require('socket.io-client')
const socket_hit = io1(process.env.APIURL+":"+process.env.PORT+"/", { transport: ['websocket'] });

function sundaysInMonth( m, y ) {
  var days = new Date( y,m,0 ).getDate();
  var sundays = [ (8 - (new Date( m +'/01/'+ y ).getDay())) % 7 ];
  for ( var i = sundays[0] + 7; i < days; i += 7 ) {
    sundays.push( i );
  }
  return sundays;
}

function daysInYear(year) {
    return ((year % 4 === 0 && year % 100 > 0) || year %400 == 0) ? 366 : 365;
}

function hour_min_calculation(start,end){

  var date1 = new Date(start);
  var date2 = new Date(end);

  var diff = date2.getTime() - date1.getTime();

  var msec = diff;
  var hh = Math.floor(msec / 1000 / 60 / 60);
  msec -= hh * 1000 * 60 * 60;
  var mm = Math.floor(msec / 1000 / 60);
  msec -= mm * 1000 * 60;
  var ss = Math.floor(msec / 1000);
  msec -= ss * 1000;

  // console.log(hh + ":" + mm + ":" + ss);
  if(hh <= 1){
    var hour = "hour"
  }else{
    var hour = "hours"
  }
  if(mm <= 1){
    var minute = "minute"
  }else{
    var minute = "minutes"
  }

  if(hh < 10){
    hh = "0"+hh
  }
  if(mm < 10){
    mm = "0"+mm
  }
  if(ss < 10){
    ss = "0"+ss
  }
  var date_time = hh+":"+mm

  return date_time;
}


exports.empLoginAdmin = async (req, res) => {
  try {

    var emp_id = req.body.emp_id
    var date = req.body.date
    var login_time = req.body.login_time
    var logout_time = req.body.logout_time
    var is_halfday = false;
    var is_leave = false;
    var is_sick_leave = false;
    var added_date = new Date().toISOString();


    const emp_login_hours_result = await Leave.find({ emp_id: emp_id, date: date });

    // db.collection("emp_login_hours").find({ emp_id: emp_id, date: date }, function (err, emp_login_hours_result) {
      if (emp_login_hours_result.length == 0) {

        if ((login_time !== undefined && login_time !== "") && (logout_time !== undefined && logout_time !== "")) {

          const new_employee = await Leave.create({
              emp_id:emp_id,
              date:date,
              login_time:login_time,
              logout_time:logout_time,
              is_halfday:is_halfday,
              is_leave:is_leave,
              is_sick_leave:is_sick_leave,
              leave_reason:"",
              leave_status:"",
              leave_type:"",
              is_maternity_leave:false,
              added_date:added_date
            });

          // db.collection("emp_login_hours").insert({ emp_id: emp_id, date: date, login_time: login_time, logout_time: logout_time, is_halfday: is_halfday, is_leave: is_leave, is_sick_leave: is_sick_leave, leave_reason: "", leave_status: "", leave_type: "", is_maternity_leave: false }, function (err, results) {
            socket_hit.emit("fetch_emp_attendance_app_module",{data:{hitted_by:"fetch attendance function"}})

            res.status(200).json({ status: true, message: "Log-In successfully" });

          // });
        }

        else if ((login_time !== undefined && login_time !== "") && (logout_time === undefined || logout_time === "")) {


          const new_employee = await Leave.create({
              emp_id:emp_id,
              date:date,
              login_time:login_time,
              logout_time:logout_time,
              is_halfday:is_halfday,
              is_leave:is_leave,
              is_sick_leave:is_sick_leave,
              leave_reason:"",
              leave_status:"",
              leave_type:"",
              is_maternity_leave:false,
              added_date:added_date
            });

          // db.collection("emp_login_hours").insert({ emp_id: emp_id, date: date, login_time: login_time, logout_time: logout_time, is_halfday: is_halfday, is_leave: is_leave, is_sick_leave: is_sick_leave, leave_reason: "", leave_status: "", leave_type: "", is_maternity_leave: false }, function (err, results) {
            socket_hit.emit("fetch_emp_attendance_app_module",{data:{hitted_by:"fetch attendance function"}})

            res.status(200).json({ status: true, message: "Log-In successfully" });

          // });
        }

        else if ((login_time == "" || login_time == undefined) && (logout_time != "" && logout_time != undefined)) {
          // res.send({ status: false, message: "Please add Punch-In time First" });
          res.status(200).json({ status: false, message: "Please add Punch-In time First" });

        }

        else if ((login_time == "" || login_time == undefined) && (logout_time == "" || logout_time == undefined)) {
          // res.send({ status: false, message: "Please add Punch-In time" });
          res.status(200).json({ status: false, message: "Please add Punch-In time First" });

        }

      } else {
        var new_emp_id = emp_login_hours_result[0]._id.toString()
        var obj = {}
        obj.is_halfday = is_halfday;
        obj.is_leave = is_leave;
        obj.is_sick_leave = is_sick_leave;
        obj.leave_reason = "";
        obj.halfday_reason = "";
        obj.leave_status = "";
        obj.leave_type = "";
        obj.is_maternity_leave = false;

        if (login_time != undefined && login_time != "") {
          obj.login_time = login_time
        } else {
          obj.login_time = emp_login_hours_result[0].login_time
        }
        if (logout_time != undefined && logout_time != "") {
          obj.logout_time = logout_time
        } else {
          obj.logout_time = emp_login_hours_result[0].logout_time
        }
        // console.log("obj ==", obj);

        const updatedLeave = await Leave.findByIdAndUpdate(
        new_emp_id,
        obj,
        { new: true, runValidators: true });

        // db.collection("emp_login_hours").update({ _id: ObjectID(new_emp_id) }, { $set: obj }, function (err, results) {
          socket_hit.emit("fetch_emp_attendance_app_module",{data:{hitted_by:"fetch attendance function"}})

          res.status(200).json({ status: true, message: "Update succesfully" });
        // })
      }
    // })

  } catch (error) {
    // console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.markHalfdayAdmin = async (req, res) => {
  try {

    var emp_id = req.body.emp_id
    var date = req.body.date
    var reason = req.body.reason
    var is_halfday = true;
    var is_leave = false;
    var is_sick_leave = false;
    var added_date = new Date().toISOString();


    const emp_login_hours_result = await Leave.find({ emp_id: emp_id, date: date });

    if(emp_login_hours_result.length > 0){

      const updatedLeave = await Leave.findByIdAndUpdate(
      emp_login_hours_result[0]._id,
      {
        is_halfday:is_halfday,
        is_leave:is_leave,
        is_sick_leave:is_sick_leave,
        halfday_reason:reason,
        leave_reason:"",
      },
      { new: true, runValidators: true });
      res.status(200).json({status:true, message:"Halfday marked succesfully"});


      // db.collection('emp_login_hours').update({_id:ObjectID(emp_login_hours_result[0]._id)},{$set:{is_halfday:is_halfday,is_leave:is_leave, is_sick_leave:is_sick_leave, halfday_reason:reason, leave_reason :""}}, function(err, update_result){
      //   res.send({status:true, message:"Halfday marked succesfully"})
      // })
    }else{

      const new_employee = await Leave.create({
          emp_id:emp_id,
          date:date,
          login_time:"",
          logout_time:"",
          is_halfday:is_halfday,
          is_leave:is_leave,
          is_sick_leave:is_sick_leave,
          halfday_reason:reason,
          leave_reason:"",
          leave_status:"",
          leave_type:"",
          is_maternity_leave:false,
          added_date:added_date
        });
        res.status(200).json({status:true, message:"Halfday marked succesfully"});

    }

    socket_hit.emit("fetch_emp_attendance_app_module",{data:{hitted_by:"fetch attendance function"}})



  } catch (error) {
    // console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}



exports.markLeaveAdmin = async (req, res) => {
  try {

    var emp_id = req.body.emp_id
    var date = req.body.date
    var is_halfday = false;
    var is_leave = true;
    var is_sick_leave = req.body.is_sick_leave
    var reason = req.body.reason
    var leave_type = req.body.leave_type
    var added_date = new Date().toISOString();


    const emp_login_hours_result = await Leave.find({ emp_id: emp_id, date: date });

    if(emp_login_hours_result.length > 0){

      const updatedLeave = await Leave.findByIdAndUpdate(
      emp_login_hours_result[0]._id,
      {is_halfday:is_halfday,login_time:"", logout_time:"",is_leave:is_leave, is_sick_leave:is_sick_leave,halfday_reason:"", leave_reason:reason, leave_status:"approved", leave_type:leave_type},
      { new: true, runValidators: true });
      res.status(200).json({status:true, message:"Leave marked succesfully"});

    }else{

      const new_employee = await Leave.create({emp_id:emp_id, date:date, leave_start_date:date, leave_end_date:date, login_time:"", logout_time:"", is_halfday:is_halfday,halfday_reason:"", is_leave:is_leave, is_sick_leave:is_sick_leave, leave_reason:reason, leave_status:"approved", leave_type:leave_type,added_date:added_date});
      res.status(200).json({status:true, message:"Halfday marked succesfully"});

    }
    socket_hit.emit("fetch_emp_attendance_app_module",{data:{hitted_by:"fetch attendance function"}})

  } catch (error) {
    // console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.fetchBalancePaidLeave = async (req, res) => {
  try {

    var date = new Date()
    var assiging_date = date.getFullYear()+"-01-01";
    var emp_id = req.body.emp_id
    var balance_paid_leave = 0

    const employee_details = await Employee.findById(emp_id);

    if(employee_details.total_paid_leave == undefined || employee_details.total_paid_leave == ""){
      var total_leave_given = 0
    }else{
      var total_leave_given = parseInt(employee_details.total_paid_leave)
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
    res.status(200).json({status:true, message:"Leave fetched", balance_leave:balance_leave});


  } catch (error) {
    // console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.empLogin = async (req, res) => {
  try {

    var emp_id = req.body.emp_id
    var date = req.body.date
    var login_time = req.body.login_time
    var is_halfday = false;
    var is_leave = false;
    var is_sick_leave = false;
    var added_date = new Date().toISOString();


    const emp_login_hours_result = await Leave.find({emp_id:emp_id, date:date});

    if(emp_login_hours_result.length == 0){

      const new_employee = await Leave.create({emp_id:emp_id, date:date, login_time:login_time, is_halfday:is_halfday, is_leave:is_leave, is_sick_leave:is_sick_leave,added_date:added_date});

      socket_hit.emit("attendance_list_admin_module",{data:{hitted_by:"attendance function"}})
      res.status(200).json({status:true, message:"Log-In succesfully"});

    }else{
      if(emp_login_hours_result[0].login_time == ''){

        const updatedLeave = await Leave.findByIdAndUpdate(
        emp_login_hours_result[0]._id,
        {login_time:login_time, is_halfday:is_halfday, is_leave:is_leave, is_sick_leave:is_sick_leave, leave_reason:"", leave_status:"", leave_type:"", halfday_reason:""},
        { new: true, runValidators: true });


        socket_hit.emit("attendance_list_admin_module",{data:{hitted_by:"attendance function"}})
        res.status(200).json({status:true, message:"Log-In succesfully"});

      }else{

        res.status(200).json({status:false, message:"Already login for this date"});
      }

    }

  } catch (error) {
    // console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.empLogout = async (req, res) => {
  try {

    var emp_id = req.body.emp_id
    var date = req.body.date
    var logout_time = req.body.logout_time

    const emp_login_hours_result = await Leave.find({emp_id:emp_id, date:date});

    if(emp_login_hours_result.length > 0){


      const updatedLeave = await Leave.findByIdAndUpdate(
      emp_login_hours_result[0]._id,
      {logout_time:logout_time},
      { new: true, runValidators: true });

      socket_hit.emit("attendance_list_admin_module",{data:{hitted_by:"attendance function"}})
      res.status(200).json({status:true, message:"Log-Out succesfully"});

    }else{
      res.status(200).json({status:false, message:"Please first login for this date"});

    }

  } catch (error) {
    // console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.fetchEmpLoginTiming = async (req, res) => {
  try {
    var emp_id = req.body.emp_id
    var date = req.body.date

    const emp_login_hours_result = await Leave.find({emp_id:emp_id, date:date});

    if(emp_login_hours_result.length > 0){

      var login_time = emp_login_hours_result[0].login_time
      if(emp_login_hours_result[0].logout_time == undefined || emp_login_hours_result[0].logout_time == "" || emp_login_hours_result[0].logout_time == null){
        var total_working_hour = ""
        var logout_time = ""
      }else {
        if(emp_login_hours_result[0].login_time != undefined && emp_login_hours_result[0].login_time != "" && emp_login_hours_result[0].login_time != null && emp_login_hours_result[0].logout_time != undefined && emp_login_hours_result[0].logout_time != "" && emp_login_hours_result[0].logout_time != null){
          var logout_time = emp_login_hours_result[0].logout_time
          var total_working_hour = hour_min_calculation(new Date(date+" "+emp_login_hours_result[0].login_time),new Date(date+" "+emp_login_hours_result[0].logout_time))
        }else {
          var total_working_hour = ""
          var logout_time = ""
        }
      }
    }else{
      var login_time = ""
      var logout_time = ""
      var total_working_hour = ""
    }
    res.status(200).json({status:true, message:"Data fetched succesfully", login_time:login_time, logout_time:logout_time, total_working_hour:total_working_hour});

  } catch (error) {
    // console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


exports.fetchMasterRoll = async (req, res) => {
  try {
    var emp_id = req.body.emp_id
    var sorting_date = req.body.sorting_date

    var date_array = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]
    var data_array = []
    const weekday = ["S","M","T","W","T","F","S"];
    const getDays = (year, month) => new Date(year, month, 0).getDate()
    var daysInCurrentMonth=new Date(new Date(sorting_date).getFullYear(), new Date(sorting_date).getMonth() + 1, 0).getDate()

    const employee_details = await Employee.findById(emp_id);

    if(!employee_details){
      res.status(200).json({status:false, message: 'Employee not found' });
    }
    var emp_name = employee_details.name

    const emp_login_result = await Leave.find({emp_id:emp_id, date:{$regex: new RegExp(sorting_date, "i")}});
    var holiday_result = []

    var month_array = []
    var present_count = 0
    var absent_count = 0
    var halfday_count = 0
    var paid_leave_count = 0
    var unmarked_count = 0

    if(emp_login_result.length > 0){
      for (var i = 0; i < date_array.length; i++) {
        if(i < 9){
          var get_date = "0"+date_array[i]
        }else{
          var get_date = date_array[i]
        }
        var date = sorting_date+"-"+get_date
        const d = new Date(date);
        let day = d.getDay();


        let obj = emp_login_result.find(o => o.date === date);
        let holiday_obj = holiday_result.find(o => o.holiday_date === date);
        // console.log("obj=========",obj);
        if(obj == undefined){
          if(holiday_obj == undefined){
            unmarked_count +=1
            var marked = "-"
          }else{
            var marked = "H"
          }

          var data_obj = {
            date:date_array[i],
            day:weekday[day],
            marked:marked,
            total_working_hour:"-",
          }
          month_array[i] = data_obj

        }else{

          if(obj.is_halfday == true){
            halfday_count += 1
          }

          if(obj.leave_type == "PL"){
            paid_leave_count += 1
          }

          if(obj.is_leave == true && obj.leave_status == "approved"){
            var marked = "A"
            var total_working_hour = "-"
            absent_count += 1
          }else if(obj.is_leave == true && (obj.leave_status == "disapproved" ||  obj.leave_status == "declined")){
            var marked = "-"
            var total_working_hour = "-"
          }else if(obj.is_leave == true && obj.leave_status == "requested" ){
            var marked = "-"
            var total_working_hour = "-"
          }else {
            if(obj.is_halfday == true){
              var marked = "HD"
            }else{
              var marked = "P"
            }
            present_count += 1
            if(obj.logout_time == undefined || obj.logout_time == "" || obj.logout_time == null){
              var total_working_hour = ""
            }else {
              if(obj.login_time != undefined && obj.login_time != "" && obj.login_time != null && obj.logout_time != undefined && obj.logout_time != "" && obj.logout_time != null){
                var total_working_hour = hour_min_calculation(new Date(date+" "+obj.login_time),new Date(date+" "+obj.logout_time))
              }else {
                var total_working_hour = ""
              }
            }
          }


          var data_obj = {
            date:date_array[i],
            day:weekday[day],
            marked:marked,
            total_working_hour:total_working_hour,
          }
          month_array[i] = data_obj
        }
      }
    }else{
      for (var i = 0; i < date_array.length; i++) {
        if(i < 9){
          var get_date = "0"+date_array[i]
        }else{
          var get_date = date_array[i]
        }
        var date = sorting_date+"-"+get_date

        let holiday_obj = holiday_result.find(o => o.holiday_date === date);
        // console.log("obj=========",obj);

        if(holiday_obj == undefined){
          unmarked_count +=1
          var marked = "-"
          var total_working_hour = "-"
        }else{
          var marked = "H"
          var total_working_hour = ""
        }

        const d = new Date(date);
        let day = d.getDay();
        var obj = {
          date:date_array[i],
          day:weekday[day],
          marked:marked,
          total_working_hour:total_working_hour,
        }
        month_array[i] = obj
      }
      // unmarked_count +=1
    }

    data_array.push({
      emp_name:emp_name,
      emp_id:emp_id,
      month_array:month_array,
      present_count:present_count,
      absent_count:absent_count,
      halfday_count:halfday_count,
      paid_leave_count:paid_leave_count,
      unmarked_count:daysInCurrentMonth-(present_count+absent_count),
    })

    res.status(200).json({status:true, message: 'Data fetched successfully', data:data_array});

  } catch (error) {
    // console.error('Error deleting employee:', error);
    res.status(500).json({ message: error.message });
  }
}

exports.fetchMasterRollNew = async (req, res) => {
  try {
    var emp_id = req.body.emp_id
    // var sorting_date = req.body.sorting_date
    var year = req.body.year
    var year_array = [
      {
        start_date: year+"-01",
        end_date: year+"-01",
      },{
        start_date: year+"-02",
        end_date: year+"-02",
      },{
        start_date: year+"-03",
        end_date: year+"-03",
      },{
        start_date: year+"-04",
        end_date: year+"-04",
      },{
        start_date: year+"-05",
        end_date: year+"-05",
      },{
        start_date: year+"-06",
        end_date: year+"-06",
      },{
        start_date: year+"-07",
        end_date: year+"-07",
      },{
        start_date: year+"-08",
        end_date: year+"-08",
      },{
        start_date: year+"-09",
        end_date: year+"-09",
      },{
        start_date: year+"-10",
        end_date: year+"-10",
      },{
        start_date: year+"-11",
        end_date: year+"-11",
      },{
        start_date: year+"-12",
        end_date: year+"-12",
      }
    ]

    var current_date = new Date()
    var today_date = new Date().toISOString().split("T")[0]
    var current_month = current_date.getMonth()+1
    var present_count = 0
    var absent_count = 0
    var halfday_count = 0
    var paid_leave_count = 0
    var unmarked_count = 0
    var total_sundays = 0
    var total_holidays = 0
    var date_array = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]
    var data_array = []
    const weekday = ["S","M","T","W","T","F","S"];

    const employee_details = await Employee.findById(emp_id);

    // console.log("employee_details",employee_details);

    if(!employee_details){
      res.status(200).json({status:false, message: 'Employee not found' });
    }else{
      var emp_name = employee_details.name

      if(year_array.length > 0){
        var userlength = year_array.length;
          for (var nm = 0; nm < year_array.length; nm++) {
          // year_array[nm]
        // }
        // async.eachSeries(year_array, async function (each_result, next) {
          var index_user = nm;

          var start_date = year_array[nm].start_date
          var end_date = year_array[nm].end_date

          const emp_login_result = await Leave.find({emp_id:emp_id, date:{$regex: new RegExp(start_date, "i")}});
          var holiday_result = []

          var month_array = []

          var mon_aa = new Date(start_date)
          var mon_bb = mon_aa.getMonth()+1
          var year_bb = mon_aa.getFullYear()
          total_sundays += sundaysInMonth(mon_bb, year_bb).length
          // console.log("total_sundays",total_sundays);

          if(emp_login_result.length > 0){
            for (var i = 0; i < date_array.length; i++) {
              if(i < 9){
                var get_date = "0"+date_array[i]
              }else{
                var get_date = date_array[i]
              }
              var date = start_date+"-"+get_date
              const d = new Date(date);
              let day = d.getDay();


              let obj = emp_login_result.find(o => o.date === date);
              let holiday_obj = holiday_result.find(o => o.holiday_date === date);
              // console.log("obj=========",obj);
              if(obj == undefined){
                if(holiday_obj == undefined){
                  unmarked_count +=1
                  if(date > today_date){
                    var marked = ""
                  }else{
                    var marked = "-"
                  }
                }else{
                  var marked = "H"
                  total_holidays += 1
                }

                var data_obj = {
                  date:date_array[i],
                  day:weekday[day],
                  marked:marked,
                  total_working_hour:"-",
                }
                month_array[i] = data_obj

              }else{

                if(obj.is_halfday == true){
                  halfday_count += 1
                }

                if(obj.leave_type == "PL"){
                  paid_leave_count += 1
                }

                if(obj.is_leave == true && obj.leave_status == "approved"){
                  var marked = "A"
                  var total_working_hour = "-"
                  absent_count += 1
                }else {
                  if(obj.is_halfday == true){
                    var marked = "HD"
                  }else{
                    var marked = "P"
                  }
                  present_count += 1
                  if(obj.logout_time == undefined || obj.logout_time == "" || obj.logout_time == null){
                    var total_working_hour = ""
                  }else {
                    if(obj.login_time != undefined && obj.login_time != "" && obj.login_time != null && obj.logout_time != undefined && obj.logout_time != "" && obj.logout_time != null){
                      var total_working_hour = hour_min_calculation(new Date(date+" "+obj.login_time),new Date(date+" "+obj.logout_time))
                    }else {
                      var total_working_hour = ""
                    }
                  }
                }


                var data_obj = {
                  date:date_array[i],
                  day:weekday[day],
                  marked:marked,
                  total_working_hour:total_working_hour,
                }
                month_array[i] = data_obj
              }
            }
          }else{
            for (var i = 0; i < date_array.length; i++) {
              if(i < 9){
                var get_date = "0"+date_array[i]
              }else{
                var get_date = date_array[i]
              }
              var date = start_date+"-"+get_date
              const d = new Date(date);
              var compare_month = d.toISOString().split("T")[0]
              // console.log("compare_month===========",compare_month);
              // console.log("current_month===========",current_month);
              let day = d.getDay();

              if(compare_month > today_date){
                var marked = ""
                var total_working_hour = ""
              }else{
                var marked = "A"
                var total_working_hour = "-"
              }
              var obj = {
                date:date_array[i],
                day:weekday[day],
                marked:marked,
                total_working_hour:total_working_hour,
              }
              month_array[i] = obj
            }
            unmarked_count +=1
          }

          data_array.push({
            start_date:start_date,
            end_date:end_date,
            month_array:month_array,
          })


          // next();
          if(index_user == userlength - 1) {

            var days_in_year = daysInYear(parseInt(year))
            var data = [{
              present_count:present_count,
              absent_count:absent_count,
              halfday_count:halfday_count,
              paid_leave_count:paid_leave_count,
              unmarked_count:days_in_year-(present_count+absent_count)-(total_sundays+total_holidays),
              all_months:data_array,
            }]



            res.status(200).json({status:true, message: 'Data fetched successfully', data:data});

          }
        }
        // })
      }

    }


    // var month_array = []
    // var present_count = 0
    // var absent_count = 0
    // var halfday_count = 0
    // var paid_leave_count = 0
    // var unmarked_count = 0
    //
    // if(emp_login_result.length > 0){
    //   for (var i = 0; i < date_array.length; i++) {
    //     if(i < 9){
    //       var get_date = "0"+date_array[i]
    //     }else{
    //       var get_date = date_array[i]
    //     }
    //     var date = sorting_date+"-"+get_date
    //     const d = new Date(date);
    //     let day = d.getDay();
    //
    //
    //     let obj = emp_login_result.find(o => o.date === date);
    //     let holiday_obj = holiday_result.find(o => o.holiday_date === date);
    //     // console.log("obj=========",obj);
    //     if(obj == undefined){
    //       if(holiday_obj == undefined){
    //         unmarked_count +=1
    //         var marked = "-"
    //       }else{
    //         var marked = "H"
    //       }
    //
    //       var data_obj = {
    //         date:date_array[i],
    //         day:weekday[day],
    //         marked:marked,
    //         total_working_hour:"-",
    //       }
    //       month_array[i] = data_obj
    //
    //     }else{
    //
    //       if(obj.is_halfday == true){
    //         halfday_count += 1
    //       }
    //
    //       if(obj.leave_type == "PL"){
    //         paid_leave_count += 1
    //       }
    //
    //       if(obj.is_leave == true && obj.leave_status == "approved"){
    //         var marked = "A"
    //         var total_working_hour = "-"
    //         absent_count += 1
    //       }else if(obj.is_leave == true && (obj.leave_status == "disapproved" ||  obj.leave_status == "declined")){
    //         var marked = "-"
    //         var total_working_hour = "-"
    //       }else if(obj.is_leave == true && obj.leave_status == "requested" ){
    //         var marked = "-"
    //         var total_working_hour = "-"
    //       }else {
    //         if(obj.is_halfday == true){
    //           var marked = "HD"
    //         }else{
    //           var marked = "P"
    //         }
    //         present_count += 1
    //         if(obj.logout_time == undefined || obj.logout_time == "" || obj.logout_time == null){
    //           var total_working_hour = ""
    //         }else {
    //           if(obj.login_time != undefined && obj.login_time != "" && obj.login_time != null && obj.logout_time != undefined && obj.logout_time != "" && obj.logout_time != null){
    //             var total_working_hour = hour_min_calculation(new Date(date+" "+obj.login_time),new Date(date+" "+obj.logout_time))
    //           }else {
    //             var total_working_hour = ""
    //           }
    //         }
    //       }
    //
    //
    //       var data_obj = {
    //         date:date_array[i],
    //         day:weekday[day],
    //         marked:marked,
    //         total_working_hour:total_working_hour,
    //       }
    //       month_array[i] = data_obj
    //     }
    //   }
    // }else{
    //   for (var i = 0; i < date_array.length; i++) {
    //     if(i < 9){
    //       var get_date = "0"+date_array[i]
    //     }else{
    //       var get_date = date_array[i]
    //     }
    //     var date = sorting_date+"-"+get_date
    //
    //     let holiday_obj = holiday_result.find(o => o.holiday_date === date);
    //     // console.log("obj=========",obj);
    //
    //     if(holiday_obj == undefined){
    //       unmarked_count +=1
    //       var marked = "-"
    //       var total_working_hour = "-"
    //     }else{
    //       var marked = "H"
    //       var total_working_hour = ""
    //     }
    //
    //     const d = new Date(date);
    //     let day = d.getDay();
    //     var obj = {
    //       date:date_array[i],
    //       day:weekday[day],
    //       marked:marked,
    //       total_working_hour:total_working_hour,
    //     }
    //     month_array[i] = obj
    //   }
    //   // unmarked_count +=1
    // }
    //
    // data_array.push({
    //   emp_name:emp_name,
    //   emp_id:emp_id,
    //   month_array:month_array,
    //   present_count:present_count,
    //   absent_count:absent_count,
    //   halfday_count:halfday_count,
    //   paid_leave_count:paid_leave_count,
    //   unmarked_count:daysInCurrentMonth-(present_count+absent_count),
    // })
    //
    // res.status(200).json({status:true, message: 'Data fetched successfully', data:data_array});

  } catch (error) {
    // console.error('Error deleting employee:', error);
    res.status(500).json({ message: error.message });
  }
}

exports.exportMasterRollNew = async (req, res) => {
  try {
    var emp_id = req.body.emp_id
    var year = req.body.year
    var year_array = [
      {
        start_date: year+"-01",
        end_date: year+"-01",
        month_name:"January",
        year:year,
      },{
        start_date: year+"-02",
        end_date: year+"-02",
        month_name:"February",
        year:year,
      },{
        start_date: year+"-03",
        end_date: year+"-03",
        month_name:"March",
        year:year,
      },{
        start_date: year+"-04",
        end_date: year+"-04",
        month_name:"April",
        year:year,
      },{
        start_date: year+"-05",
        end_date: year+"-05",
        month_name:"May",
        year:year,
      },{
        start_date: year+"-06",
        end_date: year+"-06",
        month_name:"June",
        year:year,
      },{
        start_date: year+"-07",
        end_date: year+"-07",
        month_name:"July",
        year:year,
      },{
        start_date: year+"-08",
        end_date: year+"-08",
        month_name:"August",
        year:year,
      },{
        start_date: year+"-09",
        end_date: year+"-09",
        month_name:"September",
        year:year,
      },{
        start_date: year+"-10",
        end_date: year+"-10",
        month_name:"October",
        year:year,
      },{
        start_date: year+"-11",
        end_date: year+"-11",
        month_name:"November",
        year:year,
      },{
        start_date: year+"-12",
        end_date: year+"-12",
        month_name:"December",
        year:year,
      }
    ]

    var current_date = new Date()
    var today_date = new Date().toISOString().split("T")[0]
    var current_month = current_date.getMonth()+1

    var date_array = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]
    var data_array = []
    const weekday = ["S","M","T","W","T","F","S"];

    const employee_details = await Employee.findById(emp_id);

    if(!employee_details){
      res.status(200).json({status:false, message: 'Employee not found' });
    }else{
      var emp_name = employee_details.name

      if(year_array.length > 0){
        var userlength = year_array.length;
          for (var nm = 0; nm < year_array.length; nm++) {

          var index_user = nm;

          var start_date = year_array[nm].start_date
          var end_date = year_array[nm].end_date
          var month_name = year_array[nm].month_name
          var year = year_array[nm].year

          const emp_login_result = await Leave.find({emp_id:emp_id, date:{$regex: new RegExp(start_date, "i")}});
          var holiday_result = []

          var month_array = []
          var single_obj = {
            "month" : month_name,
            "year" : year
          }
          // single_obj.Month = month_name
          // single_obj.Year = year

          for (var i = 0; i < date_array.length; i++) {
            var obj_key = (date_array[i]).toString()
            if(emp_login_result.length > 0){

              if(i < 9){
                var get_date = "0"+date_array[i]
              }else{
                var get_date = date_array[i]
              }
              var date = start_date+"-"+get_date
              const d = new Date(date);
              let day = d.getDay();


              let obj = emp_login_result.find(o => o.date === date);
              let holiday_obj = holiday_result.find(o => o.holiday_date === date);
              // console.log("obj=========",obj);
              if(obj == undefined){
                if(holiday_obj == undefined){
                  if(date > today_date){
                    var marked = ""
                  }else{
                    var marked = "-"
                  }
                }else{
                  var marked = "H"
                }

              }else{

                if(obj.is_leave == true && obj.leave_status == "approved"){
                  var marked = "A"
                }else {
                  if(obj.is_halfday == true){
                    var marked = "HD"
                  }else{
                    var marked = "P"
                  }
                }
              }
            }else{
              if(i < 9){
                var get_date = "0"+date_array[i]
              }else{
                var get_date = date_array[i]
              }
              var date = start_date+"-"+get_date
              const d = new Date(date);
              var compare_month = d.toISOString().split("T")[0]
              let day = d.getDay();

              if(compare_month > today_date){
                var marked = ""
                var total_working_hour = ""
              }else{
                var marked = "A"
                var total_working_hour = "-"
              }
            }
            single_obj[obj_key] = marked
          }
          data_array.push(single_obj)

          // if(index_user == userlength - 1) {
          //
          //   console.log("data_array",data_array);
          //
          //   let yourDate = new Date()
          //   var date = yourDate.toISOString().split('T')[0]
          //   var time = yourDate.toLocaleTimeString();
          //   var file_name = emp_name+" "+year+" master_roll_report.csv"
          //
          //   var csv_path = "public/reports/"+file_name;
          //   var csv_path_url = process.env.EXPORTURL+"/public/reports/"+file_name;
          //
          //   jsonexport(data_array,function(err, csv){
          //     fs.writeFile(csv_path, csv, function(err) {
          //       if(err) {}
          //       // console.log("errr",err);
          //       // console.log("csv generated");
          //       // res.send({
          //       //       status: true,
          //       //       message: "Csv generated sucessfully",
          //       //       path:export_path+csv_path_name
          //       //   });
          //       res.status(200).json({status:true, message: 'Csv generated sucessfully', path:csv_path_url});
          //     });
          //   });
          //
          //
          //   // res.status(200).json({status:true, message: 'Data fetched successfully', data:data_array});
          //
          // }
        }
        console.log("data_array",data_array);
          let yourDate = new Date()
          var date = yourDate.toISOString().split('T')[0]
          var time = yourDate.toLocaleTimeString();
          var file_name = emp_name+" "+year+" master_roll_report.csv"

          var csv_path = "public/reports/"+file_name;
          var csv_path_url = process.env.EXPORTURL+"/public/reports/"+file_name;

          jsonexport(data_array,function(err, csv){
            fs.writeFile(csv_path, csv, function(err) {
              if(err) {}
              // console.log("errr",err);
              // console.log("csv generated");
              // res.send({
              //       status: true,
              //       message: "Csv generated sucessfully",
              //       path:export_path+csv_path_name
              //   });
              res.status(200).json({status:true, message: 'Csv generated sucessfully', path:csv_path_url});
            });
          });


          // res.status(200).json({status:true, message: 'Data fetched successfully', data:data_array});

      }
    }
  } catch (error) {
    // console.error('Error deleting employee:', error);
    res.status(500).json({ message: error.message });
  }
}


function getMonthName(monthNumber) {
  const date = new Date();
  date.setMonth(monthNumber - 1);

  return date.toLocaleString('en-US', { month: 'long' });
}

exports.exportMasterRoll = async (req, res) => {
  try {
    var emp_id = req.body.emp_id
    var sorting_date = req.body.sorting_date

    var date_array = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]
    var data_array = []
    const weekday = ["S","M","T","W","T","F","S"];
    const getDays = (year, month) => new Date(year, month, 0).getDate()
    var daysInCurrentMonth=new Date(new Date(sorting_date).getFullYear(), new Date(sorting_date).getMonth() + 1, 0).getDate()
    var currentMonth = new Date(sorting_date).getMonth() + 1
    var monthName = getMonthName(currentMonth)
    var currentYear = new Date(sorting_date).getFullYear()
    const employee_details = await Employee.findById(emp_id);

    if(!employee_details){
      res.status(200).json({status:false, message: 'Employee not found' });
    }
    var emp_name = employee_details.name

    const emp_login_result = await Leave.find({emp_id:emp_id, date:{$regex: new RegExp(sorting_date, "i")}});
    var holiday_result = []

    var month_array = []
    var present_count = 0
    var absent_count = 0
    var halfday_count = 0
    var paid_leave_count = 0
    var unmarked_count = 0

    if(emp_login_result.length > 0){
      for (var i = 0; i < date_array.length; i++) {
        if(i < 9){
          var get_date = "0"+date_array[i]
        }else{
          var get_date = date_array[i]
        }
        var date = sorting_date+"-"+get_date
        const d = new Date(date);
        let day = d.getDay();


        let obj = emp_login_result.find(o => o.date === date);
        let holiday_obj = holiday_result.find(o => o.holiday_date === date);

        // console.log("obj=========",obj);
        if(obj == undefined){
          if(holiday_obj == undefined){
            unmarked_count +=1
            var marked = "-"
          }else{
            var marked = "H"
          }

          var data_obj = {
            date:date_array[i],
            day:weekday[day],
            marked:marked,
            total_working_hour:"-",
          }
          month_array[i] = data_obj
        }else{

          if(obj.is_halfday == true){
            halfday_count += 1
          }

          if(obj.leave_type == "PL"){
            paid_leave_count += 1
          }

          if(obj.is_leave == true && obj.leave_status == "approved"){
            var marked = "A"
            var total_working_hour = "-"
            absent_count += 1
          }else {
            // var marked = "P"
            if(obj.is_halfday == true){
              var marked = "HD"
            }else{
              var marked = "P"
            }
            present_count += 1
            if(obj.logout_time == undefined || obj.logout_time == "" || obj.logout_time == null){
              var total_working_hour = ""
            }else {
              if(obj.login_time != undefined && obj.login_time != "" && obj.login_time != null && obj.logout_time != undefined && obj.logout_time != "" && obj.logout_time != null){
                var total_working_hour = hour_min_calculation(new Date(date+" "+obj.login_time),new Date(date+" "+obj.logout_time))
              }else {
                var total_working_hour = ""
              }
            }
          }


          var data_obj = {
            date:date_array[i],
            day:weekday[day],
            marked:marked,
            total_working_hour:total_working_hour,
          }
          month_array[i] = data_obj
        }
      }
    }else{
      for (var i = 0; i < date_array.length; i++) {
        if(i < 9){
          var get_date = "0"+date_array[i]
        }else{
          var get_date = date_array[i]
        }
        var date = sorting_date+"-"+get_date
        const d = new Date(date);
        let day = d.getDay();
        var obj = {
          date:date_array[i],
          day:weekday[day],
          marked:"-",
          total_working_hour:"-",
        }
        month_array[i] = obj
      }
      unmarked_count +=1
    }
    // console.log("present_count",present_count);

    data_array.push({"Sr No.":1,
      "Month":monthName+" "+currentYear,
      "Employee Name":emp_name,
      // emp_id:emp_id,
      // month_array:month_array,
      "Present":present_count,
      "Absent":absent_count,
      "Halfday":halfday_count,
      "Paid Leave":paid_leave_count,
      "Unmarked":daysInCurrentMonth-(present_count+absent_count),
      "Total Attendance":present_count,
    })

    let yourDate = new Date()
    var date = yourDate.toISOString().split('T')[0]
    var time = yourDate.toLocaleTimeString();

    var csv_path = "public/reports/master_roll_report_"+date+"_"+time+".csv";
    var csv_path_url = process.env.EXPORTURL+"/public/reports/master_roll_report_"+date+"_"+time+".csv";
    var csv_path_name = "master_roll_report_"+date+" "+time+".csv";

    jsonexport(data_array,function(err, csv){
      fs.writeFile(csv_path, csv, function(err) {
        if(err) {}
        // console.log("errr",err);
        // console.log("csv generated");
        // res.send({
        //       status: true,
        //       message: "Csv generated sucessfully",
        //       path:export_path+csv_path_name
        //   });
        res.status(200).json({status:true, message: 'Csv generated sucessfully', path:csv_path_url});
      });
    });


  } catch (error) {
    // console.error('Error deleting employee:', error);
    res.status(500).json({ message: error.message });
  }
}
