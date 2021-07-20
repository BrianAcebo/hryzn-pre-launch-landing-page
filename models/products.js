const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);

// Product Schema
const ProductSchema = mongoose.Schema({
   title: {
     type: String
   },
   description: {
     type: String
   },
   image: {
     type: String
   },
   shipping_and_returns: {
     type: String
   },
   categories: [],
   availability: {
     is_in_stock: {
       type: Boolean
     },
     quantity: {
       type: String
     }
   },
   price: {
     type: String
   },
   owner: {
     type: String
   }
});

const Product = module.exports = mongoose.model('Product', ProductSchema);

// Create Product
module.exports.saveProduct = (newProduct, callback) => {
   newProduct.save(callback);
}
