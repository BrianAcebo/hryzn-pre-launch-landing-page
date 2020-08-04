const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const keys = require('../config/keys');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const dateNow = Date.now().toString();
const jwt = require('jsonwebtoken');

// AWS S3 Access
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
const multipleUpload = multer({storage: multerS3(storage)});


// Connection to Models
const User = require('../models/users');
const Project = require('../models/projects');
const Notification = require('../models/notifications');
const Group = require('../models/groups');


// GET Create Project
router.get('/create-project', (req, res, next) => {
   if(req.isAuthenticated()) {
      User.getUserByUsername(req.user.username, (err, profile) => {
         if(err) throw err;

         User.find({ 'username': { $in: profile.following} }, (err, profiles) => {
            if (err) throw err;
            res.render('p/create-project', {
               page_title: 'Create Project',
               editProject: true,
               mention: profiles
            });
         });
      });
   } else {
      res.redirect('/users/register');
   }
});


// POST Create Project
router.post('/create-project/blog', upload.fields([{name: 'project_image', maxCount: 1}, {name: 'thumbnail_image', maxCount: 1}, {name: 'project_video', maxCount: 1}]), verifyToken, (req, res, next) => {

   if(req.isAuthenticated()) {

      jwt.verify(req.token, 'SuperSecretKey', (err, authData) => {
         if (err) {
            res.sendStatus(403);
         } else if (req.body.orange_blossom != '') {
            res.sendStatus(403);
         } else {

            var project_title = req.body.project_title.replace(/\r\n/g,'');
            var project_description = req.body.project_description.replace(/\r\n/g,'');
            var admin = req.body.admin; // Owner of project
            var is_private = req.body.is_private;
            var id = req.body.id;
            var user = req.body.user;
            var req_project_notes = req.body.project_notes.replace(/\r\n/g,'');
            var project_url = req.body.project_url;
            var posted_to_group;
            if (req.body.post_to != '') {
               if (req.body.post_to != 'Followers') {
                  Group.findOne({ '_id': { $in: req.body.post_to } }, (err, group) => {
                     if (group) {
                        posted_to_group = true;
                     } else {
                        posted_to_group = false;
                     }
                  });
               } else {
                  posted_to_group = false;
               }
            } else {
               posted_to_group = false;
            }

            if (req.body.project_categories) {
               if (req.body.project_categories.length > 0) {
                  var project_categories = req.body.project_categories;
               } else {
                  var project_categories = [];
               }
            } else {
               var project_categories = [];
            }

            // Check for mentions or hashtags
            var tag_indices = []
            function find_tag(index) {
               var tag = '';
               for (var i = 0; i < 200; i++) {
                  if (req_project_notes[index + i] == ' ' || req_project_notes[index + i] == '<') {
                     break;
                  } else if (req_project_notes[index + i] == '&' && req_project_notes[index + i + 2] == 'b'){
                     break;
                  } else {
                     tag += req_project_notes[index + i];
                     tag_indices.push(index + i);
                  }
               }
               return tag;
            }
            var project_notes = '';
            var slice;
            var mention;
            for (var i = 0; i < req_project_notes.length; i++) {
               if(req_project_notes.charAt(i) == '#') {

                  slice = find_tag(i);
                  var clean_word = slice.slice(1, slice.length);
                  project_notes += '<a class="mention_tag" href="/explore/' + clean_word + '">' + slice + '</a> ';
                  if (project_categories.indexOf(clean_word) === -1) {
                     project_categories.push(clean_word);
                  }

               } else if (req_project_notes.charAt(i) == '@') {

                  slice = find_tag(i);
                  var clean_word = slice.slice(1, slice.length);
                  project_notes += '<a class="mention_tag" href="/profile/' + clean_word + '">' + slice + '</a> ';

                  // Send notification to the user mentioned
                  User.findOne({ 'username': { $in: clean_word} }, (err, reciever) => {
                    if (err) throw err;

                    if (reciever) {
                       var newNotification = new Notification({
                          sender: req.user._id,
                          reciever: reciever._id,
                          type: '@' + req.user.username + ' mentioned you in their new post.',
                          link: '/profile/' + req.user.username
                       });

                       // Create notification in database
                       Notification.saveNotification(newNotification, (err, notification) => {
                          if(err) throw err;

                          // Add Notification for User
                          User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                             if (err) throw err;
                          });
                       });
                    }
                 });

              } else if (tag_indices.indexOf(i) > -1) {
                 // do nothing
              } else {
                  project_notes += req_project_notes.charAt(i);
               }
            }

            // See if project_url has https://
            var has_https = project_url.search("https://");
            if(has_https > -1) {

               var url_without_https = project_url.split("https://")[1];
               project_url = url_without_https;

            }


            // Form Validation
            req.checkBody('project_title', 'Project Title Is Too Long').isLength({ min: 0, max:200 });
            req.checkBody('project_description', 'Description Must Be Less Than 500 Characters').isLength({ min: 0, max: 500 });

            errors = req.validationErrors();

            if(errors) {

               User.findById(id, (err, user) => {
                  if(err) throw err;

                  User.find({ 'username': { $in: user.following} }, (err, profiles) => {
                     if (err) throw err;
                     res.render('p/create-project', {
                        errors: errors,
                        page_title: 'Create Project',
                        project_title: project_title,
                        project_description: project_description,
                        project_notes: project_notes,
                        is_private: is_private,
                        project_video: project_video,
                        project_url: project_url,
                        categories: project_categories,
                        project_notes: project_notes,
                        editProject: true,
                        project_error: true,
                        mention: profiles,
                        user: user
                     });
                  });
               });

            } else {

               if(req.files.thumbnail_image) {

                  var allGood = false;

                  if (req.files.project_video) {

                     // If user uploaded an image for project
                     var ext = path.extname(req.files.project_video[0].originalname);

                     // Check if file is audio
                     if(ext !== '.mp4' && ext !== '.MP4' && ext !== '.webm' && ext !== '.WEBM' && ext !== '.ogg' && ext !== '.OGG') {

                        User.findById(id, (err, user) => {
                           if(err) throw err;

                           User.find({ 'username': { $in: user.following} }, (err, profiles) => {
                              if (err) throw err;
                              res.render('p/create-project', {
                                 error_msg: 'Video File Must End With .webm .mp4 .ogg',
                                 page_title: 'Create Project',
                                 project_title: project_title,
                                 project_description: project_description,
                                 project_notes: project_notes,
                                 is_private: is_private,
                                 project_url: project_url,
                                 categories: project_categories,
                                 project_notes: project_notes,
                                 editProject: true,
                                 project_error: true,
                                 mention: profiles,
                                 user: user
                              });
                           });
                        });

                     } else {
                        var allGood = true;
                     }

                  } else {

                     if (req.files.project_image) {

                        // If user uploaded an image for project
                        var ext = path.extname(req.files.project_image[0].originalname);

                        // Check if file is an image
                        if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {

                           User.findById(id, (err, user) => {
                              if(err) throw err;

                              User.find({ 'username': { $in: user.following} }, (err, profiles) => {
                                 if (err) throw err;
                                 res.render('p/create-project', {
                                    error_msg: 'Project Image File Must End With .jpg .jpeg .png .gif',
                                    page_title: 'Create Project',
                                    project_title: project_title,
                                    project_description: project_description,
                                    project_notes: project_notes,
                                    is_private: is_private,
                                    project_url: project_url,
                                    categories: project_categories,
                                    project_notes: project_notes,
                                    editProject: true,
                                    project_error: true,
                                    mention: profiles,
                                    user: user
                                 });
                              });
                           });
                        } else {
                           var allGood = true;
                        }

                     }
                  }

                  if (allGood) {
                     // If user uploaded an image for thumbnail
                     var ext = path.extname(req.files.thumbnail_image[0].originalname);

                     // Check if file is an image
                     if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {

                        User.findById(id, (err, user) => {
                           if(err) throw err;

                           User.find({ 'username': { $in: user.following} }, (err, profiles) => {
                              if (err) throw err;
                              res.render('p/create-project', {
                                 error_msg: 'Thumbnail Image File Must End With .jpg .jpeg .png .gif',
                                 page_title: 'Create Project',
                                 project_title: project_title,
                                 project_description: project_description,
                                 project_notes: project_notes,
                                 is_private: is_private,
                                 project_url: project_url,
                                 categories: project_categories,
                                 project_notes: project_notes,
                                 editProject: true,
                                 project_error: true,
                                 mention: profiles,
                                 user: user
                              });
                           });
                        });

                     } else {

                        // No errors have been made
                        // var fileExt = req.file.originalname.split('.').pop();
                        if (req.files.project_video) {
                           var project_image;
                           var project_video = dateNow + req.files.project_video[0].originalname;
                        } else {
                           var project_video;
                           var project_image = dateNow + req.files.project_image[0].originalname;
                        }
                        var thumbnail_image = dateNow + req.files.thumbnail_image[0].originalname;

                        var newProject = new Project({
                           project_title: project_title,
                           project_description: project_description,
                           is_private: is_private,
                           project_image: project_image,
                           thumbnail_image: thumbnail_image,
                           project_video: project_video,
                           project_url: project_url,
                           admins: admin,
                           categories: project_categories,
                           project_owner: admin,
                           project_notes: project_notes
                        });

                        // Create project in database
                        Project.saveProject(newProject, (err, project) => {
                           if(err) throw err;

                           // Add project to User document
                           info = [];
                           info['profileUsername'] = req.user.username;
                           info['projectId'] = project._id.toString();

                           User.createToProfile(info, (err, user) => {
                              if(err) throw err;
                           });

                           if (posted_to_group) {
                              Group.findOne({ '_id': { $in: req.body.post_to } }, (err, group) => {

                                 info['groupId'] = group._id;
                                 info['groupName'] = group.group_name;
                                 info['groupIsPrivate'] = group.is_private;

                                 console.log(info['projectId']);

                                 Group.addProject(info, (err, group) => {
                                    if(err) throw err;
                                 });

                                 Project.addGroup(info, (err, project) => {
                                    if(err) throw err;
                                 });

                                 // Send notification to the user mentioned
                                 group.users.forEach(function(user, key) {
                                    User.findOne({ 'username': { $in: user} }, (err, reciever) => {
                                       if (err) throw err;

                                       var newNotification = new Notification({
                                          sender: req.user._id,
                                          reciever: reciever._id,
                                          type: '@' + req.user.username + ' added a post in the group ' + group.group_name,
                                          link: '/groups/' + group._id
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
                                 });

                                 req.flash('success_msg', "Project was created.");
                                 res.redirect('/groups/' + group._id);

                              });

                           } else {
                              req.flash('success_msg', "Project was created.");
                              res.redirect('/p/details/' + project._id);
                           }
                        });

                     }
                  }

               } else {
                  // If user did not upload an image for project
                  User.findById(id, (err, user) => {
                     if(err) throw err;

                     User.find({ 'username': { $in: user.following} }, (err, profiles) => {
                        if (err) throw err;
                        res.render('p/create-project', {
                           error_msg: 'Please upload a thumbnail image for blog post',
                           page_title: 'Create Project',
                           project_title: project_title,
                           project_description: project_description,
                           project_notes: project_notes,
                           is_private: is_private,
                           project_video: project_video,
                           project_url: project_url,
                           categories: project_categories,
                           project_notes: project_notes,
                           editProject: true,
                           project_error: true,
                           mention: profiles,
                           user: user
                        });
                     });
                  });
               }
            }
         }
      });

   } else {
      res.redirect('/users/register');
   }
});

// Get Edit Project
router.get('/details/edit/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      Project.findById(req.params.id, (err, project) => {
         if(err) throw err;

         if(project.admins.indexOf(req.user.username) > -1 || req.user.username === 'hryzn') {

            var is_admin_of_project = true;

            if(project.project_notes) {
               if(project.project_notes === "") {
                  var notes_is_empty_string = true;
               } else {
                  var notes_is_empty_string = false;

                  // Replace single & double quotes with backslash
                  var project_notes = project.project_notes.replace(/'/g,"\\'");
                  project_notes.replace(/"/g,'\\"');
               }
            } else {
               var notes_is_empty_string = false;
            }

            User.getUserByUsername(req.user.username, (err, profile) => {
               if(err) throw err;

               User.find({ 'username': { $in: profile.following} }, (err, profiles) => {
                  if (err) throw err;
                  res.render('p/details/edit-project', {
                     project: project,
                     project_notes: project_notes,
                     notes_is_empty_string: notes_is_empty_string,
                     hide_scripts: true,
                     page_title: project.project_title,
                     is_admin_of_project: is_admin_of_project,
                     editProject: true,
                     mention: profiles
                  });
               });
            });

         } else {

            var is_admin_of_project = false;
            res.redirect('/');

         }
      });
   } else {
      res.redirect('/users/register');
   }
});

// Post Edit Project
router.post('/details/edit/:id', upload.fields([{name: 'project_image', maxCount: 1}, {name: 'thumbnail_image', maxCount: 1}, {name: 'project_video', maxCount: 1}]), (req, res, next) => {
   if(req.isAuthenticated()) {

      var project_id = req.params.id;
      var project_description = req.body.project_description.replace(/\r\n/g,'');
      var project_title = req.body.project_title;
      var is_private = req.body.is_private;
      var user_id = req.body.id;
      var user = req.body.user;
      var req_project_notes = req.body.project_notes.replace(/\r\n/g,'');
      var project_url = req.body.project_url;
      if (req.body.post_to != 'Followers') {
         var posted_to_group = true;
      } else {
         var posted_to_group = false;
      }

      // See if project_url has https://
      var has_https = project_url.search("https://");
      if(has_https > -1) {

         var url_without_https = project_url.split("https://")[1];
         project_url = url_without_https;

      }

      // Form Validation
      req.checkBody('project_title', 'Project Title Is Too Long').isLength({ min: 0, max:200 });
      req.checkBody('project_description', 'Description Must Be Less Than 500 Characters').isLength({ min: 0, max: 500 });

      errors = req.validationErrors();

      if(errors) {

         Project.findById(project_id, (err, project) => {
            if(err) throw err;

            User.find({ 'username': { $in: req.user.following} }, (err, profiles) => {
               if (err) throw err;
               res.render('p/details/edit-project', {
                  errors_2: errors,
                  user: req.user,
                  project: project,
                  page_title: project.project_title,
                  is_admin_of_project: true,
                  editProject: true,
                  project_error: true,
                  mention: profiles,
                  user: user
               });
            });
         });

      } else {


         if (req.files.project_video || req.files.project_image || req.files.thumbnail_image) {

            if (req.files.project_video) {

               // If user uploaded an image for project
               var ext = path.extname(req.files.project_video[0].originalname);

               // Check if file is audio
               if(ext !== '.mp4' && ext !== '.MP4' && ext !== '.webm' && ext !== '.WEBM' && ext !== '.ogg' && ext !== '.OGG') {

                  User.findById(id, (err, user) => {
                     if(err) throw err;

                     User.find({ 'username': { $in: user.following} }, (err, profiles) => {
                        if (err) throw err;
                        res.render('p/create-project', {
                           error_msg: 'Video File Must End With .webm .mp4 .ogg',
                           page_title: 'Create Project',
                           project_title: project_title,
                           project_description: project_description,
                           project_notes: project_notes,
                           is_private: is_private,
                           project_url: project_url,
                           categories: project_categories,
                           project_notes: project_notes,
                           editProject: true,
                           project_error: true,
                           mention: profiles,
                           user: user
                        });
                     });
                  });

               } else {
                  var project_video = dateNow + req.files.project_video[0].originalname;
               }

            } else {
               if (req.files.project_image) {

                  // If user uploaded an image for project
                  var ext = path.extname(req.files.project_image[0].originalname);

                  // Check if image has proper extension
                  if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {
                     Project.findById(project_id, (err, project) => {
                        if(err) throw err;

                        User.find({ 'username': { $in: req.user.following} }, (err, profiles) => {
                           if (err) throw err;
                           res.render('p/details/edit-project', {
                              errors_2: 'Project Image Must End With .jpg .jpeg .png .gif',
                              user: req.user,
                              project: project,
                              page_title: project.project_title,
                              is_admin_of_project: true,
                              editProject: true,
                              project_error: true,
                              mention: profiles
                           });
                        });
                     });
                  } else {
                     var project_image = dateNow + req.files.project_image[0].originalname;
                     var project_video;
                  }
               }
            }


            if (req.files.thumbnail_image) {

               // If user uploaded an image for project
               var ext = path.extname(req.files.thumbnail_image[0].originalname);

               // Check if image has proper extension
               if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {
                  Project.findById(project_id, (err, project) => {
                     if(err) throw err;

                     User.find({ 'username': { $in: req.user.following} }, (err, profiles) => {
                        if (err) throw err;
                        res.render('p/details/edit-project', {
                           errors_2: 'Thumbnail Image Must End With .jpg .jpeg .png .gif',
                           user: req.user,
                           project: project,
                           page_title: project.project_title,
                           is_admin_of_project: true,
                           editProject: true,
                           project_error: true,
                           mention: profiles
                        });
                     });
                  });
               } else {
                  var thumbnail_image = dateNow + req.files.thumbnail_image[0].originalname;
               }
            }


            var allGood = false;

            if (req.files.project_video && req.files.thumbnail_image) {
               if (project_video && thumbnail_image) {
                  allGood = true;
               }
            } else if (req.files.project_video) {
               if (project_video) {
                  allGood = true;
               }
            } else if (req.files.project_image && req.files.thumbnail_image) {
               if (project_image && thumbnail_image) {
                  allGood = true;
               }
            } else if (req.files.project_image) {
               if (project_image) {
                  allGood = true;
               }
            } else {
               if (thumbnail_image) {
                  allGood = true;
               }
            }


            if (allGood) {

               Project.findById(project_id, (err, project) => {
                  if(err) throw err;

                  if (req.body.project_categories) {
                     if (req.body.project_categories.length > 0) {
                        var project_categories = req.body.project_categories;
                     } else {
                        var project_categories = project.categories;
                     }
                  } else {
                     var project_categories = project.categories;
                  }

                  // Check for mentions or hashtags
                  var tag_indices = []
                  function find_tag(index) {
                     var tag = '';
                     for (var i = 0; i < 200; i++) {
                        if (req_project_notes[index + i] == ' ' || req_project_notes[index + i] == '<') {
                           break;
                        } else if (req_project_notes[index + i] == '&' && req_project_notes[index + i + 2] == 'b'){
                           break;
                        } else {
                           tag += req_project_notes[index + i];
                           tag_indices.push(index + i);
                        }
                     }
                     return tag;
                  }
                  var project_notes = '';
                  var slice;
                  var mention;
                  for (var i = 0; i < req_project_notes.length; i++) {
                     if(req_project_notes.charAt(i) == '#') {

                        slice = find_tag(i);
                        var clean_word = slice.slice(1, slice.length);
                        project_notes += '<a class="mention_tag" href="/explore/' + clean_word + '">' + slice + '</a> ';
                        if (project_categories.indexOf(clean_word) === -1) {
                           project_categories.push(clean_word);
                        }

                     } else if (req_project_notes.charAt(i) == '@') {

                        slice = find_tag(i);
                        var clean_word = slice.slice(1, slice.length);
                        project_notes += '<a class="mention_tag" href="/profile/' + clean_word + '">' + slice + '</a> ';

                        // Send notification to the user mentioned
                        User.findOne({ 'username': { $in: clean_word} }, (err, reciever) => {
                          if (err) throw err;

                          var newNotification = new Notification({
                             sender: req.user._id,
                             reciever: reciever._id,
                             type: '@' + req.user.username + ' mentioned you in their post.',
                             link: '/p/details/' + project_id
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

                    } else if (tag_indices.indexOf(i) > -1) {
                       // do nothing
                    } else {
                        project_notes += req_project_notes.charAt(i);
                     }
                  }

                  if (req.files.project_image &&  req.files.thumbnail_image) {

                     // User uploaded both images

                     Project.findByIdAndUpdate(project_id, {
                        project_title: project_title,
                        project_description: project_description,
                        project_image: project_image,
                        thumbnail_image: thumbnail_image,
                        project_video: project_video,
                        project_url: project_url,
                        categories: project_categories,
                        is_private: is_private,
                        project_notes: project_notes
                     }, (err, user) => {
                        if (err) throw err;
                     });
                  } else if (req.files.project_image) {

                     // User uploaded just project image

                     Project.findByIdAndUpdate(project_id, {
                        project_title: project_title,
                        project_description: project_description,
                        project_image: project_image,
                        project_url: project_url,
                        project_video: project_video,
                        categories: project_categories,
                        is_private: is_private,
                        project_notes: project_notes
                     }, (err, user) => {
                        if (err) throw err;
                     });
                  } else if (req.files.project_video &&  req.files.thumbnail_image) {

                     // User uploaded video and thumb

                     Project.findByIdAndUpdate(project_id, {
                        project_title: project_title,
                        project_description: project_description,
                        thumbnail_image: thumbnail_image,
                        project_video: project_video,
                        project_url: project_url,
                        categories: project_categories,
                        is_private: is_private,
                        project_notes: project_notes
                     }, (err, user) => {
                        if (err) throw err;
                     });
                  } else if (req.files.project_video) {

                     // User uploaded just project video

                     Project.findByIdAndUpdate(project_id, {
                        project_title: project_title,
                        project_description: project_description,
                        project_video: project_video,
                        project_url: project_url,
                        categories: project_categories,
                        is_private: is_private,
                        project_notes: project_notes
                     }, (err, user) => {
                        if (err) throw err;
                     });
                  } else {

                     // User uploaded just thumbnail image

                     Project.findByIdAndUpdate(project_id, {
                        project_title: project_title,
                        project_description: project_description,
                        thumbnail_image: thumbnail_image,
                        project_video: project_video,
                        project_url: project_url,
                        categories: project_categories,
                        is_private: is_private,
                        project_notes: project_notes
                     }, (err, user) => {
                        if (err) throw err;
                     });
                  }

                  req.flash('success_msg', "Project was updated.");
                  res.redirect('/p/details/' + project_id);
               });

            }
         } else {

            Project.findById(project_id, (err, project) => {
               if(err) throw err;

               if (req.body.project_categories) {
                  if (req.body.project_categories.length > 0) {
                     var project_categories = req.body.project_categories;
                  } else {
                     var project_categories = project.categories;
                  }
               } else {
                  var project_categories = project.categories;
               }

               // Check for mentions or hashtags
               var tag_indices = []
               function find_tag(index) {
                  var tag = '';
                  for (var i = 0; i < 200; i++) {
                     if (req_project_notes[index + i] == ' ' || req_project_notes[index + i] == '<') {
                        break;
                     } else if (req_project_notes[index + i] == '&' && req_project_notes[index + i + 2] == 'b'){
                        break;
                     } else {
                        tag += req_project_notes[index + i];
                        tag_indices.push(index + i);
                     }
                  }
                  return tag;
               }
               var project_notes = '';
               var slice;
               var mention;
               for (var i = 0; i < req_project_notes.length; i++) {
                  if(req_project_notes.charAt(i) == '#') {

                     slice = find_tag(i);
                     var clean_word = slice.slice(1, slice.length);
                     project_notes += '<a class="mention_tag" href="/explore/' + clean_word + '">' + slice + '</a> ';
                     if (project_categories.indexOf(clean_word) === -1) {
                        project_categories.push(clean_word);
                     }

                  } else if (req_project_notes.charAt(i) == '@') {

                     slice = find_tag(i);
                     var clean_word = slice.slice(1, slice.length);
                     project_notes += '<a class="mention_tag" href="/profile/' + clean_word + '">' + slice + '</a> ';

                     // Send notification to the user mentioned
                     User.findOne({ 'username': { $in: clean_word} }, (err, reciever) => {
                       if (err) throw err;

                       var newNotification = new Notification({
                          sender: req.user._id,
                          reciever: reciever._id,
                          type: '@' + req.user.username + ' mentioned you in their post.',
                          link: '/p/details/' + project_id
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

                 } else if (tag_indices.indexOf(i) > -1) {
                    // do nothing
                 } else {
                     project_notes += req_project_notes.charAt(i);
                  }
               }

               Project.findByIdAndUpdate(project_id, {
                  project_title: project_title,
                  project_description: project_description,
                  is_private: is_private,
                  project_video: project_video,
                  project_url: project_url,
                  categories: project_categories,
                  project_notes: project_notes
               }, (err, user) => {
                  if (err) throw err;
               });

               req.flash('success_msg', "Project was updated.");
               res.redirect('/p/details/' + project_id);
            });
         }
      }
   } else {
      res.redirect('/users/register');
   }
});

// Get Project Detail
router.get('/details/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      Project.findById(req.params.id, (err, project) => {
         if (err) throw err;

         if (project) {

            if (project.is_micro_post) {

               res.redirect('/p/micro/' + req.params.id);

            } else {

               if (project.admins.indexOf(req.user.username) > -1 || req.user.username === 'hryzn') {
                  var is_admin_of_project = true;
               } else {
                  var is_admin_of_project = false;
                  var not_admin = true;
               }

               if (project.is_private && not_admin) {

                  // User came to a private project and is not an owner
                  res.redirect('/');

               } else {

                  // If the project has any saves
                  if (project.saves.length  > 0) {
                     var saves_amount = project.saves.length;
                     var enough_saves = true;
                     // If the person viewing saved the project
                     if (project.saves.indexOf(req.user.username) > -1) {
                        var user_saved = true;
                     }
                  } else {
                     // Project has no saves
                     var user_saved = false;
                     var saves_amount = 0;
                     var enough_saves = false;
                  }

                  // If the project has any likes
                  if (project.likes.length > 0) {
                     var likes_amount = project.likes.length;
                     var enough_likes = true;
                     // If the person viewing liked the project
                     if (project.likes.indexOf(req.user.username) > -1) {
                        var user_liked = true;
                     }
                  } else {
                     // Project has no likes
                     var user_liked = false;
                     var likes_amount = 0;
                     var enough_likes = false;
                  }

                  // If the project has any comments
                  if (project.comments.length > 0) {
                     var comment_amount = project.comments.length
                     var enough_comments = true;
                  } else {
                     // Project has no comments
                     var comment_amount = 0;
                     var enough_comments = false;
                  }


                  // If the project has any reposts
                  if (project.reposts.length > 0) {
                     var repost_amount = project.reposts.length;
                     var enough_reposts = true;
                     // If the person viewing reposted the project
                     if (project.reposts.indexOf(req.user.username) > -1) {
                        var user_reposted = true;
                     }
                  } else {
                     // Project has no reposts
                     var repost_amount = 0;
                     var enough_reposts = false;
                  }


                  var admin_amount = project.admins.length;

                  var search_notes = project.project_notes.toString();

                  Project.find({$text: { $search: search_notes }}, {score: { $meta: "textScore" }}, (err, related_projects) => {
                     if (err) throw err;

                     var reverse_projects = related_projects.slice(0,14).reverse();

                     if (related_projects.length > 4) {

                        res.render('p/details/details', {
                           project: project,
                           related_projects: reverse_projects,
                           projects: reverse_projects, // masonry related projects
                           page_title: project.project_title,
                           is_admin_of_project: is_admin_of_project,
                           comment_amount: comment_amount,
                           enough_comments: enough_comments,
                           enough_saves: enough_saves,
                           saves_amount: saves_amount,
                           enough_likes: enough_likes,
                           likes_amount: likes_amount,
                           user_saved: user_saved,
                           user_liked: user_liked,
                           enough_reposts: enough_reposts,
                           repost_amount: repost_amount,
                           user_reposted: user_reposted,
                           admin_amount: admin_amount
                        });
                     } else {
                        if (project.categories.length > 4) {
                           Project.find({ 'categories': { $in: project.categories} }, (err, related_projects) => {
                              if (err) throw err;

                              console.log('yeah');

                              var reverse_projects = related_projects.slice(0,14).reverse();

                              res.render('p/details/details', {
                                 project: project,
                                 related_projects: reverse_projects,
                                 projects: reverse_projects, // masonry related projects
                                 page_title: project.project_title,
                                 is_admin_of_project: is_admin_of_project,
                                 comment_amount: comment_amount,
                                 enough_comments: enough_comments,
                                 enough_saves: enough_saves,
                                 saves_amount: saves_amount,
                                 enough_likes: enough_likes,
                                 likes_amount: likes_amount,
                                 user_saved: user_saved,
                                 user_liked: user_liked,
                                 enough_reposts: enough_reposts,
                                 repost_amount: repost_amount,
                                 user_reposted: user_reposted,
                                 admin_amount: admin_amount
                              });
                           });
                        } else {
                           Project.find({}, (err, related_projects) => {
                              if (err) throw err;

                              var reverse_projects = related_projects.slice(0,14).reverse();

                              res.render('p/details/details', {
                                 project: project,
                                 related_projects: reverse_projects,
                                 projects: reverse_projects, // masonry related projects
                                 page_title: project.project_title,
                                 is_admin_of_project: is_admin_of_project,
                                 comment_amount: comment_amount,
                                 enough_comments: enough_comments,
                                 enough_saves: enough_saves,
                                 saves_amount: saves_amount,
                                 enough_likes: enough_likes,
                                 likes_amount: likes_amount,
                                 user_saved: user_saved,
                                 user_liked: user_liked,
                                 enough_reposts: enough_reposts,
                                 repost_amount: repost_amount,
                                 user_reposted: user_reposted,
                                 admin_amount: admin_amount
                              });
                           });
                        }
                     }

                  }).sort({score: { $meta: "textScore" }});
               }
            }
         } else {
            res.redirect('/');
         }
      });
   } else {
      Project.findById(req.params.id, (err, project) => {
         if (err) throw err;

         if (project) {
            res.redirect('/p/details/' + req.params.id + '/guest');
         } else {
            res.redirect('/users/register');
         }
      });
   }
});

// Get Project Detail From Outside Link
router.get('/details/:id/guest', (req, res, next) => {
   if(req.isAuthenticated()) {
      res.redirect('/p/details/' + req.params.id);
   } else {

      Project.findById(req.params.id, (err, project) => {
         if (err) throw err;

         if (project) {

            if (project.is_micro_post) {

               res.redirect('/p/micro/' + req.params.id);

            } else {

               // If the project has any saves
               if (project.saves.length  > 0) {
                  var saves_amount = project.saves.length;
                  var enough_saves = true;
                  var user_saved = false;
               } else {
                  // Project has no saves
                  var user_saved = false;
                  var saves_amount = 0;
                  var enough_saves = false;
               }

               // If the project has any likes
               if (project.likes.length > 0) {
                  var likes_amount = project.likes.length;
                  var enough_likes = true;
                  var user_liked = false;
               } else {
                  // Project has no likes
                  var user_liked = false;
                  var likes_amount = 0;
                  var enough_likes = false;
               }

               // If the project has any comments
               if (project.comments.length > 0) {
                  var comment_amount = project.comments.length
                  var enough_comments = true;
               } else {
                  // Project has no comments
                  var comment_amount = 0;
                  var enough_comments = false;
               }


               // If the project has any reposts
               if (project.reposts.length > 0) {
                  var repost_amount = project.reposts.length;
                  var enough_reposts = true;
                  var user_reposted = false;
               } else {
                  // Project has no reposts
                  var repost_amount = 0;
                  var enough_reposts = false;
               }

               var admin_amount = project.admins.length;

               if (project.categories.length > 0) {
                  Project.find({ 'categories': { $in: project.categories} }, (err, related_projects) => {
                     if (err) throw err;

                     var reverse_projects = related_projects.slice(0,14).reverse();

                     res.render('p/details/details', {
                        project: project,
                        related_projects: reverse_projects,
                        projects: reverse_projects,
                        page_title: project.project_title,
                        is_admin_of_project: false,
                        comment_amount: comment_amount,
                        enough_comments: enough_comments,
                        enough_saves: enough_saves,
                        saves_amount: saves_amount,
                        enough_likes: enough_likes,
                        likes_amount: likes_amount,
                        enough_reposts: enough_reposts,
                        repost_amount: repost_amount,
                        user_saved: false,
                        user_liked: false,
                        admin_amount: admin_amount,
                        user_is_guest: true
                     });
                  });
               } else {
                  Project.find({}, (err, related_projects) => {
                     if (err) throw err;

                     var reverse_projects = related_projects.slice(0,14).reverse();

                     res.render('p/details/details', {
                        project: project,
                        related_projects: reverse_projects,
                        projects: reverse_projects,
                        page_title: project.project_title,
                        is_admin_of_project: false,
                        comment_amount: comment_amount,
                        enough_saves: enough_saves,
                        saves_amount: saves_amount,
                        enough_likes: enough_likes,
                        likes_amount: likes_amount,
                        enough_reposts: enough_reposts,
                        repost_amount: repost_amount,
                        user_saved: false,
                        user_liked: false,
                        admin_amount: admin_amount,
                        user_is_guest: true
                     });
                  });
               }
            }
         } else {
            res.redirect('/');
         }
      });
   }
});


// Get Project Detail
router.get('/micro/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      Project.findById(req.params.id, (err, project) => {
         if (err) throw err;

         if (project) {

            if (project.project_owner == req.user.username || req.user.username === 'hryzn') {
               var is_admin_of_project = true;
            } else {
               var is_admin_of_project = false;
               var not_admin = true;
            }

            if (project.is_private && not_admin) {

               // User came to a private project and is not an owner
               res.redirect('/');

            } else {

               // If the project has any saves
               if (project.saves.length  > 0) {
                  var saves_amount = project.saves.length;
                  var enough_saves = true;
                  // If the person viewing saved the project
                  if (project.saves.indexOf(req.user.username) > -1) {
                     var user_saved = true;
                  }
               } else {
                  // Project has no saves
                  var user_saved = false;
                  var saves_amount = 0;
                  var enough_saves = false;
               }

               // If the project has any likes
               if (project.likes.length > 0) {
                  var likes_amount = project.likes.length;
                  var enough_likes = true;
                  // If the person viewing liked the project
                  if (project.likes.indexOf(req.user.username) > -1) {
                     var user_liked = true;
                  }
               } else {
                  // Project has no likes
                  var user_liked = false;
                  var likes_amount = 0;
                  var enough_likes = false;
               }

               // If the project has any comments
               if (project.comments.length > 0) {
                  var comment_amount = project.comments.length
                  var enough_comments = true;
               } else {
                  // Project has no comments
                  var comment_amount = 0;
                  var enough_comments = false;
               }


               // If the project has any reposts
               if (project.reposts.length > 0) {
                  var repost_amount = project.reposts.length;
                  var enough_reposts = true;
                  // If the person viewing reposted the project
                  if (project.reposts.indexOf(req.user.username) > -1) {
                     var user_reposted = true;
                  }
               } else {
                  // Project has no reposts
                  var repost_amount = 0;
                  var enough_reposts = false;
               }


               var admin_amount = project.admins.length;

               if (typeof project.project_title != 'undefined') {
                  var project_title = project.project_title;
               } else {
                  var project_title = 'Explore';
               }

               Project.find({$text: { $search: project.micro_body }}, {score: { $meta: "textScore" }}, (err, related_projects) => {
                  if (err) throw err;

                  var reverse_projects = related_projects.slice(0,14).reverse();

                  if (related_projects.length > 4) {

                     res.render('p/micro/micro-details', {
                        project: project,
                        related_projects: reverse_projects,
                        projects: reverse_projects, // masonry related projects
                        page_title: project_title,
                        is_admin_of_project: is_admin_of_project,
                        comment_amount: comment_amount,
                        enough_comments: enough_comments,
                        enough_saves: enough_saves,
                        saves_amount: saves_amount,
                        enough_likes: enough_likes,
                        likes_amount: likes_amount,
                        user_saved: user_saved,
                        user_liked: user_liked,
                        enough_reposts: enough_reposts,
                        repost_amount: repost_amount,
                        user_reposted: user_reposted,
                        admin_amount: admin_amount
                     });
                  } else {
                     if (project.categories.length > 4) {
                        Project.find({ 'categories': { $in: project.categories} }, (err, related_projects) => {
                           if (err) throw err;

                           console.log('yeah');

                           var reverse_projects = related_projects.slice(0,14).reverse();

                           res.render('p/micro/micro-details', {
                              project: project,
                              related_projects: reverse_projects,
                              projects: reverse_projects, // masonry related projects
                              page_title: project_title,
                              is_admin_of_project: is_admin_of_project,
                              comment_amount: comment_amount,
                              enough_comments: enough_comments,
                              enough_saves: enough_saves,
                              saves_amount: saves_amount,
                              enough_likes: enough_likes,
                              likes_amount: likes_amount,
                              user_saved: user_saved,
                              user_liked: user_liked,
                              enough_reposts: enough_reposts,
                              repost_amount: repost_amount,
                              user_reposted: user_reposted,
                              admin_amount: admin_amount
                           });
                        });
                     } else {
                        Project.find({}, (err, related_projects) => {
                           if (err) throw err;

                           var reverse_projects = related_projects.slice(0,14).reverse();

                           res.render('p/micro/micro-details', {
                              project: project,
                              related_projects: reverse_projects,
                              projects: reverse_projects, // masonry related projects
                              page_title: project_title,
                              is_admin_of_project: is_admin_of_project,
                              comment_amount: comment_amount,
                              enough_comments: enough_comments,
                              enough_saves: enough_saves,
                              saves_amount: saves_amount,
                              enough_likes: enough_likes,
                              likes_amount: likes_amount,
                              user_saved: user_saved,
                              user_liked: user_liked,
                              enough_reposts: enough_reposts,
                              repost_amount: repost_amount,
                              user_reposted: user_reposted,
                              admin_amount: admin_amount
                           });
                        });
                     }
                  }

               }).sort({score: { $meta: "textScore" }});
            }
         } else {
            res.redirect('/');
         }
      });
   } else {
      Project.findById(req.params.id, (err, project) => {
         if (err) throw err;

         if (project) {
            res.redirect('/p/micro/' + req.params.id + '/guest');
         } else {
            res.redirect('/users/register');
         }
      });
   }
});


// Get Project Detail From Outside Link
router.get('/micro/:id/guest', (req, res, next) => {
   if(req.isAuthenticated()) {
      res.redirect('/p/details/' + req.params.id);
   } else {

      Project.findById(req.params.id, (err, project) => {
         if (err) throw err;

         if (project) {

            // If the project has any saves
            if (project.saves.length  > 0) {
               var saves_amount = project.saves.length;
               var enough_saves = true;
               var user_saved = false;
            } else {
               // Project has no saves
               var user_saved = false;
               var saves_amount = 0;
               var enough_saves = false;
            }

            // If the project has any likes
            if (project.likes.length > 0) {
               var likes_amount = project.likes.length;
               var enough_likes = true;
               var user_liked = false;
            } else {
               // Project has no likes
               var user_liked = false;
               var likes_amount = 0;
               var enough_likes = false;
            }

            // If the project has any comments
            if (project.comments.length > 0) {
               var comment_amount = project.comments.length
               var enough_comments = true;
            } else {
               // Project has no comments
               var comment_amount = 0;
               var enough_comments = false;
            }


            // If the project has any reposts
            if (project.reposts.length > 0) {
               var repost_amount = project.reposts.length;
               var enough_reposts = true;
               var user_reposted = false;
            } else {
               // Project has no reposts
               var repost_amount = 0;
               var enough_reposts = false;
            }

            var admin_amount = project.admins.length;

            if (typeof project.project_title != 'undefined') {
               var project_title = project.project_title;
            } else {
               var project_title = 'Explore';
            }

            console.log(project.project_title);

            if (project.categories.length > 0) {
               Project.find({ 'categories': { $in: project.categories} }, (err, related_projects) => {
                  if (err) throw err;

                  var reverse_projects = related_projects.slice(0,14).reverse();

                  res.render('p/micro/micro-details', {
                     project: project,
                     related_projects: reverse_projects,
                     projects: reverse_projects,
                     page_title: project_title,
                     is_admin_of_project: false,
                     comment_amount: comment_amount,
                     enough_comments: enough_comments,
                     enough_saves: enough_saves,
                     saves_amount: saves_amount,
                     enough_likes: enough_likes,
                     likes_amount: likes_amount,
                     enough_reposts: enough_reposts,
                     repost_amount: repost_amount,
                     user_saved: false,
                     user_liked: false,
                     admin_amount: admin_amount,
                     user_is_guest: true
                  });
               });
            } else {
               Project.find({}, (err, related_projects) => {
                  if (err) throw err;

                  var reverse_projects = related_projects.slice(0,14).reverse();

                  res.render('p/micro/micro-details', {
                     project: project,
                     related_projects: reverse_projects,
                     projects: reverse_projects,
                     page_title: project_title,
                     is_admin_of_project: false,
                     comment_amount: comment_amount,
                     enough_saves: enough_saves,
                     saves_amount: saves_amount,
                     enough_likes: enough_likes,
                     likes_amount: likes_amount,
                     enough_reposts: enough_reposts,
                     repost_amount: repost_amount,
                     user_saved: false,
                     user_liked: false,
                     admin_amount: admin_amount,
                     user_is_guest: true
                  });
               });
            }
         } else {
            res.redirect('/');
         }
      });
   }
});


// Post Project Detail - Save
router.post('/details/save/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      var project_owner = req.body.project_owner;

      info = [];
      info['profileUsername'] = req.user.username;
      info['projectId'] = req.body.project_id;
      info['projectTitle'] = req.body.project_title;
      info['isPrivate'] = req.body.is_private;
      info['projectImage'] = req.body.project_image;

      User.saveToProfile(info, (err, user) => {
         if(err) throw err;
      });

      // Add save to project
      Project.addSaves(info, (err, user) => {
         if(err) throw err;

         // Send notification to the user mentioned
         User.findOne({ 'username': { $in: project_owner} }, (err, reciever) => {
            if (err) throw err;

            var newNotification = new Notification({
               sender: req.user._id,
               reciever: reciever._id,
               type: '@' + req.user.username + ' saved your post.',
               link: '/p/details/' + req.params.id
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

         req.flash('success_msg', "Project Saved");
         res.redirect('/p/details/' + req.body.project_id);
      });
   } else {
      res.redirect('/users/register');
   }
});

// Post Project Detail - Unsave
router.post('/details/unsave/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      info = [];
      info['profileUsername'] = req.user.username;
      info['projectId'] = req.body.project_id;

      User.unsaveToProfile(info, (err, user) => {
         if(err) throw err;
      });

      // Remove save from project
      Project.removeSaves(info, (err, user) => {
         if(err) throw err;
         req.flash('success_msg', "Project Unsaved");
         res.redirect('/p/details/' + req.body.project_id);
      });
   } else {
      res.redirect('/users/register');
   }
});


// Micropost - Save
router.post('/details/micro/save/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      var project_owner = req.body.project_owner;
      var og_path = req.body.og_path;

      Project.findOne({ '_id': { $in: req.params.id} }, (err, project) => {

         if (project.saves.length) {
            project.saves.forEach(function(save, key) {

               if (save === req.user.username) {
                  info = [];
                  info['profileUsername'] = req.user.username;
                  info['projectId'] = req.params.id;

                  User.unsaveToProfile(info, (err, user) => {
                     if(err) throw err;
                  });

                  // Remove save from project
                  Project.removeSaves(info, (err, user) => {
                     if(err) throw err;
                     req.flash('success_msg', "Project Unsaved");
                     res.redirect('/p/micro/' + req.params.id);
                  });
               } else {
                  info = [];
                  info['profileUsername'] = req.user.username;
                  info['projectId'] = req.body.project_id;
                  info['projectTitle'] = req.body.project_title;
                  info['isPrivate'] = req.body.is_private;
                  info['projectImage'] = req.body.project_image;

                  User.saveToProfile(info, (err, user) => {
                     if(err) throw err;
                  });

                  // Add save to project
                  Project.addSaves(info, (err, user) => {
                     if(err) throw err;

                     // Send notification to the user mentioned
                     User.findOne({ 'username': { $in: project_owner} }, (err, reciever) => {
                        if (err) throw err;

                        var newNotification = new Notification({
                           sender: req.user._id,
                           reciever: reciever._id,
                           type: '@' + req.user.username + ' saved your post.',
                           link: '/p/micro/' + req.params.id
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

                     req.flash('success_msg', "Project Saved");
                     res.redirect('/p/micro/' + req.params.id);
                  });
               }

            });
         } else {
            info = [];
            info['profileUsername'] = req.user.username;
            info['projectId'] = req.body.project_id;
            info['projectTitle'] = req.body.project_title;
            info['isPrivate'] = req.body.is_private;
            info['projectImage'] = req.body.project_image;

            User.saveToProfile(info, (err, user) => {
               if(err) throw err;
            });

            // Add save to project
            Project.addSaves(info, (err, user) => {
               if(err) throw err;

               // Send notification to the user mentioned
               User.findOne({ 'username': { $in: project_owner} }, (err, reciever) => {
                  if (err) throw err;

                  var newNotification = new Notification({
                     sender: req.user._id,
                     reciever: reciever._id,
                     type: '@' + req.user.username + ' saved your post.',
                     link: '/p/micro/' + req.params.id
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

               req.flash('success_msg', "Project Saved");
               res.redirect('/p/micro/' + req.params.id);
            });
         }

      });

   } else {
      res.redirect('/users/register');
   }
});


// Post Project Detail - Repost
router.post('/details/repost/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      var project_owner = req.body.project_owner;
      var posted_to_group;
      var groupName;
      var groupId;

      if (req.body.repost_to != '') {
         if (req.body.repost_to != 'Followers') {
            Group.findOne({ '_id': { $in: req.body.repost_to } }, (err, group) => {
               if (group) {
                  groupId = group._id;
                  groupName = group.group_name;
                  posted_to_group = true;
               } else {
                  posted_to_group = false;
               }
            });
         } else {
            posted_to_group = false;
         }
      } else {
         posted_to_group = false;
      }

      info = [];
      info['profileUsername'] = req.user.username;
      info['projectId'] = req.body.project_id;
      info['projectTitle'] = req.body.project_title;
      info['isPrivate'] = req.body.is_private;
      info['projectImage'] = req.body.project_image;

      User.findOne({ 'username': { $in: req.user.username} }, (err, user) => {

         if (user.reposted_projects.length) {
            if (user.reposted_projects.indexOf(req.body.project_id) === -1) {
               User.repostProject(info, (err, user) => {
                  if(err) throw err;
               });
            }
         } else {
            User.repostProject(info, (err, user) => {
               if(err) throw err;
            });
         }

      });


      // Add repost to project
      Project.addReposts(info, (err, user) => {
         if(err) throw err;

         if(posted_to_group) {
            var notif = '@' + req.user.username + ' reposted your post to the group ' + groupName;
            var link = '/groups/' + groupId;
         } else {
            var notif = '@' + req.user.username + ' reposted your post.';
            var link = '/p/details/' + req.params.id;
         }

         // Send notification to the user mentioned
         User.findOne({ 'username': { $in: project_owner} }, (err, reciever) => {
            if (err) throw err;

            var newNotification = new Notification({
               sender: req.user._id,
               reciever: reciever._id,
               type: notif,
               link: link
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

         if (posted_to_group) {
            Group.findOne({ '_id': { $in: req.body.repost_to } }, (err, group) => {

               info['groupId'] = group._id;
               info['groupName'] = group.group_name;
               info['groupIsPrivate'] = group.is_private;

               Group.addProject(info, (err, group) => {
                  if(err) throw err;
               });


               // Send notification to the user mentioned
               group.users.forEach(function(user, key) {
                  User.findOne({ 'username': { $in: user} }, (err, reciever) => {
                     if (err) throw err;

                     var newNotification = new Notification({
                        sender: req.user._id,
                        reciever: reciever._id,
                        type: '@' + req.user.username + ' added a repost in the group ' + group.group_name,
                        link: '/groups/' + group._id
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
               });

               req.flash('success_msg', "Reposted Project");
               res.redirect('/groups/' + group._id);

            });

         } else {
            req.flash('success_msg', "Reposted Project");
            res.redirect('/p/details/' + req.body.project_id);
         }

      });
   } else {
      res.redirect('/users/register');
   }
});

// Post Project Detail - Unrepost
router.post('/details/unrepost/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      info = [];
      info['profileUsername'] = req.user.username;
      info['projectId'] = req.body.project_id;

      User.unrepostProject(info, (err, user) => {
         if(err) throw err;
      });

      // Remove repost from project
      Project.removeReposts(info, (err, user) => {
         if(err) throw err;
         req.flash('success_msg', "Unreposted Project");
         res.redirect('/p/details/' + req.body.project_id);
      });
   } else {
      res.redirect('/users/register');
   }
});


// Micropost - Unrepost
router.post('/details/micro/unrepost/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      info = [];
      info['profileUsername'] = req.user.username;
      info['projectId'] = req.body.project_id;
      var og_path = req.body.og_path;

      if (og_path != '') {
         var location_path = og_path;
      } else {
         var location_path = '/p/details/' + req.body.project_id;
      }

      User.unrepostProject(info, (err, user) => {
         if(err) throw err;
      });

      // Remove repost from project
      Project.removeReposts(info, (err, user) => {
         if(err) throw err;
         req.flash('success_msg', "Unreposted Project");
         res.redirect('/p/micro/' + req.params.id);
      });
   } else {
      res.redirect('/users/register');
   }
});


// Micropost - Repost
router.post('/details/micro/repost/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      var project_owner = req.body.project_owner;
      var posted_to_group;
      var groupName;
      var groupId;
      var og_path = req.body.og_path;

      if (req.body.repost_to != '') {
         if (req.body.repost_to != 'Followers') {
            Group.findOne({ '_id': { $in: req.body.repost_to } }, (err, group) => {
               if (group) {
                  groupId = group._id;
                  groupName = group.group_name;
                  posted_to_group = true;
               } else {
                  posted_to_group = false;
               }
            });
         } else {
            posted_to_group = false;
         }
      } else {
         posted_to_group = false;
      }

      info = [];
      info['profileUsername'] = req.user.username;
      info['projectId'] = req.body.project_id;
      info['projectTitle'] = req.body.project_title;
      info['isPrivate'] = req.body.is_private;
      info['projectImage'] = req.body.project_image;

      User.findOne({ 'username': { $in: req.user.username} }, (err, user) => {

         if (user.reposted_projects.length) {
            if (user.reposted_projects.indexOf(req.body.project_id) === -1) {
               User.repostProject(info, (err, user) => {
                  if(err) throw err;
               });
            }
         } else {
            User.repostProject(info, (err, user) => {
               if(err) throw err;
            });
         }

      });

      // Add repost to project
      Project.addReposts(info, (err, user) => {
         if(err) throw err;

         if(posted_to_group) {
            var notif = '@' + req.user.username + ' reposted your post to the group ' + groupName;
            var link = '/groups/' + groupId;
         } else {
            var notif = '@' + req.user.username + ' reposted your post.';
            var link = '/p/micro/' + req.params.id;
         }

         // Send notification to the user mentioned
         User.findOne({ 'username': { $in: project_owner} }, (err, reciever) => {
            if (err) throw err;

            var newNotification = new Notification({
               sender: req.user._id,
               reciever: reciever._id,
               type: notif,
               link: link
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

         if (posted_to_group) {
            Group.findOne({ '_id': { $in: req.body.repost_to } }, (err, group) => {

               info['groupId'] = group._id;
               info['groupName'] = group.group_name;
               info['groupIsPrivate'] = group.is_private;

               Group.addProject(info, (err, group) => {
                  if(err) throw err;
               });


               // Send notification to the user mentioned
               group.users.forEach(function(user, key) {
                  User.findOne({ 'username': { $in: user} }, (err, reciever) => {
                     if (err) throw err;

                     var newNotification = new Notification({
                        sender: req.user._id,
                        reciever: reciever._id,
                        type: '@' + req.user.username + ' added a repost in the group ' + group.group_name,
                        link: '/p/micro/' + req.params.id
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
               });

               req.flash('success_msg', "Reposted Project");
               res.redirect('/p/micro/' + req.params.id);

            });

         } else {
            req.flash('success_msg', "Reposted Project");
            res.redirect('/p/micro/' + req.params.id);
         }

      });
   } else {
      res.redirect('/users/register');
   }
});


// Post Project Detail - Like
router.post('/details/like/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      var project_owner = req.body.project_owner;

      info = [];
      info['profileUsername'] = req.user.username;
      info['projectId'] = req.body.project_id;
      info['projectTitle'] = req.body.project_title;
      info['isPrivate'] = req.body.is_private;
      info['projectImage'] = req.body.project_image;

      // Add like to project
      Project.addLikes(info, (err, user) => {
         if(err) throw err;

         // Send notification to the user mentioned
         User.findOne({ 'username': { $in: project_owner} }, (err, reciever) => {
            if (err) throw err;

            var newNotification = new Notification({
               sender: req.user._id,
               reciever: reciever._id,
               type: '@' + req.user.username + ' liked your post.',
               link: '/p/details/' + req.params.id
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

         req.flash('success_msg', "Project Liked");
         res.redirect('/p/details/' + req.body.project_id);
      });
   } else {
      res.redirect('/users/register');
   }
});

// Post Project Detail - Unlike
router.post('/details/unlike/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      info = [];
      info['profileUsername'] = req.user.username;
      info['projectId'] = req.body.project_id;

      // Remove like from project
      Project.removeLikes(info, (err, user) => {
         if(err) throw err;
         req.flash('success_msg', "Project Unliked");
         res.redirect('/p/details/' + req.body.project_id);
      });
   } else {
      res.redirect('/users/register');
   }
});


// Micropost - Like
router.post('/details/micro/like/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      var project_owner = req.body.project_owner;
      var og_path = req.body.og_path;

      Project.findOne({ '_id': { $in: req.params.id} }, (err, project) => {

         if (project.likes.length) {

            project.likes.forEach(function(user, key) {

               if (user === req.user.username) {
                  info = [];
                  info['profileUsername'] = req.user.username;
                  info['projectId'] = req.params.id;

                  // Remove like from project
                  Project.removeLikes(info, (err, user) => {
                     if(err) throw err;
                     req.flash('success_msg', "Project Unliked");
                     res.redirect('/p/micro/' + req.params.id);
                  });
               } else {
                  info = [];
                  info['profileUsername'] = req.user.username;
                  info['projectId'] = req.body.project_id;
                  info['projectTitle'] = req.body.project_title;
                  info['isPrivate'] = req.body.is_private;
                  info['projectImage'] = req.body.project_image;

                  // Add like to project
                  Project.addLikes(info, (err, user) => {
                     if(err) throw err;

                     // Send notification to the user mentioned
                     User.findOne({ 'username': { $in: project_owner} }, (err, reciever) => {
                        if (err) throw err;

                        var newNotification = new Notification({
                           sender: req.user._id,
                           reciever: reciever._id,
                           type: '@' + req.user.username + ' liked your post.',
                           link: '/p/micro/' + req.params.id
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

                     req.flash('success_msg', "Project Liked");
                     res.redirect('/p/micro/' + req.params.id);
                  });
               }

            });
         } else {
            info = [];
            info['profileUsername'] = req.user.username;
            info['projectId'] = req.body.project_id;
            info['projectTitle'] = req.body.project_title;
            info['isPrivate'] = req.body.is_private;
            info['projectImage'] = req.body.project_image;

            // Add like to project
            Project.addLikes(info, (err, user) => {
               if(err) throw err;

               // Send notification to the user mentioned
               User.findOne({ 'username': { $in: project_owner} }, (err, reciever) => {
                  if (err) throw err;

                  var newNotification = new Notification({
                     sender: req.user._id,
                     reciever: reciever._id,
                     type: '@' + req.user.username + ' liked your post.',
                     link: '/p/micro/' + req.params.id
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

               req.flash('success_msg', "Project Liked");
               res.redirect('/p/micro/' + req.params.id);
            });
         }

      });
   } else {
      res.redirect('/users/register');
   }
});


// Post Project Detail - Comment
router.post('/details/comment/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      var project_owner = req.body.project_owner;


      if (req.body.og_path != '') {
         var path = req.body.og_path;
         var notifPath = '/p/micro/' + req.params.id;
      } else {
         var path = '/p/details/' + req.params.id
         var notifPath = '/p/details/' + req.params.id
      }


      info = [];
      info['profileUsername'] = req.user.username;
      info['projectId'] = req.body.project_id;
      if (req.body.profileimage) {
         info['profileimage'] = req.body.profileimage;
      } else {
         info['profileimage'] = 'hryzn-placeholder-01.jpg';
      }

      var req_comment = req.body.comment.replace(/\r\n/g,'');

      // Check for mentions or hashtags
      var comment_array = req_comment.split(" ");
      var comment_notes = '';
      comment_array.forEach(function(word, key) {
         if (word[0] == '@') {

            if (word.indexOf("<") > -1) {
               if (word.indexOf("&nbsp") > -1) {
                  var pos = word.indexOf("&nbsp");
               }  else {
                  var pos = word.indexOf("<");
               }
            } else {
               if (word.indexOf("&nbsp") > -1) {
                  var pos = word.indexOf("&nbsp");
               }  else {
                  var pos = word.length;
               }
            }
            var slice = word.slice(1, pos);
            slice = slice.replace(/<\/?[^>]+(>|$)/g, "");
            var clean_word = word.slice(0, pos);
            comment_notes += '<a class="mention_tag" href="/profile/' + slice + '">' + clean_word + '</a> ' + word.slice(pos, word.length) + ' ';

            // Send notification to the user mentioned
            User.findOne({ 'username': { $in: slice} }, (err, reciever) => {
               if (err) throw err;

               var newNotification = new Notification({
                  sender: req.user._id,
                  reciever: reciever._id,
                  type: '@' + req.user.username + ' mentioned you in a comment.',
                  link: notifPath
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

         } else {
            comment_notes += word + ' ';
         }
      });

      info['comment'] = comment_notes;

      // Add save to project
      Project.addComment(info, (err, user) => {
         if(err) throw err;

         // Send notification to the user mentioned
         User.findOne({ 'username': { $in: project_owner} }, (err, reciever) => {
            if (err) throw err;

            var newNotification = new Notification({
               sender: req.user._id,
               reciever: reciever._id,
               type: '@' + req.user.username + ' commented on your post.',
               link: notifPath
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

         req.flash('success_msg', "Added Comment");
         res.redirect(path);
      });
   } else {
      res.redirect('/users/register');
   }
});


// Post Project Detail - Uncomment
router.post('/details/uncomment/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      if (req.body.og_path != '') {
         var path = req.body.og_path;
      } else {
         var path = '/p/details/' + req.params.id
      }

      info = [];
      info['profileUsername'] = req.user.username;
      info['projectId'] = req.params.id;
      info['commentId'] = req.body.comment_id;

      // Add save to project
      Project.removeComment(info, (err, user) => {
         if(err) throw err;
         req.flash('success_msg', "Removed Comment");
         res.redirect(path);
      });
   } else {
      res.redirect('/users/register');
   }
});


// Delete project
router.get('/details/delete/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      // Find project to delete
      Project.findById(req.params.id, (err, project) => {
         if(err) throw err;

         if(project.project_owner === req.user.username || req.user.username === 'hryzn') {

            // Only delete if admin

            info = [];

            // If project has saves
            if(project.saves.length) {

               for (var i = 0, len = project.saves.length; i < len; i++) {
                  info['profileUsername'] = project.saves[i];
                  info['projectId'] = req.params.id;

                  User.unsaveToProfile(info, (err, user) => {
                     if(err) throw err;
                  });
               }

            }

            // If project has admins
            if(project.project_owner.length) {
               info['profileUsername'] = project.project_owner;
               info['projectId'] = req.params.id;

               User.deleteFromProfile(info, (err, user) => {
                  if(err) throw err;
               });
            }

            // If project has reposts
            if(project.reposts.length > 0) {
               for (var i = 0, len = project.reposts.length; i < len; i++) {
                  info['profileUsername'] = project.reposts[i];
                  info['projectId'] = req.params.id;

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
            Project.findByIdAndRemove(req.params.id, (err) => {
              if (err) throw err;
              req.flash('success_msg', "Destroyed From Existence...");
              res.redirect('/profile/' + req.user.username);
            });

         } else {

            // Send them to the homepage
            res.location('/');
            res.redirect('/');

         }

      });
   } else {
      res.redirect('/users/register');
   }
});

router.post('/upload', upload.single('editor_image'), (req, res, next) => {
   if(req.isAuthenticated()) {
      // var fileExt = req.file.originalname.split('.').pop();
      res.status(200).send({"file": "https://s3.amazonaws.com/hryzn-app-static-assets/" + dateNow + req.file.originalname, "success":true});
   } else {
      res.redirect('/users/register');
   }
});

// POST Create Micropost
router.post('/create-micro/micro', upload.fields([{name: 'micro_image', maxCount: 1}, {name: 'micro_thumbnail_image__audio', maxCount: 1}, {name: 'micro_thumbnail_image__video', maxCount: 1}, {name: 'micro_audio', maxCount: 1}, {name: 'micro_video', maxCount: 1}]), verifyToken, (req, res, next) => {

   if(req.isAuthenticated()) {

      jwt.verify(req.token, 'SuperSecretKey', (err, authData) => {
         if (err) {
            res.sendStatus(403);
         } else if (req.body.orange_blossom != '') {
            res.sendStatus(403);
         } else {

            var admin = req.body.admin; // Owner of project
            var id = req.body.id;
            var user = req.body.user;

            if (typeof req.body.micro_title_image != 'undefined') {

               var micro_title = req.body.micro_title_image.replace(/\r\n/g,'');

            } else if (typeof req.body.micro_title_audio != 'undefined') {

               var micro_title = req.body.micro_title_audio.replace(/\r\n/g,'');

            } else if (typeof req.body.micro_title_video != 'undefined') {

               var micro_title = req.body.micro_title_video.replace(/\r\n/g,'');

            } else {
               var micro_title;
            }


            var req_micro_body = req.body.micro_body.replace(/\r\n/g,'');

            if (req.body.project_categories) {
               if (req.body.project_categories.length > 0) {
                  var project_categories = req.body.project_categories;
               } else {
                  var project_categories = [];
               }
            } else {
               var project_categories = [];
            }
            var project_url = req.body.project_url;
            var posted_to_group;
            if (req.body.post_to != '') {
               if (req.body.post_to != 'Followers') {
                  Group.findOne({ '_id': { $in: req.body.post_to } }, (err, group) => {
                     if (group) {
                        posted_to_group = true;
                     } else {
                        posted_to_group = false;
                     }
                  });
               } else {
                  posted_to_group = false;
               }
            } else {
               posted_to_group = false;
            }

            var og_path = req.body.og_path;

            if (og_path != '') {
               var location_path = og_path;
            } else {
               var location_path = '/profile/' + req.user.username;
            }

            // See if project_url has https://
            var has_https = project_url.search("https://");
            if(has_https > -1) {

               var url_without_https = project_url.split("https://")[1];
               project_url = url_without_https;

            }

            // Check for mentions or hashtags
            var micro_array = req_micro_body.split(" ");
            var micro_body  = '';
            micro_array.forEach(function(word, key) {
               if (word[0] == '@') {

                  // Slice the '@' and name from mention
                  if (word.indexOf("<") > -1) {
                     if (word.indexOf("&nbsp") > -1) {
                        var pos = word.indexOf("&nbsp");
                     }  else {
                        var pos = word.indexOf("<");
                     }
                  } else {
                     if (word.indexOf("&nbsp") > -1) {
                        var pos = word.indexOf("&nbsp");
                     }  else {
                        var pos = word.length;
                     }
                  }
                  var slice = word.slice(1, pos);
                  slice = slice.replace(/<\/?[^>]+(>|$)/g, "");
                  var clean_word = word.slice(0, pos);
                  micro_body += '<a class="mention_tag" href="/profile/' + slice + '">' + clean_word + '</a> ' + word.slice(pos, word.length) + ' ';

                  // Send notification to the user mentioned
                  User.findOne({ 'username': { $in: slice} }, (err, reciever) => {
                     if (err) throw err;

                     var newNotification = new Notification({
                        sender: req.user._id,
                        reciever: reciever._id,
                        type: '@' + req.user.username + ' mentioned you in their new post.',
                        link: '/profile/' + req.user.username
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

               } else if (word[0] == '#') {

                  // Slice the '#' and word from hashtag
                  if (word.indexOf("<") > -1) {
                     var pos = word.indexOf("<");
                  } else {
                     var pos = word.length;
                  }
                  var slice = word.slice(1, pos);
                  slice = slice.replace(/<\/?[^>]+(>|$)/g, "");
                  var clean_word = word.slice(0, pos);
                  if (project_categories.indexOf(slice) === -1) {
                     project_categories.push(slice);
                  }
                  micro_body += '<a class="mention_tag" href="/explore/' + slice + '">' + clean_word + '</a> ' + word.slice(pos, word.length) + ' ';

               } else {
                  micro_body += word + ' ';
               }
            });

            if (req.body.is_micro_text == 'true') {

               var newProject = new Project({
                  categories: project_categories,
                  project_owner: req.user.username,
                  micro_body: micro_body,
                  project_url: project_url,
                  is_micro_post: true
               });

               // Create project in database
               Project.saveProject(newProject, (err, project) => {
                  if(err) throw err;

                  // Add project to User document
                  info = [];
                  info['profileUsername'] = req.user.username;
                  info['projectId'] = project._id.toString();

                  User.createToProfile(info, (err, user) => {
                     if(err) throw err;
                  });

                  if (posted_to_group) {
                     Group.findOne({ '_id': { $in: req.body.post_to } }, (err, group) => {

                        info['groupId'] = group._id;
                        info['groupName'] = group.group_name;
                        info['groupIsPrivate'] = group.is_private;

                        console.log(info['projectId']);

                        Group.addProject(info, (err, group) => {
                           if(err) throw err;
                        });

                        Project.addGroup(info, (err, project) => {
                           if(err) throw err;
                        });

                        // Send notification to the user mentioned
                        group.users.forEach(function(user, key) {
                           User.findOne({ 'username': { $in: user} }, (err, reciever) => {
                              if (err) throw err;

                              var newNotification = new Notification({
                                 sender: req.user._id,
                                 reciever: reciever._id,
                                 type: '@' + req.user.username + ' added a post in the group ' + group.group_name,
                                 link: '/groups/' + group._id
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
                        });

                        req.flash('success_msg', "Micropost was created.");
                        res.redirect('/groups/' + group._id);

                     });

                  } else {
                     req.flash('success_msg', "Micropost was created.");
                     res.redirect(location_path);
                  }
               });

            } else if (req.body.is_micro_image == 'true') {
               if(req.files.micro_image) {

                  // If user uploaded an image for project
                  var ext = path.extname(req.files.micro_image[0].originalname);

                  // Check if file is an image
                  if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {

                     User.findById(id, (err, user) => {
                        if(err) throw err;

                        User.find({ 'username': { $in: user.following} }, (err, profiles) => {
                           if (err) throw err;
                           res.render('p/create-project', {
                              error_msg: 'Image File Must End With .jpg .jpeg .png .gif',
                              page_title: 'Create Project',
                              notes_is_empty_string: true,
                              editProject: true,
                              project_error: true,
                              mention: profiles,
                              user: user
                           });
                        });
                     });

                  } else {
                     // No errors have been made
                     // var fileExt = req.file.originalname.split('.').pop();
                     var micro_image = dateNow + req.files.micro_image[0].originalname;

                     var newProject = new Project({
                        micro_image: micro_image,
                        categories: project_categories,
                        project_owner: req.user.username,
                        project_title: micro_title,
                        micro_body: micro_body,
                        project_url: project_url,
                        is_micro_post: true
                     });

                     // Create project in database
                     Project.saveProject(newProject, (err, project) => {
                        if(err) throw err;

                        // Add project to User document
                        info = [];
                        info['profileUsername'] = req.user.username;
                        info['projectId'] = project._id.toString();

                        User.createToProfile(info, (err, user) => {
                           if(err) throw err;
                        });

                        if (posted_to_group) {
                           Group.findOne({ '_id': { $in: req.body.post_to } }, (err, group) => {

                              info['groupId'] = group._id;
                              info['groupName'] = group.group_name;
                              info['groupIsPrivate'] = group.is_private;

                              Group.addProject(info, (err, group) => {
                                 if(err) throw err;
                              });

                              Project.addGroup(info, (err, project) => {
                                 if(err) throw err;
                              });

                              // Send notification to the user mentioned
                              group.users.forEach(function(user, key) {
                                 User.findOne({ 'username': { $in: user} }, (err, reciever) => {
                                    if (err) throw err;

                                    var newNotification = new Notification({
                                       sender: req.user._id,
                                       reciever: reciever._id,
                                       type: '@' + req.user.username + ' added a post in the group ' + group.group_name,
                                       link: '/groups/' + group._id
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
                              });

                              req.flash('success_msg', "Micropost was created.");
                              res.redirect('/groups/' + group._id);

                           });

                        } else {
                           req.flash('success_msg', "Micropost was created.");
                           res.redirect(location_path);
                        }
                     });

                  }
               } else {

                  User.findById(id, (err, user) => {
                     if(err) throw err;

                     User.find({ 'username': { $in: user.following} }, (err, profiles) => {
                        if (err) throw err;
                        res.render('p/create-project', {
                           error_msg: 'Please Upload An Image',
                           page_title: 'Create Project',
                           notes_is_empty_string: true,
                           editProject: true,
                           project_error: true,
                           mention: profiles,
                           user: user
                        });
                     });
                  });

               }
            } else if (req.body.is_micro_audio == 'true') {

               if(req.files.micro_audio && req.files.micro_thumbnail_image__audio) {

                  // If user uploaded an image for project
                  var ext = path.extname(req.files.micro_audio[0].originalname);

                  // Check if file is audio
                  if(ext !== '.mpeg' && ext !== '.MPEG' && ext !== '.wav' && ext !== '.WAV' && ext !== '.wave' && ext !== '.WAVE' && ext !== '.mp3' && ext !== '.MP3' && ext !== '.ogg' && ext !== '.OGG') {

                     User.findById(id, (err, user) => {
                        if(err) throw err;

                        User.find({ 'username': { $in: user.following} }, (err, profiles) => {
                           if (err) throw err;
                           res.render('p/create-project', {
                              error_msg: 'Audio File Must End With .mpeg .wav .wave .mp3 .ogg',
                              page_title: 'Create Project',
                              notes_is_empty_string: true,
                              editProject: true,
                              project_error: true,
                              mention: profiles,
                              user: user
                           });
                        });
                     });


                  } else {

                     // If user uploaded an image for project
                     var ext = path.extname(req.files.micro_thumbnail_image__audio[0].originalname);

                     // Check if file is an image
                     if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {

                        User.findById(id, (err, user) => {
                           if(err) throw err;

                           User.find({ 'username': { $in: user.following} }, (err, profiles) => {
                              if (err) throw err;
                              res.render('p/create-project', {
                                 error_msg: 'Thumbnail Image File Must End With .jpg .jpeg .png .gif',
                                 page_title: 'Create Project',
                                 notes_is_empty_string: true,
                                 editProject: true,
                                 project_error: true,
                                 mention: profiles,
                                 user: user
                              });
                           });
                        });

                     } else {

                        // No errors have been made
                        // var fileExt = req.file.originalname.split('.').pop();
                        var micro_audio = dateNow + req.files.micro_audio[0].originalname;
                        var thumbnail_image = dateNow + req.files.micro_thumbnail_image__audio[0].originalname;

                        var newProject = new Project({
                           micro_audio: micro_audio,
                           thumbnail_image: thumbnail_image,
                           categories: project_categories,
                           project_owner: req.user.username,
                           project_title: micro_title,
                           micro_body: micro_body,
                           project_url: project_url,
                           is_micro_post: true
                        });

                        // Create project in database
                        Project.saveProject(newProject, (err, project) => {
                           if(err) throw err;

                           // Add project to User document
                           info = [];
                           info['profileUsername'] = req.user.username;
                           info['projectId'] = project._id.toString();

                           User.createToProfile(info, (err, user) => {
                              if(err) throw err;
                           });

                           if (posted_to_group) {
                              Group.findOne({ '_id': { $in: req.body.post_to } }, (err, group) => {

                                 info['groupId'] = group._id;
                                 info['groupName'] = group.group_name;
                                 info['groupIsPrivate'] = group.is_private;

                                 Group.addProject(info, (err, group) => {
                                    if(err) throw err;
                                 });

                                 Project.addGroup(info, (err, project) => {
                                    if(err) throw err;
                                 });

                                 // Send notification to the user mentioned
                                 group.users.forEach(function(user, key) {
                                    User.findOne({ 'username': { $in: user} }, (err, reciever) => {
                                       if (err) throw err;

                                       var newNotification = new Notification({
                                          sender: req.user._id,
                                          reciever: reciever._id,
                                          type: '@' + req.user.username + ' added a post in the group ' + group.group_name,
                                          link: '/groups/' + group._id
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
                                 });

                                 req.flash('success_msg', "Micropost was created.");
                                 res.redirect('/groups/' + group._id);

                              });

                           } else {
                              req.flash('success_msg', "Micropost was created.");
                              res.redirect(location_path);
                           }
                        });

                     }

                  }
               } else {

                  User.findById(id, (err, user) => {
                     if(err) throw err;

                     User.find({ 'username': { $in: user.following} }, (err, profiles) => {
                        if (err) throw err;
                        res.render('p/create-project', {
                           error_msg: 'Please Upload An Audio File and Thumbnail Image',
                           page_title: 'Create Project',
                           notes_is_empty_string: true,
                           editProject: true,
                           project_error: true,
                           mention: profiles,
                           user: user
                        });
                     });
                  });

               }

            } else if (req.body.is_micro_video == 'true') {

               if(req.files.micro_video && req.files.micro_thumbnail_image__video) {

                  // If user uploaded an image for project
                  var ext = path.extname(req.files.micro_video[0].originalname);

                  // Check if file is audio
                  if(ext !== '.mp4' && ext !== '.MP4' && ext !== '.webm' && ext !== '.WEBM' && ext !== '.ogg' && ext !== '.OGG') {

                     User.findById(id, (err, user) => {
                        if(err) throw err;

                        User.find({ 'username': { $in: user.following} }, (err, profiles) => {
                           if (err) throw err;
                           res.render('p/create-project', {
                              error_msg: 'Video File Must End With .webm .mp4 .ogg',
                              page_title: 'Create Project',
                              notes_is_empty_string: true,
                              editProject: true,
                              project_error: true,
                              mention: profiles,
                              user: user
                           });
                        });
                     });


                  } else {

                     // If user uploaded an image for project
                     var ext = path.extname(req.files.micro_thumbnail_image__video[0].originalname);

                     // Check if file is an image
                     if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {

                        User.findById(id, (err, user) => {
                           if(err) throw err;

                           User.find({ 'username': { $in: user.following} }, (err, profiles) => {
                              if (err) throw err;
                              res.render('p/create-project', {
                                 error_msg: 'Thumbnail Image File Must End With .jpg .jpeg .png .gif',
                                 page_title: 'Create Project',
                                 notes_is_empty_string: true,
                                 editProject: true,
                                 project_error: true,
                                 mention: profiles,
                                 user: user
                              });
                           });
                        });

                     } else {

                        // No errors have been made
                        // var fileExt = req.file.originalname.split('.').pop();
                        var micro_video = dateNow + req.files.micro_video[0].originalname;
                        var thumbnail_image = dateNow + req.files.micro_thumbnail_image__video[0].originalname;

                        var newProject = new Project({
                           micro_video: micro_video,
                           thumbnail_image: thumbnail_image,
                           categories: project_categories,
                           project_owner: req.user.username,
                           project_title: micro_title,
                           micro_body: micro_body,
                           project_url: project_url,
                           is_micro_post: true
                        });

                        // Create project in database
                        Project.saveProject(newProject, (err, project) => {
                           if(err) throw err;

                           // Add project to User document
                           info = [];
                           info['profileUsername'] = req.user.username;
                           info['projectId'] = project._id.toString();

                           User.createToProfile(info, (err, user) => {
                              if(err) throw err;
                           });

                           if (posted_to_group) {
                              Group.findOne({ '_id': { $in: req.body.post_to } }, (err, group) => {

                                 info['groupId'] = group._id;
                                 info['groupName'] = group.group_name;
                                 info['groupIsPrivate'] = group.is_private;

                                 Group.addProject(info, (err, group) => {
                                    if(err) throw err;
                                 });

                                 Project.addGroup(info, (err, project) => {
                                    if(err) throw err;
                                 });

                                 // Send notification to the user mentioned
                                 group.users.forEach(function(user, key) {
                                    User.findOne({ 'username': { $in: user} }, (err, reciever) => {
                                       if (err) throw err;

                                       var newNotification = new Notification({
                                          sender: req.user._id,
                                          reciever: reciever._id,
                                          type: '@' + req.user.username + ' added a post in the group ' + group.group_name,
                                          link: '/groups/' + group._id
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
                                 });

                                 req.flash('success_msg', "Micropost was created.");
                                 res.redirect('/groups/' + group._id);

                              });

                           } else {
                              req.flash('success_msg', "Micropost was created.");
                              res.redirect(location_path);
                           }
                        });

                     }

                  }
               } else {

                  User.findById(id, (err, user) => {
                     if(err) throw err;

                     User.find({ 'username': { $in: user.following} }, (err, profiles) => {
                        if (err) throw err;
                        res.render('p/create-project', {
                           error_msg: 'Please Upload An Video File and Thumbnail Image',
                           page_title: 'Create Project',
                           notes_is_empty_string: true,
                           editProject: true,
                           project_error: true,
                           mention: profiles,
                           user: user
                        });
                     });
                  });

               }

            }

         }
      });

   } else {
      res.redirect('/users/register');
   }
});


// Get Edit Project
router.get('/micro/edit/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      Project.findById(req.params.id, (err, project) => {
         if(err) throw err;

         if(project.project_owner == req.user.username || req.user.username === 'hryzn') {

            var is_admin_of_project = true;

            res.render('p/micro/edit-micro', {
               project: project,
               hide_scripts: true,
               page_title: project.project_title,
               is_admin_of_project: is_admin_of_project
            });

         } else {

            var is_admin_of_project = false;
            res.redirect('/');

         }
      });
   } else {
      res.redirect('/users/register');
   }
});


// Verify JS Web Token
function verifyToken(req, res, next) {

   var bearerReq = req.body._c_;

   if (typeof bearerReq !== 'undefined') {

      var bearerToken = bearerReq.split(' ')[1];
      req.token = bearerToken;

   } else {
      res.sendStatus(403);
   }

   next()
}

module.exports = router;
