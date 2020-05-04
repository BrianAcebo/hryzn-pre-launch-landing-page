const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const keys = require('../config/keys');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const dateNow = Date.now().toString();

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
      cb(null, dateNow + file.originalname);
   }
}

const upload = multer({storage: multerS3(storage)});
const multipleUpload = multer({storage: multerS3(storage)}).any();

const User = require('../models/users');
const Project = require('../models/projects');
const Message = require('../models/messages');

// Get Welcome Landing Page
router.get('/welcome', (req, res, next) => {
   if(req.isAuthenticated()) {
      res.redirect('/');
   } else {

      var featured_projects = [
         '5cda25cc5f66f6001759268a',
         '5cdc5b07294e1e0017d3f87e',
         '5e88ee436413750017b0304b',
         '5e7d700888041a0017351dc4',
         '5e88f3ef6413750017b0304c',
         '5e8e799102b32d001725d5bb',
         '5e57414fe509772628eca160',
         '5e9379216387290017b85ebb'
      ];

      Project.find({ '_id': { $in: featured_projects } }, (err, projects) => {
         if (err) throw err;

         res.render('welcome', {
           page_title: 'Create, explore, and share your ideas on a powerful social writing platform',
           notLoginPage: false,
           projects: projects,
           welcomePage: true
         });
      }).limit(8);

   }
});

// Get Index (User is logged in)
router.get('/', (req, res, next) => {
   if(req.isAuthenticated()) {

      // User's Subscriptions Feed

      // if (req.user.following) {
      //    User.find({ 'username': { $in: req.user.following } }, (err, profiles) => {
      //       if (err) throw err;
      //
      //       var profile_project = []
      //
      //       profiles.forEach(function(profile, key) {
      //          profile.own_projects.reverse().forEach(function(proj, key) {
      //             profile_project.push(proj);
      //          });
      //       });
      //
      //       Project.find({ '_id': { $in: profile_project } }, (err, projects) => {
      //          if (err) throw err;
      //
      //          res.render('explore', {
      //             page_title: 'Explore Projects',
      //             projects: projects,
      //             profiles: profiles,
      //             explore_default: true
      //          });
      //       });
      //    });
      // } else {
      //    res.redirect('/explore');
      // }

      // For now just redirect to explore page
      res.redirect('/explore');
   } else {
      res.redirect('/welcome');
   }
});


// Get All Chats
router.get('/messages', (req, res, next) => {
   if(req.isAuthenticated()) {
      Message.find({ '_id': { $in: req.user.messages} }, (err, messages) => {

         if (err) throw err;

         if (messages.length > 0) {
            var has_messages = true;
         } else {
            var has_messages = false;
         }

         User.find({ 'username': { $in: req.user.following} }, (err, following) => {

            if (err) throw err;

            var other_users = [];

            messages.forEach(function(msg, key) {
               msg.users.forEach(function(user, key) {
                  if (user != req.user.username) {
                     other_users.push(user);
                  }
               });
            });

            res.render('messages', {
               page_title: 'Messages',
               has_messages: has_messages,
               messages: messages,
               other_users: other_users,
               following: following
            });

         });

      });

   } else {
      res.redirect('/welcome');
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
      res.redirect('/welcome');
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
      res.redirect('/welcome');
   }
});


// Post Old Message Chat
router.post('/messages/chat/:messageId', (req, res, next) => {
   if(req.isAuthenticated()) {

      info = [];
      info['userUsername'] = req.body.username;
      info['messageId'] = req.params.messageId;
      info['profileimage'] = req.body.profileimage;
      info['message'] = req.body.message.replace(/\r\n/g,'');

      // Add followers to profile
      Message.addMessage(info, (err, message) => {
         if(err) throw err

         req.flash('success_msg', "Message Sent");
         res.redirect('/messages/chat/' + req.params.messageId);
      });

   } else {
      res.redirect('/welcome');
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
      res.redirect('/welcome');
   }
});


// Post New Message Chat
router.post('/messages/new/:username', (req, res, next) => {
   if(req.isAuthenticated()) {

      var users = req.body.users;
      var sent_by = req.user.username;
      var profileimage = req.body.profileimage;
      var message = req.body.message.replace(/\r\n/g,'');

      var newMessage = new Message({
         users: users,
         messages: {
            username: sent_by,
            profileimage: profileimage,
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

         req.flash('success_msg', "Message was sent.");
         res.redirect('/messages');
      });

   } else {
      res.redirect('/welcome');
   }
});


// Get User Logout
router.get('/logout', (req, res, next) => {
   if(req.isAuthenticated() || req.session) {
      req.logout();
      req.session.destroy( (err) => {
         res.clearCookie('connect.sid');
         res.redirect('/welcome');
      });
   } else {
      res.redirect('/welcome');
   }
});


// GET Profile
router.get('/profile/:username', (req, res, next) => {

   User.getUserByUsername(req.params.username, (err, profile) => {

      if(err) throw err;

      if(req.isAuthenticated()) {
      } else {
         var guestUser = true;
      }

      if(req.isAuthenticated()) {
         // User is seeing their own profile
         if(profile.username === req.user.username) {
            var viewing_own_profile = true;
            if (profile.username === 'hryzn') {
               var hryznAdmin = true;
            } else {
               var hryznAdmin = false;
            }
         } else {
            var viewing_own_profile = false;
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

            res.render('profile', {
               page_title: profile.username,
               profile: profile,
               projects: reversed_projects,
               saved_projects: reversed_saved_projects,
               user_follows_profile: user_follows_profile,
               amount_of_followers: amount_of_followers,
               amount_of_following: amount_of_following,
               amount_of_projects: amount_of_projects,
               viewing_own_profile: viewing_own_profile,
               guestUser: guestUser,
               hryznAdmin: hryznAdmin
            });
         });
      });
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
         req.flash('success_msg', "Following " + info['profileUsername']);
         res.redirect('/profile/' + info['profileUsername']);
      });
   } else {
      res.redirect('/welcome');
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
      res.redirect('/welcome');
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
      res.redirect('/welcome');
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
      res.redirect('/welcome');
   }
});

// GET Settings
router.get('/settings', (req, res, next) => {
   if(req.isAuthenticated()) {
      res.render('settings', { page_title: 'Settings' });
   } else {
      res.redirect('/welcome');
   }
});

// POST Settings
router.post('/settings', upload.array('images[]', 2), (req, res, next) => {
   if(req.isAuthenticated()) {

      function capitalize(string) {
         return string.charAt(0).toUpperCase() + string.slice(1);
      }

      // var username = req.body.username;
      var oldUsername = req.user.username;
      var email = req.body.email;
      var oldEmail = req.user.email;
      var bio = req.body.bio.replace(/\r\n/g,'');;
      var website_link = req.body.website_link;
      var youtube_link = req.body.youtube_link;
      var twitter_link = req.body.twitter_link;
      var instagram_link = req.body.instagram_link;
      var facebook_link = req.body.facebook_link;
      var id = req.body.id;
      var user = req.body.user;

      if(req.body.firstname === "") {
         var firstname = "";
      } else {
         var firstname = req.body.firstname;
         firstname = capitalize(firstname);
         req.checkBody('firstname', 'First Name Is Too Long').isLength({ min: 0, max:50 });
      }

      if(req.body.lastname === "") {
         var lastname = "";
      } else {
         var lastname = req.body.lastname;
         lastname = capitalize(lastname);
         req.checkBody('lastname', 'Last Name Is Too Long').isLength({ min: 0, max:50 });
      }

      // See if website_link has https://
      var has_https = website_link.search("https://");
      if(has_https > -1) {

         var url_without_https = website_link.split("https://")[1];
         website_link = url_without_https;

      }

      // Form Validation
      // req.checkBody('username', 'Please Enter A Username').notEmpty();
      // req.checkBody('username', 'Username Must Be Between 5-50 Characters').isLength({ min: 5, max:50 });
      req.checkBody('bio', 'Bio Is Too Long.').isLength({ min: 0, max: 200 });
      req.checkBody('email', 'Please Enter An Email Address').notEmpty();
      req.checkBody('email', 'Please Enter A Valid Email Address').isEmail();

      errors = req.validationErrors();

      if(errors) {
         User.findById(id, (err, user) => {
            if(err) throw err;

            res.render('settings', {
               errors: errors,
               page_title: 'Settings',
               user: user
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
            if(!user || user.email === oldEmail) {

               if(req.body.images) {

                  console.log('files');

                  var img_indices = req.body.img_indices;

                  good_files = [];

                  req.files.forEach(function(file, key) {
                     var ext = file.originalname.split('.').pop();
                     if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {
                        good_files.push(file.originalname);
                     }
                  })

                  if(good_files.length < 2 && img_indices == 3) {
                     User.findById(id, (err, user) => {
                        if(err) throw err;

                        res.render('settings', {
                           error_msg: 'Uploaded File Must End With .jpg .jpeg .png .gif',
                           firstname: firstname,
                           lastname: lastname,
                           email: email,
                           page_title: 'Settings',
                           user: user
                        });
                     });
                  } else {

                     if(good_files.length < 1 && img_indices <= 2) {
                        User.findById(id, (err, user) => {
                           if(err) throw err;

                           res.render('settings', {
                              error_msg: 'Uploaded File Must End With .jpg .jpeg .png .gif',
                              firstname: firstname,
                              lastname: lastname,
                              email: email,
                              page_title: 'Settings',
                              user: user
                           });
                        });
                     } else {

                        good_files = [];

                        req.files.forEach(function(file, key) {
                           // var fileExt = file.originalname.split('.').pop();
                           var img = dateNow + file.originalname;
                           good_files.push(img);
                        })

                        if (img_indices == 3) {

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
                              profileimage: good_files[0],
                              backgroundimage: good_files[1]
                           }, (err, user) => {
                              if (err) throw err;
                           });

                           res.redirect('/profile/' + req.user.username);

                        } else if (img_indices == 2) {

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
                              profileimage: good_files[0]
                           }, (err, user) => {
                              if (err) throw err;
                           });

                           res.redirect('/profile/' + req.user.username);

                        } else {

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
                              backgroundimage: good_files[0]
                           }, (err, user) => {
                              if (err) throw err;
                           });

                           res.redirect('/profile/' + req.user.username);

                        }

                     }
                  }
               } else {

                  User.findByIdAndUpdate(id, {
                     firstname: firstname,
                     lastname: lastname,
                     email: email,
                     bio: bio,
                     website: website_link,
                     youtube: youtube_link,
                     twitter: twitter_link,
                     instagram: instagram_link,
                     facebook: facebook_link
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
                     user: user
                  });
               });
            }
         });
      }
   } else {
      res.redirect('/welcome');
   }
});

// Delete Profile
router.get('/delete/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      User.findById(req.params.id, (err, user) => {
         if(err) throw err;

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
                        console.log("No delete : " + err);
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
               console.log("No delete : " + err);
            }
         });

         User.findByIdAndRemove(req.params.id, (err) => {
           if (err) throw err;
           res.location('/welcome');
           res.redirect('/welcome');
         });
      });
   } else {
      res.redirect('/welcome');
   }
});

// Get Explore
router.get('/explore', (req, res, next) => {
   if(req.isAuthenticated()) {
      Project.find({}, (err, projects) => {
         if (err) throw err;

         var reversed_projects = projects.reverse();

         res.render('explore', {
            page_title: 'Explore Projects',
            projects: reversed_projects,
            explore_default: true
         });
      });

   } else {
      res.redirect('/welcome');
   }
});

// Get Category
router.get('/explore/:category', (req, res, next) => {
   if(req.isAuthenticated()) {

      Project.find({ 'categories': { $in: req.params.category} }, (err, projects) => {
         if (err) throw err;

         var reversed_projects = projects.reverse();

         res.render('explore', {
            page_title: 'Explore ' + req.params.category,
            projects: reversed_projects,
            explore_default: true
         });
      });

   } else {
      res.redirect('/welcome');
   }
});

// Get Search
router.get('/search', (req, res, next) => {
   if(req.isAuthenticated()) {
      var searchTerm = req.query.p;

      User.find({$text: { $search: searchTerm }}, {score: { $meta: "textScore" }}, (err, user) => {
         if (err) throw err;

         Project.find({$text: { $search: searchTerm }}, {score: { $meta: "textScore" }}, (err, projects) => {
            if (err) throw err;

            // No need to reverse order of projects

            res.render('explore', {
               page_title: 'Explore Projects',
               projects: projects,
               user_search: user,
               project_search: projects,
               explore_default: false
            });
         }).sort({score: { $meta: "textScore" }});
      }).sort({score: { $meta: "textScore" }});

   } else {
      res.redirect('/welcome');
   }
});

// Get Sitemap
router.get('/sitemap', (req, res, next) => {
   res.render('sitemap', {
      page_title: 'Sitemap',
      sitemap: true
   });
});

module.exports = router;
