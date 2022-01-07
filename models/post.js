const mongoose = require('mongoose');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);

// Blog Schema
const PostSchema = mongoose.Schema({
  post_title: {
    type: String,
    required: true,
    trim: true
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
    type: String,
    unique: true,
    required: true,
    trim: true
  }
}, { timestamps: true });

const Post = module.exports = mongoose.model('Post', PostSchema);
