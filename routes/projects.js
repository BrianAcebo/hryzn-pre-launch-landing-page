const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const keys = require('../config/keys');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const dateNow = Date.now().toString();

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
      cb(null, dateNow + '-' + file.originalname);
   }
}
const upload = multer({
   storage: multerS3(storage)
});
const multipleUpload = multer({
   storage: multerS3(storage)
});

const User = require('../models/users');
const Project = require('../models/projects');

// GET Create Project
router.get('/create-project', (req, res, next) => {
   if(req.isAuthenticated()) {
      res.render('p/create-project', {
         page_title: 'Create Project'
      });
   } else {
      res.redirect('/welcome');
   }
});

// POST Create Project
router.post('/create-project', upload.single('project_image'), (req, res, next) => {

   var project_title = req.body.project_title;
   var admin = req.body.admin; // Owner of project
   var is_private = req.body.is_private;
   var id = req.body.id;

   // Embed video
   var project_video = '';
   var url = req.body.project_video;
   var is_youtube_video = url.search("https://www.youtube.com");
   var is_vimeo_video = url.search("https://vimeo.com");

   // Check if it is Youtube video ->
   // Check if there's an unwanted playlist ->
   // Check if it's already an embedded video ->
   // Grab the video id and attach it to new link

   if(is_youtube_video === -1) {
      // It is not a Youtube video
   } else {

      // See if link has unwanted playlist
      var has_unwanted_playlist = url.search("&list=");
      if(has_unwanted_playlist === -1) {

         // See if video is already embedded
         var is_already_embed = url.search("https://www.youtube.com/embed");
         if(is_already_embed === -1) {
            // It is not a an embedded video
            var video_id = url.split("?v=")[1];
            project_video = "https://www.youtube.com/embed/" + video_id;
         } else {
            project_video = req.body.project_video;
         }

      } else {
         // It has an unwanted playlist attached to the url
         var url_end = url.split("?v=")[1];
         var video_id = url_end.split("&list=")[0];
         project_video = "https://www.youtube.com/embed/" + video_id;
      }

   }

   // Check if it is Vimeo video ->
   // Check if it's already an embedded video ->
   // Grab the video id and attach it to new link

   if(is_vimeo_video === -1) {
      // It is not a Vimeo video
   } else {

      // See if video is already embedded
      var is_already_embed = url.search("https://player.vimeo.com/video/");
      if(is_already_embed === -1) {
         // It is not a an embedded video
         var video_id = url.split("https://vimeo.com/")[1];
         project_video = "https://player.vimeo.com/video/" + video_id;
      } else {
         project_video = req.body.project_video;
      }

   }

   // Form Validation
   req.checkBody('project_title', 'Please Enter A Project Title').notEmpty();
   req.checkBody('project_title', 'Project Title Is Too Long').isLength({ min: 0, max:200 });

   errors = req.validationErrors();

   if(errors) {
      User.findById(id, (err, user) => {
         if(err) throw err;

         res.render('p/create-project', {
            errors: errors,
            page_title: 'Create Project',
            user: user
         });
      });
   } else {
      if(req.file) {
         // If user uploaded an image for project
         var ext = path.extname(req.file.originalname);

         // Check if file is an image
         if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {
            User.findById(id, (err, user) => {
               if(err) throw err;

               res.render('p/create-project', {
                  error_msg: 'Uploaded File Must End With .jpg .jpeg .png .gif',
                  page_title: 'Create Project',
                  user: user
               });
            });
         } else {
            // No errors have been made
            var project_image = dateNow + '-' + req.file.originalname;

            var newProject = new Project({
               project_title: project_title,
               is_private: is_private,
               project_image: project_image,
               project_video: project_video,
               admins: admin,
               project_owner: admin
            });

            // Create project in database
            Project.saveProject(newProject, (err, project) => {
               if(err) throw err;
               console.log(err);
            });

            // Add project to User document
            info = [];
            info['profileUsername'] = req.user.username;
            info['projectId'] = newProject._id;

            User.followProject(info, (err, user) => {
               if(err) throw err;
            });

            req.flash('success_msg', "Project was created. Edit the project.");
            res.redirect('/p/details/edit/' + newProject._id);

         }
      } else {
         // If user did not upload an image for project
         User.findById(id, (err, user) => {
            if(err) throw err;

            res.render('p/create-project', {
               error_msg: 'Please upload an image for the project.',
               page_title: 'Create Project',
               user: user
            });
         });
      }
   }
});

// Get Edit Project
router.get('/details/edit/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      Project.findById(req.params.id, (err, project) => {
         if(err) throw err;

         if(project.admins.indexOf(req.user.username) === -1) {
            var is_admin_of_project = false;
            res.redirect('');
         } else {
            var is_admin_of_project = true;
         }

         if(project.lists === undefined || project.lists.length == 0) {
            var project_list_is_empty = true;
         } else {
            var project_list_is_empty = false;
         }

         res.render('p/details/edit-project', {
            project: project,
            hide_scripts: true,
            project_list_is_empty: project_list_is_empty,
            page_title: project.project_title,
            is_admin_of_project: is_admin_of_project
         });
      });
   } else {
      res.redirect('/welcome');
   }
});

// Post Edit Project
router.post('/details/edit/:id', upload.single('project_image'), (req, res, next) => {
   if(req.isAuthenticated()) {

      var project_id = req.params.id;
      var project_description = req.body.project_description;
      var project_title = req.body.project_title;
      var is_private = req.body.is_private;
      var user_id = req.body.id;
      var user = req.body.user;
      var list_count = req.body.list_count;
      var project_notes = req.body.project_notes;
      project_notes = project_notes.replace(/\r\n/g,'');

      // Embed video
      var project_video = '';
      var url = req.body.project_video;
      var is_youtube_video = url.search("https://www.youtube.com");
      var is_vimeo_video = url.search("https://vimeo.com");

      // Check if it is Youtube video ->
      // Check if there's an unwanted playlist ->
      // Check if it's already an embedded video ->
      // Grab the video id and attach it to new link

      if(is_youtube_video === -1) {
         // It is not a Youtube video
      } else {

         // See if link has unwanted playlist
         var has_unwanted_playlist = url.search("&list=");
         if(has_unwanted_playlist === -1) {

            // See if video is already embedded
            var is_already_embed = url.search("https://www.youtube.com/embed");
            if(is_already_embed === -1) {
               // It is not a an embedded video
               var video_id = url.split("?v=")[1];
               project_video = "https://www.youtube.com/embed/" + video_id;
            } else {
               project_video = req.body.project_video;
            }

         } else {
            // It has an unwanted playlist attached to the url
            var url_end = url.split("?v=")[1];
            var video_id = url_end.split("&list=")[0];
            project_video = "https://www.youtube.com/embed/" + video_id;
         }

      }

      // Check if it is Vimeo video ->
      // Check if it's already an embedded video ->
      // Grab the video id and attach it to new link

      if(is_vimeo_video === -1) {
         // It is not a Vimeo video
      } else {

         // See if video is already embedded
         var is_already_embed = url.search("https://player.vimeo.com/video/");
         if(is_already_embed === -1) {
            // It is not a an embedded video
            var video_id = url.split("https://vimeo.com/")[1];
            project_video = "https://player.vimeo.com/video/" + video_id;
         } else {
            project_video = req.body.project_video;
         }

      }

      // Form Validation
      req.checkBody('project_title', 'Please Enter A Project Title').notEmpty();
      req.checkBody('project_title', 'Project Title Is Too Long').isLength({ min: 0, max:200 });
      req.checkBody('project_description', 'Description Must Be Less Than 500 Characters').isLength({ min: 0, max: 500 });

      errors = req.validationErrors();

      if(errors) {

         Project.findById(project_id, (err, project) => {
            if(err) throw err;

            res.render('p/details/edit-project', {
               errors_2: errors,
               user: req.user,
               project: project,
               page_title: project.project_title,
               is_admin_of_project: true
            });
         });

      } else {

         var lists = [];

         if (req.body.list_items_1 === undefined || req.body.list_items_1.length == 0) {
            // List items are empty
         } else {
            lists.push({
               list_title: req.body.list_title_1,
               list_items: req.body.list_items_1,
               list_order: 1
            });
         }

         if (req.body.list_items_2 === undefined || req.body.list_items_2.length == 0) {
            // List items are empty
         } else {
            lists.push({
               list_title: req.body.list_title_2,
               list_items: req.body.list_items_2,
               list_order: 2
            });
         }

         if (req.body.list_items_3 === undefined || req.body.list_items_3.length == 0) {
            // List items are empty
         } else {
            lists.push({
               list_title: req.body.list_title_3,
               list_items: req.body.list_items_3,
               list_order: 3
            });
         }

         if (req.body.list_items_4 === undefined || req.body.list_items_4.length == 0) {
            // List items are empty
         } else {
            lists.push({
               list_title: req.body.list_title_4,
               list_items: req.body.list_items_4,
               list_order: 4
            });
         }

         if (req.body.list_items_5 === undefined || req.body.list_items_5.length == 0) {
            // List items are empty
         } else {
            lists.push({
               list_title: req.body.list_title_5,
               list_items: req.body.list_items_5,
               list_order: 5
            });
         }

         if(req.file) {
            var ext = path.extname(req.file.originalname);
            if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {
               Project.findById(project_id, (err, project) => {
                  if(err) throw err;

                  res.render('p/details/edit-project', {
                     errors_2: 'Uploaded File Must End With .jpg .jpeg .png .gif',
                     user: req.user,
                     project: project,
                     page_title: project.project_title,
                     is_admin_of_project: true
                  });
               });
            } else {
               var project_image = dateNow + '-' + req.file.originalname;

               Project.findById(project_id, (err, project) => {
                  if(err) throw err;

                  Project.findByIdAndUpdate(project_id, {
                     project_title: project_title,
                     project_description: project_description,
                     project_image: project_image,
                     project_video: project_video,
                     is_private: is_private,
                     lists: lists,
                     project_notes: project_notes
                  }, (err, user) => {
                     if (err) throw err;
                  });

                  res.redirect('/p/details/' + project_id);
               });
            }
         } else {

            Project.findById(project_id, (err, project) => {
               if(err) throw err;

               Project.findByIdAndUpdate(project_id, {
                  project_title: project_title,
                  project_description: project_description,
                  is_private: is_private,
                  project_video: project_video,
                  lists: lists,
                  project_notes: project_notes
               }, (err, user) => {
                  if (err) throw err;
               });

               res.redirect('/p/details/' + project_id);
            });
         }
      }
   } else {
      res.redirect('/welcome');
   }
});

// Get Project Detail
router.get('/details/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      Project.findById(req.params.id, (err, project) => {
         if(err) throw err;

         if(typeof project.followers === "undefined") {
            var user_follows_project = false;
            var followersLength = 0;
         } else {
            var followersLength = project.followers.length;
            if(project.followers.indexOf(req.user.username) === -1) {
               var user_follows_project = false;
            } else {
               var user_follows_project = true;
            }
         }

         if(project.admins.indexOf(req.user.username) === -1) {
            var is_admin_of_project = false;
         } else {
            var is_admin_of_project = true;
         }

         var adminLength = project.admins.length;

         res.render('p/details/details', {
            project: project,
            page_title: project.project_title,
            user_follows_project: user_follows_project,
            is_admin_of_project: is_admin_of_project,
            followersLength: followersLength,
            adminLength: adminLength
         });
      });
   } else {
      res.redirect('/welcome');
   }
});

// Get Project Detail From Outside Link
router.get('/details/:id/guest', (req, res, next) => {
   Project.findById(req.params.id, (err, project) => {
      if(err) throw err;

      res.render('p/details/details', {
         project: project,
         page_title: project.project_title,
         user_is_guest: true
      });
   });
});

// Post Project Detail - Follow
router.post('/details/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      info = [];
      info['profileUsername'] = req.user.username;
      info['projectId'] = req.body.project_id;
      info['projectTitle'] = req.body.project_title;
      info['isPrivate'] = req.body.is_private;
      info['projectImage'] = req.body.project_image;

      User.followProject(info, (err, user) => {
         if(err) throw err;
      });

      // Add followers to project
      Project.addFollowers(info, (err, user) => {
         if(err) throw err;
         req.flash('success_msg', "Project Saved");
         res.redirect('/p/details/' + req.body.project_id);
      });
   } else {
      res.redirect('/welcome');
   }
});

// Post Project Detail - Unfollow
router.post('/details/unfollow/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      info = [];
      info['profileUsername'] = req.user.username;
      info['projectId'] = req.body.project_id;

      User.unfollowProject(info, (err, user) => {
         if(err) throw err;
      });

      // Add followers to project
      Project.removeFollowers(info, (err, user) => {
         if(err) throw err;
         req.flash('success_msg', "Project Unsaved");
         res.redirect('/p/details/' + req.body.project_id);
      });
   } else {
      res.redirect('/welcome');
   }
});

// Delete project
router.get('/details/delete/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      // Find project to delete
      Project.findById(req.params.id, (err, project) => {
         if(err) throw err;

         if(project.admins.indexOf(req.user.username) === -1) {

            // Send them to the homepage
            res.location('/');
            res.redirect('/');

         } else {

            // Only delete if admin

            info = [];

            // If project has followers
            if(project.followers.length > 0) {

               for (var i = 0, len = project.followers.length; i < len; i++) {
                  info['profileUsername'] = project.followers[i];
                  info['projectId'] = req.params.id;

                  User.unfollowProject(info, (err, user) => {
                     if(err) throw err;
                  });
               }

            }

            // If project has admins
            if(project.admins.length > 0) {
               for (var i = 0, len = project.admins.length; i < len; i++) {
                  info['profileUsername'] = project.admins[i];
                  info['projectId'] = req.params.id;

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

            // Delete the project
            Project.findByIdAndRemove(req.params.id, (err) => {
              if (err) throw err;
              req.flash('success_msg', "Project Deleted");
              res.location('/');
              res.redirect('/');
            });
         }

      });
   } else {
      res.redirect('/welcome');
   }
});

router.post('/upload', upload.single('editor_image'), (req, res, next) => {
   if(req.isAuthenticated()) {
      res.status(200).send({"file": "http://s3.amazonaws.com/hryzn-app-static-assets/" + dateNow + '-' + req.file.originalname, "success":true});
   } else {
      res.redirect('/welcome');
   }
});

module.exports = router;
