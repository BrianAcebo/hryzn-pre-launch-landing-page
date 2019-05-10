const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);

// User Schema
const UserSchema = mongoose.Schema({
   firstname: {
      type: String
   },
   lastname: {
      type: String
   },
   username: {
      type: String
   },
   email: {
      type: String
   },
   password: {
      type: String,
      bcrypt: true
   },
   profileimage: {
      type: String
   },
   bio: {
      type: String
   },
   followers: [],
   following: [],
   projects: [{
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Project'
   }]
});

const User = module.exports = mongoose.model('User', UserSchema);

// Get User By Id
module.exports.getUserById = (id, callback) => {
   User.findById(id, callback);
}

// Get User By Username
module.exports.getUserByUsername = (username, callback) => {
   const query = { username: username };
   User.findOne(query, callback);
}

// Get User By Email
module.exports.getUserByEmail = (email, callback) => {
   const query = { email: email };
   User.findOne(query, callback);
}

// Compare Password
module.exports.comparePassword = (passwordToCheck, hash, callback) => {
   bcrypt.compare(passwordToCheck, hash, (err, isMatch) => {
      if(err) throw err;
      callback(null, isMatch);
   });
}

// Create User Account
module.exports.saveUser = (newUser, callback) => {
   bcrypt.hash(newUser.password, 10, (err, hash) => {
      if(err) throw err;
      // Set hash
      newUser.password = hash;
      console.log('User Saved');
      newUser.save(callback);
   });
}

// Follow Project
module.exports.followProject = (info, callback) => {
   profileUsername = info['profileUsername'];
   projectId = info['projectId'];
   projectTitle = info['projectTitle'];
   isPrivate = info['isPrivate'];
   projectImage = info['projectImage'];

   const query = { username: profileUsername };

   User.findOneAndUpdate(query,
      { $push: { "projects": projectId }},
      { safe: true, upsert: true },
      callback
   );
}

// Add Followers
module.exports.addFollowers = (info, callback) => {
   profileId = info['profileId'];
   username_to_add = info['userUsername'];

   const query = { _id: profileId };

   User.findOneAndUpdate(query,
      {
         $addToSet: {"followers": [username_to_add]},
      },
      { safe: true, upsert: true },
      callback
   );
}

// Add Following
module.exports.addFollowing = (info, callback) => {
   userId = info['userId'];
   username_to_add = info['profileUsername'];

   const query = { _id: userId };

   User.findOneAndUpdate(query,
      {
         $addToSet: {"following": [username_to_add]},
      },
      { safe: true, upsert: true },
      callback
   );
}

// Remove Followers
module.exports.removeFollowers = (info, callback) => {
   profileId = info['profileId'];
   username_to_remove = info['userUsername'];

   const query = { _id: profileId };

   User.findOneAndUpdate(query,
      { $pull: { followers: username_to_remove } },
      { multi: true },
      callback
   );
}

// Remove Followers
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

// Unfollow Project
module.exports.unfollowProject = (info, callback) => {
   profileUsername = info['profileUsername'];
   projectId = info['projectId'];
   projectTitle = info['projectTitle'];

   const query = { username: profileUsername };

   User.findOneAndUpdate(query,
      { $pull: { projects: { project_id: projectId } } },
      { multi: true },
      callback
   );

}
