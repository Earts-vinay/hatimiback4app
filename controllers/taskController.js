const { Employee, EmployeeTransfer, EmployeeSwap} = require("../models/employeeModel");
const { Property } = require("../models/propertyModel");
const { Role } = require("../models/masterRoleModel");
const { Task, TaskConversation} = require("../models/taskModel");
const { Notification } = require("../models/notificationModel");
const multer = require("multer");
const createError = require("http-errors");


const {
  uploadImage,
  updateMultipleImages,
  deleteMultipleImages,
} = require("../services/uploadService");

const {sendNotification} = require("../services/sendNotificationService");
const validationErrorHandler = require("../utils/validationErrorHandler");
const { log } = require("console");

const io1 = require('socket.io-client')
// const socket_hit = io1("http://192.168.29.31:3000/", { transport: ['websocket'] });
const socket_hit = io1(process.env.APIURL+":"+process.env.PORT+"/", { transport: ['websocket'] });
// console.log("socket_hit",socket_hit);
exports.addTask = async (req, res) => {

  try {
    const {emp_id, property_id, task_title, task_date, task_time, task_type, room_no} = req.body;
    var added_date = new Date().toISOString();
    var task_status = 'pending'
    var status_by_employee = 'pending'
    var is_cancel = false

    const new_task = await Task.create({
      emp_id,
      property_id,
      task_title,
      task_date,
      task_time,
      task_type,
      room_no,
      task_status,
      status_by_employee,
      is_cancel,
      added_date
    });

    // socket_hit.emit("fetch_emp_task_app_module")


    const emp_result_noti = await Employee.findById(emp_id);
    if(!emp_result_noti){
      var device_id = ''
    }else{
      if(emp_result_noti.device_id == undefined || emp_result_noti.device_id == "" || emp_result_noti.device_id == null){
        var device_id = ''
      }else{
        var device_id = emp_result_noti.device_id
        const noti_result = await Notification.find({emp_id:emp_id, is_read:false});
        var badge = noti_result.length+1
        var sending_message = {
          title:"Task assigned",
          message:task_title,
          date:task_date,
          type:"task",
          task_id:new_task._id,
          badge:badge,
        }

        const new_noti = await Notification.create({
          emp_id:emp_id,
          notification_for:"mobile",
          title:"Task assigned",
          message:task_title,
          date:task_date,
          type:"task",
          task_id:new_task._id,
          is_read:false,
          added_date:added_date
        });

        await sendNotification(device_id, sending_message)
      }
    }

    // socket_hit.emit("aaaaaaa")
    // socket_hit.emit("fetch_emp_task_app_module")

    // console.log("fetch_emp_task_app_module");

    res.status(201).json({status:true, message: "Task added successfully",data:new_task });
  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};

exports.getSingleTask = async (req, res) => {

  try {

    const task_result = await Task.findById(req.body.id);

    if(!task_result){
      res.status(201).json({status:false, message:"Task not available"});
    }else{

      var emp_id = task_result.emp_id
      const emp_result = await Employee.findById(emp_id);
      if(!emp_result){
        var emp_name = ''
      }else{
        var emp_name = emp_result.name
      }

      var property_id = task_result.property_id
      const property_result = await Property.findById(property_id);
      if(!property_result){
        var property_name = ''
      }else{
        var property_name = property_result.property_name
      }

      if(req.body.hit_from == 'admin'){
        var find_obj = {task_id:req.body.id, notification_for:"admin", is_read:false}
      }else{
        var find_obj = {task_id:req.body.id, emp_id:emp_id, is_read:false}
      }

      const task_noti_result = await Notification.find(find_obj);
      if(task_noti_result.length > 0){
        for (var z = 0; z < task_noti_result.length; z++) {
          const updatedNoti = await Notification.findByIdAndUpdate(
            task_noti_result[z]._id,
            {is_read:true},
            { new: true, runValidators: true });
          }
      }

      const task_conversation_result = await TaskConversation.find({task_id:req.body.id});

      if(task_conversation_result.length > 0){

        const updatedEmployee = await TaskConversation.findByIdAndUpdate(
          task_conversation_result[0]._id,
          {$set: {'messages.$[].new_message': false}},
          { new: true, runValidators: true });

        var messages = task_conversation_result[0].messages
        messages.sort(function(a, b) {
            return parseFloat(b.message_id) - parseFloat(a.message_id);
        });
        var conversation_array = messages
      }else{
        var conversation_array = []
      }

      var data_obj = {
        _id:task_result._id,
        emp_id:task_result.emp_id,
        property_id:task_result.property_id,
        task_title:task_result.task_title,
        task_date:task_result.task_date,
        task_time:task_result.task_time,
        task_type:task_result.task_type,
        room_no:task_result.room_no,
        task_status:task_result.task_status,
        status_by_employee:task_result.status_by_employee,
        is_cancel:task_result.is_cancel,
        added_date:task_result.added_date,
        task_image:task_result.task_image,
        mark_complete:task_result.mark_complete,
        emp_name:emp_name,
        property_name:property_name,
        conversation_array:conversation_array,
      }

      res.status(201).json({status:true, message:"Task fetched",data:data_obj});
    }

  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};


exports.updateTask = async (req, res) => {

  try {

    const task_result = await Task.findById(req.body.id);

    if(!task_result){
      res.status(201).json({status:false, message:"Task not available"});
    }else{

      const updatedEmployee = await Task.findByIdAndUpdate(
      req.body.id,
      req.body,
      { new: true, runValidators: true });

      var emp_id = task_result.emp_id
      var task_title = task_result.task_title
      var task_date = task_result.task_date

      const emp_result_noti = await Employee.findById(emp_id);
      if(!emp_result_noti){
        var device_id = ''
      }else{
        if(emp_result_noti.device_id == undefined || emp_result_noti.device_id == "" || emp_result_noti.device_id == null){
          var device_id = ''
        }else{
          var device_id = emp_result_noti.device_id
          const noti_result = await Notification.find({emp_id:emp_id, is_read:false});
          var badge = noti_result.length+1
          var sending_message = {
            title:"Task re-assigned",
            message:task_title,
            date:task_date,
            type:"task",
            task_id:req.body.id,
            badge:badge,
          }

          const new_noti = await Notification.create({
            emp_id:emp_id,
            notification_for:"mobile",
            title:"Task re-assigned",
            message:task_title,
            date:task_date,
            type:"task",
            task_id:req.body.id,
            is_read:false,
            added_date:new Date().toISOString()
          });

          await sendNotification(device_id, sending_message)
        }
      }

      socket_hit.emit("fetch_emp_task_app_module")

      res.status(201).json({status:true, message:"Task update successfully"});
    }

  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.body.id);
    if (!deletedTask) {
      return res.status(200).json({status: false, message: 'Task not found' });
    }
    const task_result = await Task.findById(req.body.id);
    var emp_id = task_result.emp_id
    var task_title = task_result.task_title
    var task_date = task_result.task_date

    const emp_result_noti = await Employee.findById(emp_id);
    if(!emp_result_noti){
      var device_id = ''
    }else{
      if(emp_result_noti.device_id == undefined || emp_result_noti.device_id == "" || emp_result_noti.device_id == null){
        var device_id = ''
      }else{
        var device_id = emp_result_noti.device_id
        const noti_result = await Notification.find({emp_id:emp_id, is_read:false});
        var badge = noti_result.length+1
        var sending_message = {
          title:"Task deleted",
          message:task_title,
          date:task_date,
          type:"task",
          task_id:req.body.id,
          badge:badge,
        }

        const new_noti = await Notification.create({
          emp_id:emp_id,
          notification_for:"mobile",
          title:"Task deleted",
          message:task_title,
          date:task_date,
          type:"task",
          task_id:req.body.id,
          is_read:false,
          added_date:new Date().toISOString()
        });

        await sendNotification(device_id, sending_message)
      }
    }

    // socket_hit.emit("fetch_emp_task_app_module")
    res.json({ message: 'Task deleted successfully', data: deletedTask });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


exports.cancelTask = async (req, res) => {

  try {

    const task_result = await Task.findById(req.body.id);

    if(!task_result){
      res.status(201).json({status:false, message:"Task not available"});
    }else{

      const updatedEmployee = await Task.findByIdAndUpdate(
      req.body.id,
      {task_status:"cancelled", is_cancel:true},
      { new: true, runValidators: true });

      var emp_id = task_result.emp_id
      var task_title = task_result.task_title
      var task_date = task_result.task_date

      const emp_result_noti = await Employee.findById(emp_id);
      if(!emp_result_noti){
        var device_id = ''
      }else{
        if(emp_result_noti.device_id == undefined || emp_result_noti.device_id == "" || emp_result_noti.device_id == null){
          var device_id = ''
        }else{
          var device_id = emp_result_noti.device_id
          const noti_result = await Notification.find({emp_id:emp_id, is_read:false});
          var badge = noti_result.length+1
          var sending_message = {
            title:"Task deleted",
            message:task_title,
            date:task_date,
            type:"task",
            task_id:req.body.id,
            badge:badge,
          }

          const new_noti = await Notification.create({
            emp_id:emp_id,
            notification_for:"mobile",
            title:"Task deleted",
            message:task_title,
            date:task_date,
            type:"task",
            task_id:req.body.id,
            is_read:false,
            added_date:new Date().toISOString()
          });

          await sendNotification(device_id, sending_message)
        }
      }

      // socket_hit.emit("fetch_emp_task_app_module")
      res.status(201).json({status:true, message:"Task cancelled successfully"});
    }

  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};

exports.acceptTask = async (req, res) => {

  try {

    const task_result = await Task.findById(req.body.id);

    if(!task_result){
      res.status(201).json({status:false, message:"Task not available"});
    }else{

      const updatedEmployee = await Task.findByIdAndUpdate(
      req.body.id,
      {status_by_employee:"accepted"},
      { new: true, runValidators: true });

      console.log("updatedEmployee",updatedEmployee);

      var task_title = task_result.task_title
      var task_date = task_result.task_date

      const noti_result = await Notification.find({notification_for:"admin", is_read:false});
      var badge = noti_result.length+1

      const new_noti = await Notification.create({
        emp_id:"",
        notification_for:"admin",
        title:"Task Accepted",
        message:task_title,
        date:task_date,
        type:"task",
        task_id:req.body.id,
        is_read:false,
        added_date:new Date().toISOString()
      });

      // socket_hit.emit("fetch_task_admin_module")
      // socket_hit.emit("fetch_task_admin_module")

      res.status(201).json({status:true, message:"Task accepted successfully"});
    }
  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};

exports.markCompleteTask = async (req, res) => {
  let task_images = [];
  let original_keys = [];
  try {
    await new Promise((resolve, reject) => {
      uploadImage.array("task_images")(req, res, async function (err) {

        // console.log("yyyyyyyyyyyy",req.body);
        if (req.files && req.files.length > 0) {
          req.files?.forEach((file) => {
            task_images.push(file.location);
            original_keys.push(file.key);
          });
          const task_result = await Task.findById(req.body.id);

          try {
            if (!task_result) {
              await deleteMultipleImages(original_keys);
              return res.json({
                status: false,
                data: task_result,
                message: "Task data not found.",
              });
            }

            if(task_result.mark_complete == undefined || task_result.mark_complete == "" || task_result.mark_complete == null){
              var mark_complete = [{
                id:1,
                status:"pending",
                task_images:task_images
              }]
            }else{
              var mark_complete = task_result.mark_complete
              if(mark_complete.length > 0){
                var id = mark_complete[mark_complete.length-1].id+1
              }else{
                var id = 1
              }
              mark_complete.push({
                id:id,
                status:"pending",
                task_images:task_images
              })
            }

            const updatedEmployee = await Task.findByIdAndUpdate(
            req.body.id,
            {mark_complete:mark_complete, task_status:"completed"},
            { new: true, runValidators: true });

          } catch (validationError) {
            if (validationError.name === "ValidationError") {
              // Handle validation errors here
              const validationErrors = validationErrorHandler(validationError);
              await deleteMultipleImages(original_keys);
              res.status(400).json({
                status: false,
                message: "Validation failed. Please check your input.",
                errors: validationErrors,
              });
              return;
            }
            throw validationError;
          }

          const noti_result = await Notification.find({notification_for:"admin", is_read:false});
          var badge = noti_result.length+1

          var task_title = task_result.task_title
          var task_date = task_result.task_date

          const new_noti = await Notification.create({
            emp_id:"",
            notification_for:"admin",
            title:"Task mark completed",
            message:task_title,
            date:task_date,
            type:"task",
            task_id:req.body.id,
            is_read:false,
            added_date:new Date().toISOString()
          });

          // socket_hit.emit("fetch_task_admin_module")
          res.status(201).json({
            status: true,
            message: "Task mark completed successfully",
          });

          resolve();
        } else {
          if (err instanceof multer.MulterError) {
            reject(err);
          } else if (err) {
            reject(createError.BadRequest(err));
          } else {
            reject(createError.BadRequest("Please select file"));
          }
        }
      });
    });
  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};


exports.approveTask = async (req, res) => {

  try {
    var complete_id = req.body.complete_id

    const task_result = await Task.findById(req.body.id);

    if(!task_result){
      res.status(201).json({status:false, message:"Task not available"});
    }else{

      var mark_complete = task_result.mark_complete
      for (var i = 0; i < mark_complete.length; i++) {
        if(mark_complete[i].id == parseInt(complete_id)){
          mark_complete[i].status = 'approved'
        }
      }

      const updatedEmployee = await Task.findByIdAndUpdate(
      req.body.id,
      {task_status:"approved", mark_complete:mark_complete},
      { new: true, runValidators: true });

      var emp_id = task_result.emp_id
      var task_title = task_result.task_title
      var task_date = task_result.task_date

      const emp_result_noti = await Employee.findById(emp_id);
      if(!emp_result_noti){
        var device_id = ''
      }else{
        if(emp_result_noti.device_id == undefined || emp_result_noti.device_id == "" || emp_result_noti.device_id == null){
          var device_id = ''
        }else{
          var device_id = emp_result_noti.device_id
          const noti_result = await Notification.find({emp_id:emp_id, is_read:false});
          var badge = noti_result.length+1
          var sending_message = {
            title:"Task approved",
            message:task_title,
            date:task_date,
            type:"task",
            task_id:req.body.id,
            badge:badge,
          }

          const new_noti = await Notification.create({
            emp_id:emp_id,
            notification_for:"mobile",
            title:"Task Approved",
            message:task_title,
            date:task_date,
            type:"task",
            task_id:req.body.id,
            is_read:false,
            added_date:new Date().toISOString()
          });

          await sendNotification(device_id, sending_message)
        }
      }

      // socket_hit.emit("fetch_emp_task_app_module")
      res.status(201).json({status:true, message:"Task approved successfully"});
    }

  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};

exports.disapproveTask = async (req, res) => {
  // console.log("disapproveTask", req.body);

  try {
    var complete_id = req.body.complete_id

    const task_result = await Task.findById(req.body.id);

    if(!task_result){
      res.status(201).json({status:false, message:"Task not available"});
    }else{

      var mark_complete = task_result.mark_complete
      for (var i = 0; i < mark_complete.length; i++) {
        if(mark_complete[i].id == parseInt(complete_id)){
          mark_complete[i].status = 'disapproved'
        }
      }

      const updatedEmployee = await Task.findByIdAndUpdate(
      req.body.id,
      {task_status:"disapproved", mark_complete:mark_complete},
      { new: true, runValidators: true });

      var emp_id = task_result.emp_id
      var task_title = task_result.task_title
      var task_date = task_result.task_date

      const emp_result_noti = await Employee.findById(emp_id);
      if(!emp_result_noti){
        var device_id = ''
      }else{
        if(emp_result_noti.device_id == undefined || emp_result_noti.device_id == "" || emp_result_noti.device_id == null){
          var device_id = ''
        }else{
          var device_id = emp_result_noti.device_id
          const noti_result = await Notification.find({emp_id:emp_id, is_read:false});
          var badge = noti_result.length+1
          var sending_message = {
            title:"Task disapproved",
            message:task_title,
            date:task_date,
            type:"task",
            task_id:req.body.id,
            badge:badge,
          }

          const new_noti = await Notification.create({
            emp_id:emp_id,
            notification_for:"mobile",
            title:"Task Disapproved",
            message:task_title,
            date:task_date,
            type:"task",
            task_id:req.body.id,
            is_read:false,
            added_date:new Date().toISOString()
          });

          await sendNotification(device_id, sending_message)
        }
      }

      // socket_hit.emit("fetch_emp_task_app_module")
      res.status(201).json({status:true, message:"Task disapproved successfully"});
    }

  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};

exports.addMessageTask = async (req, res) => {

  try {

    var task_id = req.body.id
    var message = req.body.message
    var message_from = req.body.message_from
    var user_name = req.body.user_name
    var message_date = new Date().toISOString()
    const task_result = await Task.findById(task_id);

    if(!task_result){
      res.status(201).json({status:false, message:"Task not available"});
    }else{
      var emp_id = task_result.emp_id

      const task_conversation_result = await TaskConversation.find({task_id:task_id});

      if(task_conversation_result.length > 0){

        var messages = task_conversation_result[0].messages
        if(messages.length > 0){
          var message_id = messages[messages.length-1].message_id+1
        }else{
          var message_id = 1
        }
        var message_obj = {
          message_id:message_id,
          message:message,
          message_from:message_from,
          message_date:message_date,
          user_name:user_name,
          new_message:true
        }
        const updatedEmployee = await TaskConversation.findByIdAndUpdate(
          task_conversation_result[0]._id,
          {$push: {"messages":message_obj}},
          { new: true, runValidators: true });
      }else{
        var messages = [{
          message_id:1,
          message:message,
          message_from:message_from,
          message_date:message_date,
          user_name:user_name,
          new_message:true
        }]

        const new_task_con = await TaskConversation.create({
          task_id,
          emp_id,
          messages
        });
      }

      if(message_from == 'admin'){
        var emp_id = task_result.emp_id
        var task_title = task_result.task_title
        var task_date = task_result.task_date

        const emp_result_noti = await Employee.findById(emp_id);
        if(!emp_result_noti){
          var device_id = ''
        }else{
          if(emp_result_noti.device_id == undefined || emp_result_noti.device_id == "" || emp_result_noti.device_id == null){
            var device_id = ''
          }else{
            var device_id = emp_result_noti.device_id
            const noti_result = await Notification.find({emp_id:emp_id, is_read:false});
            var badge = noti_result.length+1
            var sending_message = {
              title:user_name,
              message:message,
              date:task_date,
              type:"task",
              task_id:req.body.id,
              badge:badge,
            }

            const new_noti = await Notification.create({
              emp_id:emp_id,
              notification_for:"mobile",
              title:user_name,
              message:message,
              date:task_date,
              type:"task",
              task_id:req.body.id,
              is_read:false,
              added_date:new Date().toISOString()
            });

            await sendNotification(device_id, sending_message)
          }
        }
      }else{
        const noti_result = await Notification.find({notification_for:"admin", is_read:false});
        var badge = noti_result.length+1

        var task_title = task_result.task_title
        var task_date = task_result.task_date

        const new_noti = await Notification.create({
          emp_id:"",
          notification_for:"admin",
          title:user_name,
          message:message,
          date:task_date,
          type:"task",
          task_id:req.body.id,
          is_read:false,
          added_date:new Date().toISOString()
        });
      }

      // socket_hit.emit("fetch_emp_task_app_module")
      // socket_hit.emit("fetch_task_admin_module")
      res.status(201).json({status:true, message:"Message added successfully"});
    }

  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};

exports.updateMessageTask = async (req, res) => {

  try {

    var task_id = req.body.id
    var message_id = req.body.message_id
    var message = req.body.message
    var user_name = req.body.user_name
    var message_date = new Date().toISOString()
    const task_result = await Task.findById(task_id);

    if(!task_result){
      res.status(201).json({status:false, message:"Task not available"});
    }else{
      var message_from = task_result.message_from
      const task_conversation_result = await TaskConversation.find({task_id:task_id});

      if(task_conversation_result.length > 0){

        var messages = task_conversation_result[0].messages
        for (var i = 0; i < messages.length; i++) {
          if(messages[i].message_id == message_id){
            messages[i].message = message
            messages[i].user_name = user_name
          }
        }

        const updatedEmployee = await TaskConversation.findByIdAndUpdate(
          task_conversation_result[0]._id,
          {"messages":messages},
          { new: true, runValidators: true });

          if(message_from == 'admin'){
            var emp_id = task_result.emp_id
            var task_title = task_result.task_title
            var task_date = task_result.task_date

            const emp_result_noti = await Employee.findById(emp_id);
            if(!emp_result_noti){
              var device_id = ''
            }else{
              if(emp_result_noti.device_id == undefined || emp_result_noti.device_id == "" || emp_result_noti.device_id == null){
                var device_id = ''
              }else{
                var device_id = emp_result_noti.device_id
                const noti_result = await Notification.find({emp_id:emp_id, is_read:false});
                var badge = noti_result.length+1
                var sending_message = {
                  title:user_name,
                  message:message,
                  date:task_date,
                  type:"task",
                  task_id:req.body.id,
                  badge:badge,
                }

                const new_noti = await Notification.create({
                  emp_id:emp_id,
                  notification_for:"mobile",
                  title:user_name,
                  message:message,
                  date:task_date,
                  type:"task",
                  task_id:req.body.id,
                  is_read:false,
                  added_date:new Date().toISOString()
                });

                await sendNotification(device_id, sending_message)
              }
            }
          }else{
            const noti_result = await Notification.find({notification_for:"admin", is_read:false});
            var badge = noti_result.length+1

            var task_title = task_result.task_title
            var task_date = task_result.task_date

            const new_noti = await Notification.create({
              emp_id:"",
              notification_for:"admin",
              title:user_name,
              message:message,
              date:task_date,
              type:"task",
              task_id:req.body.id,
              is_read:false,
              added_date:new Date().toISOString()
            });
          }

          // socket_hit.emit("fetch_emp_task_app_module")
          // socket_hit.emit("fetch_task_admin_module")
          res.status(201).json({status:true, message:"Message updated successfully"});
      }else{
        res.status(201).json({status:true, message:"Message not available"});
      }

    }

  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};

exports.deleteMessageTask = async (req, res) => {

  try {

    var task_id = req.body.id
    var message_id = req.body.message_id

    const task_result = await Task.findById(task_id);

    if(!task_result){
      res.status(201).json({status:false, message:"Task not available"});
    }else{

      var message_from = task_result.message_from

      const task_conversation_result = await TaskConversation.find({task_id:task_id});

      if(task_conversation_result.length > 0){

        const updatedEmployee = await TaskConversation.findByIdAndUpdate(
          task_conversation_result[0]._id,
          {$pull: {"messages":{message_id:message_id}}},
          // {$pull: {"messages.message_id":message_id}},
          { new: true, runValidators: true });


          if(message_from == 'admin'){
            var emp_id = task_result.emp_id
            var task_title = task_result.task_title
            var task_date = task_result.task_date

            const emp_result_noti = await Employee.findById(emp_id);
            if(!emp_result_noti){
              var device_id = ''
            }else{
              if(emp_result_noti.device_id == undefined || emp_result_noti.device_id == "" || emp_result_noti.device_id == null){
                var device_id = ''
              }else{
                var device_id = emp_result_noti.device_id
                const noti_result = await Notification.find({emp_id:emp_id, is_read:false});
                var badge = noti_result.length+1
                var sending_message = {
                  title:"Message deleted",
                  message:task_title,
                  date:task_date,
                  type:"task",
                  task_id:req.body.id,
                  badge:badge,
                }

                const new_noti = await Notification.create({
                  emp_id:emp_id,
                  notification_for:"mobile",
                  title:"Message deleted",
                  message:task_title,
                  date:task_date,
                  type:"task",
                  task_id:req.body.id,
                  is_read:false,
                  added_date:new Date().toISOString()
                });

                await sendNotification(device_id, sending_message)
              }
            }
          }else{
            const noti_result = await Notification.find({notification_for:"admin", is_read:false});
            var badge = noti_result.length+1

            var task_title = task_result.task_title
            var task_date = task_result.task_date

            const new_noti = await Notification.create({
              emp_id:"",
              notification_for:"admin",
              title:"Message deleted",
              message:task_title,
              date:task_date,
              type:"task",
              task_id:req.body.id,
              is_read:false,
              added_date:new Date().toISOString()
            });
          }

          // socket_hit.emit("fetch_emp_task_app_module")
          // socket_hit.emit("fetch_task_admin_module")
          res.status(201).json({status:true, message:"Message deleted successfully"});
      }else{
        res.status(201).json({status:true, message:"Message not available"});
      }

    }

  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};

exports.readNotification = async (req, res) => {

  try {

    const task_noti_result = await Notification.find({emp_id:req.body.emp_id, is_read:false});
    if(task_noti_result.length > 0){
      for (var z = 0; z < task_noti_result.length; z++) {
        const updatedNoti = await Notification.findByIdAndUpdate(
          task_noti_result[z]._id,
          {is_read:true},
          { new: true, runValidators: true });
        }
    }

    res.status(201).json({status:true, message:"Notification read successfully"});
  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};
exports.fetchNotification = async (req, res) => {

  try {

    const task_noti_result = await Notification.find({emp_id:req.body.emp_id}).sort({_id:-1});
    if(task_noti_result.length > 0){
      res.status(201).json({status:true, message:"Notification fetched successfully", data:task_noti_result});
    }else{
      res.status(201).json({status:false, message:"Notification not found"});
    }

  } catch (error) {
    console.error(error);
    res
      .status(error.status ? error.status : 500)
      .json({ status: false, error: error.message });
  }
};
