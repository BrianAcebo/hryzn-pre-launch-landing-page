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
const Category = require('../models/categories');
const Product = require('../models/products');


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

     if (typeof req.user.creator_products != 'undefined') {

       if (req.user.creator_products.length > 0) {

         Product.find({ '_id': { $in: req.user.creator_products } }, (err, products) => {

           if (creator_plan.has_creator_plan) {
             res.render('dashboard/monetize', {
               page_title: page_title,
               notLoginPage: false,
               welcomePage: false,
               dashboard: true,
               dash_nav_monetize: true,
               products: products,
               dashboard_page_name: 'Monetize',
               subscription_active: creator_plan.subscription_active,
               creator_plan: creator_plan.creator_plan_name
             });
           } else {
             res.redirect('/');
           }

         });

       } else {
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
       }

     } else {
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
              res.redirect('/dashboard/monetize');

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

        if (typeof req.user.own_projects != "undefined") {

          if (req.user.own_projects.length > 0) {

            req.user.own_projects.forEach(function(proj, key) {
              Project.findByIdAndUpdate(mongoose.Types.ObjectId(proj), {
                project_owner_has_private_profile: true
              }, (err, project) => {
                 if (err) throw err;

                 project_counter += 1;

                 if (project_counter == req.user.own_projects.length) {
                   req.flash('success_msg', "Subscription was created.");
                   res.redirect('/dashboard/monetize');
                 }
              });
            });

          } else {
            req.flash('success_msg', "Subscription was created.");
            res.redirect('/dashboard/monetize');
          }

        } else {
          req.flash('success_msg', "Subscription was created.");
          res.redirect('/dashboard/monetize');
        }

      });

    }

});


router.post('/delete-subscription', (req, res) => {

  User.findByIdAndUpdate(req.user._id, {
    creator_subscription: {
      is_active: false
    }
  }, (err, user) => {
    if (err) throw err;

    User.find({ 'username': { $in: req.user.followers } }, (err, followers) => {

      var follower_count = 1;

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

        if (follower_count == req.user.followers.length) {

          req.flash('success_msg', "Subscription was deleted.");
          res.redirect('/dashboard/monetize');

        }

      }

    });

  });

});


// POST Create Product
router.post('/creator-products/add', upload.single('product_image'), (req, res, next) => {

   if(req.isAuthenticated()) {

      var product_title = req.body.product_title.replace(/\r\n/g,'')
      var product_description = req.body.product_description.replace(/\r\n/g,'');
      var product_ship_and_ret = req.body.product_ship_and_ret.replace(/\r\n/g,'');
      var product_quantity = req.body.product_quantity;
      var product_owner = req.user._id;
      var product_price = req.body.product_price;

      if (req.body.product_categories) {
         if (req.body.product_categories.length > 0) {
            var product_categories = req.body.product_categories;
         } else {
            var product_categories = [];
         }
      } else {
         var product_categories = [];
      }

      if(req.file) {

         // If user uploaded an image for project
         var ext = path.extname(req.file.originalname);

         // Check if file is an image
         if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {

            User.findById(product_owner, (err, user) => {
               if(err) throw err;

               var creator_plan = check_creator_plan(req.user.premium_creator_account);

               res.render('dashboard/monetize', {
                  error_msg: 'File Must End With .jpg .jpeg .png .gif',
                  page_title: 'Creators Account: ' + creator_plan.creator_plan_name + ' - Monetize',
                  product_title: product_title,
                  product_description: product_description,
                  product_ship_and_ret: product_ship_and_ret,
                  product_quantity: product_quantity,
                  user: user
               });
            });

         } else {
            // No errors have been made
            // var fileExt = req.file.originalname.split('.').pop();

            var filename = dateNow + req.file.originalname;
            filename = filename.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); // replace everything except letters and numbers

            var product_image = filename;

            var newProduct = new Product({
               title: product_title,
               description: product_description,
               image: product_image,
               shipping_and_returns: product_ship_and_ret,
               categories: product_categories,
               availabilty: {
                 is_in_stock: true,
                 quantity: product_quantity
               },
               price: product_price,
               owner: product_owner
            });


            product_categories.forEach(function(cat, key) {
              Category.findOne({ 'category': { $in: cat} }, (err, category) => {
                  if (err) throw err;

                  if (!category) {
                    var newCategory = new Category({
                       category: cat
                    });

                    // Create category in database
                    Category.saveCategory(newCategory, (err, category) => {
                       if(err) throw err;
                    });
                  }
               });
             });



            // Create product in database
            Product.saveProduct(newProduct, (err, product) => {
               if(err) throw err;

               // Add product to User document
               info = [];
               info['profileUsername'] = req.user.username;
               info['productId'] = product._id.toString();

               User.findByIdAndUpdate(req.user._id, {
                  creator_products_is_active: true
               }, (err, user) => {
                  if (err) throw err;

                  User.addProduct(info, (err, user) => {
                     if(err) throw err;

                     req.flash('success_msg', "Product was created.");
                     res.redirect('/dashboard/monetize');
                  });

               });

            });

         }
       }

  } else {
     res.redirect('/users/register');
  }

});


// Get Edit Product
router.get('/monetize/products/edit/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

     // Check to see if they have a plan and what plan it is
     var creator_plan = check_creator_plan(req.user.premium_creator_account);
     var page_title = 'Creators Account: ' + creator_plan.creator_plan_name + ' - Edit Product';

     if (creator_plan.has_creator_plan) {

       Product.findOne({ '_id': { $in: req.params.id} }, (err, product) => {
           if (err) throw err;

           if (product) {

             res.render('dashboard/edit-product', {
               page_title: page_title,
               notLoginPage: false,
               welcomePage: false,
               dashboard: true,
               dash_nav_monetize: true,
               dashboard_page_name: 'Edit Product',
               subscription_active: creator_plan.subscription_active,
               creator_plan: creator_plan.creator_plan_name,
               product: product
             });

           }  else {
             res.redirect('/dashboard/monetize');
           }

        });

     } else {
       res.redirect('/');
     }

   } else {
      res.redirect('/');
   }
});


// POST Edit Product
router.post('/monetize/products/edit/:id', upload.single('product_image'), (req, res, next) => {

   if(req.isAuthenticated()) {

      var product_title = req.body.product_title.replace(/\r\n/g,'')
      var product_description = req.body.product_description.replace(/\r\n/g,'');
      var product_ship_and_ret = req.body.product_ship_and_ret.replace(/\r\n/g,'');
      var product_quantity = req.body.product_quantity;
      var product_owner = req.user._id;
      var product_price = req.body.product_price;

      if (req.body.product_categories) {
         if (req.body.product_categories.length > 0) {
            var product_categories = req.body.product_categories;
         } else {
            var product_categories = [];
         }
      } else {
         var product_categories = [];
      }

      if(req.file) {

         // If user uploaded an image for project
         var ext = path.extname(req.file.originalname);

         // Check if file is an image
         if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {

            User.findById(product_owner, (err, user) => {
               if(err) throw err;

               var creator_plan = check_creator_plan(req.user.premium_creator_account);

               res.render('dashboard/edit-product', {
                  error_msg: 'File Must End With .jpg .jpeg .png .gif',
                  page_title: 'Creators Account: ' + creator_plan.creator_plan_name + ' - Monetize',
                  product_title: product_title,
                  product_description: product_description,
                  product_ship_and_ret: product_ship_and_ret,
                  product_quantity: product_quantity,
                  user: user
               });
            });

         } else {
            // No errors have been made
            // var fileExt = req.file.originalname.split('.').pop();

            var filename = dateNow + req.file.originalname;
            filename = filename.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); // replace everything except letters and numbers

            var product_image = filename;

            Product.findByIdAndUpdate(req.params.id, {
              title: product_title,
              description: product_description,
              image: product_image,
              shipping_and_returns: product_ship_and_ret,
              categories: product_categories,
              availabilty: {
                is_in_stock: true,
                quantity: product_quantity
              },
              price: product_price,
              owner: product_owner
            }, (err, user) => {

               if (err) throw err;

               product_categories.forEach(function(cat, key) {
                 Category.findOne({ 'category': { $in: cat} }, (err, category) => {
                     if (err) throw err;

                     if (!category) {
                       var newCategory = new Category({
                          category: cat
                       });

                       // Create category in database
                       Category.saveCategory(newCategory, (err, category) => {
                          if(err) throw err;
                       });
                     }
                  });
                });

                req.flash('success_msg', "Product was updated.");
                res.redirect('/dashboard/monetize');

            });

         }
       } else {

         Product.findByIdAndUpdate(req.params.id, {
           title: product_title,
           description: product_description,
           shipping_and_returns: product_ship_and_ret,
           categories: product_categories,
           availabilty: {
             is_in_stock: true,
             quantity: product_quantity
           },
           price: product_price,
           owner: product_owner
         }, (err, user) => {

            if (err) throw err;

            product_categories.forEach(function(cat, key) {
              Category.findOne({ 'category': { $in: cat} }, (err, category) => {
                  if (err) throw err;

                  if (!category) {
                    var newCategory = new Category({
                       category: cat
                    });

                    // Create category in database
                    Category.saveCategory(newCategory, (err, category) => {
                       if(err) throw err;
                    });
                  }
               });
             });

             req.flash('success_msg', "Product was updated.");
             res.redirect('/dashboard/monetize');

         });

       }

  } else {
     res.redirect('/users/register');
  }

});


// POST Edit Product
router.post('/monetize/products/delete/:id', (req, res, next) => {

   if(req.isAuthenticated()) {

     Product.findOne({ '_id': { $in: req.params.id} }, (err, product) => {
         if (err) throw err;

         if (product) {

           if (product.owner == req.user._id.toString() || req.user.username === 'hryzn') {

             // Delete project image
             var s3_instance = new aws.S3();
             var s3_params = {
                Bucket: 'hryzn-app-static-assets',
                Key: product.image
             };
             s3_instance.deleteObject(s3_params, (err, data) => {
                if(data) {
                   console.log("File deleted");
                }
                else {
                   console.log("No delete : " + err);
                }
             });

             // Delete the project
             Product.findByIdAndRemove(req.params.id, (err) => {
               if (err) throw err;

               // Add product to User document
               info = [];
               info['userId'] = req.user._id;
               info['productId'] = product._id;

               User.removeProduct(info, (err, user) => {
                  if(err) throw err;

                  req.flash('success_msg', "Destroyed From Existence...");
                  res.redirect('/dashboard/monetize');
               });

             });

           } else {
             // res.redirect('/dashboard/monetize');
             console.log('name')
           }

         }  else {
           // res.redirect('/dashboard/monetize');
           console.log('product')
         }

      });

   } else {
      res.redirect('/users/register');
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
