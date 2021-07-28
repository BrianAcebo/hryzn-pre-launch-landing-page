const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);

// Cart Schema
const CartSchema = mongoose.Schema({
   owner: {
     type: String
   },
   products: [{
     product_id: {
       type: String
     },
     quantity: {
       type: Number
     }
   }]
});

const Cart = module.exports = mongoose.model('Cart', CartSchema);

// Create Cart
module.exports.saveCart = (newCart, callback) => {
   newCart.save(callback);
}

// Add Cart Item
module.exports.addCartItem = (info, callback) => {
  cartId = info['cartId'];
  productId = info['productId'];
  quantity = info['quantity'];

   const query = { _id: cartId };

   Cart.findOneAndUpdate(query,
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

// Update Cart Item
module.exports.updateCartItem = (info, callback) => {
   cartId = info['cartId'];
   productId = info['productId'];
   quantity = info['quantity'];

   const query = { _id: cartId, "products.product_id": productId };

   Cart.findOneAndUpdate(query,
      {
         $set: {
            "products.$.quantity": quantity
         },
      },
      { safe: true, upsert: true },
      callback
   );
}

// Remove Cart Item
module.exports.removeCartItem = (info, callback) => {
  cartId = info['cartId'];
  productId = info['productId'];

   const query = { _id: cartId };

   Cart.findOneAndUpdate(query,
      { $pull: { products: { 'product_id': productId } } },
      { multi: true },
      callback
   );
}
