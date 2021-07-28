const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);

// Checkout Schema
const CheckoutSchema = mongoose.Schema({
   owner: {
     type: String
   },
   fname: {
     type: String
   },
   lname: {
     type: String
   },
   email: {
     type: String
   },
   phone: {
     type: String
   },
   address: {
     type: String
   },
   apt: {
     type: String
   },
   city: {
     type: String
   },
   state: {
     type: String
   },
   postal: {
     type: String
   },
   country: {
     type: String
   }
});

const Checkout = module.exports = mongoose.model('Checkout', CheckoutSchema);

// Create Checkout
module.exports.saveCheckout = (newCheckout, callback) => {
   newCheckout.save(callback);
}

// Add Checkout Item
module.exports.addCheckout = (info, callback) => {
  cartId = info['cartId'];
  productId = info['productId'];
  quantity = info['quantity'];

   const query = { _id: cartId };

   Checkout.findOneAndUpdate(query,
      {
         $addToSet: {
            "products": {
               "product_id": productId,
               "quantity": quantity
            }
         },
      },
      { safe: true, upsert: true },
      callback
   );
}
