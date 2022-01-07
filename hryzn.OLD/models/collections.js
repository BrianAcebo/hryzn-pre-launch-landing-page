const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);

// Collection Schema
const CollectionSchema = mongoose.Schema({
   followers: [],
   projects: [],
   collection_name: {
      type: String
   },
   collection_categories: [],
   is_private: {
      type: Boolean
   },
   collection_owner: {
      type: String
   },
   collection_slug: {
      type: String
   }
});

const Collection = module.exports = mongoose.model('Collection', CollectionSchema);

// Create Collection
module.exports.saveCollection = (newCollection, callback) => {
   newCollection.save(callback);
}

// Add Project
module.exports.addProject = (info, callback) => {
   collectionId = info['collectionId'];
   projectId = info['projectId'];

   const query = { _id: collectionId };

   Collection.findOneAndUpdate(query,
      {
         $addToSet: {"projects": [projectId]},
      },
      { safe: true, upsert: true },
      callback
   );
}

// Remove Project
module.exports.removeProject = (info, callback) => {
   collectionId = info['collectionId'];
   projectId = info['projectId'];

   const query = { _id: collectionId };

   Collection.findOneAndUpdate(query,
      { $pull: { projects: projectId } },
      { multi: true },
      callback
   );
}

// Add User
module.exports.addUser = (info, callback) => {
   collectionId = info['collectionId'];
   username = info['profileUsername'];

   const query = { _id: collectionId };

   Collection.findOneAndUpdate(query,
      {
         $addToSet: {"followers": [username]},
      },
      { safe: true, upsert: true },
      callback
   );
}

// Remove User
module.exports.removeUser = (info, callback) => {
   collectionId = info['collectionId'];
   profileUsername = info['profileUsername'];

   const query = { _id: collectionId };

   Collection.findOneAndUpdate(query,
      { $pull: { followers: profileUsername } },
      { multi: true },
      callback
   );
}
