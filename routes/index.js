const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const keys = require('../config/keys');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3'); // AWS Multer
const dateNow = Date.now().toString();
const jwt = require('jsonwebtoken');
const request = require('request');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

var current_date = new Date();
var current_date_and_time = current_date.toLocaleString()
var day = String(current_date.getDate()).padStart(2, '0');
var month = String(current_date.getMonth() + 1).padStart(2, '0');
var year = current_date.getFullYear();
current_date = month + '/' + day + '/' + year;

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
const Collection = require('../models/collections');
const Email = require('../models/emails');
const Category = require('../models/categories');
const Product = require('../models/products');
const Cart = require('../models/cart');
const Checkout = require('../models/checkout');
const Order = require('../models/orders');
const Post = require('../models/blogs');


// To create csv file for email list

// const createCsvWriter = require('csv-writer').createObjectCsvWriter;
// var emails = [];
//
// User.find({}, (err, users) => {
//   users.forEach(function(user, key) {
//     var emailObject = {
//       email: user.email
//     }
//     emails.push(emailObject);
//   });
//
//
//  console.log(emails);
//
//  const csvWriter = createCsvWriter({
//    path: 'email-list_2.csv',
//    header: [
//      {id: 'email', title: 'Email'}
//    ]
//  });
//
//  csvWriter
//    .writeRecords(emails)
//    .then(()=> console.log('The CSV file was written successfully'));
//
// });

// Get Welcome Landing Page
router.get('/', (req, res, next) => {

  // User domains *.myhryzn.com
  if (req.subdomains.length && req.subdomains.slice(-1)[0] != 'www') {

    var user_subdomain = req.subdomains.slice(-1)[0];

    User.findOne({ 'username': { $in: user_subdomain} }, (err, profile) => {

       if (profile) {

          if(err) throw err;

          if(req.isAuthenticated()) {

            if (req.user.date_of_birth) {
              var user_dob = req.user.date_of_birth.split('/');

              var dob_day = user_dob[0];
              var dob_month = user_dob[1];
              var dob_year = user_dob[2];

              var curr_dateObj = new Date();
              var curr_month = curr_dateObj.getUTCMonth() + 1; //months from 1-12
              var curr_day = curr_dateObj.getUTCDate();
              var curr_year = curr_dateObj.getUTCFullYear();

              if (parseInt(curr_year) - parseInt(dob_year) > 18) {
                 var can_view_adult_content = true;
              } else if (parseInt(curr_month) - parseInt(dob_month) > 0 && parseInt(curr_year) - parseInt(dob_year) == 18) {
                 var can_view_adult_content = true;
              } else if (parseInt(curr_day) - parseInt(dob_day) >= 0 && parseInt(curr_month) - parseInt(dob_month) == 0 && parseInt(curr_year) - parseInt(dob_year) == 18) {
                 var can_view_adult_content = true;
              } else {
                 var can_view_adult_content = false;
              }

            } else {

              var can_view_adult_content = true;

            }

          } else {
             var guestUser = true;
             var can_view_adult_content = false;
          }

          if(req.isAuthenticated()) {
             // User is seeing their own profile
             if(profile.username === req.user.username) {
                var viewing_own_profile = true;
             } else {
                var viewing_own_profile = false;
             }

             // Hryzn Admin
             if (req.user.username === 'hryzn') {
                var hryznAdmin = true;
             } else {
                var hryznAdmin = false;
             }

             var is_following = false;

             profile.followers.forEach(function(follower, key) {
               if (follower === req.user.username) {
                 is_following = true;
               }
             });

             if (profile.is_private_profile && viewing_own_profile) {
               var unable_to_view_private_profile = false;
             } else if (profile.is_private_profile && hryznAdmin) {
               var unable_to_view_private_profile = false;
             } else if (profile.is_private_profile && is_following) {
               var unable_to_view_private_profile = false;
             } else if (profile.is_private_profile) {
               var unable_to_view_private_profile = true;
             } else {
               var unable_to_view_private_profile = false;
             }

          } else {
             var viewing_own_profile = false;
          }

          if(profile.followers) {

             var amount_of_followers = profile.followers.length;

             if(req.isAuthenticated()) {
                if(profile.followers.indexOf(req.user.username) === -1) {
                   var user_follows_profile = false;
                } else {
                   var user_follows_profile = true;
                }
             } else {
                var user_follows_profile = false;
             }

          } else {

             // Profile has no followers
             var user_follows_profile = false;
             var amount_of_followers = 0;

          }


          if(profile.following) {
             var amount_of_following = profile.following.length;
          } else {
             // Profile is not following anyone
             var amount_of_following = 0;
          }


          if(profile.own_projects) {
             var amount_of_projects = profile.own_projects.length;
          } else {
             var amount_of_projects = 0;
          }


          var viewer_has_pending_request;

          profile.pending_friend_requests.forEach(function(request, key) {
            if (request == req.user._id.toString()) {
              viewer_has_pending_request = true;
            }
          });


          if (profile.collections) {

             var collection_ids = [];
             profile.collections.forEach(function(collection, key) {
                collection_ids.push(collection.collection_id);
             });

             Collection.find({ '_id': { $in: collection_ids} }, (err, collections) => {
                if (err) throw err;

                var collection_projects = [];

                var all_collections = [];

                collections.forEach(function(collection, key) {

                   if(req.isAuthenticated()) {

                      if (collection.collection_owner === req.user.username) {

                         // Owner is viewing collection
                         Project.find({ '_id': { $in: collection.projects} }, (err, projects) => {
                            if (err) throw err;

                            var reversed_projects = projects.reverse();

                            all_collections.push({
                               "collection_name": collection.collection_name,
                               "projects": reversed_projects,
                               "collection_slug": collection.collection_slug,
                               "id": collection._id,
                               "is_private": collection.is_private
                            });
                         });
                      } else if (collection.is_private) {

                         // Must follow to see private collection
                         collection.followers.forEach(function(follower, key) {
                            if (follower == req.user._id) {
                               Project.find({ '_id': { $in: collection.projects} }, (err, projects) => {
                                  if (err) throw err;

                                  var reversed_projects = projects.reverse();

                                  all_collections.push({
                                     "collection_name": collection.collection_name,
                                     "projects": reversed_projects,
                                     "collection_slug": collection.collection_slug,
                                     "id": collection._id,
                                     "is_private": collection.is_private
                                  });
                               });
                            }
                         });
                      } else {

                         // Collection is public to all
                         Project.find({ '_id': { $in: collection.projects} }, (err, projects) => {
                            if (err) throw err;

                            var reversed_projects = projects.reverse();

                            all_collections.push({
                               "collection_name": collection.collection_name,
                               "projects": reversed_projects,
                               "collection_slug": collection.collection_slug,
                               "id": collection._id,
                               "is_private": collection.is_private
                            });
                         });
                      }
                   } else {
                      if (!collection.is_private) {
                         // Collection is public to all
                         Project.find({ '_id': { $in: collection.projects} }, (err, projects) => {
                            if (err) throw err;

                            var reversed_projects = projects.reverse();

                            all_collections.push({
                               "collection_name": collection.collection_name,
                               "projects": reversed_projects,
                               "collection_slug": collection.collection_slug,
                               "id": collection._id,
                               "is_private": collection.is_private
                            });
                         });
                      }
                   }
                });

                Project.find({ '_id': { $in: profile.own_projects} }, (err, projects) => {
                   if (err) throw err;

                   var reversed_projects = projects.reverse();

                   all_public_projects = [];

                   if (viewing_own_profile) {
                      all_collections.push({
                         "collection_name": 'All',
                         "projects": reversed_projects,
                         "collection_slug": 'all',
                         "collection_all": true,
                         "is_private": false
                      });
                   } else {
                      var good_project;
                      reversed_projects.forEach(function(project, key) {
                         good_project = false;

                         if(project.posted_to_collection) {

                            if (project.posted_to_collection.length > 0) {
                               project.posted_to_collection.forEach(function(project_collection, key) {
                                  if (project_collection.collection_is_private) {
                                     // do nothing
                                  } else {
                                     good_project = true;
                                  }
                               });
                            } else {
                               good_project = true;
                            }
                         } else {
                            good_project = true;
                         }

                         if(good_project) {
                            all_public_projects.push(project);
                         }

                      });

                      all_collections.push({
                         "collection_name": 'All',
                         "projects": all_public_projects,
                         "collection_slug": 'all',
                         "collection_all": true,
                         "is_private": false
                      });
                   }

                   Project.find({ '_id': { $in: profile.saved_projects} }, (err, saved_projects) => {
                      if (err) throw err;

                      var reversed_saved_projects = saved_projects.reverse();

                      Project.find({ '_id': { $in: profile.reposted_projects} }, (err, reposted_projects) => {
                         if (err) throw err;

                         var reversed_reposted_projects = reposted_projects.reverse();

                         User.find({ 'username': { $in: profile.followers} }, (err, followers) => {

                            if (typeof profile.profile_theme == 'undefined') {
                               var pageRender = 'profile-themes/default';
                            } else {
                               var pageRender = 'profile-themes/' + profile.profile_theme;
                            }

                            if (profile.premium_creator_account == 0 || profile.premium_creator_account == 1 || profile.premium_creator_account == 2 || profile.premium_creator_account == 3) {
                               var premium_creator_account = true;
                            } else {
                              var premium_creator_account = false;
                            }

                            Product.find({ '_id': { $in: profile.creator_products} }, (err, products) => {
                               if (err) throw err;

                              res.render(pageRender, {
                                 page_title: '@' + profile.username,
                                 page_description: profile.bio,
                                 profile: profile,
                                 projects: reversed_projects,
                                 collections: all_collections.reverse(),
                                 saved_projects: reversed_saved_projects,
                                 reposted_projects: reversed_reposted_projects,
                                 user_follows_profile: user_follows_profile,
                                 amount_of_followers: amount_of_followers,
                                 amount_of_following: amount_of_following,
                                 amount_of_projects: amount_of_projects,
                                 viewing_own_profile: viewing_own_profile,
                                 guestUser: guestUser,
                                 hryznAdmin: hryznAdmin,
                                 profile_active: true,
                                 profilePage: true,
                                 followers: followers,
                                 premium_creator_account: premium_creator_account,
                                 main_page_nav: true,
                                 unable_to_view_private_profile: unable_to_view_private_profile,
                                 viewer_has_pending_request: viewer_has_pending_request,
                                 can_view_adult_content: can_view_adult_content,
                                 products: products,
                                 payment_element: true
                              });

                            });

                         });

                      });
                   });

                });

             });

          } else {

             Project.find({ '_id': { $in: profile.own_projects} }, (err, projects) => {
                if (err) throw err;

                var reversed_projects = projects.reverse();

                var private_amount = [];
                projects.forEach(function(project, index) {
                   if (project.is_private) {
                      private_amount.push(project);
                   }
                });

                amount_of_projects = amount_of_projects - private_amount.length;

                Project.find({ '_id': { $in: profile.saved_projects} }, (err, saved_projects) => {
                   if (err) throw err;

                   var reversed_saved_projects = saved_projects.reverse();

                   Project.find({ '_id': { $in: profile.reposted_projects} }, (err, reposted_projects) => {
                      if (err) throw err;

                      var reversed_reposted_projects = reposted_projects.reverse();

                      if (typeof profile.profile_theme == 'undefined') {
                         var pageRender = 'profile-themes/default';
                      } else {
                         var pageRender = 'profile-themes/' + profile.profile_theme;
                      }

                      if (profile.premium_creator_account == 0 || profile.premium_creator_account == 1 || profile.premium_creator_account == 2 || profile.premium_creator_account == 3) {
                        var premium_creator_account = true;
                      } else {
                        var premium_creator_account = false;
                      }

                      Product.find({ '_id': { $in: profile.creator_products} }, (err, products) => {
                         if (err) throw err;

                        res.render(pageRender, {
                           page_title: '@' + profile.username,
                           page_description: profile.bio,
                           profile: profile,
                           projects: reversed_projects,
                           saved_projects: reversed_saved_projects,
                           reposted_projects: reversed_reposted_projects,
                           user_follows_profile: user_follows_profile,
                           amount_of_followers: amount_of_followers,
                           amount_of_following: amount_of_following,
                           amount_of_projects: amount_of_projects,
                           viewing_own_profile: viewing_own_profile,
                           guestUser: guestUser,
                           hryznAdmin: hryznAdmin,
                           profile_active: true,
                           profilePage: true,
                           noCollections: noCollections,
                           premium_creator_account: premium_creator_account,
                           main_page_nav: true,
                           unable_to_view_private_profile: unable_to_view_private_profile,
                           viewer_has_pending_request: viewer_has_pending_request,
                           can_view_adult_content: can_view_adult_content,
                           products: products,
                           payment_element: true
                        });

                      });
                   });
                });
             });
          }

       } else {
          res.redirect('/');
       }

    });

  } else {

    // myhryzn home domain
    if(req.isAuthenticated()) {

       var info = [];

       // Greeting was not working on iphone

       // var now = new Date();
       // var time = now.getHours();
       //
       // console.log(time);

       // if (time >= 12 && time < 18) {
       //    var greeting = 'Good afternoon';
       // } else if (time >= 18 && time < 24) {
       //    var greeting = 'Good evening';
       // } else {
       //    var greeting = 'Good morning';
       // }

       var greeting = 'Hello'

       // User's Subscriptions Feed
       if (req.user.following) {
          User.find({ 'username': { $in: req.user.following } }, (err, profiles) => {
             if (err) throw err;

             var profile_project = [];

             req.user.own_projects.forEach(function(proj, key) {
                profile_project.push(proj);
             });

             req.user.reposted_projects.forEach(function(proj, key) {
                profile_project.push(proj);
             });

             profiles.forEach(function(profile, key) {
                profile.own_projects.forEach(function(proj, key) {
                   profile_project.push(proj);
                });
                profile.reposted_projects.forEach(function(proj, key) {
                   profile_project.push(proj);
                });
             });

             Project.find({ '_id': { $in: profile_project } }, (err, projects) => {

                if (err) throw err;

                var all_public_projects = [];

                projects.forEach(function(project, key) {

                   // Scan through every project

                   var project = project.toObject();

                   profiles.forEach(function(profile, key) {
                      profile.reposted_projects.forEach(function(proj_id, key) {
                         if (project._id == proj_id) {
                            project.reposted_by = profile.username;
                         }
                      });
                   });

                   req.user.reposted_projects.forEach(function(proj_id, key) {
                      if (project._id == proj_id) {
                         project.reposted_by = req.user.username;
                      }
                   });

                   // If the project has any saves
                   if (project.saves.length  > 0) {
                      var saves_amount = project.saves.length;
                      var enough_saves = true;
                      // If the person viewing saved the project
                      if (project.saves.indexOf(req.user.username) > -1) {
                         var user_saved = true;
                         project.user_saved = true;
                      }
                   } else {
                      // Project has no saves
                      var user_saved = false;
                      var saves_amount = 0;
                      var enough_saves = false;
                      project.user_saved = false;
                   }

                   // If the project has any likes
                   if (project.likes.length > 0) {
                      var likes_amount = project.likes.length;
                      var enough_likes = true;
                      // If the person viewing liked the project
                      if (project.likes.indexOf(req.user.username) > -1) {
                         var user_liked = true;
                         project.user_liked = true;
                      }
                   } else {
                      // Project has no likes
                      var user_liked = false;
                      var likes_amount = 0;
                      var enough_likes = false;
                      project.user_liked = false;
                   }

                   // If the project has any reposts
                   if (project.reposts.length > 0) {
                      var repost_amount = project.reposts.length;
                      var enough_reposts = true;
                      // If the person viewing reposted the project
                      if (project.reposts.indexOf(req.user.username) > -1) {
                         var user_reposted = true;
                         project.user_reposted = true;
                      }
                   } else {
                      // Project has no reposts
                      var repost_amount = 0;
                      var enough_reposts = false;
                      project.user_reposted = false;
                   }

                   if(project.posted_to_collection) {
                      if (project.posted_to_collection.length > 0) {

                         // See if project has any collections

                         project.posted_to_collection.forEach(function(project_collection, key) {

                            if (project_collection.collection_is_private) {

                               // If collection was private check to see if they're allowed to see it

                               if (project_collection.followers.length > 0) {
                                  project_collection.followers.forEach(function(follower, key) {
                                     if (follower == req.user._id || project_collection.collection_owner === req.user.username) {
                                        project.private_collection_name = project_collection.collection_name;
                                        all_public_projects.push(project);
                                     }
                                  });
                               } else {
                                  if (project_collection.collection_owner === req.user.username) {
                                     project.private_collection_name = project_collection.collection_name;
                                     all_public_projects.push(project);
                                  }
                               }

                            } else {
                               // If collection was public mark that we scanned collection
                               all_public_projects.push(project);
                            }
                         });
                      } else {
                         // No collections so we mark that we scanned project
                         all_public_projects.push(project);
                      }
                   } else {
                      // No collections so we mark that we scanned project
                      all_public_projects.push(project);
                   }

                });

                var user_groups = [];

                req.user.groups.forEach(function(group, key) {
                   user_groups.push(group.group_id);
                });

                Group.find({ '_id': { $in: user_groups } }, (err, groups) => {

                   Project.find({ 'categories': { $in: req.user.interests} }, (err, suggested_projects) => {

                     if (err) throw err;

                     Project.find({}, (err, all_suggested_projects) => {

                        if (err) throw err;

                        suggested_projects = suggested_projects.concat(all_suggested_projects);

                        var suggested_public_projects = [];

                        suggested_projects.forEach(function(project, key) {

                           // Scan through every project

                           if(project.posted_to_collection) {
                              if (project.posted_to_collection.length > 0) {

                                 // See if project has any collections

                                 project.posted_to_collection.forEach(function(project_collection, key) {

                                    if (project_collection.collection_is_private) {

                                       // If collection was private skip project

                                    } else {
                                       // If collection was public mark that we scanned collection
                                       suggested_public_projects.push(project);
                                    }
                                 });
                              } else {
                                 // No collections so we mark that we scanned project
                                 suggested_public_projects.push(project);
                              }
                           } else {
                              // No collections so we mark that we scanned project
                              suggested_public_projects.push(project);
                           }
                        });

                        function shuffle(array) {
                          var currentIndex = array.length, temporaryValue, randomIndex;

                          // While there remain elements to shuffle...
                          while (0 !== currentIndex) {

                            // Pick a remaining element...
                            randomIndex = Math.floor(Math.random() * currentIndex);
                            currentIndex -= 1;

                            // And swap it with the current element.
                            temporaryValue = array[currentIndex];
                            array[currentIndex] = array[randomIndex];
                            array[randomIndex] = temporaryValue;
                          }

                          return array;
                        }

                        shuffle(suggested_public_projects);

                        var reverse_suggested_projects = suggested_public_projects.slice(0,9);

                        var reverse_suggested_projects_num2 = suggested_public_projects.slice(10,19);

                        var reverse_suggested_projects_num3 = suggested_public_projects.slice(20,29);

                        User.find({ 'interests': { $in: req.user.interests} }, (err, suggested_profiles) => {

                           shuffle(suggested_profiles);

                           var reverse_suggested_profiles = suggested_profiles.slice(0,9).reverse();

                           var reverse_suggested_profiles_num2 = suggested_profiles.slice(10,19).reverse();

                           var reverse_suggested_profiles_num3 = suggested_profiles.slice(20,29).reverse();

                           Group.find({ 'group_categories': { $in: req.user.interests} }, (err, suggested_groups) => {

                              if (suggested_groups.length < 1) {
                                 Group.find({}, (err, suggested_groups) => {

                                    shuffle(suggested_groups);

                                    var reverse_suggested_groups = suggested_groups.slice(0,3).reverse();

                                    var reverse_suggested_groups_num2 = suggested_groups.slice(4,6).reverse();

                                    var reverse_suggested_groups_num3 = suggested_groups.slice(7,10).reverse();

                                    res.render('index', {
                                       page_title: 'Welcome',
                                       greeting: greeting,
                                       projects: all_public_projects.reverse(),
                                       suggested_projects: reverse_suggested_projects,
                                       suggested_profiles: reverse_suggested_profiles,
                                       suggested_groups: reverse_suggested_groups,
                                       suggested_projects_num2: reverse_suggested_projects_num2,
                                       suggested_profiles_num2: reverse_suggested_profiles_num2,
                                       suggested_groups_num2: reverse_suggested_groups_num2,
                                       suggested_projects_num3: reverse_suggested_projects_num3,
                                       suggested_profiles_num3: reverse_suggested_profiles_num3,
                                       suggested_groups_num3: reverse_suggested_groups_num3,
                                       profiles: profiles,
                                       groups: groups,
                                       explore_default: true,
                                       index_active: true,
                                       linear_feed: true,
                                       main_page_nav: true
                                    });
                                 });
                              } else {

                                shuffle(suggested_groups);

                                var reverse_suggested_groups = suggested_groups.slice(0,3).reverse();

                                var reverse_suggested_groups_num2 = suggested_groups.slice(4,6).reverse();

                                var reverse_suggested_groups_num3 = suggested_groups.slice(7,10).reverse();

                                 res.render('index', {
                                    page_title: 'Welcome',
                                    greeting: greeting,
                                    projects: all_public_projects.reverse(),
                                    suggested_projects: reverse_suggested_projects,
                                    suggested_profiles: reverse_suggested_profiles,
                                    suggested_groups: reverse_suggested_groups,
                                    suggested_projects_num2: reverse_suggested_projects_num2,
                                    suggested_profiles_num2: reverse_suggested_profiles_num2,
                                    suggested_groups_num2: reverse_suggested_groups_num2,
                                    suggested_projects_num3: reverse_suggested_projects_num3,
                                    suggested_profiles_num3: reverse_suggested_profiles_num3,
                                    suggested_groups_num3: reverse_suggested_groups_num3,
                                    profiles: profiles,
                                    groups: groups,
                                    explore_default: true,
                                    index_active: true,
                                    linear_feed: true,
                                    main_page_nav: true
                                 });
                              }
                           });
                        });

                      });
                   });

                });

             });
          });
       } else {
          res.redirect('/explore');
       }

    } else {

       var featured_projects = [
          '5cdc5b07294e1e0017d3f87e',
          '5ec2d44b3140810017388fd9',
          '5ec7e44081ccba00177f86d0',
          '5ec16bceb65710001792819c',
          '5e9379216387290017b85ebb',
          '5cda25cc5f66f6001759268a',
          '5e7d700888041a0017351dc4',
          '5f234106570ea01a26cd426e'
       ];

       var featured_groups = [
          '5f11bdd40e1d0b001758aa3b',
          '5ebccaba0cb91f72b7c3c8c5',
          '5f11c5c60e1d0b001758aa56'
       ];

       Project.find({ '_id': { $in: featured_projects } }, (err, projects) => {

          if (err) throw err;

          Group.find({ '_id': { $in: featured_groups} }, (err, groups) => {

             if (err) throw err;

             Post.findOne({ 'post_slug': { $in: 'briut-essentials-bettering-the-planet-while-bettering-ourselves.' } }, (err, case_study) => {

                if (err) throw err;

                Post.find({}, (err, posts) => {

                   if (err) throw err;

                   var blog_posts = []
                   var rev_posts = posts.reverse();

                   if (posts[0].post_slug == case_study.post_slug || posts[0].is_draft) {
                     blog_posts.push(posts[1]);
                     blog_posts.push(posts[2]);
                     blog_posts.push(posts[3]);
                   }

                   if (posts[1].post_slug == case_study.post_slug || posts[1].is_draft) {
                     blog_posts.push(posts[0]);
                     blog_posts.push(posts[2]);
                     blog_posts.push(posts[3]);
                   }

                   if (posts[2].post_slug == case_study.post_slug || posts[2].is_draft) {
                     blog_posts.push(posts[0]);
                     blog_posts.push(posts[1]);
                     blog_posts.push(posts[3]);
                   }

                    res.render('welcome', {
                       page_title: "The creator's marketplace with the simplest way to connect with your community and build your business.",
                       notLoginPage: false,
                       projects: projects,
                       groups: groups,
                       welcomePage: true,
                       case_study: case_study,
                       blog_posts: blog_posts
                    });

               });

            });

          });

       }).limit(8);

    }
  }

});

// Get Welcome Redirect
router.get('/welcome', (req, res, next) => {
   res.redirect('/');
});


// Get Creatives
router.get('/creatives', (req, res, next) => {
  if(req.isAuthenticated()) {
    if (req.user.premium_creator_account == 0 || req.user.premium_creator_account == 1 || req.user.premium_creator_account == 2 || req.user.premium_creator_account == 3) {
       var premium_creator_account = true;
    } else {
      var premium_creator_account = false;
    }
  }

  res.render('creatives', {
    page_title: 'Creatives',
    notLoginPage: false,
    creativesPage: true,
    creatorSetup: true,
    premium_creator_account: premium_creator_account
  });
});


// Get Creatives
router.get('/creatives/early', (req, res, next) => {
   res.redirect('/creatives');
});


// POST Creatives
router.post('/creatives/early', (req, res, next) => {

   if (typeof req.body.top_email !='undefined') {
      var body_email = req.body.top_email.replace(/\r\n/g,'').trim();

      // Form Validation
      req.checkBody('top_email', 'Please Enter An Email Address').notEmpty();
      req.checkBody('top_email', 'Please Enter A Valid Email Address').isEmail();
   } else {
      var body_email = req.body.bottom_email.replace(/\r\n/g,'').trim();

      // Form Validation
      req.checkBody('bottom_email', 'Please Enter An Email Address').notEmpty();
      req.checkBody('bottom_email', 'Please Enter A Valid Email Address').isEmail();
   }

   var errors = req.validationErrors();

   if(errors) {
      res.render('creatives', {
        page_title: 'Creatives',
        notLoginPage: false,
        creativesPage: true,
        errors: errors,
        creatorSetup: true
      });
   } else {

      Email.findOne({ 'email': { $in: body_email} }, (err, email) => {

         if(err) throw err;

         if (email) {

            res.render('creatives', {
              page_title: 'Creatives',
              notLoginPage: false,
              creativesPage: true,
              error_msg: 'Sorry that email is already in use.',
              creatorSetup: true
            });

         } else {
            var newEmail = new Email({
               email: body_email
            });

            // Save email
            Email.saveEmail(newEmail, (err, user) => {
               if(err) throw err;

               res.render('creatives', {
                 page_title: 'Creatives',
                 notLoginPage: false,
                 creativesPage: true,
                 creatorSetup: true,
                 thanks: true
               });
            });
         }

      });
   }
});


// Get Profile Setup
router.get('/setup-profile', (req, res, next) => {
   if(req.isAuthenticated()) {

      User.find({ '_id': { $in: req.user._id} }, (err, user) => {

         if (err) throw err;

         if (user.completed_profile_setup) {
            res.redirect('/settings');
         } else {
            res.render('setup-profile', {
              page_title: 'Setup Your Profile',
              notLoginPage: false,
              setupProfilePage: true
            });
         }

      });

   } else {
      res.redirect('/');
   }
});


// Get Profile Setup Next or Skip
router.get('/setup-profile/:answer', (req, res, next) => {
   if(req.isAuthenticated()) {

      if (req.user.completed_profile_setup) {
         res.redirect('/settings');
      } else {

         var answer = req.params.answer;

         if (answer === 'skip') {

            User.findByIdAndUpdate(req.user._id, {
               completed_profile_setup: true
            }, (err, user) => {
               if (err) throw err;
               res.redirect('/walkthrough/interests');
            });

         } else if (answer === 'next') {

            res.render('setup-profile', {
               page_title: 'Setup Your Profile',
               notLoginPage: false,
               setupProfilePage: true,
               setup_next: true
            });

         } else {
            res.redirect('/');
         }
      }

   } else {
      res.redirect('/');
   }
});


// Post Profile Setup Next
router.post('/setup-profile/next',  upload.fields([{name: 'profileimage', maxCount: 1}, {name: 'backgroundimage', maxCount: 1}]), (req, res, next) => {
   if(req.isAuthenticated()) {

      function capitalize(string) {
         return string.charAt(0).toUpperCase() + string.slice(1);
      }

      // var username = req.body.username;
      var bio = req.body.bio.replace(/\r\n/g,'');
      var music_link = req.body.music_link.replace(/\r\n/g,'');

      if(req.body.firstname === "") {
         var firstname = "";
      } else {
         var firstname = req.body.firstname.replace(/\r\n/g,'');
         firstname = capitalize(firstname);
         req.checkBody('firstname', 'First Name Is Too Long').isLength({ min: 0, max:50 });
      }

      if(req.body.lastname === "") {
         var lastname = "";
      } else {
         var lastname = req.body.lastname.replace(/\r\n/g,'');
         lastname = capitalize(lastname);
         req.checkBody('lastname', 'Last Name Is Too Long').isLength({ min: 0, max:50 });
      }

      if (typeof req.body.music_link == 'undefined' || req.body.music_link == '' || req.body.music_link.length < 0) {
         var embed_link = req.user.music_link;
      } else {
         var music_link = req.body.music_link.replace(/\r\n/g,'');

         // See which service is music link
         var is_spotify = music_link.search("open.spotify.com/track/");
         var is_tidal = music_link.search("tidal.com/browse/track/");
         var is_tidal_2 = music_link.search("tidal.com/track/");
         var is_soundcloud = music_link.search("soundcloud.com/");
         var is_apple = music_link.search("music.apple.com/us/album/");
         var is_deezer = music_link.search("deezer.com/track");

         var embed_link;

         if (is_spotify > -1) {
            var spotify_track_id = music_link.split("/track/")[1];
            embed_link = '<iframe style="min-height: auto!important; z-index: 555555;" src="https://open.spotify.com/embed/track/' + spotify_track_id + '" width="300" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>'
         } else if (is_tidal > -1 || is_tidal_2 > -1) {
            var tidal_track_id = music_link.split("/track/")[1];
            embed_link = '<div style="position: relative;  overflow: hidden; max-width: 100%; z-index: 555555;"><iframe src="https://embed.tidal.com/tracks/' + tidal_track_id + '?layout=gridify" frameborder="0" allowfullscreen style="top: 0; left: 0; width: 100%; min-height: 100%; margin: 0 auto;"></iframe></div>'
         } else if (is_apple > -1) {
            var apple_track_id = music_link.split("music.apple.com/us/")[1];
            embed_link = '<iframe allow="autoplay *; encrypted-media *; fullscreen *" frameborder="0" height="150" style="width:100%;max-width:660px;overflow:hidden;background:transparent;z-index: 555555;" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" src="https://embed.music.apple.com/us/' + apple_track_id + '"></iframe>'
         } else if (is_deezer > -1) {
            var deezer_track_id = music_link.split("/track/")[1];
            embed_link = '<iframe style="z-index: 555555;"scrolling="no" frameborder="0" allowTransparency="true" src="https://www.deezer.com/plugins/player?format=classic&autoplay=false&playlist=true&width=700&height=350&color=EF5466&layout=&size=medium&type=tracks&id=' + deezer_track_id + '&app_id=1" width="700" height="350"></iframe>'
         } else {
            // nothing
            embed_link = req.user.music_link;
         }
      }

      // Profile Customization
      if (typeof req.body.profile_theme == 'undefined') {
         var profile_theme = req.user.profile_theme;
      } else {
         var profile_theme = req.body.profile_theme;
      }

      // Form Validation
      // req.checkBody('username', 'Please Enter A Username').notEmpty();
      // req.checkBody('username', 'Username Must Be Between 5-50 Characters').isLength({ min: 5, max:50 });
      req.checkBody('bio', 'Bio Is Too Long.').isLength({ min: 0, max: 200 });

      errors = req.validationErrors();

      if(errors) {
         User.findById(req.user._id, (err, user) => {
            if(err) throw err;

            res.render('setup-profile', {
               errors: errors,
               page_title: 'Setup Your Profile',
               user: user,
               setup_next: true,
               firstname: firstname,
               lastname: lastname,
               bio: bio,
               profile_theme: profile_theme,
               music_link: music_link
            });
         });
      } else {
         if(req.files.profileimage || req.files.backgroundimage) {

            var continue_process = true;

            if (req.files.profileimage) {
               var ext = path.extname(req.files.profileimage[0].originalname);

               if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {

                  continue_process = false;

                  User.findById(req.user._id, (err, user) => {
                     if(err) throw err;

                     res.render('setup-profile', {
                        error_msg: 'Profile Image Must End With .jpg .jpeg .png .gif',
                        page_title: 'Setup Your Profile',
                        user: user,
                        setup_next: true,
                        firstname: firstname,
                        lastname: lastname,
                        bio: bio,
                        profile_theme: profile_theme,
                        music_link: embed_link
                     });
                  });
               } else {
                  var filename = dateNow + req.files.profileimage[0].originalname;
                  filename = filename.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); // replace everything except letters and numbers

                  var profileimage = filename;
               }
            } else {
               var profileimage = req.user.profileimage;
            }

            if (req.files.backgroundimage) {
               var ext = path.extname(req.files.backgroundimage[0].originalname);

               if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {

                  if (continue_process) {
                     User.findById(req.user._id, (err, user) => {
                        if(err) throw err;

                        res.render('setup-profile', {
                           error_msg: 'Header Image Must End With .jpg .jpeg .png .gif',
                           page_title: 'Setup Your Profile',
                           user: user,
                           setup_next: true,
                           firstname: firstname,
                           lastname: lastname,
                           bio: bio,
                           profile_theme: profile_theme,
                           music_link: embed_link
                        });
                     });
                  }
               } else {
                  var filename = dateNow + req.files.backgroundimage[0].originalname;
                  filename = filename.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); // replace everything except letters and numbers

                  var backgroundimage = filename;
               }
            } else {
               var backgroundimage = req.user.backgroundimage;
            }

            User.findByIdAndUpdate(req.user._id, {
               firstname: firstname,
               lastname: lastname,
               bio: bio,
               music_link: embed_link,
               profile_theme: profile_theme,
               profileimage: profileimage,
               backgroundimage: backgroundimage,
               completed_profile_setup: true
            }, (err, user) => {
               if (err) throw err;
            });

            res.redirect('/walkthrough/interests');

         } else {

            // User didn't upload images

            User.findByIdAndUpdate(req.user._id, {
               firstname: firstname,
               lastname: lastname,
               bio: bio,
               music_link: embed_link,
               profile_theme: profile_theme,
               completed_profile_setup: true
            }, (err, user) => {
               if (err) throw err;
            });

            res.redirect('/walkthrough/interests');
         }
      }

   } else {
      res.redirect('/');
   }
});

// Post Modal Walkthrough
router.post('/walkthrough', (req, res, next) => {
   if(req.isAuthenticated()) {
      User.findByIdAndUpdate(req.user._id, {
         completed_modal_walkthrough: true
      }, (err, user) => {
         if (err) throw err;
      });

      if (req.user.premium_creator_account == 4) {
        res.redirect('/creatives');
      } else {
        res.redirect('/');
      }

   } else {
      res.redirect('/');
   }
});

// Get Modal Walkthrough
router.get('/walkthrough/:onboarding', (req, res, next) => {
   if(req.isAuthenticated()) {

      if (req.user.completed_modal_walkthrough) {
         res.redirect('/');
      } else {

         var which_onboarding = req.params.onboarding;

         if (which_onboarding === 'interests') {
            res.render('walkthrough', {
               page_title: 'Welcome',
               onboarding_interests: true
            });
         } else if (which_onboarding === 'modal') {
            User.findOne({ '_id': { $in: '5fe22ee746497818fbb7c9d3' } }, (err, modal_user) => {
               Project.find({ '_id': { $in: modal_user.own_projects } }, (err, modal_walkthrough_project) => {
                  res.render('walkthrough', {
                     page_title: 'Welcome',
                     projects: modal_walkthrough_project
                  });
               });
            });
         } else {
            res.redirect('/');
         }
      }

   } else {
      res.redirect('/');
   }
});


// Get All Groups
router.get('/groups', (req, res, next) => {
   if(req.isAuthenticated()) {

      var group_ids = [];

      req.user.groups.forEach(function(group, key) {
         group_ids.push(group.group_id);
      });
      Group.find({ '_id': { $in: group_ids} }, (err, groups) => {

         if (err) throw err;

         res.render('groups', {
            page_title: 'Groups',
            groups: groups,
            groupEdit: true
         });

      });

   } else {
      res.redirect('/users/register');
   }
});


// POST Create Group
router.post('/create-group', upload.single('group_image'), (req, res, next) => {

   if(req.isAuthenticated()) {

      var id = req.body.id;
      var user = req.body.user;
      var group_name = req.body.group_name.replace(/\r\n/g,'');
      var is_private = req.body.is_private;
      var group_admin = req.user.username;
      var users = [user];

      if (req.body.group_categories) {
         var group_categories = req.body.group_categories;
      } else {
         var group_categories = [];
      }

      if(is_private) {
         var hex = 'H'+(Math.random()*0xFFFFFF<<0).toString(16);
         var newDate = Date.now().toString();
         newDate = newDate.slice(0,3);
         var group_code = hex + newDate;
      }

      if(req.file) {

         // If user uploaded an image for project
         var ext = path.extname(req.file.originalname);

         // Check if file is an image
         if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {

            User.findById(id, (err, user) => {
               if(err) throw err;

               res.render('groups', {
                  error_msg: 'File Must End With .jpg .jpeg .png .gif',
                  page_title: 'Groups',
                  group_name: group_name,
                  is_private: is_private,
                  group_admin: group_admin,
                  group_error: true,
                  groupEdit: true,
                  user: user
               });
            });

         } else {
            // No errors have been made
            // var fileExt = req.file.originalname.split('.').pop();

            var filename = dateNow + req.file.originalname;
            filename = filename.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); // replace everything except letters and numbers

            var group_image = filename;

            var newGroup = new Group({
               users: users,
               group_name: group_name,
               is_private: is_private,
               group_admin: group_admin,
               group_image: group_image,
               group_code: group_code,
               group_categories: group_categories
            });

            // Create group in database
            Group.saveGroup(newGroup, (err, group) => {
               if(err) throw err;

               // Add group to User document
               info = [];
               info['profileUsername'] = req.user.username;
               info['groupId'] = group._id.toString();
               info['groupName'] = group.group_name.toString();

               User.addGroup(info, (err, user) => {
                  if(err) throw err;
               });

               req.flash('success_msg', "Group was created.");
               res.redirect('/groups/' + group._id);
            });

         }
      } else {

         var group_image = 'hryzn-placeholder-01.jpg';

         var newGroup = new Group({
            users: users,
            group_name: group_name,
            is_private: is_private,
            group_admin: group_admin,
            group_image: group_image,
            group_code: group_code,
            group_categories: group_categories
         });

         // Create group in database
         Group.saveGroup(newGroup, (err, group) => {
            if(err) throw err;

            // Add group to User document
            info = [];
            info['profileUsername'] = req.user.username;
            info['groupId'] = group._id.toString();
            info['groupName'] = group.group_name.toString();

            User.addGroup(info, (err, user) => {
               if(err) throw err;
            });

            req.flash('success_msg', "Group was created.");
            res.redirect('/groups/' + group._id);
         });
      }

   } else {
      res.redirect('/users/register');
   }
});


// Get Group Detail
router.get('/groups/:id', (req, res, next) => {

   Group.findOne({ '_id': { $in: req.params.id} }, (err, group) => {

      if (err) throw err;

      if (group) {


         if(req.isAuthenticated()) {
            if (group.users.indexOf(req.user.username) > -1) {
               var userNotJoined = false;
            } else {
               var userNotJoined = true;
            }
         } else {
            var userNotJoined = true;
         }

         var allowed = false;

         if (group.is_private) {
            if(req.isAuthenticated()) {
               group.users.forEach(function(user, key) {
                  if (user === req.user.username) {
                     allowed = true;
                  }
               });

               // Hryzn Admin
               if (req.user.username === 'hryzn') {
                  allowed = true;
               }
            }
         } else {
            allowed = true;
         }

         if (allowed) {

            if(req.isAuthenticated()) {
               if (group.group_admin === req.user.username) {
                  var groupAdmin = true;
               } else {
                  // Hryzn Admin
                  if (req.user.username === 'hryzn') {
                     var groupAdmin = true;
                  } else {
                     var groupAdmin = false;
                  }
               }
            } else {
               var groupAdmin = false;
            }

            Project.find({ '_id': { $in: group.projects} }, (err, projects) => {

               if (err) throw err;

               var all_public_projects = [];

               projects.forEach(function(project, key) {

                  // Scan through every project

                  if(project.posted_to_collection) {
                     if (project.posted_to_collection.length > 0) {

                        // See if project has any collections

                        project.posted_to_collection.forEach(function(project_collection, key) {

                           if (project_collection.collection_is_private) {

                              // If collection was private check to see if they're allowed to see it

                              if(req.isAuthenticated()) {
                                 if (project_collection.followers.length > 0) {
                                    project_collection.followers.forEach(function(follower, key) {
                                       if (follower === req.user.username || project_collection.collection_owner === req.user.username) {
                                          all_public_projects.push(project);
                                       }
                                    });
                                 } else {
                                    if (project_collection.collection_owner === req.user.username) {
                                       all_public_projects.push(project);
                                    }
                                 }
                              }

                           } else {
                              // If collection was public mark that we scanned collection
                              all_public_projects.push(project);
                           }
                        });
                     } else {
                        // No collections so we mark that we scanned project
                        all_public_projects.push(project);
                     }
                  } else {
                     // No collections so we mark that we scanned project
                     all_public_projects.push(project);
                  }
               });

               User.find({ 'username': { $in: group.users} }, (err, users) => {
                  if (err) throw err;

                  res.render('groups/group-detail', {
                     page_title: group.group_name,
                     group: group,
                     projects: all_public_projects.reverse(),
                     groupAdmin: groupAdmin,
                     users: users,
                     userNotJoined: userNotJoined
                  });
               });

            });
         } else {
            res.redirect('/groups');
         }
      } else {
         res.redirect('/groups');
      }

   });
});


// Get Edit Group
router.get('/groups/edit/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      Group.findOne({ '_id': { $in: req.params.id} }, (err, group) => {

         if (err) throw err;

         if (group.group_admin === req.user.username) {
            res.render('groups/edit-group', {
               page_title: group.group_name,
               group: group,
               groupEdit: true
            });
         } else {
            res.redirect('/groups');
         }

      });

   } else {
      res.redirect('/users/register');
   }
});


// POST Edit Group
router.post('/groups/edit/:id', upload.single('group_image'), (req, res, next) => {

   if(req.isAuthenticated()) {

      var id = req.body.id;
      var user = req.body.user;
      var group_name = req.body.group_name.replace(/\r\n/g,'');
      var is_private = req.body.is_private;

      if (req.body.group_categories) {
         var group_categories = req.body.group_categories;
      } else {
         var group_categories = false;
      }

      if(req.file) {

         // If user uploaded an image for project
         var ext = path.extname(req.file.originalname);

         // Check if file is an image
         if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {

            User.findById(id, (err, user) => {
               if(err) throw err;

               res.render('groups/edit-group', {
                  error_msg: 'File Must End With .jpg .jpeg .png .gif',
                  page_title: 'Groups',
                  group_name: group_name,
                  is_private: is_private,
                  group_error: true,
                  groupEdit: true,
                  user: user
               });
            });

         } else {
            // No errors have been made
            // var fileExt = req.file.originalname.split('.').pop();

            var filename = dateNow + req.file.originalname;
            filename = filename.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); // replace everything except letters and numbers

            var group_image = filename;

            var info = [];
            info['groupId'] = req.params.id;
            info['groupName'] = group_name;
            info['groupIsPrivate'] = is_private;

            Group.findOne({ '_id': { $in: req.params.id} }, (err, group) => {
               if (group.projects) {
                  group.projects.forEach(function(project, key) {
                     Project.findOne({ '_id': { $in: project} }, (err, project) => {
                        if (project) {
                           info['projectId'] = project._id.toString();
                           Project.updateGroup(info, (err, project) => {
                              if(err) throw err;
                           });
                        }
                     });
                  });
               }

               if (group.users) {
                  group.users.forEach(function(user, key) {
                     User.findOne({ 'username': { $in: user} }, (err, user) => {
                        if (user) {
                           info['userId'] = user._id.toString();
                           User.updateGroup(info, (err, user) => {
                              if(err) throw err;
                           });
                        }
                     });
                  });
               }
            });

            if (group_categories) {
               Group.findByIdAndUpdate(req.params.id, {
                  group_name: group_name,
                  is_private: is_private,
                  group_image: group_image,
                  group_categories: group_categories
               }, (err, user) => {
                  if (err) throw err;
               });
            } else {
               Group.findByIdAndUpdate(req.params.id, {
                  group_name: group_name,
                  is_private: is_private,
                  group_image: group_image
               }, (err, user) => {
                  if (err) throw err;
               });
            }

            req.flash('success_msg', "Group was updated.");
            res.redirect('/groups/' + req.params.id);

         }
      } else {

         var info = [];
         info['groupId'] = req.params.id;
         info['groupName'] = group_name;
         info['groupIsPrivate'] = is_private;

         Group.findOne({ '_id': { $in: req.params.id} }, (err, group) => {
            if (group.projects) {
               group.projects.forEach(function(project, key) {
                  Project.findOne({ '_id': { $in: project} }, (err, project) => {
                     if (project) {
                        info['projectId'] = project._id.toString();
                        Project.updateGroup(info, (err, project) => {
                           if(err) throw err;
                        });
                     }
                  });
               });
            }

            if (group.users) {
               group.users.forEach(function(user, key) {
                  User.findOne({ 'username': { $in: user} }, (err, user) => {
                     if (user) {
                        info['userId'] = user._id.toString();
                        User.updateGroup(info, (err, user) => {
                           if(err) throw err;

                           console.log(user);
                        });
                     }
                  });
               });
            }
         });

         if (group_categories) {
            Group.findByIdAndUpdate(req.params.id, {
               group_name: group_name,
               is_private: is_private,
               group_categories: group_categories
            }, (err, user) => {
               if (err) throw err;
            });
         } else {
            Group.findByIdAndUpdate(req.params.id, {
               group_name: group_name,
               is_private: is_private
            }, (err, user) => {
               if (err) throw err;
            });
         }

         req.flash('success_msg', "Group was updated.");
         res.redirect('/groups/' + req.params.id);
      }

   } else {
      res.redirect('/users/register');
   }
});


// Get Join Group
router.get('/groups/:groupId/join', (req, res, next) => {
   if(req.isAuthenticated()) {

      Group.findOne({ '_id': { $in: req.params.groupId} }, (err, group) => {

         if (err) throw err;

         if (group) {
            if (group.users.indexOf(req.user.username) > -1) {
               res.redirect('/groups/' + req.params.groupId);
            } else {
               // Add group to User document
               info = [];
               info['profileUsername'] = req.user.username;
               info['groupId'] = req.params.groupId;
               info['groupName'] = group.group_name.toString();

               // Send notification to the user mentioned
               User.findOne({ 'username': { $in: group.group_admin} }, (err, reciever) => {
                  if (err) throw err;

                  var newNotification = new Notification({
                     sender: req.user._id,
                     reciever: reciever._id,
                     type: '@' + req.user.username + ' joined your group.',
                     link: '/groups/' + req.params.groupId,
                     date_sent: current_date
                  });

                  // Create notification in database
                  Notification.saveNotification(newNotification, (err, notification) => {
                     if(err) throw err;

                     // Add Notification for User
                     User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                        if (err) throw err;
                     });
                  });
               });

               User.addGroup(info, (err, user) => {
                  if(err) throw err;
               });

               Group.addUser(info, (err, group) => {
                  if(err) throw err;

                  req.flash('success_msg', "Joined group.");
                  res.redirect('/groups/' + req.params.groupId);
               });
            }
         } else {
            res.redirect('/groups');
         }

      });

   } else {
      res.redirect('/users/register');
   }
});


// Post Join Private Group
router.post('/groups/join/private/code', (req, res, next) => {
   if(req.isAuthenticated()) {

      Group.findOne({ 'group_code': { $in: req.body.group_code} }, (err, group) => {

         if (err) throw err;

         if (group) {
            if (group.group_admin === req.user.username) {
               res.redirect('/groups');
            } else {
               // Add group to User document
               info = [];
               info['profileUsername'] = req.user.username;
               info['groupId'] = group._id;
               info['groupName'] = group.group_name.toString();

               // Send notification to group admin
               User.findOne({ 'username': { $in: group.group_admin} }, (err, reciever) => {
                  if (err) throw err;

                  var newNotification = new Notification({
                     sender: req.user._id,
                     reciever: reciever._id,
                     type: '@' + req.user.username + ' joined your group.',
                     link: '/groups/' + group._id,
                     date_sent: current_date
                  });

                  // Create notification in database
                  Notification.saveNotification(newNotification, (err, notification) => {
                     if(err) throw err;

                     // Add Notification for User
                     User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                        if (err) throw err;
                     });
                  });
               });

               User.addGroup(info, (err, user) => {
                  if(err) throw err;
               });

               Group.addUser(info, (err, group) => {
                  if(err) throw err;

                  req.flash('success_msg', "Joined group.");
                  res.redirect('/groups/' + group._id);
               });
            }
         } else {
            res.redirect('/groups');
         }

      });

   } else {
      res.redirect('/users/register');
   }
});


// Get Kick Out User
router.get('/groups/:groupId/kick/profile/:username', (req, res, next) => {
   if(req.isAuthenticated()) {

      if (req.params.username === req.user.username) {
         var self_kick = true;
      } else {
         var self_kick = false;
      }

      Group.findOne({ '_id': { $in: req.params.groupId} }, (err, group) => {

         if (err) throw err;

         if (group.group_admin === req.user.username || self_kick) {
            if (group.group_admin === req.params.username) {
               res.redirect('/groups/' + req.params.groupId);
            } else {
               // Add group to User document
               info = [];
               info['profileUsername'] = req.params.username;
               info['groupId'] = req.params.groupId;
               info['groupName'] = group.group_name.toString();


               if (self_kick) {
                  var link = '/groups';
                  var msg = 'Left the group.'
               } else {
                  var link = '/groups/' + req.params.groupId;
                  var msg = 'User was removed.'

                  // Send notification to the user mentioned
                  User.findOne({ 'username': { $in: req.params.username} }, (err, reciever) => {
                     if (err) throw err;

                     var newNotification = new Notification({
                        sender: req.user._id,
                        reciever: reciever._id,
                        type: 'Sorry, you were removed from the group ' + group.group_name,
                        link: '/groups',
                        date_sent: current_date
                     });

                     // Create notification in database
                     Notification.saveNotification(newNotification, (err, notification) => {
                        if(err) throw err;

                        // Add Notification for User
                        User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                           if (err) throw err;
                        });
                     });
                  });
               }

               User.removeGroup(info, (err, user) => {
                  if(err) throw err;
               });

               Group.removeUser(info, (err, group) => {
                  if(err) throw err;

                  req.flash('success_msg', msg);
                  res.redirect(link);
               });
            }
         } else {
            res.redirect('/groups');
         }

      });

   } else {
      res.redirect('/users/register');
   }
});


// Get Remove Project
router.get('/groups/:groupId/remove/:projectId', (req, res, next) => {
   if(req.isAuthenticated()) {

      Group.findOne({ '_id': { $in: req.params.groupId} }, (err, group) => {

         if (err) throw err;

         if (group.group_admin === req.user.username) {

            Project.findOne({ '_id': { $in: req.params.projectId} }, (err, project) => {

               info = [];
               info['projectId'] = req.params.projectId;
               info['groupId'] = req.params.groupId;
               info['groupName'] = group.group_name.toString();

               // Send notification to the user mentioned
               User.findOne({ 'username': { $in: project.project_owner} }, (err, reciever) => {
                  if (err) throw err;

                  var newNotification = new Notification({
                     sender: req.user._id,
                     reciever: reciever._id,
                     type: 'Sorry, your project was removed from the group ' + group.group_name,
                     link: '/groups',
                     date_sent: current_date
                  });

                  // Create notification in database
                  Notification.saveNotification(newNotification, (err, notification) => {
                     if(err) throw err;

                     // Add Notification for User
                     User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                        if (err) throw err;
                     });
                  });
               });

               Project.removeGroup(info, (err, user) => {
                  if(err) throw err;
               });

               Group.removeProject(info, (err, group) => {
                  if(err) throw err;

                  req.flash('success_msg', "Project was removed.");
                  res.redirect('/groups/' + group._id);
               });
            });
         } else {
            res.redirect('/groups');
         }

      });

   } else {
      res.redirect('/users/register');
   }
});


// Delete Group
router.get('/groups/delete/:id/:deleteAll', (req, res, next) => {
   if(req.isAuthenticated()) {

      if (req.params.deleteAll === 'true') {
         var deleteProjects = true;
      } else  {
         var deleteProjects = false;
      }

      Group.findById(req.params.id, (err, group) => {
         if(err) throw err;

         if (group.group_admin === req.user.username || req.user.username === 'hryzn') {

            if (group.is_private && deleteProjects) {

               // Delete Everything

               if(group.projects.length) {

                  group.projects.forEach(function(proj, key) {
                     // Find project to delete
                     Project.findById(proj, (err, project) => {
                        if(err) throw err;

                        var info = [];

                        // If project has saves
                        if(project.saves.length) {

                           for (var i = 0, len = project.saves.length; i < len; i++) {
                              info['profileUsername'] = project.saves[i];
                              info['projectId'] = project._id;

                              User.unsaveToProfile(info, (err, user) => {
                                 if(err) throw err;
                              });
                           }

                        }

                        // If project has admins
                        if(project.project_owner.length) {
                           info['profileUsername'] = project.project_owner;
                           info['projectId'] = project._id;

                           console.log(info['projectId']);

                           User.deleteFromProfile(info, (err, user) => {
                              if(err) throw err;

                              console.log(user);
                           });
                        }

                        // If project has reposts
                        if(project.reposts.length) {
                           for (var i = 0, len = project.reposts.length; i < len; i++) {
                              info['profileUsername'] = project.reposts[i];
                              info['projectId'] = project._id;

                              User.unrepostProject(info, (err, user) => {
                                 if(err) throw err;
                              });
                           }
                        }

                        // Delete project image
                        var s3_instance = new aws.S3();
                        var s3_params = {
                           Bucket: 'hryzn-app-static-assets',
                           Key: project.project_image
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
                        Project.findByIdAndRemove(project._id, (err) => {
                          if (err) throw err;
                        });

                     });
                  });

               }

               // If group has users
               if(group.users.length) {

                  for (var i = 0, len = group.users.length; i < len; i++) {
                     var info = [];
                     info['profileUsername'] = group.users[i];
                     info['groupId'] = req.params.id;

                     User.removeGroup(info, (err, user) => {
                        if(err) throw err;
                     });
                  }

               }

               // Delete the Group
               Group.findByIdAndRemove(req.params.id, (err) => {
                 if (err) throw err;
                 req.flash('success_msg', "Destroyed From Existence...");
                 res.redirect('/groups');
               });

            } else {

               // Keep Projects

               if(group.projects.length) {

                  group.projects.forEach(function(proj, key) {
                     var info = [];
                     info['projectId'] = proj;
                     info['groupId'] = req.params.id;

                     Project.removeGroup(info, (err, project) => {
                        if(err) throw err;
                     });

                  });

               }

               // If group has users
               if(group.users.length) {

                  for (var i = 0, len = group.users.length; i < len; i++) {
                     var info = [];
                     info['profileUsername'] = group.users[i];
                     info['groupId'] = req.params.id;

                     User.removeGroup(info, (err, user) => {
                        if(err) throw err;
                     });
                  }

               }

               // Delete the Group
               Group.findByIdAndRemove(req.params.id, (err) => {
                 if (err) throw err;
                 req.flash('success_msg', "Destroyed From Existence...");
                 res.redirect('/groups');
               });

            }

         } else {
            res.redirect('/groups');
         }
      });
   } else {
      res.redirect('/users/register');
   }
});


// Get All Chats
router.get('/messages', (req, res, next) => {
   if(req.isAuthenticated()) {
      Message.find({ '_id': { $in: req.user.messages} }, (err, messages) => {

         if (err) throw err;

         var existing_chats = [];

         if (messages.length > 0) {
            messages.forEach(function(chat, key) {
               chat.users.forEach(function(user, key) {
                  if( user !== req.user.username) {
                     existing_chats.push(user);
                  }
               });
            });
         }

         followers_with_no_chat = req.user.following.filter(function(x) {
           return existing_chats.indexOf(x) < 0;
         });

         User.find({ 'username': { $in: followers_with_no_chat} }, (err, following) => {

            if (err) throw err;

            User.find({ 'username': { $in: existing_chats} }, (err, existing_chats) => {

               if (err) throw err;

               res.render('messages', {
                  page_title: 'Messages',
                  messages: messages,
                  following: following,
                  existing_chats: existing_chats
               });

            });

         });

      });

   } else {
      res.redirect('/users/register');
   }
});


// New / Old Message Redirect
router.get('/messages/:username', (req, res, next) => {
   if(req.isAuthenticated()) {

      User.findOne({ 'username': { $in: req.params.username} }, (err, user) => {

         if (err) throw err;

         var chat_id;

         user.messages.forEach(function(msg, key) {
            req.user.messages.forEach(function(user_msg, key) {
               if (user_msg === msg) {
                  chat_id = user_msg;
               }
            });
         });

         Message.findOne({ '_id': { $in: chat_id } }, (err, message) => {

            if (err) throw err;

            if (message) {
               res.redirect('/messages/chat/' + message.id);
            } else {
               res.redirect('/messages/new/' + req.params.username);
            }

         });


      });

   } else {
      res.redirect('/users/register');
   }
});


// Get Old Message Chat
router.get('/messages/chat/:messageId', (req, res, next) => {
   if(req.isAuthenticated()) {

      Message.findOne({ '_id': { $in: req.params.messageId } }, (err, message) => {

         if (err) throw err;

         if (message) {
           var chat_name = '';

           message.users.forEach(function(user, key) {
              if (user != req.user.username) {
                chat_name = user;
              }
            });

            if (message.last_sent_by != req.user._id) {
              Message.findByIdAndUpdate(message._id, {was_viewed: true}, (err, msg) => {

                 if (err) throw err;

                 res.render('messages/chat', {
                    page_title: chat_name,
                    new_chat: false,
                    message: message,
                    chat: true,
                    chat_name: chat_name
                 });

              });

            } else {
              res.render('messages/chat', {
                 page_title: chat_name,
                 new_chat: false,
                 message: message,
                 chat: true,
                 chat_name: chat_name,
                 viewing_own_messages: true
              });
            }
         } else {
           res.redirect('/');
         }

      });

   } else {
      res.redirect('/users/register');
   }
});


// Delete Old Message Chat
router.get('/messages/chat/delete/:messageId', (req, res, next) => {
   if(req.isAuthenticated()) {

      Message.findById(req.params.messageId, (err, message) => {
         if(err) throw err;

         var info = [];

         // Delete chat from user's profile
         if(message.users.length) {

            for (var i = 0, len = message.users.length; i < len; i++) {
               info['profileUsername'] = message.users[i];
               info['messageId'] = req.params.messageId;

               User.removeChat(info, (err, user) => {
                  if(err) throw err;
               });
            }

         }

         Message.findByIdAndRemove(message._id, (err) => {
            if (err) throw err;

            req.flash('success_msg', "Chat was deleted.");
            res.redirect('/messages');
         });

      });

   } else {
      res.redirect('/users/register');
   }
});


// Post Old Message Chat
router.post('/messages/chat/:messageId', (req, res, next) => {
   if(req.isAuthenticated()) {

      info = [];
      info['userUsername'] = req.body.username;
      info['messageId'] = req.params.messageId;
      if (req.body.profileimage) {
         info['profileimage'] = req.body.profileimage;
      } else {
         info['profileimage'] = 'hryzn-placeholder-01.jpg';
      }
      info['message'] = req.body.message.replace(/\r\n/g,'');
      info['liked'] = false;
      info['date_time'] = current_date_and_time;
      info['is_post_link'] = false;

      // Add message
      Message.addMessage(info, (err, message) => {
         if(err) throw err

         Message.findByIdAndUpdate(req.params.messageId, {
           was_viewed: false,
           date_of_last_msg: current_date,
           last_sent_by: req.user._id
         }, (err, msg) => {

            if (err) throw err;

            Message.findOne({ '_id': { $in: req.params.messageId} }, (err, message) => {
               message.users.forEach(function(user, key) {
                  if (user != req.user.username) {
                     // Send notification to the user mentioned
                     User.findOne({ 'username': { $in: user} }, (err, reciever) => {
                        if (err) throw err;

                        var newNotification = new Notification({
                           sender: req.user._id,
                           reciever: reciever._id,
                           type: '@' + req.body.username + ' messaged you.',
                           link: '/messages/chat/' + req.params.messageId,
                           date_sent: current_date
                        });

                        // Create notification in database
                        Notification.saveNotification(newNotification, (err, notification) => {
                           if(err) throw err;

                           // Add Notification for User
                           User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                              if (err) throw err;
                           });
                        });
                     });
                  }
               });
            });

            //io.emit('message', req.body);

            req.flash('success_msg', "Message Sent");
            res.redirect('/messages/chat/' + req.params.messageId);
         });
      });

   } else {
      res.redirect('/users/register');
   }
});


// Get New Message Chat
router.get('/messages/new/:username', (req, res, next) => {
   if(req.isAuthenticated()) {

      User.findOne({ 'username': { $in: req.params.username} }, (err, user) => {

         if (err) throw err;

         res.render('messages/chat', {
            page_title: req.params.username,
            new_chat: true,
            other_user: user.username,
            chat: true,
            chat_name: req.params.username
         });

      });

   } else {
      res.redirect('/users/register');
   }
});


// Post New Message Chat
router.post('/messages/new/:username', (req, res, next) => {
   if(req.isAuthenticated()) {

      var info = [];

      var users = req.body.users;
      var sent_by = req.user.username;
      if (req.body.profileimage) {
         info['profileimage'] = req.body.profileimage;
      } else {
         info['profileimage'] = 'hryzn-placeholder-01.jpg';
      }
      var message = req.body.message.replace(/\r\n/g,'');

      var newMessage = new Message({
         users: users,
         messages: {
            username: sent_by,
            profileimage: info['profileimage'],
            message: message,
            liked: false,
            date_time: current_date_and_time
         },
         was_viewed: false,
         date_of_last_msg: current_date
      });

      // Create message in database
      Message.saveMessage(newMessage, (err, message) => {
         if(err) throw err;

         // Add chat for User
         users.forEach(function(user, key) {
            info = [];
            info['profileUsername'] = user;
            info['messageId'] = message._id.toString();

            User.addChat(info, (err, user) => {
               if(err) throw err;
            });
         });

         // Send notification to the user mentioned
         User.findOne({ 'username': { $in: req.params.username} }, (err, reciever) => {
            if (err) throw err;

            var newNotification = new Notification({
               sender: req.user._id,
               reciever: reciever._id,
               type: '@' + req.user.username + ' messaged you.',
               link: '/messages/chat/' + message._id,
               date_sent: current_date
            });

            // Create notification in database
            Notification.saveNotification(newNotification, (err, notification) => {
               if(err) throw err;

               // Add Notification for User
               User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                  if (err) throw err;
               });
            });
         });

         req.flash('success_msg', "Message was sent.");
         res.redirect('/messages');
      });

   } else {
      res.redirect('/users/register');
   }
});


// Send Post Message
router.post('/messages/direct/sendpost', (req, res, next) => {
   if(req.isAuthenticated()) {

     var send_to_user = req.body.send_to_user.replace(/\r\n/g,'').trim();

     User.findOne({ 'username': { $in: send_to_user} }, (err, receiving_user) => {

        if (err) throw err;

        if (receiving_user) {
          if(req.user.followers.indexOf(receiving_user.username) === -1) {
            res.redirect('/');
          } else {
            var chat_id;

            receiving_user.messages.forEach(function(msg, key) {
               req.user.messages.forEach(function(user_msg, key) {
                  if (user_msg === msg) {
                     chat_id = user_msg;
                  }
               });
            });

            Message.findOne({ '_id': { $in: chat_id } }, (err, message) => {

               if (err) throw err;

               if (message) {
                  // Existing chat

                  var chat_id = message._id;

                  info = [];
                  info['userUsername'] = req.user.username;
                  info['messageId'] = chat_id;
                  if (req.user.profileimage) {
                     info['profileimage'] = req.user.profileimage;
                  } else {
                     info['profileimage'] = 'hryzn-placeholder-01.jpg';
                  }
                  info['message'] = req.body.message;
                  info['liked'] = false;
                  info['date_time'] = current_date_and_time;
                  info['is_post_link'] = true;

                  // Add message
                  Message.addMessage(info, (err, message) => {
                     if(err) throw err

                     Message.findByIdAndUpdate(chat_id, {
                       was_viewed: false,
                       date_of_last_msg: current_date,
                       last_sent_by: req.user._id
                     }, (err, msg) => {

                        if (err) throw err;

                        message.users.forEach(function(user, key) {
                           if (user != req.user.username) {
                              // Send notification to the user mentioned
                              User.findOne({ 'username': { $in: user} }, (err, reciever) => {
                                 if (err) throw err;

                                 var newNotification = new Notification({
                                    sender: req.user._id,
                                    reciever: reciever._id,
                                    type: '@' + req.body.username + ' messaged you.',
                                    link: '/messages/chat/' + req.params.messageId,
                                    date_sent: current_date
                                 });

                                 // Create notification in database
                                 Notification.saveNotification(newNotification, (err, notification) => {
                                    if(err) throw err;

                                    // Add Notification for User
                                    User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                                       if (err) throw err;
                                    });
                                 });
                              });
                           }
                        });

                        req.flash('success_msg', "Message Sent");
                        res.redirect('/');
                     });
                  });
               } else {
                  // Create new chat

                  var info = [];
                  var users = [];
                  users.push(req.user.username);
                  users.push(receiving_user.username);

                  var sent_by = req.user.username;
                  if (req.user.profileimage) {
                     info['profileimage'] = req.user.profileimage;
                  } else {
                     info['profileimage'] = 'hryzn-placeholder-01.jpg';
                  }
                  var message = req.body.message;

                  var newMessage = new Message({
                     users: users,
                     messages: {
                        username: sent_by,
                        profileimage: info['profileimage'],
                        message: message,
                        liked: false,
                        date_time: current_date_and_time,
                        is_post_link: true
                     },
                     was_viewed: false,
                     date_of_last_msg: current_date
                  });

                  // Create message in database
                  Message.saveMessage(newMessage, (err, message) => {
                     if(err) throw err;

                     // Add chat for User
                     users.forEach(function(user, key) {
                        info = [];
                        info['profileUsername'] = user;
                        info['messageId'] = message._id.toString();

                        User.addChat(info, (err, user) => {
                           if(err) throw err;
                        });
                     });

                     var newNotification = new Notification({
                        sender: req.user._id,
                        reciever: receiving_user._id,
                        type: '@' + req.user.username + ' messaged you.',
                        link: '/messages/chat/' + message._id,
                        date_sent: current_date
                     });

                     // Create notification in database
                     Notification.saveNotification(newNotification, (err, notification) => {
                        if(err) throw err;

                        // Add Notification for User
                        User.findByIdAndUpdate(receiving_user._id, { has_notification: true }, (err, user) => {
                           if (err) throw err;
                        });
                     });

                     req.flash('success_msg', "Message was sent.");
                     res.redirect('/');
                  });
               }

            });
          }
        } else {
          res.redirect('/');
        }


     });

   } else {
      res.redirect('/users/register');
   }
});


// Direct message - like
router.post('/messages/direct/like/', (req, res, next) => {
   if(req.isAuthenticated()) {
      info = [];
      info['chatId'] = req.body.chatId;
      info['messageId'] = req.body.messageId;

      Message.findOne({ '_id': { $in: req.body.chatId} }, (err, chat) => {

         if (err) throw err;

         if (chat) {

           // Remove save from project
           Message.likeMessage(info, (err, msg) => {

              if(err) throw err;

               chat.users.forEach(function(user, key) {
                  if (user != req.user.username) {
                     // Send notification to the user mentioned
                     User.findOne({ 'username': { $in: user} }, (err, reciever) => {
                        if (err) throw err;

                        var newNotification = new Notification({
                           sender: req.user._id,
                           reciever: reciever._id,
                           type: '@' + req.user.username + ' liked your message.',
                           link: '/messages/chat/' + req.body.chatId,
                           date_sent: current_date
                        });

                        // Create notification in database
                        Notification.saveNotification(newNotification, (err, notification) => {
                           if(err) throw err;

                           // Add Notification for User
                           User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                              if (err) throw err;

                              req.flash('success_msg', "Message Liked");
                              res.redirect('/messages/chat/' + req.body.chatId);
                           });
                        });
                     });
                  }
               });
           });

         } else {
            res.redirect('/');
         }
      });
   } else {
      res.redirect('/users/register');
   }
});


// Get User Logout
router.get('/logout', (req, res, next) => {
   if(req.isAuthenticated() || req.session) {
      req.logout();
      req.session.destroy( (err) => {
         res.clearCookie('connect.sid');
         res.redirect('/users/register');
      });
   } else {
      res.redirect('/users/register');
   }
});


// Get Notifications
router.get('/notifications', (req, res, next) => {
   if(req.isAuthenticated()) {
      Notification.find({ 'reciever': { $in: req.user._id} }, (err, notifications) => {

         if (err) throw err;

         // Add Notification for User
         User.findByIdAndUpdate(req.user._id, { has_notification: false }, (err, user) => {
            if (err) throw err;
         });

         res.render('notifications', {
            page_title: 'Notifications',
            notifications: notifications.reverse(),
            notification_page: true,
            notification_active: true,
            main_page_nav: true
         });

      });

   } else {
      res.redirect('/users/register');
   }
});


// Post Notifications - Delete
router.post('/notifications/remove/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      Notification.findByIdAndRemove(req.params.id, (err) => {
         if (err) throw err;

         req.flash('success_msg', "Notification was deleted.");
         res.redirect('/notifications');
      });

   } else {
      res.redirect('/users/register');
   }
});

// Get Notifications - Delete
router.get('/notifications/remove/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      Notification.findByIdAndRemove(req.params.id, (err) => {
         if (err) throw err;

         req.flash('success_msg', "Notification was deleted.");
         res.redirect('/notifications');
      });

   } else {
      res.redirect('/users/register');
   }
});


// GET Profile
router.get('/profile/:username', (req, res, next) => {

   User.findOne({ 'username': { $in: req.params.username} }, (err, profile) => {

      if (profile) {

         if(err) throw err;


         if(req.isAuthenticated()) {

           if (req.user.date_of_birth) {
             var user_dob = req.user.date_of_birth.split('/');

             var dob_day = user_dob[0];
             var dob_month = user_dob[1];
             var dob_year = user_dob[2];

             var curr_dateObj = new Date();
             var curr_month = curr_dateObj.getUTCMonth() + 1; //months from 1-12
             var curr_day = curr_dateObj.getUTCDate();
             var curr_year = curr_dateObj.getUTCFullYear();

             if (parseInt(curr_year) - parseInt(dob_year) > 18) {
                var can_view_adult_content = true;
             } else if (parseInt(curr_month) - parseInt(dob_month) > 0 && parseInt(curr_year) - parseInt(dob_year) == 18) {
                var can_view_adult_content = true;
             } else if (parseInt(curr_day) - parseInt(dob_day) >= 0 && parseInt(curr_month) - parseInt(dob_month) == 0 && parseInt(curr_year) - parseInt(dob_year) == 18) {
                var can_view_adult_content = true;
             } else {
                var can_view_adult_content = false;
             }

           } else {

             var can_view_adult_content = true;

           }

         } else {
            var guestUser = true;
            var can_view_adult_content = false;
         }

         if(req.isAuthenticated()) {
            // User is seeing their own profile
            if(profile.username === req.user.username) {
               var viewing_own_profile = true;
            } else {
               var viewing_own_profile = false;
            }

            // Hryzn Admin
            if (req.user.username === 'hryzn') {
               var hryznAdmin = true;
            } else {
               var hryznAdmin = false;
            }

            var is_following = false;

            profile.followers.forEach(function(follower, key) {
              if (follower === req.user.username) {
                is_following = true;
              }
            });

            if (profile.is_private_profile && viewing_own_profile) {
              var unable_to_view_private_profile = false;
            } else if (profile.is_private_profile && hryznAdmin) {
              var unable_to_view_private_profile = false;
            } else if (profile.is_private_profile && is_following) {
              var unable_to_view_private_profile = false;
            } else if (profile.is_private_profile) {
              var unable_to_view_private_profile = true;
            } else {
              var unable_to_view_private_profile = false;
            }

         } else {
            var viewing_own_profile = false;
         }

         if(profile.followers) {

            var amount_of_followers = profile.followers.length;

            if(req.isAuthenticated()) {
               if(profile.followers.indexOf(req.user.username) === -1) {
                  var user_follows_profile = false;
               } else {
                  var user_follows_profile = true;
               }
            } else {
               var user_follows_profile = false;
            }

         } else {

            // Profile has no followers
            var user_follows_profile = false;
            var amount_of_followers = 0;

         }


         if(profile.following) {
            var amount_of_following = profile.following.length;
         } else {
            // Profile is not following anyone
            var amount_of_following = 0;
         }


         if(profile.own_projects) {
            var amount_of_projects = profile.own_projects.length;
         } else {
            var amount_of_projects = 0;
         }

         var viewer_has_pending_request;

         profile.pending_friend_requests.forEach(function(request, key) {
           if (request == req.user._id.toString()) {
             viewer_has_pending_request = true;
           }
         });


         if (profile.collections) {

            var collection_ids = [];
            profile.collections.forEach(function(collection, key) {
               collection_ids.push(collection.collection_id);
            });

            Collection.find({ '_id': { $in: collection_ids} }, (err, collections) => {
               if (err) throw err;

               var collection_projects = [];

               var all_collections = [];

               collections.forEach(function(collection, key) {

                  if(req.isAuthenticated()) {

                     if (collection.collection_owner === req.user.username) {

                        // Owner is viewing collection
                        Project.find({ '_id': { $in: collection.projects} }, (err, projects) => {
                           if (err) throw err;

                           var reversed_projects = projects.reverse();

                           all_collections.push({
                              "collection_name": collection.collection_name,
                              "projects": reversed_projects,
                              "collection_slug": collection.collection_slug,
                              "id": collection._id,
                              "is_private": collection.is_private
                           });
                        });
                     } else if (collection.is_private) {

                        // Must follow to see private collection
                        collection.followers.forEach(function(follower, key) {
                           if (follower == req.user._id) {
                              Project.find({ '_id': { $in: collection.projects} }, (err, projects) => {
                                 if (err) throw err;

                                 var reversed_projects = projects.reverse();

                                 all_collections.push({
                                    "collection_name": collection.collection_name,
                                    "projects": reversed_projects,
                                    "collection_slug": collection.collection_slug,
                                    "id": collection._id,
                                    "is_private": collection.is_private
                                 });
                              });
                           }
                        });
                     } else {

                        // Collection is public to all
                        Project.find({ '_id': { $in: collection.projects} }, (err, projects) => {
                           if (err) throw err;

                           var reversed_projects = projects.reverse();

                           all_collections.push({
                              "collection_name": collection.collection_name,
                              "projects": reversed_projects,
                              "collection_slug": collection.collection_slug,
                              "id": collection._id,
                              "is_private": collection.is_private
                           });
                        });
                     }
                  } else {
                     if (!collection.is_private) {
                        // Collection is public to all
                        Project.find({ '_id': { $in: collection.projects} }, (err, projects) => {
                           if (err) throw err;

                           var reversed_projects = projects.reverse();

                           all_collections.push({
                              "collection_name": collection.collection_name,
                              "projects": reversed_projects,
                              "collection_slug": collection.collection_slug,
                              "id": collection._id,
                              "is_private": collection.is_private
                           });
                        });
                     }
                  }
               });

               Project.find({ '_id': { $in: profile.own_projects} }, (err, projects) => {
                  if (err) throw err;

                  var reversed_projects = projects.reverse();

                  all_public_projects = [];

                  if (viewing_own_profile) {
                     all_collections.push({
                        "collection_name": 'All',
                        "projects": reversed_projects,
                        "collection_slug": 'all',
                        "collection_all": true,
                        "is_private": false
                     });
                  } else {
                     var good_project;
                     reversed_projects.forEach(function(project, key) {
                        good_project = false;

                        if(project.posted_to_collection) {

                           if (project.posted_to_collection.length > 0) {
                              project.posted_to_collection.forEach(function(project_collection, key) {
                                 if (project_collection.collection_is_private) {
                                    // do nothing
                                 } else {
                                    good_project = true;
                                 }
                              });
                           } else {
                              good_project = true;
                           }
                        } else {
                           good_project = true;
                        }

                        if(good_project) {
                           all_public_projects.push(project);
                        }

                     });

                     all_collections.push({
                        "collection_name": 'All',
                        "projects": all_public_projects,
                        "collection_slug": 'all',
                        "collection_all": true,
                        "is_private": false
                     });
                  }

                  Project.find({ '_id': { $in: profile.saved_projects} }, (err, saved_projects) => {
                     if (err) throw err;

                     var reversed_saved_projects = saved_projects.reverse();

                     Project.find({ '_id': { $in: profile.reposted_projects} }, (err, reposted_projects) => {
                        if (err) throw err;

                        var reversed_reposted_projects = reposted_projects.reverse();

                        User.find({ 'username': { $in: profile.followers} }, (err, followers) => {

                           if (typeof profile.profile_theme == 'undefined') {
                              var pageRender = 'profile-themes/default';
                           } else {
                              var pageRender = 'profile-themes/' + profile.profile_theme;
                           }

                           if (profile.premium_creator_account == 0 || profile.premium_creator_account == 1 || profile.premium_creator_account == 2 || profile.premium_creator_account == 3) {
                             var premium_creator_account = true;
                           } else {
                             var premium_creator_account = false;
                           }

                           Product.find({ '_id': { $in: profile.creator_products} }, (err, products) => {
                              if (err) throw err;

                               res.render(pageRender, {
                                  page_title: '@' + profile.username,
                                  page_description: profile.bio,
                                  profile: profile,
                                  projects: reversed_projects,
                                  collections: all_collections.reverse(),
                                  saved_projects: reversed_saved_projects,
                                  reposted_projects: reversed_reposted_projects,
                                  user_follows_profile: user_follows_profile,
                                  amount_of_followers: amount_of_followers,
                                  amount_of_following: amount_of_following,
                                  amount_of_projects: amount_of_projects,
                                  viewing_own_profile: viewing_own_profile,
                                  guestUser: guestUser,
                                  hryznAdmin: hryznAdmin,
                                  profile_active: true,
                                  profilePage: true,
                                  followers: followers,
                                  premium_creator_account: premium_creator_account,
                                  main_page_nav: true,
                                  unable_to_view_private_profile: unable_to_view_private_profile,
                                  viewer_has_pending_request: viewer_has_pending_request,
                                  can_view_adult_content: can_view_adult_content,
                                  products: products,
                                  payment_element: true
                               });

                           });
                        });

                     });
                  });

               });

            });

         } else {

            Project.find({ '_id': { $in: profile.own_projects} }, (err, projects) => {
               if (err) throw err;

               var reversed_projects = projects.reverse();

               var private_amount = [];
               projects.forEach(function(project, index) {
                  if (project.is_private) {
                     private_amount.push(project);
                  }
               });

               amount_of_projects = amount_of_projects - private_amount.length;

               Project.find({ '_id': { $in: profile.saved_projects} }, (err, saved_projects) => {
                  if (err) throw err;

                  var reversed_saved_projects = saved_projects.reverse();

                  Project.find({ '_id': { $in: profile.reposted_projects} }, (err, reposted_projects) => {
                     if (err) throw err;

                     var reversed_reposted_projects = reposted_projects.reverse();

                     if (typeof profile.profile_theme == 'undefined') {
                        var pageRender = 'profile-themes/default';
                     } else {
                        var pageRender = 'profile-themes/' + profile.profile_theme;
                     }

                     if (profile.premium_creator_account == 0 || profile.premium_creator_account == 1 || profile.premium_creator_account == 2 || profile.premium_creator_account == 3) {
                       var premium_creator_account = true;
                     } else {
                       var premium_creator_account = false;
                     }

                     Product.find({ '_id': { $in: profile.creator_products} }, (err, products) => {
                        if (err) throw err;

                         res.render(pageRender, {
                            page_title: '@' + profile.username,
                            page_description: profile.bio,
                            profile: profile,
                            projects: reversed_projects,
                            saved_projects: reversed_saved_projects,
                            reposted_projects: reversed_reposted_projects,
                            user_follows_profile: user_follows_profile,
                            amount_of_followers: amount_of_followers,
                            amount_of_following: amount_of_following,
                            amount_of_projects: amount_of_projects,
                            viewing_own_profile: viewing_own_profile,
                            guestUser: guestUser,
                            hryznAdmin: hryznAdmin,
                            profile_active: true,
                            profilePage: true,
                            noCollections: noCollections,
                            premium_creator_account: premium_creator_account,
                            main_page_nav: true,
                            unable_to_view_private_profile: unable_to_view_private_profile,
                            viewer_has_pending_request: viewer_has_pending_request,
                            can_view_adult_content: can_view_adult_content,
                            products: products,
                            payment_element: true
                         });
                      });
                  });
               });
            });
         }

      } else {
         res.redirect('/');
      }

   });

});

// Post Profile - Follow
router.post('/profile/follow/:id', (req, res, next) => {
  if(req.isAuthenticated()) {
    info = [];
    info['userUsername'] = req.user.username;
    info['profileId'] = req.params.id;
    info['profileUsername'] = req.body.profile_username;
    info['userId'] = req.user._id;

    // Send notification to the user mentioned
    User.findOne({ 'username': { $in: req.body.profile_username } }, (err, reciever) => {
      if (err) throw err;

      var is_following = false;

      reciever.followers.forEach(function(follower, key) {
        if (follower === req.user.username) {
          is_following = true;
        }
      });

      if (req.user.username === reciever.username) {
        is_following = true;
      }

      if (is_following) {
        res.redirect('/profile/' + req.body.profile_username);
      } else {

        if (reciever.is_private_profile) {

          // Update following for User
          User.addRequest(info, (err, user) => {
            if(err) throw err;

            var newNotification = new Notification({
              sender: req.user._id,
              reciever: reciever._id,
              type: '@' + req.user.username + ' requested to follow you.',
              link: '/profile/' + req.user.username,
              date_sent: current_date,
              is_friend_request: true
            });

            // Create notification in database
            Notification.saveNotification(newNotification, (err, notification) => {
              if(err) throw err;

              // Add Notification for User
              User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                if (err) throw err;

                req.flash('success_msg', "Friend Request Sent");
                res.redirect('/profile/' + info['profileUsername']);
              });

            });

          });

        } else {

          // Add followers to profile
          User.addFollowers(info, (err, user) => {
            if(err) throw err;

            // Update following for User
            User.addFollowing(info, (err, user) => {
              if(err) throw err;

              var newNotification = new Notification({
                sender: req.user._id,
                reciever: reciever._id,
                type: '@' + req.user.username + ' started following you.',
                link: '/profile/' + req.user.username,
                date_sent: current_date
              });

              // Create notification in database
              Notification.saveNotification(newNotification, (err, notification) => {
                if(err) throw err;

                // Add Notification for User
                User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                  if (err) throw err;

                  req.flash('success_msg', "Following @" + info['profileUsername']);
                  res.redirect('/profile/' + info['profileUsername']);
                });

              });

            });

          });

        }

      }
    });
  } else {
    res.redirect('/users/register');
  }
});

// Post Profile - Unfollow
router.post('/profile/unfollow/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      info = [];
      info['userUsername'] = req.user.username;
      info['profileId'] = req.params.id;
      info['profileUsername'] = req.body.profile_username;
      info['userId'] = req.user._id;

      User.findOne({ '_id': { $in: req.user._id } }, async (err, user) => {
        if (err) throw err;

        var sub_id;
        var sub_count = 0;

        if (typeof user.following_subscriptions != 'undefined') {

          if (user.following_subscriptions.length > 0) {

            console.log(user.following_subscriptions)

            user.following_subscriptions.forEach(async function(sub, key) {

              sub_count += 1;

              if (sub.user_following == req.params.id.toString()) {
                sub_id = sub.subscription_id;
              }

              if (sub_count == user.following_subscriptions.length) {

                if (sub_id) {

                  info['subId'] = sub_id;

                  await stripe.subscriptions.del(
                    sub_id
                  ).then(function() {
                    try {

                      User.removeSubscription(info, (err, user) => {
                        if(err) throw err;

                        // Update following for User
                        User.removeFollowing(info, (err, user) => {
                           if(err) throw err;

                           // Remove followers from profile
                           User.removeFollowers(info, (err, user) => {
                              if(err) throw err;

                              req.flash('success_msg', "Unfollowed @" + info['profileUsername']);
                              res.redirect('/profile/' + info['profileUsername']);
                           });

                        });

                      });

                    } catch {
                      return res.status(500).send({
                        error: err.message
                      });
                    }
                  });

                }

              }
            });

          } else {

            console.log('yeah')

            // Update following for User
            User.removeFollowing(info, (err, user) => {
               if(err) throw err;

               // Remove followers from profile
               User.removeFollowers(info, (err, user) => {
                  if(err) throw err;

                  req.flash('success_msg', "Unfollowed @" + info['profileUsername']);
                  res.redirect('/profile/' + info['profileUsername']);
               });

            });

          }

        } else {

          console.log('yeah 2')

          // Update following for User
          User.removeFollowing(info, (err, user) => {
             if(err) throw err;

             // Remove followers from profile
             User.removeFollowers(info, (err, user) => {
                if(err) throw err;

                req.flash('success_msg', "Unfollowed @" + info['profileUsername']);
                res.redirect('/profile/' + info['profileUsername']);
             });

          });

        }

      });

   } else {
      res.redirect('/users/register');
   }
});

// GET Profile Followers
router.get('/profile/:username/followers', (req, res, next) => {
   if(req.isAuthenticated()) {
      User.getUserByUsername(req.params.username, (err, profile) => {
         if(err) throw err;

         User.find({ 'username': { $in: profile.followers} }, (err, profiles) => {
            if (err) throw err;
            res.render('followers', {
               page_title: '@' + profile.username,
               profiles: profiles
            });
         });
      });
   } else {
      res.redirect('/users/register');
   }
});

// Pending Request - Follow
router.get('/pending-request/:id/:answer/:notification_id', (req, res, next) => {
  if(req.isAuthenticated()) {

    // Send notification to the user mentioned
    User.findOne({ '_id': { $in: req.params.id } }, (err, reciever) => {
      if (err) throw err;

      // Profile is the profile being followed
      // User is the user that originally made the request

      if (reciever) {

        info = [];
        info['profileId'] = req.user._id;
        info['userId'] = reciever._id;
        info['userUsername'] = reciever.username;
        info['profileUsername'] = req.user.username;

        var notification_id = req.params.notification_id;

        if (req.params.answer === 'true') {
          var request_answer = true;
        } else {
          var request_answer = false;
        }

        if (request_answer) {

          // Add followers to profile
          User.addFollowers(info, (err, user) => {
            if(err) throw err;

            // Update following for User
            User.addFollowing(info, (err, user) => {
              if(err) throw err;

              // Update request for User
              User.removeRequest(info, (err, user) => {
                if(err) throw err;

                var newNotification = new Notification({
                  sender: reciever._id,
                  reciever: req.user._id,
                  type: '@' + reciever.username + ' started following you.',
                  link: '/profile/' + reciever.username,
                  date_sent: current_date
                });

                // Create notification in database
                Notification.saveNotification(newNotification, (err, notification) => {
                  if(err) throw err;

                  // Add Notification for User
                  User.findByIdAndUpdate(req.user._id, { has_notification: true }, (err, user) => {
                    if (err) throw err;

                    var newNotification = new Notification({
                      sender: req.user._id,
                      reciever: reciever._id,
                      type: '@' + req.user.username + ' accepted your friend request.',
                      link: '/profile/' + req.user.username,
                      date_sent: current_date
                    });

                    // Create notification in database
                    Notification.saveNotification(newNotification, (err, notification) => {
                      if(err) throw err;

                      // Add Notification for User
                      User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                        if (err) throw err;

                        req.flash('success_msg', "Accepted " + reciever.username);
                        res.redirect('/notifications/remove/' + notification_id);
                      });

                    });

                  });

                });

              });

            });

          });

        } else {

          // Update request for User
          User.removeRequest(info, (err, user) => {
            if(err) throw err;

            req.flash('success_msg', "Declined " + reciever.username);
            res.redirect('/notifications/remove/' + notification_id);

          });

        }

      } else {
        res.redirect('/notifications');
      }

    });
  } else {
    res.redirect('/users/register');
  }
});

// GET Profile Following
router.get('/profile/:username/following', (req, res, next) => {
   if(req.isAuthenticated()) {
      User.getUserByUsername(req.params.username, (err, profile) => {
         if(err) throw err;

         User.find({
             'username': { $in: profile.following}
         }, (err, profiles) => {
            if (err) throw err;
            res.render('followers', {
               page_title: '@' + profile.username,
               profiles: profiles
            });
         });
      });
   } else {
      res.redirect('/users/register');
   }
});

// GET Settings
router.get('/settings', (req, res, next) => {
   if(req.isAuthenticated()) {
      res.render('settings', {
         page_title: 'Settings',
         profilePage: true
      });
   } else {
      res.redirect('/users/register');
   }
});

// POST Settings
router.post('/settings', upload.fields([{name: 'profile_project_backgroundimage', maxCount: 1}, {name: 'profileimage', maxCount: 1}, {name: 'backgroundimage', maxCount: 1}]), (req, res, next) => {
   if(req.isAuthenticated()) {

      function capitalize(string) {
         return string.charAt(0).toUpperCase() + string.slice(1);
      }

      // var username = req.body.username;
      var bypassEmail = 'brian@bypassEmail';
      var oldUsername = req.user.username;
      var email = req.body.email.replace(/\r\n/g,'');
      var oldEmail = req.user.email.replace(/\r\n/g,'');
      var bio = req.body.bio.replace(/\r\n/g,'');
      var website_link = req.body.website_link.replace(/\r\n/g,'');
      var youtube_link = req.body.youtube_link.replace(/\r\n/g,'');
      var twitter_link = req.body.twitter_link.replace(/\r\n/g,'');
      var instagram_link = req.body.instagram_link.replace(/\r\n/g,'');
      var facebook_link = req.body.facebook_link.replace(/\r\n/g,'');
      var id = req.body.id;
      var user = req.body.user;

      if (req.body.make_profile_private === "true") {
         var is_private_profile = true;
      } else if (req.body.make_profile_public === "true") {
        var is_private_profile = false;
      } else {
         var is_private_profile = req.user.is_private_profile;
      }

      if(req.body.firstname === "") {
         var firstname = "";
      } else {
         var firstname = req.body.firstname.replace(/\r\n/g,'');
         firstname = capitalize(firstname);
         req.checkBody('firstname', 'First Name Is Too Long').isLength({ min: 0, max:50 });
      }

      if(req.body.lastname === "") {
         var lastname = "";
      } else {
         var lastname = req.body.lastname.replace(/\r\n/g,'');
         lastname = capitalize(lastname);
         req.checkBody('lastname', 'Last Name Is Too Long').isLength({ min: 0, max:50 });
      }

      // See if website_link has https://
      var has_https = website_link.search("https://");
      if(has_https > -1) {

         var url_without_https = website_link.split("https://")[1];
         website_link = url_without_https;

      }

      if (typeof req.body.music_link == 'undefined' || req.body.music_link == '' || req.body.music_link.length < 0) {
         var embed_link = req.user.music_link;
      } else {
         var music_link = req.body.music_link.replace(/\r\n/g,'');

         // See which service is music link
         var is_spotify = music_link.search("open.spotify.com/track/");
         var is_tidal = music_link.search("tidal.com/browse/track/");
         var is_tidal_2 = music_link.search("tidal.com/track/");
         var is_soundcloud = music_link.search("soundcloud.com/");
         var is_apple = music_link.search("music.apple.com/us/album/");
         var is_deezer = music_link.search("deezer.com/track");

         var embed_link;

         if (is_spotify > -1) {
            var spotify_track_id = music_link.split("/track/")[1];
            embed_link = '<iframe style="min-height: auto!important; z-index: 555555;" src="https://open.spotify.com/embed/track/' + spotify_track_id + '" width="300" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>'
         } else if (is_tidal > -1 || is_tidal_2 > -1) {
            var tidal_track_id = music_link.split("/track/")[1];
            embed_link = '<div style="position: relative;  overflow: hidden; max-width: 100%; z-index: 555555;"><iframe src="https://embed.tidal.com/tracks/' + tidal_track_id + '?layout=gridify" frameborder="0" allowfullscreen style="top: 0; left: 0; width: 100%; min-height: 100%; margin: 0 auto;"></iframe></div>'
         } else if (is_apple > -1) {
            var apple_track_id = music_link.split("music.apple.com/us/")[1];
            embed_link = '<iframe allow="autoplay *; encrypted-media *; fullscreen *" frameborder="0" height="150" style="width:100%;max-width:660px;overflow:hidden;background:transparent;z-index: 555555;" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" src="https://embed.music.apple.com/us/' + apple_track_id + '"></iframe>'
         } else if (is_deezer > -1) {
            var deezer_track_id = music_link.split("/track/")[1];
            embed_link = '<iframe style="z-index: 555555;"scrolling="no" frameborder="0" allowTransparency="true" src="https://www.deezer.com/plugins/player?format=classic&autoplay=false&playlist=true&width=700&height=350&color=EF5466&layout=&size=medium&type=tracks&id=' + deezer_track_id + '&app_id=1" width="700" height="350"></iframe>'
         } else {
            // nothing
            embed_link = req.user.music_link;
         }
      }


      // Profile Customization
      if (typeof req.body.profile_theme == 'undefined') {
         var profile_theme = req.user.profile_theme;
      } else {
         var profile_theme = req.body.profile_theme;
      }

      if (typeof req.body.profile_cursor == 'undefined') {
         var profile_cursor = req.user.profile_cursor;
      } else {
         var profile_cursor = req.body.profile_cursor;
      }

      if (typeof req.body.profile_main_accent_color == 'undefined') {
         var profile_main_accent_color = req.user.profile_main_accent_color;
      } else {
         var profile_main_accent_color = req.body.profile_main_accent_color;
      }

      if (typeof req.body.profile_main_font_accent_color == 'undefined') {
         var profile_main_font_accent_color = req.user.profile_main_font_accent_color;
      } else {
         var profile_main_font_accent_color = req.body.profile_main_font_accent_color;
      }

      if (typeof req.body.profile_secondary_accent_color == 'undefined') {
         var profile_secondary_accent_color = req.user.profile_secondary_accent_color;
      } else {
         var profile_secondary_accent_color = req.body.profile_secondary_accent_color;
      }

      if (typeof req.body.profile_secondary_font_accent_color == 'undefined') {
         var profile_secondary_font_accent_color = req.user.profile_secondary_font_accent_color;
      } else {
         var profile_secondary_font_accent_color = req.body.profile_secondary_font_accent_color;
      }

      if (typeof req.body.profile_btns_rounding == 'undefined') {
         var profile_btns_rounding = req.user.profile_btns_rounding;
      } else {
         var profile_btns_rounding = req.body.profile_btns_rounding;
      }

      if (typeof req.body.profile_main_font == 'undefined') {
         var profile_main_font = req.user.profile_main_font;
      } else {
         var profile_main_font = req.body.profile_main_font;
      }

      if (typeof req.body.profile_secondary_font == 'undefined') {
         var profile_secondary_font = req.user.profile_secondary_font;
      } else {
         var profile_secondary_font = req.body.profile_secondary_font;
      }

      var profile_project_background_color;

      if (req.body.color_was_chosen) {
         profile_project_background_color = req.user.profile_project_background_color;
      } else {
         profile_project_background_color = req.body.profile_project_background_color;
      }

      // Form Validation
      // req.checkBody('username', 'Please Enter A Username').notEmpty();
      // req.checkBody('username', 'Username Must Be Between 5-50 Characters').isLength({ min: 5, max:50 });
      req.checkBody('bio', 'Bio Is Too Long.').isLength({ min: 0, max: 200 });

      if (req.body.email != bypassEmail) {
         // We don't check for these with a bypassed email

         req.checkBody('email', 'Please Enter An Email Address').notEmpty();
         req.checkBody('email', 'Please Enter A Valid Email Address').isEmail();
      }

      errors = req.validationErrors();

      if(errors) {
         User.findById(id, (err, user) => {
            if(err) throw err;

            res.render('settings', {
               errors: errors,
               page_title: 'Settings',
               user: user,
               profilePage: true
            });
         });
      } else {

         /*
            Must be edited to update username if the user was
            an admin to a project, owner of a project,
            following someone, etc.
         */

         // User.getUserByUsername(username, (err, user) => {
         //    if(err) throw err;
         //    if(!user || user.username === oldUsername) {
         //       User.getUserByEmail(email, (err, user) => {
         //          if(err) throw err;
         //          if(!user || user.email === oldEmail) {
         //
         //             if(req.file) {
         //                var ext = path.extname(req.file.originalname);
         //                if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {
         //                   User.findById(id, (err, user) => {
         //                      if(err) throw err;
         //
         //                      res.render('settings', {
         //                         error_msg: 'Uploaded File Must End With .jpg .jpeg .png .gif',
         //                         firstname: firstname,
         //                         lastname: lastname,
         //                         username: username,
         //                         email: email,
         //                         page_title: 'Settings',
         //                         user: user
         //                      });
         //                   });
         //                } else {
         //                   // var fileExt = req.file.originalname.split('.').pop();
         //                   var backgroundimage = dateNow + file.originalname;
         //
         //                   User.findByIdAndUpdate(id, {
         //                      firstname: firstname,
         //                      lastname: lastname,
         //                      username: username,
         //                      email: email,
         //                      backgroundimage: backgroundimage
         //                   }, (err, user) => {
         //                      if (err) throw err;
         //                   });
         //
         //                   res.redirect('/profile/' + username);
         //                }
         //             } else {
         //
         //                User.findByIdAndUpdate(id, {
         //                   firstname: firstname,
         //                   lastname: lastname,
         //                   username: username,
         //                   email: email
         //                }, (err, user) => {
         //                   if (err) throw err;
         //                });
         //
         //                res.redirect('/profile/' + username);
         //             }
         //
         //          } else {
         //             // Email address is taken
         //             User.findById(id, (err, user) => {
         //                if(err) throw err;
         //
         //                res.render('settings', {
         //                   error_msg: 'Sorry That Email Address Is Taken',
         //                   firstname: firstname,
         //                   lastname: lastname,
         //                   username: username,
         //                   email: email,
         //                   page_title: 'Settings',
         //                   user: user
         //                });
         //             });
         //          }
         //       });
         //    } else {
         //       // Username is taken
         //       User.findById(id, (err, user) => {
         //          if(err) throw err;
         //
         //          res.render('settings', {
         //             error_msg: 'Sorry That Username Is Taken',
         //             firstname: firstname,
         //             lastname: lastname,
         //             username: username,
         //             email: email,
         //             page_title: 'Settings',
         //             user: user
         //          });
         //       });
         //    }
         // });

         User.getUserByEmail(email, (err, user) => {
            if(err) throw err;
            if(!user || user.email === oldEmail || email === bypassEmail) {

               if(req.files.profileimage || req.files.backgroundimage || req.files.profile_project_backgroundimage) {

                  if (req.files.profileimage) {
                     var ext = path.extname(req.files.profileimage[0].originalname);

                     if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {
                        User.findById(id, (err, user) => {
                           if(err) throw err;

                           res.render('settings', {
                              error_msg: 'Profile Image Must End With .jpg .jpeg .png .gif',
                              firstname: firstname,
                              lastname: lastname,
                              email: email,
                              page_title: 'Settings',
                              user: user,
                              profilePage: true
                           });
                        });
                     } else {
                        var filename = dateNow + req.files.profileimage[0].originalname;
                        filename = filename.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); // replace everything except letters and numbers

                        var profileimage = filename;

                        Project.find({'_id': { $in: req.user.own_projects}}, (err, user_projects) => {
                           user_projects.forEach(function(proj_id, key) {
                              Project.findByIdAndUpdate(proj_id, {
                                 project_owner_profile_image: profileimage
                              }, (err, user) => {
                                 if (err) throw err;
                              });
                           });
                        });
                     }
                  } else {
                     var profileimage = req.user.profileimage;
                  }

                  if (req.files.backgroundimage) {
                     var ext = path.extname(req.files.backgroundimage[0].originalname);

                     if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {
                        User.findById(id, (err, user) => {
                           if(err) throw err;

                           res.render('settings', {
                              error_msg: 'Header Image Must End With .jpg .jpeg .png .gif',
                              firstname: firstname,
                              lastname: lastname,
                              email: email,
                              page_title: 'Settings',
                              user: user,
                              profilePage: true
                           });
                        });
                     } else {
                        var filename = dateNow + req.files.backgroundimage[0].originalname;
                        filename = filename.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); // replace everything except letters and numbers
                        var backgroundimage = filename;
                     }
                  } else {
                     var backgroundimage = req.user.backgroundimage;
                  }

                  if (req.files.profile_project_backgroundimage) {
                     var ext = path.extname(req.files.profile_project_backgroundimage[0].originalname);

                     if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {
                        User.findById(id, (err, user) => {
                           if(err) throw err;

                           res.render('settings', {
                              error_msg: 'Project Background Image Must End With .jpg .jpeg .png .gif',
                              firstname: firstname,
                              lastname: lastname,
                              email: email,
                              page_title: 'Settings',
                              user: user,
                              profilePage: true
                           });
                        });
                     } else {

                        var filename = dateNow + req.files.profile_project_backgroundimage[0].originalname;
                        filename = filename.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); // replace everything except letters and numbers

                        var profile_project_backgroundimage = filename;
                     }
                  } else {
                     if (typeof req.body.remove_profile_project_bg != 'undefined') {
                        var profile_project_backgroundimage;
                        var profile_project_background_color;
                     } else {
                        if (req.body.color_was_chosen) {
                           var profile_project_background_color = req.body.profile_project_background_color;
                        } else {
                           var profile_project_background_color = req.user.profile_project_background_color;
                           var profile_project_backgroundimage = req.user.profile_project_backgroundimage;
                        }
                     }
                  }

                  User.findByIdAndUpdate(id, {
                     firstname: firstname,
                     lastname: lastname,
                     email: email,
                     bio: bio,
                     website: website_link,
                     youtube: youtube_link,
                     twitter: twitter_link,
                     instagram: instagram_link,
                     facebook: facebook_link,
                     profileimage: profileimage,
                     music_link: embed_link,
                     backgroundimage: backgroundimage,
                     profile_theme: profile_theme,
                     profile_project_backgroundimage: profile_project_backgroundimage,
                     profile_cursor: profile_cursor,
                     profile_secondary_accent_color: profile_secondary_accent_color,
                     profile_main_accent_color: profile_main_accent_color,
                     profile_secondary_font_accent_color: profile_secondary_font_accent_color,
                     profile_main_font_accent_color: profile_main_font_accent_color,
                     profile_btns_rounding: profile_btns_rounding,
                     profile_main_font: profile_main_font,
                     profile_secondary_font: profile_secondary_font,
                     profile_project_background_color: profile_project_background_color,
                     is_private_profile: is_private_profile
                  }, (err, user) => {
                     if (err) throw err;

                     if (is_private_profile) {

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
                                  res.redirect('/profile/' + req.user.username);
                                }
                             });
                           });

                         } else {
                           res.redirect('/profile/' + req.user.username);
                         }
                       } else {
                         res.redirect('/profile/' + req.user.username);
                       }

                     } else {

                       var project_counter = 0;

                       if (typeof req.user.own_projects != "undefined") {

                         if (req.user.own_projects.length > 0) {

                           req.user.own_projects.forEach(function(proj, key) {
                             Project.findByIdAndUpdate(mongoose.Types.ObjectId(proj), {
                               project_owner_has_private_profile: false
                             }, (err, project) => {
                                if (err) throw err;

                                project_counter += 1;

                                if (project_counter == req.user.own_projects.length) {
                                  res.redirect('/profile/' + req.user.username);
                                }
                             });
                           });

                         } else {
                           res.redirect('/profile/' + req.user.username);
                         }
                       } else {
                         res.redirect('/profile/' + req.user.username);
                       }

                     }

                  });

               } else {

                  // User didn't upload images

                  if (typeof req.body.remove_profile_project_bg != 'undefined') {
                     var profile_project_backgroundimage;
                     var profile_project_background_color;
                  } else {
                     if (req.body.color_was_chosen) {
                        var profile_project_background_color = req.body.profile_project_background_color;
                     } else {
                        var profile_project_background_color = req.user.profile_project_background_color;
                        var profile_project_backgroundimage = req.user.profile_project_backgroundimage;
                     }
                  }


                  User.findByIdAndUpdate(id, {
                     firstname: firstname,
                     lastname: lastname,
                     email: email,
                     bio: bio,
                     website: website_link,
                     youtube: youtube_link,
                     twitter: twitter_link,
                     instagram: instagram_link,
                     facebook: facebook_link,
                     music_link: embed_link,
                     profile_cursor: profile_cursor,
                     profile_theme: profile_theme,
                     profile_secondary_accent_color: profile_secondary_accent_color,
                     profile_main_accent_color: profile_main_accent_color,
                     profile_secondary_font_accent_color: profile_secondary_font_accent_color,
                     profile_main_font_accent_color: profile_main_font_accent_color,
                     profile_btns_rounding: profile_btns_rounding,
                     profile_main_font: profile_main_font,
                     profile_secondary_font: profile_secondary_font,
                     profile_project_backgroundimage: profile_project_backgroundimage,
                     profile_project_background_color: profile_project_background_color,
                     is_private_profile: is_private_profile
                  }, (err, user) => {
                     if (err) throw err;

                     if (is_private_profile) {

                       var project_counter = 0;

                       if (typeof req.user.own_projects != "undefined") {

                         if (req.user.own_projects.length > 0) {

                           req.user.own_projects.forEach(function(proj, key) {

                             Project.findByIdAndUpdate(mongoose.Types.ObjectId(proj), {
                               project_owner_has_private_profile: true
                             }, (err, project) => {
                                if (err) throw err;

                                project_counter += 1;

                                console.log(project_counter + ' ' + req.user.own_projects.length);

                                if (project_counter == req.user.own_projects.length) {
                                  res.redirect('/profile/' + req.user.username);
                                }
                             });
                           });

                         }

                       } else {
                         res.redirect('/profile/' + req.user.username);
                       }

                     } else {

                       var project_counter = 0;

                       if (typeof req.user.own_projects != "undefined") {

                         if (req.user.own_projects.length > 0) {

                           req.user.own_projects.forEach(function(proj, key) {
                             Project.findByIdAndUpdate(mongoose.Types.ObjectId(proj), {
                               project_owner_has_private_profile: false
                             }, (err, project) => {
                                if (err) throw err;

                                project_counter += 1;

                                if (project_counter == req.user.own_projects.length) {
                                  res.redirect('/profile/' + req.user.username);
                                }
                             });
                           });

                         } else {
                           res.redirect('/profile/' + req.user.username);
                         }
                       } else {
                         res.redirect('/profile/' + req.user.username);
                       }

                     }
                  });

               }

            } else {
               // Email address is taken
               User.findById(id, (err, user) => {
                  if(err) throw err;

                  res.render('settings', {
                     error_msg: 'Sorry That Email Address Is Taken',
                     firstname: firstname,
                     lastname: lastname,
                     bio: bio,
                     website: website_link,
                     youtube: youtube_link,
                     twitter: twitter_link,
                     instagram: instagram_link,
                     facebook: facebook_link,
                     email: email,
                     page_title: 'Settings',
                     user: user,
                     profilePage: true
                  });
               });
            }
         });
      }
   } else {
      res.redirect('/users/register');
   }
});

// Delete Profile
router.post('/delete/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      if (req.body.check_username === req.user.username) {

         User.findById(req.params.id, (err, user) => {
            if(err) throw err;

            if (req.user.username === user.username || req.user.username === 'hryzn') {
               if(user.projects) {

                  var info = [];

                  for (var i = 0, len = user.projects.length; i < len; i++) {
                     info['projectId'] = user.projects[i]._id;

                     // Find project to delete
                     Project.findById(info['projectId'], (err, project) => {
                        if(err) throw err;

                        // User would no longer have project saved
                        if(project.followers.length > 0) {
                           for (var i = 0, len = project.followers.length; i < len; i++) {
                              info['profileUsername'] = project.followers[i];

                              User.unsaveToProfile(info, (err, user) => {
                                 if(err) throw err;
                              });
                           }
                        }

                        // User will no longer be an admin
                        if(project.admins.length > 0) {
                           for (var i = 0, len = project.admins.length; i < len; i++) {
                              info['profileUsername'] = project.admins[i];

                              User.deleteFromProfile(info, (err, user) => {
                                 if(err) throw err;
                              });
                           }
                        }

                        // Delete project image
                        var s3_instance = new aws.S3();
                        var s3_params = {
                           Bucket: 'hryzn-app-static-assets',
                           Key: project.project_image
                        };
                        s3_instance.deleteObject(s3_params, (err, data) => {
                           if(data) {
                              console.log("File deleted");
                           }
                           else {
                              console.log("AWS Project Image Not Deleted:" + err);
                           }
                        });

                        // Delete the project if owner
                        if(project.project_owner === req.user.username) {
                           Project.findByIdAndRemove(info['projectId'], (err) => {
                             if (err) throw err;
                           });
                        }

                     });
                  }
               }

               // Delete profile image
               var s3_instance = new aws.S3();
               var s3_params = {
                  Bucket: 'hryzn-app-static-assets',
                  Key: user.backgroundimage
               };
               s3_instance.deleteObject(s3_params, (err, data) => {
                  if(data) {
                     console.log("File deleted");
                  }
                  else {
                     console.log("AWS Profile Image Not Deleted: " + err);
                  }
               });

               User.findByIdAndRemove(user._id, (err) => {
                 if (err) throw err;
                 res.redirect('/');
               });
            } else {
               res.redirect('/');
            }

         });

      }

   } else {
      res.redirect('/users/register');
   }
});

// Get Explore
router.get('/explore', (req, res, next) => {
   Project.find({}, (err, projects) => {

      if (err) throw err;

      var all_public_projects = [];

      projects.forEach(function(project, key) {

         // Scan through every project

         if(project.posted_to_collection) {
            if (project.posted_to_collection.length > 0) {

               // See if project has any collections

               project.posted_to_collection.forEach(function(project_collection, key) {

                  if (project_collection.collection_is_private) {

                     // If collection was private skip project

                  } else {
                     // If collection was public mark that we scanned collection
                     all_public_projects.push(project);
                  }
               });
            } else {
               // No collections so we mark that we scanned project
               all_public_projects.push(project);
            }
         } else {
            // No collections so we mark that we scanned project
            all_public_projects.push(project);
         }
      });

      Group.find({}, (err, groups) => {
         res.render('explore', {
            page_title: 'Explore',
            projects: all_public_projects.reverse(),
            groups: groups.reverse(),
            explore_default: true,
            explore_active: true,
            main_page_nav: true
         });
      });

   });
});

// Get Category
router.get('/explore/:category', (req, res, next) => {
   if(req.isAuthenticated()) {

      Project.find({ 'categories': { $in: req.params.category} }, (err, projects) => {
         if (err) throw err;

         Group.find({ 'group_categories': { $in: req.params.category} }, (err, groups) => {

            res.render('explore', {
               page_title: "#" + req.params.category,
               projects: projects.reverse(),
               groups: groups.reverse(),
               explore_default: true,
               category_title: "#" + req.params.category
            });

         });
      });

   } else {
      res.redirect('/users/register');
   }
});

// Get Search
router.get('/search', (req, res, next) => {
   var searchTerm = req.query.p;

   if (typeof searchTerm != 'string') {
     res.redirect('/');
   } else {

     User.find({$text: { $search: searchTerm }}, {score: { $meta: "textScore" }}, (err, user) => {
        if (err) throw err;

        Project.find({$text: { $search: searchTerm }}, {score: { $meta: "textScore" }}, (err, projects) => {
           if (err) throw err;

           var all_public_projects = [];

           projects.forEach(function(project, key) {

              // Scan through every project

              var project = project.toObject();

              if(project.posted_to_collection) {
                 if (project.posted_to_collection.length > 0) {

                    // See if project has any collections

                    project.posted_to_collection.forEach(function(project_collection, key) {

                       if (project_collection.collection_is_private) {

                          // If collection was private skip project

                       } else {
                          // If collection was public mark that we scanned collection
                          all_public_projects.push(project);
                       }
                    });
                 } else {
                    // No collections so we mark that we scanned project
                    all_public_projects.push(project);
                 }
              } else {
                 // No collections so we mark that we scanned project
                 all_public_projects.push(project);
              }
           });

           Group.find({$text: { $search: searchTerm }}, {score: { $meta: "textScore" }}, (err, groups) => {
              if (err) throw err;

              res.render('explore', {
                 page_title: 'Explore',
                 projects: all_public_projects,
                 group_search: groups,
                 user_search: user,
                 project_search: projects,
                 explore_default: false,
                 explore_active: true
              });
           }).sort({score: { $meta: "textScore" }});
        }).sort({score: { $meta: "textScore" }});
     }).sort({score: { $meta: "textScore" }});

   }
});

// Get Sitemap
router.get('/sitemap', (req, res, next) => {
   res.render('sitemap', {
      page_title: 'Sitemap',
      sitemap: true
   });
});

// Get Loader IO
router.get('/loaderio-aec7fb408421b42661b8aa1a3039d7e8', (req, res, next) => {
   res.render('loaderio', {
      page_title: 'Loader IO',
      sitemap: true
   });
});

// Onboarding Survey
router.post('/onboarding_survey', (req, res, next) => {
   if(req.isAuthenticated()) {

      var interests = []

      if (typeof req.body.art != 'undefined') {
         interests.push('Art');
      }

      if (typeof req.body.beauty_fashion != 'undefined') {
         interests.push('Beauty & Fashion');
      }

      if (typeof req.body.business != 'undefined') {
         interests.push('Business');
      }

      if (typeof req.body.family_society != 'undefined') {
         interests.push('Family & Society');
      }

      if (typeof req.body.food_drink != 'undefined') {
         interests.push('Food & Drink');
      }

      if (typeof req.body.health_wellness != 'undefined') {
         interests.push('Health & Wellness');
      }

      if (typeof req.body.home_garden != 'undefined') {
         interests.push('Home & Garden');
      }

      if (typeof req.body.science_technology != 'undefined') {
         interests.push('Science & Technology');
      }

      if (typeof req.body.sports_fitness != 'undefined') {
         interests.push('Sports & Fitness');
      }

      if (typeof req.body.travel != 'undefined') {
         interests.push('Travel');
      }

      console.log(interests);

      User.findByIdAndUpdate(req.user._id, {
         interests: interests,
         completed_interest_onboarding: true
      }, (err, user) => {
         if (err) throw err;

         res.redirect('/walkthrough/modal');
      });

   } else {
      res.redirect('/users/register');
   }
});


// Get Edit Collection
router.get('/collection/edit/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      Collection.findOne({ '_id': { $in: req.params.id} }, (err, collection) => {

         if (err) throw err;

         if (collection.collection_owner === req.user.username) {

            Project.find({ '_id': { $in: collection.projects} }, (err, projects) => {

               if (err) throw err;

               User.find({ '_id': { $in: collection.followers} }, (err, followers) => {

                  if (err) throw err;

                  User.findOne({ 'username': { $in: req.user.username} }, (err, profile) => {

                     if (err) throw err;

                     var projects_not_in_collection = [];

                     profile.own_projects.forEach(function(profile_project, key) {
                        if (collection.projects) {
                           if (collection.projects.indexOf(profile_project) == -1) {
                              projects_not_in_collection.push(profile_project);
                           } else {
                           }
                        } else {
                           projects_not_in_collection.push(profile_project);
                        }
                     });

                     Project.find({ '_id': { $in: projects_not_in_collection} }, (err, profile_projects) => {

                        if (err) throw err;

                        User.find({ 'username': { $in: profile.followers} }, (err, profile_followers) => {

                           if (err) throw err;

                           var not_following_collection = [];

                           profile_followers.forEach(function(profile_follower, key) {
                              if (collection.followers) {
                                 if (collection.followers.indexOf(profile_follower._id) == -1) {
                                    not_following_collection.push(profile_follower);
                                 }
                              } else {
                                 not_following_collection.push(profile_follower);
                              }
                           });

                           res.render('collections/edit-collection', {
                              page_title: 'Edit Collection',
                              collection: collection,
                              collection_projects: projects.reverse(),
                              profile_projects: profile_projects.reverse(),
                              collection_followers: followers,
                              profile_followers: not_following_collection
                           });

                        });
                     });
                  });

               });

            });

         } else {
            res.redirect('/');
         }

      });

   } else {
      res.redirect('/users/register');
   }
});

// POST Edit Collection
router.post('/edit-collection/:id', (req, res, next) => {

   if(req.isAuthenticated()) {

      var id = req.body.id;
      var user = req.body.user;
      var collection_name = req.body.collection_name.replace(/\r\n/g,'');
      var is_private = req.body.is_private;
      var add_followers = req.body.add_followers;
      var add_projects = req.body.add_projects;
      var remove_followers = req.body.remove_followers;
      var remove_projects = req.body.remove_projects;

      var collection_slug = collection_name.replace(/\s+/g, '-').toLowerCase();
      collection_slug = collection_slug.replace(/[^a-z]/gi,''); // letters

      Collection.findOne({ '_id': { $in: req.params.id} }, (err, collection) => {

         if (err) throw err;

         if (req.body.collection_categories) {
            var collection_categories = req.body.collection_categories;
         } else {
            var collection_categories = collection.collection_categories;
         }

         if (collection.projects) {
            var project_list = collection.projects;
         } else {
            var project_list = []
         }

         if (remove_projects) {
            remove_projects.forEach(function(project_id, key) {
               var info = [];
               info['projectId'] = project_id;
               info['collectionId'] = req.params.id;

               Project.findOne({ '_id': { $in: project_id } }, (err, project) => {
                  if (project) {

                     project.toObject();

                     var new_collection_array = [];

                     project.posted_to_collection.forEach(function(project_collection, key) {
                        if (project_collection.collection_id != req.params.id) {
                           new_collection_array.push(project_collection);
                        }
                     });

                     Project.findByIdAndUpdate(project_id, {
                        posted_to_collection: new_collection_array,
                     }, (err, project) => {
                        if (err) throw err;
                     });
                  }
               });

               // $pull from mongoose not working
               // Project.removeCollection(info, (err, project) => {
               //    if(err) throw err;
               //    console.log(project);
               // });

               Collection.removeProject(info, (err, collection) => {
                  if(err) throw err;
               });
            });

            project_list = project_list.filter(function(x) {
              return remove_projects.indexOf(x) < 0;
            });
         }

         if (add_projects) {
            add_projects.forEach(function(project_id, key) {
               project_list.push(project_id);

               var info = [];
               info['collectionId'] = req.params.id;
               info['projectId'] = project_id;
               Project.addCollection(info, (err, project) => {
                  if(err) throw err;
               });
            });
         }


         if (collection.followers) {
            var follower_list = collection.followers;
         } else {
            var follower_list = []
         }

         if (remove_followers) {
            follower_list = follower_list.filter(function(x) {
              return remove_followers.indexOf(x) < 0;
            });
         }

         if (add_followers) {
            add_followers.forEach(function(follower_id, key) {
               follower_list.push(follower_id);
            });
         }


         var info = [];
         info['collectionId'] = req.params.id;
         info['collectionName'] = collection_name;
         info['collectionIsPrivate'] = is_private;
         info['collectionFollowers'] = follower_list;
         info['collectionOwner'] = req.user.username;

         if (collection.projects) {
            collection.projects.forEach(function(project, key) {
               Project.findOne({ '_id': { $in: project} }, (err, project) => {
                  if (project) {
                     info['projectId'] = project._id.toString();
                     Project.updateCollection(info, (err, project) => {
                        if(err) throw err;
                     });
                  }
               });
            });
         }

         User.findOne({ 'username': { $in: req.user.username} }, (err, user) => {
            if (user) {
               info['userId'] = user._id.toString();
               User.updateCollection(info, (err, user) => {
                  if(err) throw err;
               });
            }
         });

         Collection.findByIdAndUpdate(req.params.id, {
            collection_name: collection_name,
            is_private: is_private,
            followers: follower_list,
            projects: project_list,
            collection_slug: collection_slug,
            collection_categories: collection_categories
         }, (err, collection) => {
            if (err) throw err;
         });

         req.flash('success_msg', "Collection was updated.");
         res.redirect('/profile/' + req.user.username);

      });

   } else {
      res.redirect('/users/register');
   }
});


// POST Create Collection
router.post('/create-collection', (req, res, next) => {

   if(req.isAuthenticated()) {

      var id = req.body.id;
      var user = req.body.user;
      var collection_name = req.body.the_collection_name.replace(/\r\n/g,'');
      var is_private = req.body.is_private;
      var collection_owner = req.user.username;
      var followers = req.body.collection_followers;
      var collection_projects = req.body.collection_projects;

      if (followers) {
         is_private = true;
      }

      var collection_slug = collection_name.replace(/\s+/g, '-').toLowerCase();
      collection_slug = collection_slug.replace(/[^a-z]/gi,''); // letters

      if (req.body.collection_categories) {
         var collection_categories = req.body.collection_categories;
      } else {
         var collection_categories = [];
      }

      var newCollection = new Collection({
         followers: followers,
         collection_name: collection_name,
         is_private: is_private,
         collection_owner: collection_owner,
         collection_categories: collection_categories,
         projects: collection_projects,
         collection_slug: collection_slug
      });

      // Create collection in database
      Collection.saveCollection(newCollection, (err, collection) => {
         if(err) throw err;

         // Add collection to User document
         info = [];
         info['profileUsername'] = req.user.username;
         info['collectionId'] = collection._id.toString();
         info['collectionName'] = collection.collection_name.toString();
         info['collectionIsPrivate'] = collection.is_private;
         info['collectionFollowers'] = followers;
         info['collectionOwner'] = req.user.username;

         User.addCollection(info, (err, user) => {
            if(err) throw err;
         });

         collection.projects.forEach(function(project_id, key) {
            info['projectId'] = project_id;

            Project.addCollection(info, (err, project) => {
               if(err) throw err;
            });
         });

         req.flash('success_msg', "Collection was created.");
         res.redirect('/profile/' + req.user.username);
      });

   } else {
      res.redirect('/users/register');
   }
});


// Delete Collection
router.get('/collection/delete/:id/:deleteAll', (req, res, next) => {
   if(req.isAuthenticated()) {

      if (req.params.deleteAll === 'true') {
         var deleteProjects = true;
      } else  {
         var deleteProjects = false;
      }

      var info = [];

      Collection.findById(req.params.id, (err, collection) => {
         if(err) throw err;

         if (collection) {

           if (collection.collection_owner === req.user.username || req.user.username === 'hryzn') {

              if (collection.is_private && deleteProjects) {

                 // Delete Everything

                 if(collection.projects.length) {

                    collection.projects.forEach(function(proj, key) {
                       // Find project to delete
                       Project.findById(proj, (err, project) => {
                          if(err) throw err;

                          // If project has saves
                          if(project.saves.length) {

                             for (var i = 0, len = project.saves.length; i < len; i++) {
                                info['profileUsername'] = project.saves[i];
                                info['projectId'] = project._id;

                                User.unsaveToProfile(info, (err, user) => {
                                   if(err) throw err;
                                });
                             }

                          }

                          // If project has admins
                          if(project.project_owner.length) {
                             info['profileUsername'] = project.project_owner;
                             info['projectId'] = project._id;

                             console.log(info['projectId']);

                             User.deleteFromProfile(info, (err, user) => {
                                if(err) throw err;

                                console.log(user);
                             });
                          }

                          // If project has reposts
                          if(project.reposts.length) {
                             for (var i = 0, len = project.reposts.length; i < len; i++) {
                                info['profileUsername'] = project.reposts[i];
                                info['projectId'] = project._id;

                                User.unrepostProject(info, (err, user) => {
                                   if(err) throw err;
                                });
                             }
                          }

                          // Delete project image
                          var s3_instance = new aws.S3();
                          var s3_params = {
                             Bucket: 'hryzn-app-static-assets',
                             Key: project.project_image
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
                          Project.findByIdAndRemove(project._id, (err) => {
                            if (err) throw err;
                          });

                       });
                    });

                 }

                 // Delete from owner
                 info['profileUsername'] = req.user.username;
                 info['collectionId'] = req.params.id;

                 User.removeCollection(info, (err, user) => {
                    if(err) throw err;
                 });

                 // Delete the collection
                 Collection.findByIdAndRemove(req.params.id, (err) => {
                   if (err) throw err;
                   req.flash('success_msg', "Destroyed From Existence...");
                   res.redirect('/profile/' + req.user.username);
                 });

              } else {

                 // Keep Projects

                 if(collection.projects.length) {

                    collection.projects.forEach(function(proj, key) {
                       var info = [];
                       info['projectId'] = proj;
                       info['collectionId'] = req.params.id;

                       Project.findOne({ '_id': { $in: proj } }, (err, project) => {
                          if (project) {

                             project.toObject();

                             var new_collection_array = [];

                             project.posted_to_collection.forEach(function(project_collection, key) {
                                if (project_collection.collection_id != req.params.id) {
                                   new_collection_array.push(project_collection);
                                }
                             });

                             Project.findByIdAndUpdate(proj, {
                                posted_to_collection: new_collection_array,
                             }, (err, project) => {
                                if (err) throw err;
                             });
                          }
                       });

                       // Project.removeCollection(info, (err, project) => {
                       //    if(err) throw err;
                       // });

                    });

                 }

                 // Delete from owner
                 info['profileUsername'] = req.user.username;
                 info['collectionId'] = req.params.id;

                 User.removeCollection(info, (err, user) => {
                    if(err) throw err;
                 });

                 // Delete the Collection
                 Collection.findByIdAndRemove(req.params.id, (err) => {
                   if (err) throw err;
                   req.flash('success_msg', "Destroyed From Existence...");
                   res.redirect('/profile/' + req.user.username);
                 });

              }

           } else {
              res.redirect('/profile/' + req.user.username);
           }

         } else {
            res.redirect('/');
         }
      });
   } else {
      res.redirect('/users/register');
   }
});



const calculateOrderAmount = (items, connected_id) => {

  User.findOne({ 'stripe_connected_account_id': { $in: connected_id } }, (err, connected_account) => {

    if (err) throw err;

    if (connected_account) {

      if (items.id === 'tip') {
        var amount = items.amount.replace("$", "");
        amount = amount.replace(",", "");
        amount = parseFloat(amount) * 100;
      }

      if (items.id === 'subscription') {
        var amount = connected_account.creator_subscription.current_price;
        amount = amount.replace("$", "");
        amount = amount.replace(",", "");
        amount = parseFloat(amount) * 100;

        console.log('calculating order amount ' + amount);
      }

      return amount
    }

  });
}

const calculateApplicationFeeAmount = (amount, connected_id, calculateOrderAmount) => {

  User.findOne({ 'stripe_connected_account_id': { $in: connected_id} }, (err, connected_account) => {

    if (err) throw err;

    if (amount === 'subscription') {

      var items = {
        id: 'subscription'
      }

      console.log('calculating app fee amount ' + amount);

      return calculateOrderAmount(items, connected_id);

    } else {

      if (connected_account) {
        switch (connected_account.premium_creator_account) {
          case 1:
            var percentage = .1 * amount;
            break;
          case 2:
            var percentage = .07 * amount;
            break;
          case 3:
            var percentage = .04 * amount;
            break;
          default:
        }

        return percentage
      }

    }

  });

}

const createCustomerSubscription = async (amount, connected_account) => {

  // if (req.user.stripe_customer_id != 'undefined') {
  //
  //   const subscription = await stripe.subscriptions.create({
  //     customer: req.user.stripe_customer_id,
  //     items: [
  //       {
  //         price: connected_account.creator_subscription.stripe_price_id,
  //       },
  //     ],
  //     expand: ["latest_invoice.payment_intent"],
  //     application_fee_percent: calculateApplicationFeeAmount(amount, connected_account.stripe_connected_account_id),
  //     transfer_data: {
  //       destination: connected_account.stripe_connected_account_id
  //     }
  //   });
  //
  // } else {
  //
  //   const customer = await stripe.customers.create({
  //     email: req.user.email
  //   });
  //
  //   const subscription = await stripe.subscriptions.create({
  //     customer: customer.id,
  //     items: [
  //       {
  //         price: connected_account.creator_subscription.stripe_price_id,
  //       },
  //     ],
  //     expand: ["latest_invoice.payment_intent"],
  //     application_fee_percent: calculateApplicationFeeAmount(amount, connected_account.stripe_connected_account_id),
  //     transfer_data: {
  //       destination: connected_account.stripe_connected_account_id
  //     }
  //   });
  //
  // }

}

router.post('/create-payment-intent', async (req, res) => {

    const data = req.body;

    if (data.items.id === 'tip') {

      User.findOne({ 'stripe_connected_account_id': { $in: data.account } }, async (err, connected_account) => {

        if (err) throw err;

        if (connected_account) {

          var amount = data.amount.replace("$", "");
          amount = amount.replace(",", "");
          amount = parseFloat(amount) * 100;

          // if (amount < 400) {
          //
          //   return res.status(500).send({
          //     error: {
          //       message: 'Amount must be at least $4'
          //     }
          //   });
          //
          // } else {
          // }

          switch (connected_account.premium_creator_account) {
            case 1:
              var percentage = .1 * amount;
              break;
            case 2:
              var percentage = .07 * amount;
              break;
            case 3:
              var percentage = .04 * amount;
              break;
            default:
          }

          await stripe.paymentIntents.create({
            amount: amount,
            currency: data.currency,
            application_fee_amount: percentage,
            transfer_data: {
              destination: data.account,
            },
          }).then(function(paymentIntent) {
            try {
              return res.send({
                clientSecret: paymentIntent.client_secret
              });
            } catch (err) {
              return res.status(500).send({
                error: err.message
              });
            }
          });

        }

      });

    }

    if (data.items.id === 'subscription') {

      var amount = 'subscription';

      if (typeof req.user.stripe_customer_id != 'undefined') {

        User.findOne({ 'stripe_connected_account_id': { $in: data.account } }, async (err, connected_account) => {

          if (err) throw err;

          if (connected_account) {

            var amount = connected_account.creator_subscription.current_price;
            amount = amount.replace("$", "");
            amount = amount.replace(",", "");
            amount = parseFloat(amount) * 100;

            switch (connected_account.premium_creator_account) {
              case 1:
                var percentage = .1 * amount;
                break;
              case 2:
                var percentage = .07 * amount;
                break;
              case 3:
                var percentage = .04 * amount;
                break;
              default:
            }

            await stripe.paymentIntents.create({
              amount: amount,
              currency: data.currency,
              customer: req.user.stripe_customer_id,
              application_fee_amount: percentage,
              transfer_data: {
                destination: data.account,
              },
            }).then(function(paymentIntent) {
              try {
                return res.send({
                  clientSecret: paymentIntent.client_secret
                });
              } catch (err) {
                return res.status(500).send({
                  error: err.message
                });
              }
            });
          }

        });

      } else {

        User.findOne({ 'stripe_connected_account_id': { $in: data.account } }, async (err, connected_account) => {

          if (err) throw err;

          if (connected_account) {

            const customer = await stripe.customers.create({
              email: req.user.email
            });

            User.findByIdAndUpdate(req.user._id, { stripe_customer_id: customer.id }, async (err, user) => {
               if (err) throw err;

               var amount = connected_account.creator_subscription.current_price;
               amount = amount.replace("$", "");
               amount = amount.replace(",", "");
               amount = parseFloat(amount) * 100;

               switch (connected_account.premium_creator_account) {
                 case 1:
                   var percentage = .1 * amount;
                   break;
                 case 2:
                   var percentage = .07 * amount;
                   break;
                 case 3:
                   var percentage = .04 * amount;
                   break;
                 default:
               }

               await stripe.paymentIntents.create({
                 amount: amount,
                 currency: data.currency,
                 customer: customer.id,
                 application_fee_amount: percentage,
                 transfer_data: {
                   destination: data.account,
                 },
               }).then(function(paymentIntent) {
                 try {
                   return res.send({
                     clientSecret: paymentIntent.client_secret
                   });
                 } catch (err) {
                   return res.status(500).send({
                     error: err.message
                   });
                 }
               });
            });

          }

        });

      }

    }

});


router.post('/find-connected-account', (req, res) => {

    const data = req.body;

    User.findOne({ 'stripe_connected_account_id': { $in: data.account } }, (err, connected_account) => {

      if (err) throw err;

      if (connected_account) {

        res.send({
          connected_account: connected_account
        });

      }

    });

});


router.post('/payment-success', (req, res) => {

    const data = req.body;
    var reciever_id = data.reciever_id;
    var amount = data.amount;
    var payment_id = data.payment_id;

    // Tips
    if (payment_id === 'tip') {

      // Send notification to the user mentioned
      User.findOne({ 'stripe_connected_account_id': { $in: reciever_id} }, (err, reciever) => {
         if (err) throw err;

         var newNotification = new Notification({
            sender: req.user._id,
            reciever: reciever._id,
            type: '@' + req.user.username + ' sent you a ' + amount + ' tip.',
            link: '/dashboard',
            date_sent: current_date
         });

         // Create notification in database
         Notification.saveNotification(newNotification, (err, notification) => {
            if(err) throw err;

            // Add Notification for User
            User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
               if (err) throw err;

               return res.send({
                 tip_success: true
               });
            });
         });
      });

    }

    // Subscriptions
    if (payment_id === 'subscription') {

      // Send notification to the user mentioned
      User.findOne({ 'stripe_connected_account_id': { $in: reciever_id } }, (err, reciever) => {
        if (err) throw err;

        var amount = reciever.creator_subscription.current_price;
        amount = amount.replace("$", "");
        amount = amount.replace(",", "");
        amount = parseFloat(amount) * 100;

        switch (reciever.premium_creator_account) {
          case 1:
            var percentage = 10;
            break;
          case 2:
            var percentage = 7;
            break;
          case 3:
            var percentage = 4;
            break;
          default:
        }

        info = [];
        info['userUsername'] = req.user.username;
        info['profileId'] = reciever._id;
        info['profileUsername'] = reciever.username;
        info['userId'] = req.user._id;

        var is_following = false;

        reciever.followers.forEach(function(follower, key) {
          if (follower === req.user.username) {
            is_following = true;
          }
        });

        if (req.user.username === reciever.username) {
          is_following = true;
        }

        if (is_following) {
          res.redirect('/profile/' + req.body.profile_username);
        } else {

          // Add followers to profile
          User.addFollowers(info, (err, user) => {
            if(err) throw err;

            // Update following for User
            User.addFollowing(info, (err, user) => {
              if(err) throw err;

              var newNotification = new Notification({
                sender: req.user._id,
                reciever: reciever._id,
                type: '@' + req.user.username + ' started following you.',
                link: '/profile/' + req.user.username,
                date_sent: current_date
              });

              // Create notification in database
              Notification.saveNotification(newNotification, (err, notification) => {
                if(err) throw err;

                // Add Notification for User
                User.findByIdAndUpdate(reciever._id, { has_notification: true }, async (err, user) => {
                  if (err) throw err;

                  // Find the payment method listed with the customer
                  const paymentMethods = await stripe.paymentMethods.list({
                    customer: req.user.stripe_customer_id,
                    type: 'card',
                  });

                  var pm_id = paymentMethods.data[0].id;

                  // Attach the payment method to be the default for the customer
                  // Needed for subscriptions
                  await stripe.customers.update(
                    req.user.stripe_customer_id,
                    { invoice_settings: { default_payment_method: pm_id } }
                  ).then(async function() {

                    try {

                      // Create the subscription for the customer
                      const subscription = await stripe.subscriptions.create({
                        customer: req.user.stripe_customer_id,
                        items: [{
                          price: reciever.creator_subscription.stripe_price_id,
                        }],
                        expand: ["latest_invoice.payment_intent"],
                        application_fee_percent: percentage,
                        transfer_data: {
                          destination: reciever.stripe_connected_account_id
                        },
                        trial_period_days: 30,
                        proration_behavior: "none"
                      });

                      info['subId'] = subscription.id;

                      User.addSubscription(info, (err, user) => {
                        if(err) throw err;

                        return res.send({
                          subscription_success: true
                        });
                      });

                    } catch (err) {
                      console.log(err)
                      return res.status(500).send({
                        error: err.message
                      });
                    }
                  });

                });

              });

            });

          });

        }
      });

    }

});


// Post Add to Cart
router.post('/cart/add/:id', (req, res, next) => {

    var quantity = req.body.product_quantity;

    Cart.findOne({ 'owner': { $in: req.user._id } }, (err, cart) => {

      if (err) throw err;

      if (cart) {

        // Add product to Cart document
        info = [];
        info['productId'] = req.params.id;
        info['quantity'] = quantity;
        info['cartId'] = cart._id;

        var total_cart_items = req.user.total_cart_items + parseInt(quantity);

        var product_exists = false;

        cart.products.forEach(function(product, key) {
          if (req.params.id == product.product_id) {
            product_exists = true;
            info['quantity'] = parseInt(info['quantity']) + parseInt(product.quantity);
          }
        });


        if (product_exists) {

          Cart.updateCartItem(info, (err, cart) => {
            if(err) throw err;

            User.findByIdAndUpdate(req.user._id, {
               has_cart_items: true,
               total_cart_items: total_cart_items
            }, (err, user) => {
               if (err) throw err;

               req.flash('success_msg', "Added To Cart");
               res.redirect('/p/product/' + req.params.id);
            });

          });

        } else {

          Cart.addCartItem(info, (err, cart) => {
            if(err) throw err;

            User.findByIdAndUpdate(req.user._id, {
               has_cart_items: true,
               total_cart_items: total_cart_items
            }, (err, user) => {
               if (err) throw err;

               req.flash('success_msg', "Added To Cart");
               res.redirect('/p/product/' + req.params.id);
            });

          });

        }

      } else {

        var newCart = new Cart({
           owner: req.user._id,
           products: [{
             product_id: req.params.id,
             quantity: quantity
           }]
        });

        // Create cart in database
        Cart.saveCart(newCart, (err, cart) => {
           if(err) throw err;

           var newCheckout = new Checkout({
              owner: req.user._id
           });

           // Create checkout in database
           Checkout.saveCheckout(newCheckout, (err, checkout) => {
              if(err) throw err;

              User.findByIdAndUpdate(req.user._id, {
                 has_cart_items: true,
                 total_cart_items: 1
              }, (err, user) => {
                 if (err) throw err;

                 req.flash('success_msg', "Added To Cart");
                 res.redirect('/p/product/' + req.params.id);
              });
           });

        });

      }

    });

});


function formatPrice(price) {

  price = price.toString();
  var decimal = price.indexOf(".");
  var thous = price[decimal + 3]

  if (decimal >= 0) {

    var left_side = price.substring(0, decimal);
    var right_side = price.substring(decimal, price.length);

    if (right_side.length > 3) {

      if (parseInt(thous) > 4) {
        var num = parseInt(right_side[2]) + 1;
        right_side = right_side.substring(0, 2) + num.toString();
      } else {
        right_side = right_side.substring(0, 2)
      }

    }

    left_side = left_side.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    price = "$" + left_side + right_side;

  } else {
    price = "$" + price.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  return price;

}


// Get Cart
router.get('/cart', (req, res, next) => {
  Cart.findOne({ 'owner': { $in: req.user._id } }, (err, cart) => {
     if (err) throw err;

     if (cart) {

       if (cart.products.length > 0) {

         var cart = cart.toObject();

         var all_items = [];
         var product_ids = [];

         if (cart.products.length > 1) {
           var all_count = 1;
         } else {
           var all_count = 0;
         }

         var product_owners = [];

         cart.products.forEach(function(cart_item, key) {
           product_ids.push(cart_item.product_id);
         });

         var already_checked = [];
         var already_checked_indexes = [];
         var subtotal = 0;
         var shipping_cost = 0;

         Product.find({ '_id': { $in: product_ids } }, (err, all_products) => {

           all_products.forEach(function(product, key) {

             all_count += 1;

             var product = product.toObject();

             for (var i = cart.products.length - 1; i >= 0; i--) {

               if (already_checked.indexOf(product._id.toString()) === -1) {

                 if (cart.products[i].product_id === product._id.toString()) {

                  if (typeof product.quantity == 'undefined') {
                    product.quantity = 0;
                  }

                  product_owners.push(product.owner);
                  product.quantity = product.quantity + cart.products[i].quantity;
                  cart.products[i] = product;
                  already_checked.push(product._id.toString());
                  already_checked.push(i);

                  var new_price = cart.products[i].price.replace("$", "");
                  new_price = new_price.replace(",", "");
                  new_price = parseFloat(new_price) * cart.products[i].quantity;

                  var unit_cost = product.shipping_cost.replace("$", "");
                  unit_cost = unit_cost.replace(",", "");
                  unit_cost = parseFloat(unit_cost) * cart.products[i].quantity;
                  shipping_cost = shipping_cost + unit_cost;

                  subtotal = subtotal + new_price;

                  new_price = formatPrice(new_price)

                  cart.products[i].price = new_price;

                 }
               } else {

                 if (cart.products[i].product_id === product._id.toString()) {

                   var index = already_checked.indexOf(product._id.toString());
                   var arr = already_checked.slice(index + 1);
                   var cart_index = arr[0];

                   cart.products[cart_index].quantity = cart.products[i].quantity + cart.products[cart_index].quantity;

                   var new_price = cart.products[cart_index].price.replace("$", "");
                   new_price = new_price.replace(",", "");
                   new_price = parseFloat(new_price) * cart.products[cart_index].quantity;

                   var unit_cost = product.shipping_cost.replace("$", "");
                   unit_cost = unit_cost.replace(",", "");
                   unit_cost = parseFloat(unit_cost) * cart.products[i].quantity;
                   shipping_cost = shipping_cost + unit_cost;

                   subtotal = subtotal + new_price;

                   new_price = formatPrice(new_price)

                   cart.products[cart_index].price = new_price;

                   cart.products.splice(i, 1);

                 }

               }
             }

             if (all_count == cart.products.length) {

               Product.find({ 'owner': { $in: product_owners } }, (err, similar_products) => {
                 if (err) throw err;

                 var total = subtotal + shipping_cost;

                 subtotal = formatPrice(subtotal)
                 shipping_cost = formatPrice(shipping_cost)
                 total = formatPrice(total)

                 res.render('cart', {
                    page_title: 'Cart',
                    cart: cart,
                    similar_products: similar_products,
                    subtotal: subtotal,
                    shipping_cost: shipping_cost,
                    total: total,
                    cart_active: true
                 });

               }).limit(10);

             }

           });

         });

      } else {
        res.render('cart', {
           page_title: 'Cart',
           cart: false,
           cart_active: true
        });
      }

    } else {
      res.render('cart', {
         page_title: 'Cart',
         cart: false,
         cart_active: true
      });
    }

  });
});


// Get Cart
router.get('/cart/remove/:id', (req, res, next) => {
  Cart.findOne({ 'owner': { $in: req.user._id } }, (err, cart) => {
    if (err) throw err;

    if (cart) {

      var quantity = 0;

      cart.products.forEach(function(product, key) {

        if (product.product_id === req.params.id) {
          quantity = quantity + product.quantity;
        }

      });

      var total_cart_items = req.user.total_cart_items - parseInt(quantity);

      if (total_cart_items == 0) {
        var has_cart_items = false;
      } else {
        var has_cart_items = true;
      }

      // Remove cart item
      info = [];
      info['cartId'] = cart._id;
      info['productId'] = req.params.id;

      Cart.removeCartItem(info, (err, user) => {
         if(err) throw err;

         User.findByIdAndUpdate(req.user._id, {
            has_cart_items: has_cart_items,
            total_cart_items: total_cart_items
         }, (err, user) => {
            if (err) throw err;

            req.flash('success_msg', "Removed From Cart");
            res.redirect('/cart');
         });

      });

    } else {
      res.redirect('/cart');
    }

  });

});


// Get checkout
router.get('/checkout', async (req, res, next) => {

  Cart.findOne({ 'owner': { $in: req.user._id } }, (err, cart) => {
    if (err) throw err;

    if (cart) {

      var cart_id = cart._id;

      Checkout.findOne({ 'owner': { $in: req.user._id } }, (err, checkout) => {
        if (err) throw err;

        var checkout_id = checkout._id;

        var product_ids = [];
        var quantities = [];
        var owners = [];
        var payment_intents = [];
        var products = [];

        cart.products.forEach(function(product, key) {
          product_ids.push(product.product_id);
          quantities.push(product.product_id);
          quantities.push(product.quantity);
        });

        Product.find({ '_id': { $in: product_ids } }, (err, all_products) => {

          var subtotal = 0;
          var shipping_cost = 0;
          var total = 0;
          var pi_count = 0;

          all_products.forEach(function(product, key) {

            product = product.toObject();

            var amount = product.price.replace("$", "");
            amount = amount.replace(",", "");
            amount = parseFloat(amount) * 100;

            var shipping = product.shipping_cost.replace("$", "");
            shipping = shipping.replace(",", "");
            shipping = parseFloat(shipping) * 100;

            var owner = owners.indexOf(product.owner);

            if (owner >= 0) {

              var intent_index = owners[owner + 1];
              var intent = payment_intents[intent_index];

              var quantity = quantities.indexOf(product._id.toString()) + 1;
              quantity = quantities[quantity];

              product.quantity = quantity;
              product.price = (amount / 100) * quantity;
              product.price = formatPrice(product.price)
              products.push(product);

              subtotal = subtotal + ((amount / 100) * quantity);
              shipping_cost = shipping_cost + ((shipping / 100) * quantity);

              amount = amount + shipping;
              amount = amount * quantity;

              total = total + (amount / 100);

              intent.amount = intent.amount + amount;

            } else {

              owners.push(product.owner);
              owners.push(pi_count);
              pi_count += 1;

              var quantity = quantities.indexOf(product._id.toString()) + 1;
              quantity = quantities[quantity];

              product.quantity = quantity;
              product.price = (amount / 100) * quantity;
              product.price = formatPrice(product.price)
              products.push(product);

              subtotal = subtotal + ((amount / 100) * quantity);
              shipping_cost = shipping_cost + ((shipping / 100) * quantity);

              amount = amount + shipping;
              amount = amount * quantity;

              total = total + (amount / 100);

              var intent = {
                amount: amount,
                owner: product.owner
              }

              payment_intents.push(intent);

            }

          });

          total = formatPrice(total);
          subtotal = formatPrice(subtotal);
          shipping_cost = formatPrice(shipping_cost);

          Product.find({ '_id': { $in: product_ids } }, async (err, all_products) => {

            console.log(payment_intents);

            var secrets = [];
            var all_intents = 0;

            for (var i = 0, len = payment_intents.length; i < len; i++) {

              var app_fee = .04 * payment_intents[i].amount;
              app_fee = parseInt(app_fee);

              const paymentIntent = await stripe.paymentIntents.create({
                payment_method_types: ['card'],
                amount: payment_intents[i].amount,
                currency: 'usd',
                application_fee_amount: app_fee,
                transfer_data: {
                  destination: payment_intents[i].owner,
                }
              }).then(function(paymentIntent) {

                all_intents += 1;
                secrets.push(paymentIntent.client_secret);

                if (all_intents == payment_intents.length) {
                  res.render('checkout', {
                     page_title: 'Checkout',
                     checkout: true,
                     payment_intents: payment_intents,
                     cart_active: true,
                     total: total,
                     subtotal: subtotal,
                     shipping_cost: shipping_cost,
                     products: products,
                     checkout: checkout,
                     payment_element: true,
                     intents: secrets,
                     cart_id: cart_id,
                     checkout_id: checkout_id
                  });
                }
              });
            }

          });

        });

      });

    } else {
      res.redirect('/cart');
    }

  });

});


router.post('/save-checkout', (req, res) => {

    var data = req.body.data;

    var fname = data.fname.replace(/\r\n/g,'').trim();
    var lname = data.lname.replace(/\r\n/g,'').trim();
    var email = data.email.replace(/\r\n/g,'').trim();
    var phone = data.phone.trim();
    var address = data.address.replace(/\r\n/g,'').trim();
    var apt = data.apt.replace(/\r\n/g,'').trim();
    var city = data.city.replace(/\r\n/g,'').trim();
    var state = data.state.replace(/\r\n/g,'').trim();
    var postal = data.postal.replace(/\r\n/g,'').trim();
    var country = data.country.replace(/\r\n/g,'').trim();


    Checkout.findOne({ 'owner': { $in: req.user._id } }, (err, checkout) => {

      if (err) throw err;

      if (checkout) {

        Checkout.findByIdAndUpdate(checkout._id, {
          fname: fname,
          lname: lname,
          email: email,
          phone: phone,
          address: address,
          apt: apt,
          city: city,
          state: state,
          postal: postal,
          country: country
        }, (err, checkout) => {
           if (err) throw err;

           res.sendStatus(200);
        });

      } else {

        var newCheckout = new Checkout({
           owner: req.user._id,
           fname: fname,
           lname: lname,
           email: email,
           phone: phone,
           address: address,
           apt: apt,
           city: city,
           state: state,
           postal: postal,
           country: country
        });

        // Create checkout in database
        Checkout.saveCheckout(newCheckout, (err, checkout) => {
           if(err) throw err;

           res.sendStatus(200);
        });

      }

    });

});


// Post checkout
router.post('/checkout-success', (req, res, next) => {

  if (req.isAuthenticated()) {

    const data = req.body;

    if (data.customer == req.user._id.toString()) {

      Cart.findOne({ 'owner': { $in: req.user._id } }, (err, cart) => {
        if (err) throw err;

        if (cart) {

          var todaydate = new Date();
          var day = todaydate.getDate();
          var month = todaydate.getMonth() + 1;
          var year = todaydate.getFullYear();

          switch (month) {
            case 01:
              var month_text = 'January';
              break;
            case 02:
              var month_text = 'February';
              break;
            case 03:
              var month_text = 'March';
              break;
            case 04:
              var month_text = 'April';
              break;
            case 05:
              var month_text = 'May';
              break;
            case 06:
              var month_text = 'June';
              break;
            case 07:
              var month_text = 'July';
              break;
            case 08:
              var month_text = 'August';
              break;
            case 09:
              var month_text = 'September';
              break;
            case 10:
              var month_text = 'October';
              break;
            case 11:
              var month_text = 'November';
              break;
            case 12:
              var month_text = 'December';
              break;
            default:
          }

          var date_was_created = month_text + " " + day + ", " + year;
          var order_number = '#O'+(Math.random()*0xFFFFFF<<0).toString(16);
          var customer = req.user._id;

          var product_ids = [];
          var quantities = [];
          var owners = [];
          var notif_owners = [];
          var payment_intents = [];
          var products = [];

          cart.products.forEach(function(product, key) {
            product_ids.push(product.product_id);
            quantities.push(product.product_id);
            quantities.push(product.quantity);
          });

          Product.find({ '_id': { $in: product_ids } }, (err, all_products) => {

            var pi_count = 0;
            var items = [];
            var cus_total = 0;
            var cus_subtotal = 0;
            var cus_shipping_cost = 0;
            var product_count = 0;

            all_products.forEach(function(product, key) {

              product_count += 1;

              product = product.toObject();

              var amount = product.price.replace("$", "");
              amount = amount.replace(",", "");
              amount = parseFloat(amount) * 100;

              var shipping = product.shipping_cost.replace("$", "");
              shipping = shipping.replace(",", "");
              shipping = parseFloat(shipping) * 100;

              var owner = owners.indexOf(product.owner);

              if (owner >= 0) {

                var item_index = owners[owner + 1];
                var item = items[item_index];

                var quantity = quantities.indexOf(product._id.toString()) + 1;
                quantity = quantities[quantity];

                product.quantity = quantity;
                product.price = (amount / 100) * quantity;
                product.price = formatPrice(product.price);

                item.products.push(product);

                subtotal = item.subtotal.replace("$", "");
                subtotal = subtotal.replace(",", "");
                subtotal = subtotal + ((amount / 100) * quantity);
                item.subtotal = formatPrice(subtotal);

                shipping_cost = item.shipping_cost.replace("$", "");
                shipping_cost = shipping_cost.replace(",", "");
                shipping_cost = shipping_cost + ((shipping / 100) * quantity);
                item.shipping_cost = formatPrice(shipping_cost);

                cus_subtotal = cus_subtotal + ((amount / 100) * quantity);
                cus_shipping_cost = cus_shipping_cost + ((shipping / 100) * quantity);

                amount = amount + shipping;

                cus_total = cus_total + (amount / 100);

                amount = amount * quantity;

                total = item.total.replace("$", "");
                total = total.replace(",", "");
                total = total + (amount / 100);
                item.total = formatPrice(total);

              } else {

                var subtotal = 0;
                var shipping_cost = 0;
                var total = 0;

                var quantity = quantities.indexOf(product._id.toString()) + 1;
                quantity = quantities[quantity];

                product.quantity = quantity;
                product.price = (amount / 100) * quantity;
                product.price = formatPrice(product.price);

                subtotal = subtotal + ((amount / 100) * quantity);
                subtotal = formatPrice(subtotal);

                shipping_cost = shipping_cost + ((shipping / 100) * quantity);
                shipping_cost = formatPrice(shipping_cost);
                product.shipping_cost = shipping_cost;

                cus_subtotal = cus_subtotal + ((amount / 100) * quantity);
                cus_shipping_cost = cus_shipping_cost + ((shipping / 100) * quantity);

                amount = amount + shipping;

                cus_total = cus_total + (amount / 100);

                amount = amount * quantity;

                total = total + (amount / 100);
                total = formatPrice(total);

                var item = {
                  owner: product.owner,
                  fulfillment_status: 0,
                  tracking_info: "",
                  subtotal: subtotal,
                  shipping_cost: shipping_cost,
                  total: total,
                  products: [product]
                }

                owners.push(product.owner);
                owners.push(pi_count);
                notif_owners.push(product.owner);
                items.push(item);
                pi_count += 1;

              }

              if (product_count == all_products.length) {

                cus_total = formatPrice(cus_total);
                cus_subtotal = formatPrice(cus_subtotal);
                cus_shipping_cost = formatPrice(cus_shipping_cost);

                var newOrder = new Order({
                  order_number: order_number,
                  date_was_created: date_was_created,
                  customer: customer,
                  customer_total_amount: cus_total,
                  customer_subtotal_amount: cus_subtotal,
                  customer_shipping_amount: cus_shipping_cost,
                  items: items,
                  contact_info: {
                    fname: data.fname,
                    lname: data.lname,
                    email: data.email,
                    phone: data.phone
                  },
                  shipping_info: {
                    address: data.address,
                    apt: data.apt,
                    city: data.city,
                    state: data.state,
                    postal: data.postal,
                    country: data.country
                  },
                  billing_info: {
                    billing_fname: data.billing_fname,
                    billing_lname: data.billing_lname,
                    billing_address: data.billing_address,
                    billing_apt: data.billing_apt,
                    billing_city: data.billing_city,
                    billing_state: data.billing_state,
                    billing_postal: data.billing_postal,
                    billing_country: data.billing_country
                  }
                });

                // Create order in database
                Order.saveOrder(newOrder, (err, order) => {
                   if(err) throw err;

                   // Delete the Checkout
                   Checkout.findByIdAndRemove(data.checkout_id, (err) => {
                     if (err) throw err;

                     // Delete the Cart
                     Cart.findByIdAndRemove(data.cart_id, (err) => {
                       if (err) throw err;

                       User.findByIdAndUpdate(req.user._id, {
                          has_cart_items: false,
                          total_cart_items: 0
                       }, (err, user) => {
                          if (err) throw err;

                          // Send notification to the user mentioned
                          User.findOne({ '_id': { $in: req.user._id } }, (err, reciever) => {
                             if (err) throw err;

                             var newNotification = new Notification({
                                sender: req.user._id,
                                reciever: reciever._id,
                                type: 'Thank you! Order confirmation for ' + order_number,
                                link: '/orders/' + order._id,
                                date_sent: current_date
                             });

                             // Create notification in database
                             Notification.saveNotification(newNotification, (err, notification) => {
                                if(err) throw err;

                                // Add Notification for User
                                User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                                   if (err) throw err;

                                   // Gmail Credentials
                                   var transporter = nodemailer.createTransport({
                                      service: 'Gmail',
                                      auth: {
                                         user: 'hello@myhryzn.com',
                                         pass: '+ar+oo-55'
                                      }
                                   });

                                   // Mail Body
                                   var mailOptions = {
                                      from: '"Hryzn" <hello@myhryzn.com>',
                                      to: reciever.email,
                                      subject: 'Order confirmation for ' + order_number,
                                      html: '<h1>Thank you for shopping with us!</h1><br><p>Hey ' + data.fname + ',</p><br><p>Your order is now being processed. We will send you a shipping confirmation email as soon as your products are marked as shipped.</p><br><p>If you ordered from more than one shop, your products will be separated by shop to avoid any confusion between parties. These groups will be called "Items" and are numbered accordingly. Each Item is shipped by the shop, so products may arrive at separate times.</p><br><a href="https://myhryzn.com/orders/' + order._id + '">Click here to view your order</a><br><p>Enjoy your day!</p>',
                                   }

                                   transporter.sendMail(mailOptions, (error, info) => {
                                      if(!error) {}
                                   });

                                   var owner_count = 0;

                                   for (var i = 0, len = notif_owners.length; i < len; i++) {

                                     owner_count += 1;

                                     // Send notification to the user mentioned
                                     User.findOne({ 'stripe_connected_account_id': { $in: notif_owners[i] } }, (err, reciever) => {
                                        if (err) throw err;

                                        var newNotification = new Notification({
                                           sender: req.user._id,
                                           reciever: reciever._id,
                                           type: 'You have a new order! Order: ' + order_number,
                                           link: '/orders/' + order._id,
                                           date_sent: current_date
                                        });

                                        // Create notification in database
                                        Notification.saveNotification(newNotification, (err, notification) => {
                                           if(err) throw err;

                                           // Add Notification for User
                                           User.findByIdAndUpdate(reciever._id, { has_notification: true, has_unfulfilled_items: true }, (err, user) => {
                                              if (err) throw err;

                                              // Gmail Credentials
                                              var transporter = nodemailer.createTransport({
                                                 service: 'Gmail',
                                                 auth: {
                                                    user: 'hello@myhryzn.com',
                                                    pass: '+ar+oo-55'
                                                 }
                                              });

                                              // Mail Body
                                              var mailOptions = {
                                                 from: '"Hryzn" <hello@myhryzn.com>',
                                                 to: reciever.email,
                                                 subject: 'You have a new order! Order: ' + order_number,
                                                 html: '<h1>Hello from Hryzn!</h1><br><p>Looks like your shop is doing pretty well! You have a new order: ' + order_number + '. Keep up the great work.</p><br><a href="https://myhryzn.com/orders/' + order._id + '">Click here to view your order</a><br><p>Enjoy your day!</p>',
                                              }

                                              transporter.sendMail(mailOptions, (error, info) => {
                                                 if(!error) {}
                                              });

                                              if (owner_count == notif_owners.length) {
                                                return res.send({
                                                  success: true,
                                                  order_id: order._id.toString()
                                                });
                                              }
                                           });
                                        });
                                     });
                                   }
                                });
                             });
                          });
                       });
                     });
                   });

                });

              }

            });

          });
        } else {
          return res.status(500).send({
            success: false
          });
        }

      });

    } else {
      return res.status(500).send({
        success: false
      });
    }

  } else {
    return res.status(500).send({
      success: false
    });
  }

});


// Get orders
router.get('/orders', (req, res, next) => {

  Order.find({ 'customer': { $in: req.user._id } }, (err, orders) => {
    if (err) throw err;

    res.render('orders', {
       page_title: 'Review Purchased Orders',
       orders: orders.reverse()
    });

  });
});


// Get order detail
router.get('/orders/:id', (req, res, next) => {

  Order.findOne({ '_id': { $in: req.params.id } }, (err, order) => {
    if (err) throw err;

    if (order) {
      res.render('order-detail', {
         page_title: 'Review Order' + ' ' + order.order_number,
         order: order
      });
    } else {
      res.redirect('/orders');
    }

  });
});


// POST Change order fulfillment status to shipped
router.post('/orders/:id/status/:item/:dash', (req, res, next) => {

  Order.findOne({ '_id': { $in: req.params.id } }, (err, order) => {
    if (err) throw err;

    if (order) {

      if (req.params.dash == 'true') {
        var order_url = '/dashboard/manage/' + req.params.id;
      } else {
        var order_url = '/orders/' + req.params.id;
      }

      var new_order = order.toObject();

      var item = req.params.item;
      var i = item.indexOf('-') + 1;
      item = item.substring(i, item.length);

      var tracking_info = req.body.tracking_info.replace(/\r\n/g,'');

      new_order.items[item].fulfillment_status = parseInt(new_order.items[item].fulfillment_status) + 1;

      if (new_order.items[item].tracking_info == "") {
        new_order.items[item].tracking_info = tracking_info;
      }

      if (new_order.items[item].fulfillment_status == 1) {

        // Send notification to the user mentioned
        User.findOne({ '_id': { $in: order.customer } }, (err, reciever) => {
           if (err) throw err;

           var newNotification = new Notification({
              sender: req.user._id,
              reciever: reciever._id,
              type: 'Item ' + item + ' from your order ' + order.order_number + ' has been shipped.' ,
              link: '/orders/' + req.params.id,
              date_sent: current_date
           });

           // Create notification in database
           Notification.saveNotification(newNotification, (err, notification) => {
              if(err) throw err;

              // Add Notification for User
              User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                 if (err) throw err;


                 // Verification email //
                 // Gmail Credentials
                 var transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                       user: 'hello@myhryzn.com',
                       pass: '+ar+oo-55'
                    }
                 });

                 // Mail Body
                 var mailOptions = {
                    from: '"Hryzn" <hello@myhryzn.com>',
                    to: order.contact_info.email,
                    subject: 'Your product has been shipped! Order number: ' + order.order_number,
                    html: '<h1>Your order is on the way!</h1><br><a href="https://myhryzn.com/orders/' + order._id + '">Click here to view your order</a><br><p>Item ' + item + ' from your order has been marked as fulfilled and shipped. We’re happy you can be a part of the Hryzn community. If you have any questions or concerns feel free to <a href="https://myhryzn.com/about/contact">contact us.</a></p><br><a href="https://myhryzn.com/orders/' + order._id + '/status/item-' + item + '/false">Click here to mark your order as delivered</a><br><p>Enjoy your day!</p><br><p>Tracking Info:</p><br>' + tracking_info,
                 }

                 transporter.sendMail(mailOptions, (error, info) => {
                    if(!error) {
                    }
                 });

                 var product_count = 0;

                 for (var i = 0, len = new_order.items[item].products.length; i < len; i++) {

                   product_count += 1;

                   var p = new_order.items[item].products[i];
                   var qa = parseInt(p.availability.quantity);
                   var q = parseInt(p.quantity);

                   q = parseInt(qa) - q;

                   if (q <= 0) {
                     var is_in_stock = false;
                   } else {
                     var is_in_stock = true;
                   }

                   new_order.items[item].products[i].availability.is_in_stock = is_in_stock;
                   new_order.items[item].products[i].availability.quantity = q;

                   q = q.toString();

                   var pl = new_order.items[item].products.length;

                   Product.findByIdAndUpdate(p._id, {
                        availability: {
                          is_in_stock: is_in_stock,
                          quantity: q
                        }
                     }, (err, user) => {
                        if (err) throw err;

                        if (product_count == pl) {
                          Order.findByIdAndUpdate(req.params.id, {
                             items: new_order.items
                          }, (err, user) => {
                             if (err) throw err;

                             req.flash('success_msg', "Order was marked as shipped.");
                             res.redirect(order_url);

                          });
                        }
                    });
                 }
              });
           });
        });

      } else {
        res.sendStatus(500)
      }

    } else {
      res.redirect('/orders');
    }

  });
});


// GET Change order fulfillment status to delivered
router.get('/orders/:id/status/:item/:dash', (req, res, next) => {

  Order.findOne({ '_id': { $in: req.params.id } }, (err, order) => {
    if (err) throw err;

    if (order) {

      if (req.params.dash == 'true') {
        var order_url = '/dashboard/manage/' + req.params.id;
      } else {
        var order_url = '/orders/' + req.params.id;
      }

      var new_order = order.toObject();

      var item = req.params.item;
      var i = item.indexOf('-') + 1;
      item = item.substring(i, item.length);

      new_order.items[item].fulfillment_status = parseInt(new_order.items[item].fulfillment_status) + 1;

      if (new_order.items[item].fulfillment_status == 2) {

        // Send notification to the user mentioned
        User.findOne({ 'stripe_connected_account_id': { $in: new_order.items[item].owner } }, (err, reciever) => {
           if (err) throw err;

           var newNotification = new Notification({
              sender: req.user._id,
              reciever: reciever._id,
              type: 'Item ' + item + ' from your order ' + order.order_number + ' has been marked as delivered.' ,
              link: '/orders/' + req.params.id,
              date_sent: current_date
           });

           // Create notification in database
           Notification.saveNotification(newNotification, (err, notification) => {
              if(err) throw err;

              // Add Notification for User
              User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                 if (err) throw err;

                 // Gmail Credentials
                 var transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                       user: 'hello@myhryzn.com',
                       pass: '+ar+oo-55'
                    }
                 });

                 // Mail Body
                 var mailOptions = {
                    from: '"Hryzn" <hello@myhryzn.com>',
                    to: reciever.email,
                    subject: 'Your order has been delivered! Order number: ' + order.order_number,
                    html: '<h1>Your order has been marked as delivered!</h1><br><a href="https://myhryzn.com/orders/' + order._id + '">Click here to view your order</a><br><p>Item ' + item + ' from your order has been marked as delivered. We’re happy to work with you and appreciate you being a part of our community. If you have any questions or concerns feel free to <a href="https://myhryzn.com/about/contact">contact us.</a></p><br><p>Enjoy your day!</p>',
                 }

                 transporter.sendMail(mailOptions, (error, info) => {
                    if(!error) {
                    }
                 });


                 Order.findByIdAndUpdate(req.params.id, {
                    items: new_order.items
                 }, (err, user) => {
                    if (err) throw err;

                    req.flash('success_msg', "Order was marked as delivered.");
                    res.redirect(order_url);
                 });
              });
           });
        });

      }

    } else {
      res.redirect('/orders');
    }

  });
});


// Resend confirmation email
router.get('/orders/:id/resend-email/:dash', (req, res, next) => {

  Order.findOne({ '_id': { $in: req.params.id } }, (err, order) => {
    if (err) throw err;

    if (order) {

      if (req.params.dash == 'true') {
        var order_url = '/dashboard/manage/' + req.params.id;
      } else {
        var order_url = '/orders/' + req.params.id;
      }

      if (order.customer == req.user._id) {

        // Gmail Credentials
        var transporter = nodemailer.createTransport({
           service: 'Gmail',
           auth: {
              user: 'hello@myhryzn.com',
              pass: '+ar+oo-55'
           }
        });

        // Mail Body
        var mailOptions = {
           from: '"Hryzn" <hello@myhryzn.com>',
           to: order.contact_info.email,
           subject: 'Order confirmation for ' + order.order_number,
           html: '<h1>Thank you for shopping with us!</h1><br><p>Hey ' + order.contact_info.fname + ',</p><br><p>Your order is now being processed. We will send you a shipping confirmation email as soon as your products are marked as shipped.</p><br><p>If you ordered from more than one shop, your products will be separated by shop to avoid any confusion between parties. These groups will be called "Items" and are numbered accordingly. Each Item is shipped by the shop, so products may arrive at separate times.</p><br><a href="https://myhryzn.com/orders/' + order._id + '">Click here to view your order</a><br><p>Enjoy your day!</p>',
        }

        transporter.sendMail(mailOptions, (error, info) => {
           if(!error) {
           }
        });

        req.flash('success_msg', "Confirmation email was sent.");
        res.redirect(order_url);


      } else {

        for (var i = 0, len = order.items.length; i < len; i++) {
           if (order.items[i].owner == req.user.stripe_connected_account_id) {

             // Gmail Credentials
             var transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                   user: 'hello@myhryzn.com',
                   pass: '+ar+oo-55'
                }
             });

             // Mail Body
             var mailOptions = {
                from: '"Hryzn" <hello@myhryzn.com>',
                to: order.contact_info.email,
                subject: 'Order confirmation for ' + order.order_number,
                html: '<h1>Thank you for shopping with us!</h1><br><p>Hey ' + order.contact_info.fname + ',</p><br><p>Your order is now being processed. We will send you a shipping confirmation email as soon as your products are marked as shipped.</p><br><p>If you ordered from more than one shop, your products will be separated by shop to avoid any confusion between parties. These groups will be called "Items" and are numbered accordingly. Each Item is shipped by the shop, so products may arrive at separate times.</p><br><a href="https://myhryzn.com/orders/' + order._id + '">Click here to view your order</a><br><p>Enjoy your day!</p>',
             }

             transporter.sendMail(mailOptions, (error, info) => {
                if(!error) {
                }
             });

             req.flash('success_msg', "Confirmation email was sent.");
             res.redirect(order_url);

           } else {
             res.redirect('/orders');
           }
        }

      }

    } else {
      res.redirect('/orders');
    }
  });

});


// Change order customer info
router.post('/orders/:id/customer-edit/:method/:dash', (req, res, next) => {

  Order.findOne({ '_id': { $in: req.params.id } }, (err, order) => {
    if (err) throw err;

    if (order) {

      var method = req.params.method;

      if (req.params.dash == 'true') {
        var order_url = '/dashboard/manage/' + req.params.id;
      } else {
        var order_url = '/orders/' + req.params.id;
      }

      if (method == 'contact') {

        var contact_info = {
          fname: req.body.fname,
          lname: req.body.lname,
          email: req.body.email,
          phone: req.body.phone
        }

        Order.findByIdAndUpdate(req.params.id, {
          contact_info: contact_info
        }, (err, user) => {
           if (err) throw err;

           var owner_count = 0;

           for (var i = 0, len = order.items.length; i < len; i++) {

             owner_count += 1;

             // Send notification to the user mentioned
             User.findOne({ 'stripe_connected_account_id': { $in: order.items[i].owner } }, (err, reciever) => {
                if (err) throw err;

                var newNotification = new Notification({
                   sender: req.user._id,
                   reciever: reciever._id,
                   type: 'The contact info from your order ' + order.order_number + ' has been updated.' ,
                   link: '/orders/' + req.params.id,
                   date_sent: current_date
                });

                // Create notification in database
                Notification.saveNotification(newNotification, (err, notification) => {
                   if(err) throw err;

                   // Add Notification for User
                   User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                      if (err) throw err;

                      // Gmail Credentials
                      var transporter = nodemailer.createTransport({
                         service: 'Gmail',
                         auth: {
                            user: 'hello@myhryzn.com',
                            pass: '+ar+oo-55'
                         }
                      });

                      // Mail Body
                      var mailOptions = {
                         from: '"Hryzn" <hello@myhryzn.com>',
                         to: reciever.email,
                         subject: 'Contact info updated for order number: ' + order.order_number,
                         html: '<h1>Hello from Hryzn!</h1><br><p>The contact info from your order: ' + order.order_number + ' has been updated. Just letting you know in case you need to update anything.</p><br><a href="https://myhryzn.com/orders/' + order._id + '">Click here to view your order</a><br><p>Enjoy your day!</p>',
                      }

                      transporter.sendMail(mailOptions, (error, info) => {
                         if(!error) {
                         }
                      });


                      if (owner_count == order.items.length) {
                        req.flash('success_msg', "Contact info was updated.");
                        res.redirect(order_url);
                      }
                   });
                });
             });
           }

        });

      } else if (method == 'shipping') {

        var shipping_info = {
          address: req.body.address,
          apt: req.body.apt,
          city: req.body.city,
          state: req.body.state,
          postal: req.body.postal,
          country: req.body.country
        }

        Order.findByIdAndUpdate(req.params.id, {
          shipping_info: shipping_info
        }, (err, user) => {
           if (err) throw err;

           var owner_count = 0;

           for (var i = 0, len = order.items.length; i < len; i++) {

             owner_count += 1;

             // Send notification to the user mentioned
             User.findOne({ 'stripe_connected_account_id': { $in: order.items[i].owner } }, (err, reciever) => {
                if (err) throw err;

                var newNotification = new Notification({
                   sender: req.user._id,
                   reciever: reciever._id,
                   type: 'The shipping info from your order ' + order.order_number + ' has been updated.' ,
                   link: '/orders/' + req.params.id,
                   date_sent: current_date
                });

                // Create notification in database
                Notification.saveNotification(newNotification, (err, notification) => {
                   if(err) throw err;

                   // Add Notification for User
                   User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                      if (err) throw err;

                      // Gmail Credentials
                      var transporter = nodemailer.createTransport({
                         service: 'Gmail',
                         auth: {
                            user: 'hello@myhryzn.com',
                            pass: '+ar+oo-55'
                         }
                      });

                      // Mail Body
                      var mailOptions = {
                         from: '"Hryzn" <hello@myhryzn.com>',
                         to: reciever.email,
                         subject: 'Shipping info updated for order number: ' + order.order_number,
                         html: '<h1>Hello from Hryzn!</h1><br><p>The shipping info from your order: ' + order.order_number + ' has been updated. Just letting you know in case you need to update anything.</p><br><a href="https://myhryzn.com/orders/' + order._id + '">Click here to view your order</a><br><p>Enjoy your day!</p>',
                      }

                      transporter.sendMail(mailOptions, (error, info) => {
                         if(!error) {
                         }
                      });


                      if (owner_count == order.items.length) {
                        req.flash('success_msg', "Shipping info was updated.");
                        res.redirect(order_url);
                      }
                   });
                });
             });
           }
        });

      } else if (method == 'billing') {

        var billing_info = {
          billing_fname: req.body.billing_fname,
          billing_lname: req.body.billing_lname,
          billing_address: req.body.billing_address,
          billing_apt: req.body.billing_apt,
          billing_city: req.body.billing_city,
          billing_state: req.body.billing_state,
          billing_postal: req.body.billing_postal,
          billing_country: req.body.billing_country
        }

        Order.findByIdAndUpdate(req.params.id, {
          billing_info: billing_info
        }, (err, user) => {
           if (err) throw err;

           var owner_count = 0;

           for (var i = 0, len = order.items.length; i < len; i++) {

             owner_count += 1;

             // Send notification to the user mentioned
             User.findOne({ 'stripe_connected_account_id': { $in: order.items[i].owner } }, (err, reciever) => {
                if (err) throw err;

                var newNotification = new Notification({
                   sender: req.user._id,
                   reciever: reciever._id,
                   type: 'The billing info from your order ' + order.order_number + ' has been updated.' ,
                   link: '/orders/' + req.params.id,
                   date_sent: current_date
                });

                // Create notification in database
                Notification.saveNotification(newNotification, (err, notification) => {
                   if(err) throw err;

                   // Add Notification for User
                   User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                      if (err) throw err;

                      // Gmail Credentials
                      var transporter = nodemailer.createTransport({
                         service: 'Gmail',
                         auth: {
                            user: 'hello@myhryzn.com',
                            pass: '+ar+oo-55'
                         }
                      });

                      // Mail Body
                      var mailOptions = {
                         from: '"Hryzn" <hello@myhryzn.com>',
                         to: reciever.email,
                         subject: 'Billing info updated for order number: ' + order.order_number,
                         html: '<h1>Hello from Hryzn!</h1><br><p>The billing info from your order: ' + order.order_number + ' has been updated. Just letting you know in case you need to update anything.</p><br><a href="https://myhryzn.com/orders/' + order._id + '">Click here to view your order</a><br><p>Enjoy your day!</p>',
                      }

                      transporter.sendMail(mailOptions, (error, info) => {
                         if(!error) {
                         }
                      });


                      if (owner_count == order.items.length) {
                        req.flash('success_msg', "Billing info was updated.");
                        res.redirect(order_url);
                      }
                   });
                });
             });
           }
        });

      } else {
        res.redirect('/orders');
      }

    } else {
      res.redirect('/orders');
    }

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
