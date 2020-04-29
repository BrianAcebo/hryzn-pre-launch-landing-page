const mongoose = require('mongoose');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);

// Blog Schema
const PostSchema = mongoose.Schema({
   post_title: {
      type: String
   },
   is_draft: {
      type: Boolean
   },
   post_image: {
      type: String
   },
   post_description: {
      type: String
   },
   post_owner: {
      type: String
   },
   post_notes: {
      type: String
   },
   post_categories: [],
   post_date: {
      type: String
   },
   post_slug: {
      type: String
   }
});

const Post = module.exports = mongoose.model('Post', PostSchema);

// Get All Blog Posts
module.exports.getAllPosts = (callback, limit) => {
   Post.find(callback).limit(limit);
}

// Create Blog Post
module.exports.savePost = (newPost, callback) => {
   newPost.save(callback);
}
