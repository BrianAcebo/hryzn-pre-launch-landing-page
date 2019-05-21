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

const upload = multer({
   storage: multerS3({
      s3: s3,
      bucket: 'hryzn-app-static-assets',
      key: (req, file, cb) => {
         cb(null, dateNow + '-' + file.originalname);
      }
   })
});

const User = require('../models/users');
const Project = require('../models/projects');

// Get Welcome Landing Page
router.get('/welcome', (req, res, next) => {
   if(req.isAuthenticated()) {
      res.redirect('/');
   } else {
      res.render('welcome', {
        page_title: 'Welcome to Hryzn',
        notLoginPage: false
      });
   }
});

// Get Index (User is logged in)
router.get('/', (req, res, next) => {
   if(req.isAuthenticated()) {
      Project.find({}, (err, projects) => {
         if (err) throw err;
         res.render('explore', {
            page_title: 'Explore Projects',
            projects: projects
         });
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
   if(req.isAuthenticated()) {
      User.getUserByUsername(req.params.username, (err, profile) => {
         if(err) throw err;
         if(profile.username === req.user.username) {
            can_see_private = true;
         } else {
            can_see_private = false;
         }

         if(typeof profile.followers === "undefined") {
            // Profile has no followers
            var user_follows_profile = false;
            var amount_of_followers = 0;
         } else {
            var amount_of_followers = profile.followers.length;
            if(profile.followers.indexOf(req.user.username) === -1) {
               var user_follows_profile = false;
            } else {
               var user_follows_profile = true;
            }
         }

         if(typeof profile.following === "undefined") {
            // Profile is not following anyone
            var amount_of_following = 0;
         } else {
            var amount_of_following = profile.following.length;
         }
         Project.find({
             '_id': { $in: profile.projects}
         }, (err, projects) => {
            if (err) throw err;
            res.render('profile', {
               page_title: profile.username,
               profile: profile,
               projects: projects,
               user_follows_profile: user_follows_profile,
               amount_of_followers: amount_of_followers,
               amount_of_following: amount_of_following,
               can_see_private: can_see_private
            });
         });
      });
   } else {
      res.redirect('/welcome');
   }
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

         User.find({
             'username': { $in: profile.followers}
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

// GET Profile Following
router.get('/profile/:username/following', (req, res, next) => {
   if(req.isAuthenticated()) {
      User.getUserByUsername(req.params.username, (err, profile) => {
         if(err) throw err;

         User.find({
             'username': { $in: profile.following}
         }, (err, profiles) => {
            if (err) throw err;
            res.render('following', {
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
router.post('/settings', upload.single('profileimage'), (req, res, next) => {
   if(req.isAuthenticated()) {

      function capitalize(string) {
         return string.charAt(0).toUpperCase() + string.slice(1);
      }

      // var username = req.body.username;
      var oldUsername = req.user.username;
      var email = req.body.email;
      var oldEmail = req.user.email;
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

      // Form Validation
      // req.checkBody('username', 'Please Enter A Username').notEmpty();
      // req.checkBody('username', 'Username Must Be Between 5-50 Characters').isLength({ min: 5, max:50 });
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
         //                   var profileimage = dateNow + '-' + req.file.originalname;
         //
         //                   User.findByIdAndUpdate(id, {
         //                      firstname: firstname,
         //                      lastname: lastname,
         //                      username: username,
         //                      email: email,
         //                      profileimage: profileimage
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

               if(req.file) {
                  var ext = path.extname(req.file.originalname);
                  if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {
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
                     var profileimage = dateNow + '-' + req.file.originalname;

                     User.findByIdAndUpdate(id, {
                        firstname: firstname,
                        lastname: lastname,
                        email: email,
                        profileimage: profileimage
                     }, (err, user) => {
                        if (err) throw err;
                     });

                     res.redirect('/profile/' + username);
                  }
               } else {

                  User.findByIdAndUpdate(id, {
                     firstname: firstname,
                     lastname: lastname,
                     email: email
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

         if(user.projects.length > 0) {

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

                        User.unfollowProject(info, (err, user) => {
                           if(err) throw err;
                        });
                     }
                  }

                  // User will no longer be an admin
                  if(project.admins.length > 0) {
                     for (var i = 0, len = project.admins.length; i < len; i++) {
                        info['profileUsername'] = project.admins[i];

                        User.unfollowProject(info, (err, user) => {
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
            Key: user.profileimage
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
         res.render('explore', {
            page_title: 'Explore Projects',
            projects: projects
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
      Project.find({
         $text: { $search: searchTerm }
      },
      {
         score: { $meta: "textScore" }
      },
      (err, projects) => {
         if (err) throw err;
         res.render('explore', {
            page_title: 'Explore Projects',
            projects: projects,
            user_searched_for_project: true
         });
      }
      ).sort({
         score: { $meta: "textScore" }
      });

   } else {
      res.redirect('/welcome');
   }
});

// Get User to invite to admin
router.get('/p/details/invite/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      var id = req.params.id;
      Project.findById(id, (err, project) => {
         if(err) throw err;

         res.render('p/details/invite', {
            page_title: project.project_title,
            project: project
         });
      });
   } else {
      res.redirect('/welcome');
   }
});

// Get User to invite to admin cont'd
router.get('/p/details/invite/search/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      var project_id = req.params.id;

      Project.findById(project_id, (err, project) => {
         if(err) throw err;

         var project = project;
         var search_term = req.query.searchUser;

         User.find({
            $text: { $search: search_term }
         },
         {
            score: { $meta: "textScore" }
         },
         (err, user) => {
            if (err) throw err;
            res.render('p/details/searchUser', {
               page_title: 'Invite Admin',
               user_found: user,
               project: project
            });
         }
         ).sort({
            score: { $meta: "textScore" }
         });
      });

   } else {
      res.redirect('/welcome');
   }
});

// Post Add user to project admin
router.post('/addtoadminuser/:username', (req, res, next) => {
   if(req.isAuthenticated()) {

      info = [];
      info['profileUsername'] = req.params.username;
      info['projectId'] = req.body.id;
      info['projectTitle'] = req.body.project_title;
      info['isPrivate'] = req.body.is_private;
      info['projectImage'] = req.body.project_image;

      var user_id = req.body.user_id;

      Project.findById(req.body.id, (err, project) => {
         if(err) throw err;

         if(project.admins.indexOf(req.params.username) === -1) {
            User.findByIdAndUpdate(user_id, {
               projects: req.body.id
            }, (err, user) => {
               if (err) throw err;
            });

            Project.addAdmin(info, (err, project) => {
               if(err) throw err;
               req.flash('success_msg', "User Added To Admin");
               res.redirect('/p/details/' + req.body.id);
            });
         } else {
            req.flash('errors_2', "This User Is Already An Admin");
            res.redirect('/p/details/' + req.body.id);
         }
      });

   } else {
      res.redirect('/welcome');
   }
});

module.exports = router;
