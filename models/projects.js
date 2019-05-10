const mongoose = require('mongoose');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);

// Project Schema
const ProjectSchema = mongoose.Schema({
   project_title: {
      type: String
   },
   is_private: {
      type: Boolean
   },
   project_image: {
      type: String
   },
   project_video: {
      type: String
   },
   project_description: {
      type: String
   },
   project_owner: {
      type: String
   },
   admins: [],
   followers: [],
   likes: [],
   files: [],
   lists: [{
      list_title: {
         type: String
      },
      list_items: [],
      list_order: {
         type: String
      }
   }],
   project_notes: {
      type: String
   }
});

const Project = module.exports = mongoose.model('Project', ProjectSchema);

// Get All Projects
module.exports.getAllProjects = (callback, limit) => {
   Project.find(callback).limit(limit);
}

// Create Project
module.exports.saveProject = (newProject, callback) => {
   newProject.save(callback);
}

// Add Followers
module.exports.addFollowers = (info, callback) => {
   projectId = info['projectId'];
   profileUsername = info['profileUsername'];

   const query = { _id: projectId };

   Project.findOneAndUpdate(query,
      {
         $addToSet: {"followers": [profileUsername]},
      },
      { safe: true, upsert: true },
      callback
   );
}

// Remove Followers
module.exports.removeFollowers = (info, callback) => {
   projectId = info['projectId'];
   profileUsername = info['profileUsername'];

   const query = { _id: projectId };

   Project.findOneAndUpdate(query,
      { $pull: { followers: profileUsername } },
      { multi: true },
      callback
   );
}

// Add Admins
module.exports.addAdmin = (info, callback) => {
   projectId = info['projectId'];
   profileUsername = info['profileUsername'];

   const query = { _id: projectId };

   Project.findOneAndUpdate(query,
      {
         $addToSet: {"admins": [profileUsername]},
      },
      { safe: true, upsert: true },
      callback
   );
}
