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
      project_id: {
         type: String
      },
      username: {
         type: String
      },
      profileimage: {
         type: String
      },
      message: {
         type: String
      }
   }],
   project_notes: {
      type: String
   },
   categories: []
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

// Add Comment
module.exports.addComment = (info, callback) => {
   projectId = info['projectId'];
   profileUsername = info['profileUsername'];
   profileimage = info['profileimage'];
   comment = info['comment'];

   const query = { _id: projectId };

   Project.findOneAndUpdate(query,
      {
         $addToSet: {
            "comments": {
               "project_id": projectId,
               "username": profileUsername,
               "profileimage": profileimage,
               "message": comment
            }
         },
      },
      { safe: true, upsert: true },
      callback
   );
}

// Remove Comment
module.exports.removeComment = (info, callback) => {
   projectId = info['projectId'];
   commentId = info['commentId'];

   const query = { _id: projectId };

   Project.findOneAndUpdate(query,
      { $pull: { comments: { '_id': commentId } } },
      { multi: true },
      callback
   );
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
