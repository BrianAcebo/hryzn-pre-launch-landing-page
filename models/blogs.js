const mongoose = require('mongoose');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);

// Blog Schema
const BlogSchema = mongoose.Schema({
   blog_title: {
      type: String
   },
   is_draft: {
      type: Boolean
   },
   blog_image: {
      type: String
   },
   blog_description: {
      type: String
   },
   blog_owner: {
      type: String
   },
   blog_notes: {
      type: String
   },
   blog_categories: []
});

const Blog = module.exports = mongoose.model('Blog', BlogSchema);

// Get All Blog Posts
module.exports.getAllBlogPosts = (callback, limit) => {
   Blog.find(callback).limit(limit);
}

// Create Blog Post
module.exports.saveBlogPost = (newBlogPost, callback) => {
   newBlogPost.save(callback);
}
