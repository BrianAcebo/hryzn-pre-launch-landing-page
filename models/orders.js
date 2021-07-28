const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);

// Order Schema
const OrderSchema = mongoose.Schema({
  order_number: {
    type: String
  },
  date_was_created: {
    type: String
  },
  customer: {
    type: String
  },
  customer_total_amount: {
    type: String
  },
  customer_subtotal_amount: {
    type: String
  },
  customer_shipping_amount: {
    type: String
  },
  items: [{
    owner: {
      type: String
    },
    total_amount: {
      type: String
    },
    fulfillment_status: {
      type: Number
    },
    tracking_info: {
      type: String
    },
    subtotal: {
      type: String
    },
    shipping_cost: {
      type: String
    },
    total: {
      type: String
    },
    products: []
  }],
  contact_info: {
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
    }
  },
  shipping_info: {
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
  },
  billing_info: {
    billing_fname: {
      type: String
    },
    billing_lname: {
      type: String
    },
    billing_address: {
      type: String
    },
    billing_apt: {
      type: String
    },
    billing_city: {
      type: String
    },
    billing_state: {
      type: String
    },
    billing_postal: {
      type: String
    },
    billing_country: {
      type: String
    }
  }
});

const Order = module.exports = mongoose.model('Order', OrderSchema);

// Create Order
module.exports.saveOrder = (newOrder, callback) => {
   newOrder.save(callback);
}

// Add Order Item
module.exports.addOrderItem = (info, callback) => {
  orderId = info['orderId'];
  productId = info['productId'];
  quantity = info['quantity'];

   const query = { _id: orderId };

   Order.findOneAndUpdate(query,
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

// Update Order Item
module.exports.updateOrderItem = (info, callback) => {
   orderId = info['orderId'];
   productId = info['productId'];
   quantity = info['quantity'];

   const query = { _id: orderId, "products.product_id": productId };

   Order.findOneAndUpdate(query,
      {
         $set: {
            "products.$.quantity": quantity
         },
      },
      { safe: true, upsert: true },
      callback
   );
}

// Remove Order Item
module.exports.removeOrderItem = (info, callback) => {
  orderId = info['orderId'];
  productId = info['productId'];

   const query = { _id: orderId };

   Order.findOneAndUpdate(query,
      { $pull: { products: { 'product_id': productId } } },
      { multi: true },
      callback
   );
}
