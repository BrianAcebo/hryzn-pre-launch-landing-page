const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const keys = require('../config/keys');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const dateNow = Date.now().toString();
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const stripe = require('stripe')(keys.stripeAPIKey);
const webhookSecret = keys.stripeWebhookSecret;

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

    var priceId = req.query.price_id;

    if (priceId == 'price_1Ir6YODPMngAtAXMx120sOr3') {
      var checkoutPurchase = 1;
    }

    if (priceId == 'price_1IqjWQDPMngAtAXMkE3SfI6W') {
      var checkoutPurchase = 2;
    }

    if (priceId == 'price_1IqkrvDPMngAtAXMQPTTUlwx') {
      var checkoutPurchase = 3;
    }

    User.findByIdAndUpdate(req.user._id, {
       premium_creator_account: checkoutPurchase
    }, (err, user) => {
       if (err) throw err;
       res.redirect('/dashboard');
    });

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
  var user_id = req.user._id.toString()

  // See https://stripe.com/docs/api/checkout/sessions/create
  // for additional parameters to pass.

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
      cancel_url: 'https://myhryzn.com/creators/creator-canceled',
      metadata: { user_id: user_id }
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


// Webhook endpoint to provision subscriptions
router.post("/webhook", async (req, res) => {
  let data;
  let eventType;
  // Check if webhook signing is configured.
  if (webhookSecret) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers["stripe-signature"];

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      // console.log(err + '\n' + 'End err');
      // console.log('Req.body: ' + req.body + '\n' + signature + '\n' + webhookSecret);
      return res.sendStatus(400);
    }
    // Extract the object from the event.
    data = event.data;
    eventType = event.type;
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  }

  console.log(eventType);

  switch (eventType) {
      case 'checkout.session.completed':
        // Payment is successful and the subscription is created.
        // You should provision the subscription and save the customer ID to your database.

        var hryzn_user_id = data.object.metadata.user_id;
        var stripe_customer_id = data.object.customer;

        User.findByIdAndUpdate(hryzn_user_id, {
           stripe_customer_id: stripe_customer_id
        }, (err, user) => {
           if (err) throw err;
        });

        break;
      case 'invoice.paid':
        // Continue to provision the subscription as payments continue to be made.
        // Store the status in your database and check when a user accesses your service.
        // This approach helps you avoid hitting rate limits.

        var stripe_customer_id = data.object.customer;

        User.findOne({ 'stripe_customer_id': { $in: stripe_customer_id} }, (err, user) => {

           if(err) throw err;

           // Give the user access back to their original plan before payment failed
           if (user && user.inactive_premium_creator_plan > 0) {

             User.findByIdAndUpdate(user._id, {
                premium_creator_account: user.inactive_premium_creator_plan,
                inactive_premium_creator_plan: 0,
                creator_subscription: {
                  is_active: true
                }
             }, (err, user) => {
                if (err) throw err;
             });
           }

        });

        break;
      case 'invoice.payment_failed':
        // The payment failed or the customer does not have a valid payment method.
        // The subscription becomes past_due. Notify your customer and send them to the
        // customer portal to update their payment information.

        var stripe_customer_id = data.object.customer;

        User.findOne({ 'stripe_customer_id': { $in: stripe_customer_id} }, (err, user) => {

           if(err) throw err;


           // Payment failed so their access is removed
           if (user) {

             var inactive_premium_creator_plan = user.premium_creator_account;

             User.findByIdAndUpdate(user._id, {
                premium_creator_account: 0,
                inactive_premium_creator_plan: inactive_premium_creator_plan,
                creator_subscription: {
                  is_active: false
                }
             }, (err, user) => {
                if (err) throw err;
             });
           }

        });

        break;
      case 'customer.subscription.updated':
        // The customer updated their subscription.

        // Either subscription paused or product changed

        var stripe_customer_id = data.object.customer;

        if (data.object.pause_collection == null || typeof data.object.pause_collection == 'undefined') {

          // Pause subscription object empty so product was change

          var price_id = data.object.items.data[0].price.id;

          if (price_id == 'price_1Ir6YODPMngAtAXMx120sOr3') {
            var product_number = 1;
          }

          if (price_id == 'price_1IqjWQDPMngAtAXMkE3SfI6W') {
            var product_number = 2;
          }

          if (price_id == 'price_1IqkrvDPMngAtAXMQPTTUlwx') {
            var product_number = 3;
          }

          User.findOne({ 'stripe_customer_id': { $in: stripe_customer_id} }, (err, user) => {

             if(err) throw err;

             if (user) {

               if (user.inactive_premium_creator_plan > 0) {

                 User.findByIdAndUpdate(user._id, {
                    premium_creator_account: user.inactive_premium_creator_plan,
                    inactive_premium_creator_plan: 0
                 }, (err, user) => {
                    if (err) throw err;
                 });
               } else {

                 User.findByIdAndUpdate(user._id, {
                    premium_creator_account: product_number,
                    creator_subscription: {
                      is_active: false
                    }
                 }, (err, user) => {
                    if (err) throw err;

                    if (product_number == 1) {

                      User.find({ 'username': { $in: user.followers } }, (err, followers) => {

                        var follower_count = 0;

                        // Iterate through each of the user's followers
                        for (let i = 0; i < followers.length; i++) {

                          follower_count += 1;
                          var follower = followers[i];


                          // Check if the followers have subscriptions
                          if (typeof follower.following_subscriptions != 'undefined') {

                            if (follower.following_subscriptions.length >= 1) {


                              // Iterate through a follower's subscriptions
                              for (let f = 0; f < follower.following_subscriptions.length; f++) {

                                var sub = follower.following_subscriptions[f];


                                // Check if the subscription is the same as the current user's
                                if (sub.user_following === user._id.toString()) {

                                  info = [];
                                  info['profileId'] = user._id;
                                  info['userId'] = follower._id;
                                  info['subId'] = sub.subscription_id;

                                  (async function() {

                                    await stripe.subscriptions.del(sub.subscription_id).then(function() {
                                      try {

                                        User.removeSubscription(info, (err, user) => {
                                          if(err) throw err;

                                        });

                                      } catch {
                                        return res.status(500).send({
                                          error: err.message
                                        });
                                      }
                                    });

                                  })();

                                }

                              }
                            }

                          }

                        }

                      });

                    }

                 });

               }
             }

          });

        } else {

          // Pause subscription object has data

          User.findOne({ 'stripe_customer_id': { $in: stripe_customer_id} }, (err, user) => {

             if(err) throw err;

             if (user) {

               User.findByIdAndUpdate(user._id, {
                 premium_creator_account: 0,
                 inactive_premium_creator_plan: user.premium_creator_account
               }, (err, user) => {
                  if (err) throw err;
               });
             }

          });
        }

        break;
      case 'customer.subscription.deleted':
        // The customer canceled their subscription.

        console.log(data.object);

        var stripe_customer_id = data.object.customer;

        User.findOne({ 'stripe_customer_id': { $in: stripe_customer_id} }, (err, user) => {

           if(err) throw err;

           if (user) {

             if (typeof user.premium_creator_account != 'undefined') {

               if (user.premium_creator_account >=  0) {

                 if (user.creator_subscription.is_active) {

                   User.find({ 'username': { $in: user.followers } }, (err, followers) => {

                     var follower_count = 0;

                     // Iterate through each of the user's followers
                     for (let i = 0; i < followers.length; i++) {

                       follower_count += 1;
                       var follower = followers[i];


                       // Check if the followers have subscriptions
                       if (typeof follower.following_subscriptions != 'undefined') {

                         if (follower.following_subscriptions.length >= 1) {


                           // Iterate through a follower's subscriptions
                           for (let f = 0; f < follower.following_subscriptions.length; f++) {

                             var sub = follower.following_subscriptions[f];


                             // Check if the subscription is the same as the current user's
                             if (sub.user_following === user._id.toString()) {

                               info = [];
                               info['profileId'] = user._id;
                               info['userId'] = follower._id;
                               info['subId'] = sub.subscription_id;

                               (async function() {

                                 await stripe.subscriptions.del(sub.subscription_id).then(function() {
                                   try {

                                     User.removeSubscription(info, (err, user) => {
                                       if(err) throw err;

                                     });

                                   } catch {
                                     return res.status(500).send({
                                       error: err.message
                                     });
                                   }
                                 });

                               })();

                             }

                           }
                         }

                       }

                     }

                   });

                 }

                 User.findByIdAndUpdate(user._id, {
                    premium_creator_account: 5,
                    completed_onboard_payouts: false,
                    creator_subscription: {
                      is_active: false
                    }
                 }, (err, user) => {
                    if (err) throw err;
                 });

               }

             }

           }

        });

        break;
      default:
      // Unhandled event type
    }

  res.sendStatus(200);
});


// Stripe customer portal
router.post('/customer-portal', async (req, res) => {
  // This is the url to which the customer will be redirected when they are done
  // managing their billing with the portal.
  const returnUrl = 'https://myhryzn.com/dashboard';
  var customer_id = req.user.stripe_customer_id;

  const portalsession = await stripe.billingPortal.sessions.create({
    customer: customer_id,
    return_url: returnUrl,
  });

  res.send({
    url: portalsession.url,
  });
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
