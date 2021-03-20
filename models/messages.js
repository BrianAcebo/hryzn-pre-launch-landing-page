const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);

// User Schema
const MessageSchema = mongoose.Schema({
   users: [],
   messages: [{
      username: {
         type: String
      },
      profileimage: {
         type: String
      },
      message: {
         type: String
      },
      liked: {
         type: String
      },
      date_time: {
         type: String
      }
   }],
   was_viewed: {
      type: Boolean
   },
   date_of_last_msg: {
      type: String
   },
   last_sent_by: {
      type: String
   }
});

const Message = module.exports = mongoose.model('Message', MessageSchema);

// Create Message
module.exports.saveMessage = (newMessage, callback) => {
   newMessage.save(callback);
}

// Add Message
module.exports.addMessage = (info, callback) => {
   username = info['userUsername'];
   messageId = info['messageId'];
   profileimage = info['profileimage'];
   message = info['message'];
   liked = info['liked'];
   date_time = info['date_time'];

   const query = { _id: messageId };

   Message.findOneAndUpdate(query,
      {
         $addToSet: {"messages": [{
            "username": username,
            "profileimage": profileimage,
            "message": message,
            "liked": liked,
            "date_time": date_time
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
