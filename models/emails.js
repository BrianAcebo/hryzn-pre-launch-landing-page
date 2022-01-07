const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);

// Email Schema
const EmailSchema = mongoose.Schema({
   email: {
     type: String,
     unique: true,
     required: true,
     trim: true
   },
   share_ref: {
     type: String,
     unique: true,
     required: true
   },
   place_in_wait_list: {
     type: Number,
     unique: true,
     required: true
   }
}, { timestamps: true });

const Email = module.exports = mongoose.model('Email', EmailSchema);

// Save Email
module.exports.saveEmail = (newEmail, callback) => {
   newEmail.save(callback);
}
