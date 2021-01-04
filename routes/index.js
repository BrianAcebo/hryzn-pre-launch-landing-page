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

var current_date = new Date();
var day = String(current_date.getDate()).padStart(2, '0');
var month = String(current_date.getMonth() + 1).padStart(2, '0');
var year = current_date.getFullYear();
current_date = day + '/' + month + '/' + year;

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
      filename = filename.replace(/\s+/g, '-').toLowerCase();
      filename = filename.replace("?", "");
      filename = filename.replace("#", "");
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

// Get Welcome Landing Page
router.get('/', (req, res, next) => {
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
                                    linear_feed: true
                                 });
                              });
                           } else {

                              shuffle(suggested_groups);

                              var reverse_suggested_groups = suggested_groups.slice(0,3).reverse();

                              res.render('index', {
                                 page_title: 'Welcome',
                                 greeting: greeting,
                                 projects: all_public_projects.reverse(),
                                 suggested_projects: reverse_suggested_projects,
                                 suggested_profiles: reverse_suggested_profiles,
                                 suggested_groups: reverse_suggested_groups,
                                 profiles: profiles,
                                 groups: groups,
                                 explore_default: true,
                                 index_active: true,
                                 linear_feed: true
                              });
                           }
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

            res.render('welcome', {
               page_title: "Everybody has something to say. We make it easy to say it. Find your voice.",
               notLoginPage: false,
               projects: projects,
               groups: groups,
               welcomePage: true
            });

            // Group.find({}, (err, groups) => {
            //
            //    if (err) throw err;
            //
            //    var group_names = [];
            //
            //    groups.forEach(function(group, key) {
            //       if (!group.is_private) {
            //          group_names.push(group.group_name);
            //       }
            //    });
            //
            //    console.log(group_names);
            //
            // });

         });

      }).limit(8);

   }
});

// Get Welcome Redirect
router.get('/welcome', (req, res, next) => {
   res.redirect('/');
});

// Get Creatives
router.get('/creatives', (req, res, next) => {
   if(req.isAuthenticated()) {
      res.redirect('/');
   } else {

      res.render('creatives', {
        page_title: 'Creatives',
        notLoginPage: false,
        creativesPage: true
      });

   }
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
        errors: errors
      });
   } else {

      Email.findOne({ 'email': { $in: body_email} }, (err, email) => {

         if(err) throw err;

         if (email) {

            res.render('creatives', {
              page_title: 'Creatives',
              notLoginPage: false,
              creativesPage: true,
              error_msg: 'Sorry that email is already in use.'
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
                  filename = filename.replace(/\s+/g, '-').toLowerCase();
                  filename = filename.replace("?", "");
                  filename = filename.replace("#", "");

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
                  filename = filename.replace(/\s+/g, '-').toLowerCase();
                  filename = filename.replace("?", "");
                  filename = filename.replace("#", "");

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

      res.redirect('/');
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
            filename = filename.replace(/\s+/g, '-').toLowerCase();
            filename = filename.replace("?", "");
            filename = filename.replace("#", "");

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
            filename = filename.replace(/\s+/g, '-').toLowerCase();
            filename = filename.replace("?", "");
            filename = filename.replace("#", "");

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

         User.find({ 'username': { $in: req.user.following} }, (err, following) => {

            if (err) throw err;

            res.render('messages', {
               page_title: 'Messages',
               messages: messages,
               following: following,
               existing_chats: existing_chats
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

         res.render('messages/chat', {
            page_title: 'Messages',
            new_chat: false,
            message: message,
            chat: true
         });

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
router.post('/messages/chat/:messageId', verifyToken, (req, res, next) => {
   if(req.isAuthenticated()) {

      jwt.verify(req.token, 'SuperSecretKey', (err, authData) => {
         if (err) {
            res.sendStatus(403);
         } else if (req.body.orange_blossom != '') {
            res.sendStatus(403);
         } else {

            info = [];
            info['userUsername'] = req.body.username;
            info['messageId'] = req.params.messageId;
            if (req.body.profileimage) {
               info['profileimage'] = req.body.profileimage;
            } else {
               info['profileimage'] = 'hryzn-placeholder-01.jpg';
            }
            info['message'] = req.body.message.replace(/\r\n/g,'');

            // Add message
            Message.addMessage(info, (err, message) => {
               if(err) throw err

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

               req.flash('success_msg', "Message Sent");
               res.redirect('/messages/chat/' + req.params.messageId);
            });
         }
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
            page_title: 'Messages',
            new_chat: true,
            other_user: user.username,
            chat: true
         });

      });

   } else {
      res.redirect('/users/register');
   }
});


// Post New Message Chat
router.post('/messages/new/:username', verifyToken, (req, res, next) => {
   if(req.isAuthenticated()) {

      jwt.verify(req.token, 'SuperSecretKey', (err, authData) => {
         if (err) {
            res.sendStatus(403);
         } else if (req.body.orange_blossom != '') {
            res.sendStatus(403);
         } else {

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
                  message: message
               }
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
            notification_active: true
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


// GET Profile
router.get('/profile/:username', (req, res, next) => {

   User.findOne({ 'username': { $in: req.params.username} }, (err, profile) => {

      if (profile) {

         if(err) throw err;

         if(req.isAuthenticated()) {
         } else {
            var guestUser = true;
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

                           res.render(pageRender, {
                              page_title: profile.username,
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
                              followers: followers
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

                     res.render(pageRender, {
                        page_title: profile.username,
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
                        noCollections: noCollections
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

      // Update following for User
      User.addFollowing(info, (err, user) => {
         if(err) throw err;
      });

      // Add followers to profile
      User.addFollowers(info, (err, user) => {
         if(err) throw err;

         // Send notification to the user mentioned
         User.findOne({ 'username': { $in: req.body.profile_username } }, (err, reciever) => {
            if (err) throw err;

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
               });
            });
         });

         req.flash('success_msg', "Following " + info['profileUsername']);
         res.redirect('/profile/' + info['profileUsername']);
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

      // Update following for User
      User.removeFollowing(info, (err, user) => {
         if(err) throw err;
      });

      // Remove followers from profile
      User.removeFollowers(info, (err, user) => {
         if(err) throw err;
         req.flash('success_msg', "Unfollowed " + info['profileUsername']);
         res.redirect('/profile/' + info['profileUsername']);
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
               page_title: profile.username,
               profiles: profiles
            });
         });
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
               page_title: profile.username,
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
                        filename = filename.replace(/\s+/g, '-').toLowerCase();
                        filename = filename.replace("?", "");
                        filename = filename.replace("#", "");

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
                        filename = filename.replace(/\s+/g, '-').toLowerCase();
                        filename = filename.replace("?", "");
                        filename = filename.replace("#", "");

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
                        filename = filename.replace(/\s+/g, '-').toLowerCase();
                        filename = filename.replace("?", "");
                        filename = filename.replace("#", "");

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
                     profile_project_background_color: profile_project_background_color
                  }, (err, user) => {
                     if (err) throw err;
                  });

                  res.redirect('/profile/' + req.user.username);

               } else {

                  if (typeof req.body.remove_profile_project_bg != 'undefined') {
                     var profile_project_backgroundimage;
                     var profile_project_background_color;
                  } else {
                     if (req.body.color_was_chosen) {
                        var profile_project_background_color = req.body.profile_project_background_color;
                        console.log('lol');
                     } else {
                        var profile_project_background_color = req.user.profile_project_background_color;
                        var profile_project_backgroundimage = req.user.profile_project_backgroundimage;
                     }
                  }


                  // User didn't upload images

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
                     profile_project_background_color: profile_project_background_color
                  }, (err, user) => {
                     if (err) throw err;
                  });

                  res.redirect('/profile/' + req.user.username);
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
            page_title: 'Explore Projects',
            projects: all_public_projects.reverse(),
            groups: groups.reverse(),
            explore_default: true,
            explore_active: true
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
               page_title: 'Explore ' + req.params.category,
               projects: projects.reverse(),
               groups: groups.reverse(),
               explore_default: true,
               category_title: req.params.category
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
               page_title: 'Explore Projects',
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
                              page_title: 'Edit ' + collection.collection_name,
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
