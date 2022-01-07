const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);

// Category Schema
const CategorySchema = mongoose.Schema({
   category: {
      type: String
   }
});

const Category = module.exports = mongoose.model('Category', CategorySchema);

// Save Category
module.exports.saveCategory = (newCategory, callback) => {
   newCategory.save(callback);
}
