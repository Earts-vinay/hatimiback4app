const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
var async = require('async');
const routes = require("./routes");
const connectToDatabase = require("./database/db");
require("dotenv").config();
// require("./services/Redis/init_redis");
var cron = require('node-cron');

connectToDatabase();
const app = express();

// parse json request body
app.use(express.json());
// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));
// enable cors
app.use(cors());
app.options("*", cors());
const port = process.env.PORT || 3000;

// Set up logging using Morgan
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else if (process.env.NODE_ENV === "production") {
  app.use(morgan("prod"));
} else {
  app.use(morgan("combined"));
}
app.get("/",(req,res)=>{
  res.send("server is running success")
})
// v1 api routes
app.use("/v1", routes);
// Middleware to handle undefined routes globally
app.use((req, res) => {
  res.status(404).json({ error: "Route not found globally" });
});

var server = require('http').createServer(app);


const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
  maxHttpBufferSize: 1e8 //100 mb
});

const { Leave } = require("./models/leaveModel");
const { Employee, EmployeeTransfer, EmployeeSwap} = require("./models/employeeModel");
const { Task, TaskConversation} = require("./models/taskModel");
const { Property } = require("./models/propertyModel");
const { Notification } = require("./models/notificationModel");


function Convert24_to_12 (time) {
  // Check correct time format and split into components
  time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

  if (time.length > 1) { // If time format correct
    time = time.slice (1);  // Remove full string match value
    time[5] = +time[0] < 12 ? ' AM' : ' PM'; // Set AM/PM
    time[0] = +time[0] % 12 || 12; // Adjust hours
  }
  return time.join (''); // return adjusted time or original string
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
var cron = require('node-cron');

cron.schedule("0 0 */1 * * *", function() {
  // console.log("running a task every 1 hour");
  var uploadsDir =  '/public/reports';

  fs.readdir(uploadsDir, function(err, files) {
    files.forEach(function(file, index) {
      fs.stat(path.join(uploadsDir, file), function(err, stat) {
        var endTime, now;
        if (err) {
          return console.log(err);
        }
        now = new Date().getTime();
        endTime = new Date(stat.ctime).getTime() + 3600000;
        if (now > endTime) {
          return rimraf(path.join(uploadsDir, file), function(err) {
            if (err) {
              return console.log(err);
            }
            console.log('successfully deleted');
          });
        }
      });
    });
  });
})

cron.schedule("0 0 1 * * *", async function() {
// cron.schedule("*/1 * * * * *", function() {

  console.log("running a task every day at 1am morning");
  var date = new Date();
  date.setDate(date.getDate() - 1);
  var date1 = new Date(date).toISOString().split("T")[0];

  const employee_swap = await EmployeeSwap.find({till_date:date1});

  if(employee_swap.length > 0){
    for (var i = 0; i < employee_swap.length; i++) {

      var role = employee_swap[i].role
      var emp_id = employee_swap[i].emp_id

      const updatedEmployeeSwap = await EmployeeSwap.findByIdAndUpdate(
        employee_swap[i]._id,
        {status:"cancelled",
          is_cancel:true
          },
          { new: true, runValidators: true });


          const employee = await Employee.findById(emp_id);
          var previous_role = employee.role

          previous_role = previous_role.filter(e => e !== role)

          const updatedEmployee = await Employee.findByIdAndUpdate(
          emp_id,
          {role:previous_role},
          { new: true, runValidators: true });
    }
  }
})

const fs = require('fs');
const path = require('path');

// cron to delete invoice files
cron.schedule("0 0 */1 * * *", async function() {
// cron.schedule("*/10 * * * * *", async function() {

  const directoryPath = path.join(__dirname, 'public/createinvoice');
  const oneHourInMillis = 1 * 60 * 60 * 1000; // 1 hour in milliseconds

  const now = Date.now();

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.log('Error reading directory:', err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(directoryPath, file);

      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.log(`Error getting stats for file ${file}:`, err);
          return;
        }

        // Check the creation time of the file
        const fileAge = now - stats.birthtimeMs; // File creation time in milliseconds
        if (fileAge > oneHourInMillis) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.log(`Error deleting file ${file}:`, err);
            } else {
              console.log(`Deleted file: ${file}`);
            }
          });
        }
      });
    });
  });


  const directoryUpdatePath = path.join(__dirname, 'public/updateinvoice');
  const updateOneHourInMillis = 1 * 60 * 60 * 1000; // 1 hour in milliseconds

  // const now = Date.now();

  fs.readdir(directoryUpdatePath, (err, files) => {
    if (err) {
      console.log('Error reading directory:', err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(directoryUpdatePath, file);

      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.log(`Error getting stats for file ${file}:`, err);
          return;
        }

        // Check the creation time of the file
        const fileAge = now - stats.birthtimeMs; // File creation time in milliseconds
        if (fileAge > updateOneHourInMillis) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.log(`Error deleting file ${file}:`, err);
            } else {
              console.log(`Deleted file: ${file}`);
            }
          });
        }
      });
    });
  });
})



io.on('connection', function(socket) {
   console.log('A user connected in socket from server file');



   socket.on("test_socket",function(data){
     // console.log("test_socket",data);
       socket.emit("test_socket_response",{data:{status:true,  message: 'Test Socket hitted sucessfully'}})
       socket.broadcast.emit("test_socket_response",{data:{status:true,  message: 'Test Socket hitted sucessfully'}})
   })

   socket.on("fetch_emp_attendance_app", async function (data) {
     // console.log("fetch_emp_attendance_app",data);

     var emp_id = data.emp_id
     var sorting_date = data.sorting_date
     // var month_array = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
     var date_array = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]
     var data_array = []
     const weekday = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
     const getDays = (year, month) => new Date(year, month, 0).getDate()
     var daysInCurrentMonth=new Date(new Date(sorting_date).getFullYear(), new Date(sorting_date).getMonth() + 1, 0).getDate()
     var today_date = new Date().toISOString().split("T")[0];


     if(sorting_date == undefined || sorting_date == "" || sorting_date == null || emp_id == undefined || emp_id == "" || emp_id == null ){
       socket.emit("fetch_emp_attendance_app_response", { data: {status:false, message:"Please pass correct parmanent_address"}})
       socket.broadcast.emit("fetch_emp_attendance_app_response", { data: {status:false, message:"Please pass correct parmanent_address"}})

     }else{
       const emp_result = await Employee.findById(emp_id);

       if(emp_result != undefined && emp_result._id != undefined){

           var emp_name = emp_result.name

           const emp_login_result = await Leave.find({emp_id:emp_id, date:{$regex: new RegExp(sorting_date, "i")}});

           // console.log("emp_login_result======",emp_login_result);
               var holiday_result = []
               var month_array = []
               var present_count = 0
               var absent_count = 0
               var halfday_count = 0
               var leave_count = 0
               var sick_leave_count = 0
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

                   // console.log("date=========",date);
                   // console.log("day=========",day);

                   let obj = emp_login_result.find(o => o.date === date);
                   let holiday_obj = holiday_result.find(o => o.holiday_date === date);
                   // console.log("holiday_obj",holiday_obj);
                   if(obj == undefined){
                     if(holiday_obj == undefined){
                       // console.log("dateeeeee",date);
                       // console.log("today_date",today_date);
                       if(date > today_date){
                         var marked = ""
                         var marked_name = ""

                       }else{

                         if(weekday[day] == "SUN"){
                           var marked = ""
                           var marked_name = ""
                         }else{
                           unmarked_count +=1
                           absent_count += 1
                           var marked = "Absent"
                           var marked_name = ""
                         }
                       }
                     }else{
                       var marked = "Holiday"
                       var marked_name = holiday_obj.holiday_name
                     }

                     var data_obj = {
                       date:date_array[i],
                       day:weekday[day],
                       marked:marked,
                       marked_name:marked_name,
                       login_time:"",
                       logout_time:"",
                       total_working_hour:"",total_working_hour
                     }
                     month_array[i] = data_obj

                   }else{

                     if(obj.is_halfday == true){
                       halfday_count += 1
                     }


                     if(obj.is_leave == true && obj.leave_status == "approved"){
                       var marked = "Leave"
                       var marked_name = ""

                       var login_time = ""
                       var logout_time = ""
                       var total_working_hour = ""
                       leave_count += 1
                       if(obj.is_sick_leave == true){
                         sick_leave_count += 1
                       }
                     }else {
                       var marked_name = ""

                       if(obj.is_halfday == true){
                         var marked = "Half Day"
                       }else{
                         var marked = "Present"
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
                       var login_time = obj.login_time
                       var logout_time = obj.logout_time
                     }


                     // if(obj.is_leave == true && obj.leave_status == "requested"){
                     //   var marked = ""
                     //   var marked_name = ""
                     //   var login_time = ""
                     //   var logout_time = ""
                     //   var total_working_hour = ""
                     // }else {
                     //   var marked_name = ""
                     //   if(obj.is_halfday == true){
                     //     var marked = "Half Day"
                     //   }else{
                     //     var marked = "Present"
                     //   }
                     //   present_count += 1
                     //   if(obj.logout_time == undefined || obj.logout_time == "" || obj.logout_time == null){
                     //     var total_working_hour = ""
                     //   }else {
                     //     if(obj.login_time != undefined && obj.login_time != "" && obj.login_time != null && obj.logout_time != undefined && obj.logout_time != "" && obj.logout_time != null){
                     //       var total_working_hour = hour_min_calculation(new Date(date+" "+obj.login_time),new Date(date+" "+obj.logout_time))
                     //     }else {
                     //       var total_working_hour = ""
                     //     }
                     //   }
                     //   var login_time = obj.login_time
                     //   var logout_time = obj.logout_time
                     // }




                     var data_obj = {
                       date:date_array[i],
                       day:weekday[day],
                       marked:marked,
                       marked_name:marked_name,
                       login_time:login_time,
                       logout_time:logout_time,
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

                   const d = new Date(date);
                   let day = d.getDay();
                   if(holiday_obj == undefined){
                     if(date > today_date){
                       var marked = ""
                       var marked_name = ""

                     }else{
                       var marked = "Absent"
                       var marked_name = ""
                     }

                   }else{
                     var marked = "Holiday"
                     var marked_name = holiday_obj.holiday_name
                   }
                   var obj = {
                     date:date_array[i],
                     day:weekday[day],
                     marked:marked,
                     marked_name:marked_name,
                     login_time:"",
                     logout_time:"",
                     total_working_hour:"",
                   }
                   month_array[i] = obj
                 }
                 unmarked_count +=1
               }

               // console.log("present_count",present_count);

               data_array.push({
                 emp_name:emp_name,
                 emp_id:emp_id,
                 month_array:month_array,
                 present_count:present_count,
                 absent_count:absent_count,
                 halfday_count:halfday_count,
                 leave_count:leave_count,
                 sick_leave_count:sick_leave_count,
                 // unmarked_count:daysInCurrentMonth-(present_count+absent_count),
               })

                  socket.emit("fetch_emp_attendance_app_response", { data: {status:true, message:"Data fetched", data:data_array}})
                 socket.broadcast.emit("fetch_emp_attendance_app_response", { data: {status:true, message:"Data fetched", data:data_array}})

       }else{
         socket.emit("fetch_emp_attendance_app_response", { data: {status:false, message:"Employee not found"}})
         socket.broadcast.emit("fetch_emp_attendance_app_response", { data: {status:false, message:"Employee not found"}})

       }
     }
   })

   socket.on("fetch_emp_attendance_app_module", async function (data) {
     // console.log("fetch_emp_attendance_app_module",data);

     socket.emit("fetch_emp_attendance_app_response_module", { data: {status:true, message:"Data fetched"}})
     socket.broadcast.emit("fetch_emp_attendance_app_response_module", { data: {status:true, message:"Data fetched"}})

   })


   socket.on("attendance_list_admin", async function (data) {
     // console.log("attendance_list_admin",data);
     var date = data.date
     var search = data.search
     var data_array = []

     // if(search == undefined){
     //   var find_obj = {}
     // }else{
     //   var find_obj = {name:{$regex: new RegExp(search, "i")}}
     // }

     var property_id = data.property_id
     var find_obj = {}
     if(property_id != undefined){
       find_obj.property_id = property_id
     }
     if(search != undefined){
       find_obj.name = {$regex: new RegExp(search, "i")}
     }

     var total_staff = 0
     var present = 0
     var absent = 0
     var halfday = 0
     var leave = 0
     var sick_leave = 0

     const emp_result1 = await Employee.find({suspend:{$ne:true}});
     const emp_login_hours_result1 = await Leave.find({date:date, is_leave:{$ne:true}});
     const emp_halfday_result = await Leave.find({date:date, is_halfday:true});
     const emp_leave_result = await Leave.find({date:date, is_leave:true, leave_status:"approved"});
     const emp_sick_leave_result = await Leave.find({date:date, is_sick_leave:true, leave_status:"approved"});
     const holiday_result = []

     const emp_result = await Employee.find(find_obj);
      if(emp_result.length > 0){
        for (var i = 0; i < emp_result.length; i++) {

          var emp_id = emp_result[i]._id.toString();
          var staff_name = emp_result[i].name

          const emp_login_hours_result = await Leave.find({emp_id:emp_id, date:date});

          if(emp_login_hours_result.length > 0){

            if(emp_login_hours_result[0].is_halfday == false && emp_login_hours_result[0].is_leave == false){
              var is_present = true
            }else{
              var is_present = false
            }

            if(emp_login_hours_result[0].is_halfday == true){
              var is_halfday = true
            }else{
              var is_halfday = false
            }

            if(emp_login_hours_result[0].is_leave == true && emp_login_hours_result[0].leave_status == "approved"){
              var is_leave = true
              // var is_paid_leave = false
              // var is_unpaid_leave = false
              if(emp_login_hours_result[0].leave_type == "UPL"){
                var is_paid_leave = false
                var is_unpaid_leave = true
              }else {
                var is_paid_leave = true
                var is_unpaid_leave = false
              }

              if(emp_login_hours_result[0].is_sick_leave == true){
                var is_sick_leave = true
              }else{
                var is_sick_leave = false
              }
            }else{
              var is_leave = false
              var is_paid_leave = false
              var is_unpaid_leave = false
              var is_sick_leave = false
            }


            if(emp_login_hours_result[0].selfie == undefined || emp_login_hours_result[0].selfie == '' || emp_login_hours_result[0].selfie == null){
              var selfie = ""
            }else{
              var selfie = selfie_url_path+emp_login_hours_result[0].selfie
            }

            if(emp_login_hours_result[0].login_time == undefined || emp_login_hours_result[0].login_time == '' || emp_login_hours_result[0].login_time == null){
              var login_time = ""
              var login_time_12 = ""
            }else{
              var login_time = emp_login_hours_result[0].login_time
              var login_time_12 = Convert24_to_12(emp_login_hours_result[0].login_time)
            }

            if(emp_login_hours_result[0].logout_time == undefined || emp_login_hours_result[0].logout_time == '' || emp_login_hours_result[0].logout_time == null){
              var logout_time = ""
              var logout_time_12 = ""
            }else{
              var logout_time = emp_login_hours_result[0].logout_time
              var logout_time_12 = Convert24_to_12(emp_login_hours_result[0].logout_time)
            }

            if(emp_login_hours_result[0].location_address == undefined || emp_login_hours_result[0].location_address == '' || emp_login_hours_result[0].location_address == null){
              var location = ""
            }else{
              var location = emp_login_hours_result[0].location_address
            }

            if(emp_login_hours_result[0].leave_status == "requested"){
              var is_leave = false
              var is_sick_leave = false
              var leave_reason = ""
              // var halfday_reason = ""
              var requested_leave_reason = "requested"
            }
            else {
              var requested_leave_reason = ""
              var leave_reason = emp_login_hours_result[0].leave_reason
            }

            if(emp_login_hours_result[0].leave_status == "declined" ){
              var is_log_in = false
              var is_leave = false
              var is_sick_leave = false
              var leave_reason = ""
            }else {
              var is_log_in = true
            }

            if(emp_login_hours_result[0].login_time != "" && emp_login_hours_result[0].logout_time == ""){
              var online_offline = "online"
            }else {
              var online_offline = "offline"
            }



            var is_log_in = is_log_in
            var halfday_reason = emp_login_hours_result[0].halfday_reason
            var leave_reason = leave_reason
            var requested_leave_reason = requested_leave_reason
            var is_present = is_present
            var is_halfday = is_halfday
            var is_leave = is_leave
            var is_paid_leave = is_paid_leave
            var is_unpaid_leave = is_unpaid_leave
            var is_sick_leave = is_sick_leave
            var holiday_reason = ""
          }else{
            if(holiday_result.length > 0){
              var holiday_reason = holiday_result[0].holiday_name
              var is_log_in = true
            }else{
              var holiday_reason = ""
              var is_log_in = false
            }
            var online_offline = "offline"
            var selfie = ""
            var location = ""
            var login_time = ""
            var login_time_12 = ""
            var logout_time = ""
            var logout_time_12 = ""
            var halfday_reason = ""
            var leave_reason = ""
            var requested_leave_reason = ""
            var is_present = false
            var is_halfday = false
            var is_leave = false
            var is_paid_leave = false
            var is_unpaid_leave = false
            var is_sick_leave = false
            var holiday_reason = holiday_reason
          }

          data_array.push({emp_id:emp_id,
            online_offline:online_offline,
            staff_name:staff_name,
            is_log_in:is_log_in,
            selfie:selfie,
            location:location,
            login_time:login_time,
            login_time_12:login_time_12,
            logout_time:logout_time,
            logout_time_12:logout_time_12,
            halfday_reason:halfday_reason,
            leave_reason:leave_reason,
            requested_leave_reason:requested_leave_reason,
            is_present:is_present,
            is_halfday:is_halfday,
            is_leave:is_leave,
            is_paid_leave:is_paid_leave,
            is_unpaid_leave:is_unpaid_leave,
            is_sick_leave:is_sick_leave,
            holiday_reason:holiday_reason,
          })

          if (i == emp_result.length - 1)
          {

            if(emp_result1.length > 0){
              total_staff = emp_result1.length
              present = emp_login_hours_result1.length
              absent = total_staff-present
              halfday = emp_halfday_result.length
              leave = emp_leave_result.length
              sick_leave = emp_sick_leave_result.length

            }
            var data_obj = {
              total_staff:total_staff,
              present:present,
              absent:absent,
              halfday:halfday,
              leave:leave,
              sick_leave:sick_leave,
            }

            socket.emit("attendance_list_admin_response", { data: {status:true,message:"Data fetched successfully", data:data_array, count:data_obj}})
            socket.broadcast.emit("attendance_list_admin_response", { data: {status:true,message:"Data fetched successfully", data:data_array, count:data_obj}})
          }
        }
      }else{
        socket.emit("attendance_list_admin_response", { data: {status:false,message:"Employee does not exists"}})
        socket.broadcast.emit("attendance_list_admin_response", { data: {status:false,message:"Employee does not exists"}})
      }
   })


   socket.on("attendance_list_admin_module", async function (data) {
     // console.log("attendance_list_admin_module",data);

     socket.emit("attendance_list_admin_response_module", { data: {status:true, message:"Data fetched"}})
     socket.broadcast.emit("attendance_list_admin_response_module", { data: {status:true, message:"Data fetched"}})

   })


   //fetch_requested_leave
   socket.on("fetch_requested_leave", async function (data) {
     // console.log("fetch_requested_leave",data);
     var date = new Date().toISOString().split("T")[0];
     var data_array = []
     var search = data.search
     // if(search == undefined){
     //   var find_obj = {}
     // }else{
     //   var find_obj = {name:{$regex: new RegExp(search,"i")}}
     // }

     var property_id = data.property_id
     var find_obj = {}
     if(property_id != undefined){
       find_obj.property_id = property_id
     }
     if(search != undefined){
       find_obj.name = {$regex: new RegExp(search, "i")}
     }

     var date_new = new Date()
     var assiging_date = date_new.getFullYear()+"-01-01";

     const emp_result = await Employee.find(find_obj);

       if(emp_result.length > 0){
         var interval_n = 100;


         for (var n = 0; n < emp_result.length; n++) {
           setTimeout(async function (n){

           var index = n

         // async.eachSeries(emp_result, (eachuser, next) => {
           // var index_purchase = emp_result.indexOf(eachuser);
           var emp_id = emp_result[n]._id.toString()
           var emp_name = emp_result[n].name


               if(emp_result[n].total_paid_leave == undefined || emp_result[n].total_paid_leave == ""){
                 var total_leave_given = 0
               }else{
                 var total_leave_given = parseInt(emp_result[n].total_paid_leave)
               }
               const taken_leave_result = await Leave.find({emp_id:emp_id, date:{$gte:assiging_date},leave_status:"approved"});

               // db.collection("emp_login_hours").find({emp_id:emp_id, date:{$gte:assiging_date},leave_status:"approved"}, function(err, taken_leave_result){

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

                 const requested_leave_result = await Leave.find({emp_id:emp_id, date:{$gte:date},leave_status:"requested"});

                 // console.log("requested_leave_result",requested_leave_result);
                 // db.collection("emp_login_hours").find({emp_id:emp_id, date:{$gte:date},leave_status:"requested"}, function(err, requested_leave_result){

                   if(requested_leave_result.length > 0){
                     var leave_array = []
                     for (var i = 0; i < requested_leave_result.length; i++) {
                       leave_array.push({
                         leave_id:requested_leave_result[i]._id.toString(),
                         date:requested_leave_result[i].date,
                         leave_reason:requested_leave_result[i].leave_reason,
                       })
                     }
                     data_array.push({emp_id:emp_id,
                       emp_name:emp_name,
                       leave_array:leave_array,
                       total_unpaid_leaves:total_unpaid_leaves,
                       total_paid_leaves:total_paid_leaves,
                       balance_leave:balance_leave,
                     })
                   }

                   // next();
                   if (index == emp_result.length - 1)
                   {
                     if(data_array.length > 0){

                       socket.emit("fetch_requested_leave_response", { data: {status:true,message:"Data fetched",data:data_array}})
                       socket.broadcast.emit("fetch_requested_leave_response", { data: {status:true,message:"Data fetched",data:data_array}})
                     }else{
                       // res.send({status:false, message:"Data not found"})
                       socket.emit("fetch_requested_leave_response", { data: {status:false,message:"Data does not exists"}})
                       socket.broadcast.emit("fetch_requested_leave_response", { data: {status:false,message:"Data does not exists"}})
                     }
                   }
                 // })
               // })
         // });
          }, interval_n * n, n);
        }
       }else{
         socket.emit("fetch_requested_leave_response", { data: {status:false,message:"Data does not exists"}})
         socket.broadcast.emit("fetch_requested_leave_response", { data: {status:false,message:"Data does not exists"}})

         // res.send({status:false,message:"Data not found"})
       }
     // })
   })


   socket.on("fetch_requested_leave_module", async function (data) {
     // console.log("fetch_requested_leave_module",data);

     socket.emit("fetch_requested_leave_response_module", { data: {status:true, message:"Data fetched"}})
     socket.broadcast.emit("fetch_requested_leave_response_module", { data: {status:true, message:"Data fetched"}})

   })


   //fetch_emp_leave_app
   socket.on("fetch_emp_leave_app", async function (data) {
     // console.log("fetch_emp_leave_app",data);

     var emp_id = data.emp_id
     var sorting_date = data.sorting_date
     var start_month_date = data.sorting_date+"-01"
     var end_month_date = data.sorting_date+"-31"
     var data_array = []
     var date = new Date()
     var assiging_date = date.getFullYear()+"-01-01";


     const emp_result = await Employee.findById(emp_id);

      if(emp_result != undefined && emp_result._id != undefined){

      var emp_name = emp_result.name

      if(emp_result.total_paid_leave == undefined || emp_result.total_paid_leave == ""){
        var total_leave_given = 0
      }else{
        var total_leave_given = parseInt(emp_result.total_paid_leave)
      }

      const taken_leave_result = await Leave.find({emp_id:emp_id, date:{$gte:assiging_date}});

      var total_unpaid_leaves = 0
      var total_paid_leaves = 0
      var total_sick_leaves = 0
      var total_halfday = 0
      var total_maternity = 0


      if(taken_leave_result.length > 0){
        for (var i = 0; i < taken_leave_result.length; i++) {
          if(taken_leave_result[i].is_leave == true && taken_leave_result[i].leave_status == "approved"){

            if(taken_leave_result[i].leave_type == "UPL"){
              total_unpaid_leaves += 1
            }else if(taken_leave_result[i].leave_type == "PL"){
              total_paid_leaves += 1
            }

            if(taken_leave_result[i].is_sick_leave == true){
              total_sick_leaves += 1
            }

            if(taken_leave_result[i].is_maternity_leave == true){
              total_maternity += 1
            }
          }else if(taken_leave_result[i].is_halfday == true){
            total_halfday += 1
          }
        }
      }
      if(total_leave_given == 0){
        var balance_leave = 0
      }else{
        var balance_leave = total_leave_given-total_paid_leaves
      }

      const emp_leave_result = await Leave.find({emp_id:emp_id, date:{$gte:start_month_date,$lte:end_month_date}, is_leave:true}).sort({date:-1});


        var leave_array = []
        if(emp_leave_result.length > 0){
          for (var i = 0; i < emp_leave_result.length; i++) {
            if(emp_leave_result[i].added_date == undefined){
              var added_date = ""
            }else{
              var added_date = emp_leave_result[i].added_date
            }
            leave_array.push({
              leave_id:emp_leave_result[i]._id.toString(),
              date:emp_leave_result[i].date,
              leave_status:emp_leave_result[i].leave_status,
              leave_reason:emp_leave_result[i].leave_reason,
              leave_type:emp_leave_result[i].leave_type,
              added_date:added_date
            })
          }
        }
        data_array.push({emp_id:emp_id,
          emp_name:emp_name,
          total_leave:total_leave_given,
          leave_used:total_paid_leaves,
          balance_leave:balance_leave,
          leave_array:leave_array,
          total_paid_leaves:total_paid_leaves,
          total_unpaid_leaves:total_unpaid_leaves,
          total_sick_leaves:total_sick_leaves,
          total_halfday:total_halfday,
          total_maternity:total_maternity,
        })

        if(data_array.length > 0){

          socket.emit("fetch_emp_leave_app_response", { data: {status:true, message:"Data found", data:data_array}})
          socket.broadcast.emit("fetch_emp_leave_app_response", { data: {status:true, message:"Data found", data:data_array}})

        }else{
          socket.emit("fetch_emp_leave_app_response", { data: {status:false, message:"Data not found"}})
          socket.broadcast.emit("fetch_emp_leave_app_response", { data: {status:false, message:"Data not found"}})

        }

      }else{
        socket.emit("fetch_emp_leave_app_response", { data: {status:false, message:"Data not found"}})
        socket.broadcast.emit("fetch_emp_leave_app_response", { data: {status:false, message:"Data not found"}})
      }
   })


   socket.on("fetch_emp_leave_app_module", async function (data) {
     // console.log("fetch_emp_leave_app_module",data);

     socket.emit("fetch_emp_leave_app_response_module", { data: {status:true, message:"Data fetched"}})
     socket.broadcast.emit("fetch_emp_leave_app_response_module", { data: {status:true, message:"Data fetched"}})

   })


   socket.on("fetch_emp_task_app", async function (data) {
     // console.log("fetch_emp_task_app",data);
     var emp_id = data.emp_id
     const task_result = await Task.find({emp_id:emp_id}).sort({_id:-1});
     var mainArray = []

     if(task_result.length > 0){

       for (var i = 0; i < task_result.length; i++) {
         var emp_id = task_result[i].emp_id
         const emp_result = await Employee.findById(emp_id);
         if(!emp_result){
           var emp_name = ''
         }else{
           var emp_name = emp_result.name
         }

         var property_id = task_result[i].property_id
         const property_result = await Property.findById(property_id);
         if(!property_result){
           var property_name = ''
         }else{
           var property_name = property_result.property_name
         }

         var unReadMessageCount = 0
         const task_noti_result = await Notification.find({task_id:task_result[i]._id, emp_id:emp_id, is_read:false});

         unReadMessageCount += task_noti_result.length

         var data_obj = {
           _id:task_result[i]._id,
           emp_id:task_result[i].emp_id,
           property_id:task_result[i].property_id,
           task_title:task_result[i].task_title,
           task_date:task_result[i].task_date,
           task_time:task_result[i].task_time,
           task_type:task_result[i].task_type,
           room_no:task_result[i].room_no,
           task_status:task_result[i].task_status,
           status_by_employee:task_result[i].status_by_employee,
           is_cancel:task_result[i].is_cancel,
           added_date:task_result[i].added_date,
           emp_name:emp_name,
           property_name:property_name,
           unReadMessageCount:unReadMessageCount,
         }
         mainArray.push(data_obj)

       }
       socket.emit("fetch_emp_task_app_response", { data: {status:true, message:"Data fetched",data:mainArray}})
       socket.broadcast.emit("fetch_emp_task_app_response", { data: {status:true, message:"Data fetched",data:mainArray}})
     }else{
       socket.emit("fetch_emp_task_app_response", { data: {status:false, message:"Task not available"}})
       socket.broadcast.emit("fetch_emp_task_app_response", { data: {status:false, message:"Task not available"}})
     }
   })


   socket.on("fetch_emp_task_app_module", function (data) {
     // console.log("fetch_emp_task_app_module========");
     socket.emit("fetch_emp_task_app_module_response", { data: {status:true, message:"Data fetched"}})
     socket.broadcast.emit("fetch_emp_task_app_module_response", { data: {status:true, message:"Data fetched"}})
   })



   socket.on("fetch_task_admin", async function (data) {
     // console.log("fetch_task_admin",data);
     if(data.property_id == undefined || data.property_id == "" || data.property_id == null){
       var obj = {}
     }else{
       var property_id = data.property_id
       var obj = {property_id:property_id}
     }
     // console.log("obj",obj);
     const task_result = await Task.find(obj).sort({_id:-1});
     var mainArray = []

     if(task_result.length > 0){
       for (var i = 0; i < task_result.length; i++) {

         var emp_id = task_result[i].emp_id
         var task_id = task_result[i]._id
         var task_title = task_result[i].task_title
         var task_date = task_result[i].task_date
         var task_time = task_result[i].task_time
         var task_type = task_result[i].task_type
         var room_no = task_result[i].room_no
         var task_status = task_result[i].task_status
         var status_by_employee = task_result[i].status_by_employee
         var is_cancel = task_result[i].is_cancel
         var added_date = task_result[i].added_date

         const emp_result = await Employee.findById(emp_id);
         if(!emp_result){
           var emp_name = ''
         }else{
           var emp_name = emp_result.name
         }

         var property_id = task_result[i].property_id
         const property_result = await Property.findById(property_id);
         if(!property_result){
           var property_name = ''
         }else{
           var property_name = property_result.property_name
         }

         var unReadMessageCount = 0
         const task_noti_result = await Notification.find({task_id:task_id, notification_for:"admin", is_read:false});

         unReadMessageCount += task_noti_result.length


         var data_obj = {
           _id:task_id,
           emp_id:emp_id,
           property_id:property_id,
           task_title:task_title,
           task_date:task_date,
           task_time:task_time,
           task_type:task_type,
           room_no:room_no,
           task_status:task_status,
           status_by_employee:status_by_employee,
           is_cancel:is_cancel,
           added_date:added_date,
           emp_name:emp_name,
           property_name:property_name,
           unReadMessageCount:unReadMessageCount
         }
         mainArray.push(data_obj)

       }
       socket.emit("fetch_task_admin_response", { data: {status:true, message:"Data fetched",data:mainArray}})
       socket.broadcast.emit("fetch_task_admin_response", { data: {status:true, message:"Data fetched",data:mainArray}})
     }else{
       socket.emit("fetch_task_admin_response", { data: {status:false, message:"Task not available"}})
       socket.broadcast.emit("fetch_task_admin_response", { data: {status:false, message:"Task not available"}})
     }
   })


   socket.on("fetch_task_admin_module", async function (data) {
     // console.log("fetch_task_admin_module0000000000");
     socket.emit("fetch_task_admin_module_response", { data: {status:true, message:"Data fetched"}})
     socket.broadcast.emit("fetch_task_admin_module_response", { data: {status:true, message:"Data fetched"}})
   })


   socket.on("fetch_task_badge", async function (data) {
     // console.log("fetch_task_badge");

     var unReadMessageCount = 0
     const task_noti_result = await Notification.find({notification_for:"admin", is_read:false});

     unReadMessageCount += task_noti_result.length

     if(unReadMessageCount > 0){
       socket.emit("fetch_task_badge_response", { data: {status:true, message:"Data fetched", count:unReadMessageCount}})
       socket.broadcast.emit("fetch_task_badge_response", { data: {status:true, message:"Data fetched", count:unReadMessageCount}})
     }else{
       socket.emit("fetch_task_badge_response", { data: {status:false, message:"Data not found"}})
       socket.broadcast.emit("fetch_task_badge_response", { data: {status:false, message:"Data not found"}})
     }
   })

   socket.on("fetch_task_badge_new", async function (data) {
     // console.log("fetch_task_badge");

     var unReadMessageCount = 0
     const task_noti_result = await Notification.find({notification_for:"admin", is_read:false});

     unReadMessageCount += task_noti_result.length

     if(unReadMessageCount > 0){
       socket.emit("fetch_task_badge_response_new", { data: {status:true, message:"Data fetched", count:unReadMessageCount}})
       socket.broadcast.emit("fetch_task_badge_response_new", { data: {status:true, message:"Data fetched", count:unReadMessageCount}})
     }else{
       socket.emit("fetch_task_badge_response_new", { data: {status:false, message:"Data not found"}})
       socket.broadcast.emit("fetch_task_badge_response_new", { data: {status:false, message:"Data not found"}})
     }
   })

   socket.on("update_property_emp", async function (data) {
     socket.emit("update_property_emp_response", { data: {status:true, message:"Data fetched", property_id:data.property_id, property_uid:data.property_uid}})
     socket.broadcast.emit("update_property_emp_response", { data: {status:true, message:"Data fetched", property_id:data.property_id, property_uid:data.property_uid}})
   })


   socket.on('disconnect', function () {
      console.log('A user disconnected');
   });

});


// Start the server
server.listen(port, () => {
  console.log(
    `Server is running on port ${port} in ${process.env.NODE_ENV} mode`
  );
});
