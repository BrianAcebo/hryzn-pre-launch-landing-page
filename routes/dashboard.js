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


// Onboard creators to setup payouts
router.post("/onboard-payouts", async (req, res) => {
  try {
    const account = await stripe.accounts.create({type: "express"});
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


// Get Dashboard Build
router.get('/build', (req, res, next) => {
   if(req.isAuthenticated()) {

     // Check to see if they have a plan and what plan it is
     var creator_plan = check_creator_plan(req.user.premium_creator_account);
     var page_title = 'Creators Account: ' + creator_plan.creator_plan_name + ' - Build';

     if (creator_plan.has_creator_plan) {
       res.render('dashboard/build', {
         page_title: page_title,
         notLoginPage: false,
         welcomePage: false,
         dashboard: true,
         dash_nav_build: true,
         dashboard_page_name: 'Build',
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


// Get Dashboard Manage
router.get('/manage', (req, res, next) => {
   if(req.isAuthenticated()) {

     // Check to see if they have a plan and what plan it is
     var creator_plan = check_creator_plan(req.user.premium_creator_account);
     var page_title = 'Creators Account: ' + creator_plan.creator_plan_name + ' - Manage';

     if (creator_plan.has_creator_plan) {
       res.render('dashboard/manage', {
         page_title: page_title,
         notLoginPage: false,
         welcomePage: false,
         dashboard: true,
         dash_nav_manage: true,
         dashboard_page_name: 'Manage',
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


// Get Dashboard Marketing
router.get('/marketing', (req, res, next) => {
   if(req.isAuthenticated()) {

     // Check to see if they have a plan and what plan it is
     var creator_plan = check_creator_plan(req.user.premium_creator_account);
     var page_title = 'Creators Account: ' + creator_plan.creator_plan_name + ' - Marketing';

     if (creator_plan.has_creator_plan) {
       res.render('dashboard/marketing', {
         page_title: page_title,
         notLoginPage: false,
         welcomePage: false,
         dashboard: true,
         dash_nav_marketing: true,
         dashboard_page_name: 'Marketing',
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
