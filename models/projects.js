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
   saves: [],
   likes: [],
   comments: [{
      username: {
         type: String
      },
      message: {
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

// Add Save
module.exports.addSaves = (info, callback) => {
   projectId = info['projectId'];
   profileUsername = info['profileUsername'];

   const query = { _id: projectId };

   Project.findOneAndUpdate(query,
      {
         $addToSet: {"saves": [profileUsername]},
      },
      { safe: true, upsert: true },
      callback
   );
}

// Remove Saves
module.exports.removeSaves = (info, callback) => {
   projectId = info['projectId'];
   profileUsername = info['profileUsername'];

   const query = { _id: projectId };

   Project.findOneAndUpdate(query,
      { $pull: { saves: profileUsername } },
      { multi: true },
      callback
   );
}

// Add Like
module.exports.addLikes = (info, callback) => {
   projectId = info['projectId'];
   profileUsername = info['profileUsername'];

   const query = { _id: projectId };

   Project.findOneAndUpdate(query,
      {
         $addToSet: {"likes": [profileUsername]},
      },
      { safe: true, upsert: true },
      callback
   );
}

// Remove Like
module.exports.removeLikes = (info, callback) => {
   projectId = info['projectId'];
   profileUsername = info['profileUsername'];

   const query = { _id: projectId };

   Project.findOneAndUpdate(query,
      { $pull: { likes: profileUsername } },
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
