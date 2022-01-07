const mongoose = require('mongoose');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);

// Blog Schema
const BlogSchema = mongoose.Schema({
  blog_title: {
    type: String,
    required: true,
    trim: true
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
  written_by: {
    type: String
  },
  blog_notes: {
    type: String
  },
  blog_categories: [],
  date_created: {
    type: String
  },
  blog_slug: {
    type: String,
    unique: true,
    required: true,
    trim: true
  }
}, { timestamps: true });

const Blog = module.exports = mongoose.model('Blog', BlogSchema);

// Get All Blog Posts
module.exports.getAllPosts = (callback, limit) => {
   Blog.find(callback).limit(limit);
}

// Create Blog Post
module.exports.savePost = (newPost, callback) => {
   newPost.save(callback);
}
