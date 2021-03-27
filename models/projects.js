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
   thumbnail_image: {
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
   project_owner_profile_image: {
      type: String
   },
   date_posted: {
      type: String
   },
   admins: [],
   saves: [],
   reposts: [],
   likes: [],
   comments_id: {
      type: String
   },
   project_notes: {
      type: String
   },
   project_url: {
      type: String
   },
   categories: [],
   is_micro_post: {
      type: Boolean
   },
   micro_body: {
      type: String
   },
   micro_image: {
      type: String
   },
   micro_audio: {
      type: String
   },
   micro_video: {
      type: String
   },
   posted_to_group: [{
      group_id: {
         type: String
      },
      group_name: {
         type: String
      },
      group_is_private: {
         type: String
      }
   }],
   posted_to_collection: [{
      collection_id: {
         type: String
      },
      collection_name: {
         type: String
      },
      collection_is_private: {
         type: String
      },
      followers: [],
      collection_owner: {
         type: String
      }
   }],
   project_slug: {
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

// Add Repost
module.exports.addReposts = (info, callback) => {
   projectId = info['projectId'];
   profileUsername = info['profileUsername'];

   const query = { _id: projectId };

   Project.findOneAndUpdate(query,
      {
         $addToSet: {"reposts": [profileUsername]},
      },
      { safe: true, upsert: true },
      callback
   );
}

// Remove Repost
module.exports.removeReposts = (info, callback) => {
   projectId = info['projectId'];
   profileUsername = info['profileUsername'];

   const query = { _id: projectId };

   Project.findOneAndUpdate(query,
      { $pull: { reposts: profileUsername } },
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

// Add Group
module.exports.addGroup = (info, callback) => {
   projectId = info['projectId'];
   groupName = info['groupName'];
   groupId = info['groupId'];
   groupIsPrivate = info['groupIsPrivate'];

   const query = { _id: projectId };

   Project.findOneAndUpdate(query,
      {
         $addToSet: {
            "posted_to_group": {
               "group_id": groupId,
               "group_name": groupName,
               "group_is_private": groupIsPrivate
            }
         },
      },
      { safe: true, upsert: true },
      callback
   );
}


// Update Group
module.exports.updateGroup = (info, callback) => {
   projectId = info['projectId'];
   groupName = info['groupName'];
   groupId = info['groupId'];
   groupIsPrivate = info['groupIsPrivate'];

   const query = { _id: projectId };

   Project.findOneAndUpdate(query,
      {
         $set: {
            "posted_to_group": {
               "group_id": groupId,
               "group_name": groupName,
               "group_is_private": groupIsPrivate
            }
         },
      },
      { safe: true, upsert: true },
      callback
   );
}

// Remove Group
module.exports.removeGroup = (info, callback) => {
   groupId = info['groupId'];
   projectId = info['projectId'];

   const query = { _id: projectId };

   Project.findOneAndUpdate(query,
      {
         $set: { "posted_to_group": [] }
      },
      { multi: true },
      callback
   );
}

// Add Collection
module.exports.addCollection = (info, callback) => {
   projectId = info['projectId'];
   collectionName = info['collectionName'];
   collectionId = info['collectionId'];
   collectionIsPrivate = info['collectionIsPrivate'];
   collectionFollowers = info['collectionFollowers'];
   collectionOwner = info['collectionOwner'];

   const query = { _id: projectId };

   Project.findOneAndUpdate(query,
      {
         $addToSet: {
            "posted_to_collection": {
               "collection_id": collectionId,
               "collection_name": collectionName,
               "collection_is_private": collectionIsPrivate,
               "followers": collectionFollowers,
               "collection_owner": collectionOwner
            }
         },
      },
      { safe: true, upsert: true },
      callback
   );
}

// Remove Collection
module.exports.removeCollection = (info, callback) => {
   collectionId = info['collectionId'];
   projectId = info['projectId'];

   const query = { _id: projectId };

   Project.findOneAndUpdate(query,
      { $pull: { posted_to_collection: [{ 'collection_id': collectionId }] } },
      { multi: true },
      callback
   );
}


// Update Collection
module.exports.updateCollection = (info, callback) => {
   projectId = info['projectId'];
   collectionName = info['collectionName'];
   collectionId = info['collectionId'];
   collectionIsPrivate = info['collectionIsPrivate'];
   collectionFollowers = info['collectionFollowers'];
   collectionOwner = info['collectionOwner'];

   const query = { _id: projectId };

   Project.findOneAndUpdate(query,
      {
         $set: {
            "posted_to_collection": {
               "collection_id": collectionId,
               "collection_name": collectionName,
               "collection_is_private": collectionIsPrivate,
               "followers": collectionFollowers,
               "collection_owner": collectionOwner
            }
         },
      },
      { safe: true, upsert: true },
      callback
   );
}
