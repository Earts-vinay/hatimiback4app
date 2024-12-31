var FCM = require('fcm-node');
require("dotenv").config();

exports.sendNotification = async (deviceID, sending_message) => {

  var title = sending_message.title;
  var message = sending_message.message;
  var date = sending_message.date;
  var type = sending_message.type;
  var task_id = sending_message.task_id;
  var badge = sending_message.badge;


  var custom_notification = {
    "body": message,
    "title": title,
    // "sound": 'hobnob_notification.wav',
    "show_in_foreground": true,
    "type" : type,
    "message": message,
    "task_id": task_id,
    "date": date,
    "badge": badge,
  }

  var apiKeyCOnst = process.env.NOTIFICATION_KEY;
  // var apiKeyCOnst = "AAAAWGDZ44M:APA91bGKcB2Ujt4yOMF8FeP_1ynE9hbzBWex7nGDaYTUyX9JObvOQWPSRWHfk_rmfqClR8MtAaB6EsMN7fDlicEa9oG0PYZwVkomD4c8DEublE8buzHj2L4mGsCXkYxcyO8w4gCq32ML";

  var deviceID = deviceID;
  var fcm = new FCM(apiKeyCOnst);

      var message = {
          to: deviceID,
          notification: {
          // data: {
              title: title,
              type : type,
              body: message,
              msg: message,
              message: message,
              task_id: task_id,
              custom_notification: custom_notification,
              date: date,
              badge: badge,
             // icon: 'ic_stat_name'
             // sound: 'hobnob_notification.wav',
          }
      };
  fcm.send(message, (err, response) => {
      if (err) {
          // //console.log(err);
      } else {
          console.log("notification send successfully ");
      }
  })
}
