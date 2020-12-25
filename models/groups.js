const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);

// Group Schema
const GroupSchema = mongoose.Schema({
   users: [],
   projects: [],
   group_name: {
      type: String
   },
   group_image: {
      type: String
   },
   group_categories: [],
   is_private: {
      type: Boolean
   },
   group_admin: {
      type: String
   },
   group_code: {
      type: String
   },
   has_notification: {
      type: Boolean
   }
});

const Group = module.exports = mongoose.model('Group', GroupSchema);

// Create Group
module.exports.saveGroup = (newGroup, callback) => {
   newGroup.save(callback);
}

// Add Project
module.exports.addProject = (info, callback) => {
   groupId = info['groupId'];
   projectId = info['projectId'];

   const query = { _id: groupId };

   Group.findOneAndUpdate(query,
      {
         $addToSet: {"projects": [projectId]},
      },
      { safe: true, upsert: true },
      callback
   );
}

// Add User
module.exports.addUser = (info, callback) => {
   groupId = info['groupId'];
   username = info['profileUsername'];

   const query = { _id: groupId };

   Group.findOneAndUpdate(query,
      {
         $addToSet: {"users": [username]},
      },
      { safe: true, upsert: true },
      callback
   );
}

// Remove User
module.exports.removeUser = (info, callback) => {
   groupId = info['groupId'];
   profileUsername = info['profileUsername'];

   const query = { _id: groupId };

   Group.findOneAndUpdate(query,
      { $pull: { users: profileUsername } },
      { multi: true },
      callback
   );
}

// Remove Project
module.exports.removeProject = (info, callback) => {
   groupId = info['groupId'];
   projectId = info['projectId'];

   const query = { _id: groupId };

   Group.findOneAndUpdate(query,
      { $pull: { projects: projectId } },
      { multi: true },
      callback
   );
}
