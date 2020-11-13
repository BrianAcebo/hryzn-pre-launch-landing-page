const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);

// Email Schema
const EmailSchema = mongoose.Schema({
   email: {
      type: String
   }
});

const Email = module.exports = mongoose.model('Email', EmailSchema);

// Save Email
module.exports.saveEmail = (newEmail, callback) => {
   newEmail.save(callback);
}
