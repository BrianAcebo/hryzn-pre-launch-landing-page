const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const keys = require('../config/keys');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const dateNow = Date.now().toString();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

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


// Onboard creators to setup payouts
router.post("/onboard-payouts", async (req, res) => {
  try {
    const account = await stripe.accounts.create({
      type: "express",
      email: req.user.email
    });
    req.session.accountID = account.id;

    const origin = `${req.headers.origin}`;
    const accountLinkURL = await generateAccountLink(account.id, origin);
    res.send({url: accountLinkURL});
  } catch (err) {
    res.status(500).send({
      error: err.message
    });
  }
});

router.get("/onboard-payouts/refresh", async (req, res) => {
  if (!req.session.accountID) {
    res.redirect("/");
    return;
  }
  try {
    const {accountID} = req.session;
    const origin = `${req.secure ? "https://" : "https://"}${req.headers.host}`;

    const accountLinkURL = await generateAccountLink(accountID, origin)
    res.redirect(accountLinkURL);
  } catch (err) {
    res.status(500).send({
      error: err.message
    });
  }
});

// Get checkout success
router.get('/onboard-payouts/success/:accountID', (req, res, next) => {

  if(req.isAuthenticated()) {

    var accountID = req.params.accountID;

    User.findByIdAndUpdate(req.user._id, {
       completed_onboard_payouts: true,
       stripe_connected_account_id: accountID
    }, (err, user) => {
       if (err) throw err;
       res.redirect('/dashboard');
    });

  } else {
    res.redirect('/');
  }

});

function generateAccountLink(accountID, origin) {
  return stripe.accountLinks.create({
    type: "account_onboarding",
    account: accountID,
    refresh_url: `${origin}/dashboard/onboard-payouts/refresh`,
    return_url: `${origin}/dashboard/onboard-payouts/success/` + accountID,
  }).then((link) => link.url);
}


// Get Dashboard
router.get('/', async (req, res, next) => {
  if(req.isAuthenticated()) {

    // Check to see if they have a plan and what plan it is
    var creator_plan = check_creator_plan(req.user.premium_creator_account);
    var page_title = 'Creators Account: ' + creator_plan.creator_plan_name + ' - Overview';

    if (creator_plan.has_creator_plan) {

      var stripe_connected_account_id = req.user.stripe_connected_account_id;

      const stripe_connected_account_link = await stripe.accounts.createLoginLink(stripe_connected_account_id);

      res.render('dashboard/overview', {
        page_title: page_title,
        notLoginPage: false,
        welcomePage: false,
        dashboard: true,
        dash_nav_overview: true,
        dashboard_page_name: 'Overview',
        subscription_active: creator_plan.subscription_active,
        creator_plan: creator_plan.creator_plan_name,
        stripe_connected_account_link: stripe_connected_account_link.url
      });
    } else {
      res.redirect('/');
    }

  } else {
    res.redirect('/');
  }
});


// Get Dashboard Account
router.get('/account', (req, res, next) => {
   if(req.isAuthenticated()) {

     // Check to see if they have a plan and what plan it is
     var creator_plan = check_creator_plan(req.user.premium_creator_account);
     var page_title = 'Creators Account: ' + creator_plan.creator_plan_name + ' - Account';

     if (creator_plan.has_creator_plan) {
       res.render('dashboard/account', {
         page_title: page_title,
         notLoginPage: false,
         welcomePage: false,
         dashboard: true,
         dash_nav_account: true,
         dashboard_page_name: 'Account',
         subscription_active: creator_plan.subscription_active,
         creator_plan: creator_plan.creator_plan_name
       });
     } else {
       res.redirect('/');
     }

   } else {
      res.redirect('/');
   }
});


// Get Dashboard payouts
router.get('/payouts', (req, res, next) => {
   if(req.isAuthenticated()) {

     // Check to see if they have a plan and what plan it is
     var creator_plan = check_creator_plan(req.user.premium_creator_account);
     var page_title = 'Creators Account: ' + creator_plan.creator_plan_name + ' - Payouts';

     if (creator_plan.has_creator_plan) {
       res.render('dashboard/payouts', {
         page_title: page_title,
         notLoginPage: false,
         welcomePage: false,
         dashboard: true,
         dash_nav_payouts: true,
         dashboard_page_name: 'Payouts',
         subscription_active: creator_plan.subscription_active,
         creator_plan: creator_plan.creator_plan_name
       });
     } else {
       res.redirect('/');
     }

   } else {
      res.redirect('/');
   }
});


// Get Dashboard Monetize
router.get('/monetize', (req, res, next) => {
   if(req.isAuthenticated()) {

     // Check to see if they have a plan and what plan it is
     var creator_plan = check_creator_plan(req.user.premium_creator_account);
     var page_title = 'Creators Account: ' + creator_plan.creator_plan_name + ' - Monetize';

     if (creator_plan.has_creator_plan) {
       res.render('dashboard/monetize', {
         page_title: page_title,
         notLoginPage: false,
         welcomePage: false,
         dashboard: true,
         dash_nav_monetize: true,
         dashboard_page_name: 'Monetize',
         subscription_active: creator_plan.subscription_active,
         creator_plan: creator_plan.creator_plan_name
       });
     } else {
       res.redirect('/');
     }

   } else {
      res.redirect('/');
   }
});


// Get Dashboard Analytics
router.get('/analytics', (req, res, next) => {
   if(req.isAuthenticated()) {

     // Check to see if they have a plan and what plan it is
     var creator_plan = check_creator_plan(req.user.premium_creator_account);
     var page_title = 'Creators Account: ' + creator_plan.creator_plan_name + ' - Analytics';

     if (creator_plan.has_creator_plan) {
       res.render('dashboard/analytics', {
         page_title: page_title,
         notLoginPage: false,
         welcomePage: false,
         dashboard: true,
         dash_nav_analytics: true,
         dashboard_page_name: 'Analytics',
         subscription_active: creator_plan.subscription_active,
         creator_plan: creator_plan.creator_plan_name
       });
     } else {
       res.redirect('/');
     }

   } else {
      res.redirect('/');
   }
});


// Check if they have creator plan and what plan it is
function check_creator_plan(user_plan_data) {

  switch (user_plan_data) {
    case 0:
      var creator_plan = {
        has_creator_plan: true,
        subscription_active: false,
        creator_plan_name: 'Inactive'
      }
      break;
    case 1:
      var creator_plan = {
        has_creator_plan: true,
        subscription_active: true,
        creator_plan_name: 'Personal'
      }
      break;
    case 2:
      var creator_plan = {
        has_creator_plan: true,
        subscription_active: true,
        creator_plan_name: 'Hobby'
      }
      break;
    case 3:
      var creator_plan = {
        has_creator_plan: true,
        subscription_active: true,
        creator_plan_name: 'Business'
      }
      break;
    default:
      var creator_plan = {
        has_creator_plan: false
      }
  }

  return creator_plan;

}

router.post('/creator-subscription', async (req, res) => {

    var og_amount = req.body.amount;
    var amount = req.body.amount.replace("$", "");
    amount = parseFloat(amount) * 100;


    if (req.body.is_adult_content === "true") {
       var is_adult_content = true;
    } else {
       var is_adult_content = false;
    }


    if (req.body.change_price === "true") {

      // Create a new price object with stripe
      // Stripe cannot delete prices so a new one must be created
      const price = await stripe.prices.create({
        unit_amount: amount,
        currency: 'usd',
        recurring: {interval: 'month'},
        product: req.user.creator_subscription.stripe_product_id,
      });

      // Testing showed that follower_count was 1 less than followers.length so to match it begins at 1
      var follower_count = 1;

      User.find({ 'username': { $in: req.user.followers } }, (err, followers) => {

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
                if (sub.user_following === req.user._id.toString()) {

                  (async function() {


                    // Retrieve the stripe subscription object
                    const subscription = await stripe.subscriptions.retrieve(sub.subscription_id);


                    // Update the stripe subscription object with the newly created price object
                    await stripe.subscriptions.update(sub.subscription_id,{
                      items:[{
                        price: price.id,
                      }]
                    }).then(async function() {

                      try {

                        // Delete the current item on the subscription object
                        await stripe.subscriptionItems.del(subscription.items.data[0].id);

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

          if (follower_count == req.user.followers.length) {

            // Update the user's info with the new stripe price object
            User.findByIdAndUpdate(req.user._id, {
              is_private_profile: true,
              creator_subscription: {
                stripe_product_id: req.user.creator_subscription.stripe_product_id,
                stripe_price_id: price.id,
                current_price: og_amount,
                is_active: true,
                is_adult_content: is_adult_content
              }
            }, (err, user) => {
              if (err) throw err;

              req.flash('success_msg', "Subscription was updated.");
              res.redirect('/dashboard');

            });

          }

        }

      });

    } else {

      var prod_name = req.user._id.toString() + ' - Creator Subscription';

      const product = await stripe.products.create({
        name: prod_name
      });

      const price = await stripe.prices.create({
        unit_amount: amount,
        currency: 'usd',
        recurring: {interval: 'month'},
        product: product.id,
      });

      User.findByIdAndUpdate(req.user._id, {
        is_private_profile: true,
        creator_subscription: {
          stripe_product_id: product.id,
          stripe_price_id: price.id,
          current_price: og_amount,
          is_active: true,
          is_adult_content: is_adult_content
        }
      }, (err, user) => {
        if (err) throw err;

        var project_counter = 0;

        req.user.own_projects.forEach(function(proj, key) {
          Project.findByIdAndUpdate(mongoose.Types.ObjectId(proj), {
            project_owner_has_private_profile: true
          }, (err, project) => {
             if (err) throw err;

             project_counter += 1;

             if (project_counter == req.user.own_projects.length) {
               req.flash('success_msg', "Subscription was created.");
               res.redirect('/dashboard');
             }
          });
        });

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
