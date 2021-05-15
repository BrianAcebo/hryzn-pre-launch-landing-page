const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const keys = require('../config/keys');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const dateNow = Date.now().toString();
const jwt = require('jsonwebtoken');

const stripe = require('stripe')(keys.stripeAPIKey);

aws.config.update({
   secretAccessKey: keys.secretAccessKey,
   accessKeyId: keys.accessKeyId,
   region: keys.region
});

const s3 = new aws.S3();
const storage = {
   s3: s3,
   bucket: 'hryzn-app-static-assets',
   key: (req, file, cb) => {
      // var fileExt = file.originalname.split('.').pop();
      var filename = dateNow + file.originalname;
      filename = filename.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); // replace everything except letters and numbers
      cb(null, filename);
   }
}

const upload = multer({storage: multerS3(storage)});
const multipleUpload = multer({storage: multerS3(storage)}).any();

const User = require('../models/users');
const Project = require('../models/projects');
const Message = require('../models/messages');
const Notification = require('../models/notifications');
const Group = require('../models/groups');


// Get checkout success
router.get('/creator-setup-success', (req, res, next) => {

  if(req.isAuthenticated()) {

    var priceId = req.query.priceId;

    if (priceId == 'price_1Ir6YODPMngAtAXMx120sOr3') {
      var checkoutPurchase = 1;
    }

    if (priceId == 'price_1IqjWQDPMngAtAXMkE3SfI6W') {
      var checkoutPurchase = 2;
    }

    if (priceId == 'price_1IqkrvDPMngAtAXMQPTTUlwx') {
      var checkoutPurchase = 3;
    }

    console.log(priceId + '\n' + checkoutPurchase);

    // User.findByIdAndUpdate(req.user._id, {
    //    premium_creator_account: checkoutPurchase
    // }, (err, user) => {
    //    if (err) throw err;
    //    res.redirect('/dashboard');
    // });

  } else {
    res.redirect('/');
  }

});


// Get checkout canceled
router.get('/creator-canceled', (req, res, next) => {
   if(req.isAuthenticated()) {

     res.render('creator-canceled', {
       page_title: 'Are you sure you want to cancel?',
       notLoginPage: false,
       welcomePage: false
     });

   } else {
      res.redirect('/');
   }
});


router.post('/create-creator-checkout-session', async (req, res) => {

  const { priceId } = req.body;

  // See https://stripe.com/docs/api/checkout/sessions/create
  // for additional parameters to pass.

  console.log(priceId);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          // For metered billing, do not pass quantity
          quantity: 1,
        },
      ],
      // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
      // the actual Session ID is returned in the query parameter when your customer
      // is redirected to the success page.
      success_url: 'https://myhryzn.com/creators/creator-setup-success?session_id={CHECKOUT_SESSION_ID}&price_id=' + priceId,
      cancel_url: 'https://myhryzn.com/creators/creator-canceled'
    });

    res.send({
      sessionId: session.id,
    });
  } catch (e) {
    console.log(e.message);
    res.status(400);
    return res.send({
      error: {
        message: e.message,
      }
    });
  }
});


// Verify JS Web Token
function verifyToken(req, res, next) {

   var bearerReq = req.body._c_;

   console.log(bearerReq);

   if (typeof bearerReq !== 'undefined') {

      var bearerToken = bearerReq.split(' ')[1];
      req.token = bearerToken;

   } else {
      res.sendStatus(403);
   }

   next()
}

module.exports = router;
