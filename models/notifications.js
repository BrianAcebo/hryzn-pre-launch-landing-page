const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);

// User Schema
const NotificationSchema = mongoose.Schema({
   sender: {
      type: String
   },
   reciever: {
      type: String
   },
   type: {
      type: String
   },
   link: {
      type: String
   }
});

const Notification = module.exports = mongoose.model('Notification', NotificationSchema);

// Create Notification
module.exports.saveNotification = (newNotification, callback) => {
   newNotification.save(callback);
}

// Add Following
module.exports.addNotification = (info, callback) => {
   username = info['userUsername'];
   messageId = info['messageId'];
   profileimage = info['profileimage'];
   message = info['message'];

   const query = { _id: messageId };

   Notification.findOneAndUpdate(query,
      {
         $addToSet: {"messages": [{
            "username": username,
            "profileimage": profileimage,
            "message": message
         }]},
      },
      { safe: true, upsert: true },
      callback
   );
}


// Remove Following
module.exports.removeFollowing = (info, callback) => {
   userId = info['userId'];
   username_to_remove = info['profileUsername'];

   const query = { _id: userId };

   User.findOneAndUpdate(query,
      { $pull: { following: username_to_remove } },
      { multi: true },
      callback
   );
}
