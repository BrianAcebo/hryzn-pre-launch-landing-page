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
   backgroundimage: {
      type: String
   },
   bio: {
      type: String
   },
   website: {
      type: String
   },
   youtube: {
      type: String
   },
   twitter: {
      type: String
   },
   instagram: {
      type: String
   },
   facebook: {
      type: String
   },
   followers: [],
   following: [],
   own_projects: [],
   saved_projects: [],
   reposted_projects: [],
   messages: [],
   interests: [],
   completed_interest_onboarding: {
      type: Boolean
   },
   completed_profile_setup: {
      type: Boolean
   },
   completed_modal_walkthrough: {
      type: Boolean
   },
   completed_profile_share: {
     type: Boolean
   },
   has_notification: {
      type: Boolean
   },
   groups: [{
      group_name: {
         type: String
      },
      group_id: {
         type: String
      }
   }],
   collections: [{
      collection_name: {
         type: String
      },
      collection_id: {
         type: String
      }
   }],
   profile_theme: {
      type: String
   },
   profile_cursor: {
      type: String
   },
   profile_main_accent_color: {
      type: String
   },
   profile_main_font_accent_color: {
      type: String
   },
   profile_secondary_accent_color: {
      type: String
   },
   profile_secondary_font_accent_color: {
      type: String
   },
   profile_btns_rounding: {
      type: String
   },
   profile_main_font: {
      type: String
   },
   profile_secondary_font: {
      type: String
   },
   profile_project_backgroundimage: {
      type: String
   },
   profile_project_background_color: {
      type: String
   },
   is_cc_profile: {
      type: Boolean
   },
   music_link: {
      type: String
   },
   date_of_birth: {
      type: String
   },
   is_private_profile: {
     type: Boolean
   },
   premium_creator_account: {
      type: Number
   },
   stripe_customer_id: {
      type: String
   },
   inactive_premium_creator_plan: {
      type: Number
   },
   completed_onboard_payouts: {
      type: Boolean
   },
   stripe_connected_account_id: {
     type: String
   },
   pending_friend_requests: [],
   creator_subscription: {
     stripe_product_id: {
       type: String
     },
     stripe_price_id: {
       type: String
     },
     current_price: {
       type: String
     },
     is_active: {
       type: Boolean
     },
     is_adult_content: {
       type: Boolean
     }
   },
   following_subscriptions: [{
     user_following: {
       type: String
     },
     subscription_id: {
       type: String
     }
   }],
   creator_products_is_active: {
     type: Boolean
   },
   creator_products: [],
   has_cart_items: {
     type: Boolean
   },
   total_cart_items: {
     type: Number
   },
   has_unfulfilled_items: {
     type: Boolean
   },
   is_banned: {
      type: Boolean
   },
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

module.exports.updateUser = (info, callback) => {
   profileUsername = info['profileUsername'];
   const query = { username: profileUsername };

   User.findOneAndUpdate(query,
      {
         $addToSet: {
            "completed_profile_setup": true,
            "completed_modal_walkthrough": false
         },
      },
      { safe: true, upsert: true },
      callback
   );
}

// Create Project
module.exports.createToProfile = (info, callback) => {
   profileUsername = info['profileUsername'];
   projectId = info['projectId'];
   projectTitle = info['projectTitle'];
   isPrivate = info['isPrivate'];
   projectImage = info['projectImage'];

   const query = { username: profileUsername };

   User.findOneAndUpdate(query,
      {
         $addToSet: {"own_projects": [projectId]},
      },
      { safe: true, upsert: true },
      callback
   );
}

// Delete Project
module.exports.deleteFromProfile = (info, callback) => {
   profileUsername = info['profileUsername'];
   projectId = info['projectId'];
   projectTitle = info['projectTitle'];

   const query = { username: profileUsername };

   User.findOneAndUpdate(query,
      { $pull: { "own_projects": projectId  } },
      { multi: true },
      callback
   );

}

// Save Project
module.exports.saveToProfile = (info, callback) => {
   profileUsername = info['profileUsername'];
   projectId = info['projectId'];
   projectTitle = info['projectTitle'];
   isPrivate = info['isPrivate'];
   projectImage = info['projectImage'];

   const query = { username: profileUsername };

   User.findOneAndUpdate(query,
      {
         $addToSet: {"saved_projects": [projectId]},
      },
      { safe: true, upsert: true },
      callback
   );
}

// Unsave Project
module.exports.unsaveToProfile = (info, callback) => {
   profileUsername = info['profileUsername'];
   projectId = info['projectId'];
   projectTitle = info['projectTitle'];

   const query = { username: profileUsername };

   User.findOneAndUpdate(query,
      { $pull: { "saved_projects": projectId  } },
      { multi: true },
      callback
   );

}


// Repost Project
module.exports.repostProject = (info, callback) => {
   profileUsername = info['profileUsername'];
   projectId = info['projectId'];
   projectTitle = info['projectTitle'];
   isPrivate = info['isPrivate'];
   projectImage = info['projectImage'];

   const query = { username: profileUsername };

   User.findOneAndUpdate(query,
      {
         $addToSet: {"reposted_projects": [projectId]},
      },
      { safe: true, upsert: true },
      callback
   );
}

// Unrepost Project
module.exports.unrepostProject = (info, callback) => {
   profileUsername = info['profileUsername'];
   projectId = info['projectId'];
   projectTitle = info['projectTitle'];

   const query = { username: profileUsername };

   User.findOneAndUpdate(query,
      { $pull: { "reposted_projects": projectId  } },
      { multi: true },
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


// Add Chat
module.exports.addChat = (info, callback) => {
   messageId = info['messageId'];
   username = info['profileUsername'];

   const query = { username: username };

   User.findOneAndUpdate(query,
      {
         $addToSet: {"messages": [messageId]},
      },
      { safe: true, upsert: true },
      callback
   );
}


// Remove Chat
module.exports.removeChat = (info, callback) => {
   profileUsername = info['profileUsername'];
   messageId = info['messageId'];

   const query = { username: profileUsername };

   User.findOneAndUpdate(query,
      { $pull: { "messages": messageId  } },
      { multi: true },
      callback
   );

}


// Add Notification
module.exports.addNotification = (info, callback) => {
   username = info['username'];

   const query = { username: username };

   User.findOneAndUpdate(query,
      {
         $addToSet: {"has_notification": "true"},
      },
      { safe: true, upsert: true },
      callback
   );
}

// Add Group
module.exports.addGroup = (info, callback) => {
   groupId = info['groupId'];
   profileUsername = info['profileUsername'];
   groupName = info['groupName'];

   const query = { username: profileUsername };

   User.findOneAndUpdate(query,
      {
         $addToSet: {
            "groups": {
               "group_name": groupName,
               "group_id": groupId
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
   profileUsername = info['profileUsername'];

   const query = { username: profileUsername };

   User.findOneAndUpdate(query,
      { $pull: { groups: { 'group_id': groupId } } },
      { multi: true },
      callback
   );
}

// Update Group
module.exports.updateGroup = (info, callback) => {
   userId = info['userId'];
   groupName = info['groupName'];
   groupId = info['groupId'];

   const query = { _id: userId, "groups.group_id": groupId };

   User.findOneAndUpdate(query,
      {
         $set: {
            "groups.$.group_name": groupName
         },
      },
      { safe: true, upsert: true },
      callback
   );
}

// Add Collection
module.exports.addCollection = (info, callback) => {
   collectionId = info['collectionId'];
   profileUsername = info['profileUsername'];
   collectionName = info['collectionName'];

   const query = { username: profileUsername };

   User.findOneAndUpdate(query,
      {
         $addToSet: {
            "collections": {
               "collection_name": collectionName,
               "collection_id": collectionId
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
   profileUsername = info['profileUsername'];

   const query = { username: profileUsername };

   User.findOneAndUpdate(query,
      { $pull: { collections: { 'collection_id': collectionId } } },
      { multi: true },
      callback
   );
}

// Update Collection
module.exports.updateCollection = (info, callback) => {
   userId = info['userId'];
   collectionName = info['collectionName'];
   collectionId = info['collectionId'];

   const query = { _id: userId, "collections.collection_id": collectionId };

   User.findOneAndUpdate(query,
      {
         $set: {
            "collections.$.collection_name": collectionName
         },
      },
      { safe: true, upsert: true },
      callback
   );
}


// Add Pending Request
module.exports.addRequest = (info, callback) => {
   userId_of_profile = info['profileId'];
   userId_to_add = info['userId'];

   const query = { _id: userId_of_profile };

   User.findOneAndUpdate(query,
      {
         $addToSet: {"pending_friend_requests": [userId_to_add]},
      },
      { safe: true, upsert: true },
      callback
   );
}

// Remove Pending Request
module.exports.removeRequest = (info, callback) => {
   userId_to_remove = info['userId'];
   profileId = info['profileId'];

   const query = { _id: profileId };

   User.findOneAndUpdate(query,
      { $pull: { pending_friend_requests: userId_to_remove } },
      { multi: true },
      callback
   );
}

// Add Subscription
module.exports.addSubscription = (info, callback) => {
   subId = info['subId'];
   userId = info['userId'];
   profileId = info['profileId'];

   const query = { _id: userId };

   User.findOneAndUpdate(query,
      {
         $addToSet: {
            "following_subscriptions": {
               "user_following": profileId,
               "subscription_id": subId
            }
         },
      },
      { safe: true, upsert: true },
      callback
   );
}

// Remove Subscription
module.exports.removeSubscription = (info, callback) => {
  subId = info['subId'];
  userId = info['userId'];
  profileId = info['profileId'];

   const query = { _id: userId };

   User.findOneAndUpdate(query,
      { $pull: { following_subscriptions: { 'subscription_id': subId } } },
      { multi: true },
      callback
   );
}

// Add Product
module.exports.addProduct = (info, callback) => {
   productId = info['productId'];
   profileUsername = info['profileUsername'];

   const query = { username: profileUsername };

   User.findOneAndUpdate(query,
      {
         $addToSet: {"creator_products": [productId]},
      },
      { safe: true, upsert: true },
      callback
   );
}

// Remove Product
module.exports.removeProduct = (info, callback) => {
   userId = info['userId'];
   product_to_remove = info['productId'];

   const query = { _id: userId };

   User.findOneAndUpdate(query,
      { $pull: { products: product_to_remove } },
      { multi: true },
      callback
   );
}
