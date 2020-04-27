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
      // var fileExt = file.originalname.split('.').pop();
      cb(null, dateNow + file.originalname);
   }
}
const upload = multer({storage: multerS3(storage)});
const multipleUpload = multer({storage: multerS3(storage)});


// Connection to Models
const User = require('../models/users');
const Project = require('../models/projects');


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
      res.redirect('/welcome');
   }
});


// POST Create Project
router.post('/create-project', upload.single('project_image'), (req, res, next) => {

   if(req.isAuthenticated()) {

      var project_title = req.body.project_title;
      var project_description = req.body.project_description.replace(/\r\n/g,'');
      var admin = req.body.admin; // Owner of project
      var is_private = req.body.is_private;
      var id = req.body.id;
      var user = req.body.user;
      var project_notes = req.body.project_notes.replace(/\r\n/g,'');
      var project_url = req.body.project_url;

      // See if project_url has https://
      var has_https = project_url.search("https://");
      if(has_https > -1) {

         var url_without_https = project_url.split("https://")[1];
         project_url = url_without_https;

      }

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

         User.findById(id, (err, user) => {
            if(err) throw err;

            res.render('p/create-project', {
               errors: errors,
               page_title: 'Create Project',
               project_title: project_title,
               project_description: project_description,
               project_notes: project_notes,
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
                     project_title: project_title,
                     project_description: project_description,
                     project_notes: project_notes,
                     is_private: is_private,
                     project_video: project_video,
                     project_url: project_url,
                     categories: project_categories,
                     project_notes: project_notes,
                     user: user
                  });
               });

            } else {
               // No errors have been made
               // var fileExt = req.file.originalname.split('.').pop();
               var project_image = dateNow + req.file.originalname;

               if (req.body.project_categories) {
                  if (req.body.project_categories.length > 0) {
                     var project_categories = req.body.project_categories;
                  } else {
                     var project_categories;
                  }
               } else {
                  var project_categories;
               }

               var newProject = new Project({
                  project_title: project_title,
                  project_description: project_description,
                  is_private: is_private,
                  project_image: project_image,
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

                  req.flash('success_msg', "Project was created.");
                  res.redirect('/p/details/' + project._id);
               });

            }
         } else {
            // If user did not upload an image for project
            User.findById(id, (err, user) => {
               if(err) throw err;

               res.render('p/create-project', {
                  error_msg: 'Please upload an image for the project.',
                  page_title: 'Create Project',
                  project_title: project_title,
                  project_description: project_description,
                  project_notes: project_notes,
                  is_private: is_private,
                  project_video: project_video,
                  project_url: project_url,
                  categories: project_categories,
                  project_notes: project_notes,
                  user: user
               });
            });
         }
      }

   } else {
      res.redirect('/welcome');
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
      res.redirect('/welcome');
   }
});

// Post Edit Project
router.post('/details/edit/:id', upload.single('project_image'), (req, res, next) => {
   if(req.isAuthenticated()) {

      var project_id = req.params.id;
      var project_description = req.body.project_description.replace(/\r\n/g,'');
      var project_title = req.body.project_title;
      var is_private = req.body.is_private;
      var user_id = req.body.id;
      var user = req.body.user;
      var project_notes = req.body.project_notes.replace(/\r\n/g,'');
      var project_url = req.body.project_url;

      // See if project_url has https://
      var has_https = project_url.search("https://");
      if(has_https > -1) {

         var url_without_https = project_url.split("https://")[1];
         project_url = url_without_https;

      }

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

         if(req.file) {
            var ext = path.extname(req.file.originalname);

            // Check if image has proper extension
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
               // var fileExt = req.file.originalname.split('.').pop();
               var project_image = dateNow + req.file.originalname;

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


                  Project.findByIdAndUpdate(project_id, {
                     project_title: project_title,
                     project_description: project_description,
                     project_image: project_image,
                     project_video: project_video,
                     project_url: project_url,
                     categories: project_categories,
                     is_private: is_private,
                     project_notes: project_notes
                  }, (err, user) => {
                     if (err) throw err;
                  });

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
      res.redirect('/welcome');
   }
});

// Get Project Detail
router.get('/details/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      Project.findById(req.params.id, (err, project) => {
         if (err) throw err;

         if (project) {

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
               if (project.saves) {
                  var saves_amount = project.saves.length;
                  var likes_amount = project.likes.length;
                  var comment_amount = project.comments.length;

                  if (saves_amount >= 1) {
                     var enough_saves = true;
                  } else {
                     var enough_saves = false;
                  }

                  if (likes_amount >= 1) {
                     var enough_likes = true;
                  } else {
                     var enough_likes = false;
                  }

                  if (comment_amount >= 1) {
                     var enough_comments = true;
                  } else {
                     var enough_comments = false;
                  }

                  if (project.saves.indexOf(req.user.username) === -1) {
                     var user_saved = false;
                  } else {
                     var user_saved = true;
                  }

                  if (project.likes.indexOf(req.user.username) === -1) {
                     var user_liked = false;
                  } else {
                     var user_liked = true;
                  }

               } else {
                  // Project has no saves or likes
                  var user_saved = false;
                  var saves_amount = 0;

                  var user_liked = false;
                  var likes_amount = 0;
               }

               var admin_amount = project.admins.length;

               var search_notes = project.project_notes.toString();

               Project.find({$text: { $search: search_notes }}, {score: { $meta: "textScore" }}, (err, related_projects) => {
                  if (err) throw err;

                  var reverse_related_projects = related_projects.reverse();

                  if (related_projects.length > 0) {
                     res.render('p/details/details', {
                        project: project,
                        related_projects: reverse_related_projects,
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
                        admin_amount: admin_amount
                     });
                  } else {
                     if (project.categories.length > 0) {
                        Project.find({ 'categories': { $in: project.categories} }, (err, related_projects) => {
                           if (err) throw err;

                           var reverse_related_projects = related_projects.reverse();

                           res.render('p/details/details', {
                              project: project,
                              related_projects: reverse_related_projects,
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
                              admin_amount: admin_amount
                           });
                        }).limit(8);
                     } else {
                        Project.find({}, (err, related_projects) => {
                           if (err) throw err;

                           var reverse_related_projects = related_projects.reverse();

                           res.render('p/details/details', {
                              project: project,
                              related_projects: reverse_related_projects,
                              page_title: project.project_title,
                              is_admin_of_project: is_admin_of_project,
                              comment_amount: comment_amount,
                              enough_saves: enough_saves,
                              saves_amount: saves_amount,
                              enough_likes: enough_likes,
                              likes_amount: likes_amount,
                              user_saved: user_saved,
                              user_liked: user_liked,
                              admin_amount: admin_amount
                           });
                        }).limit(5);
                     }
                  }

               }).sort({score: { $meta: "textScore" }}).limit(5);
            }
         } else {
            res.redirect('/');
         }
      });
   } else {
      res.redirect('/welcome');
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

            if (project.saves) {
               var saves_amount = project.saves.length;
               var likes_amount = project.likes.length;
               var comment_amount = project.comments.length;

               if (saves_amount >= 1) {
                  var enough_saves = true;
               } else {
                  var enough_saves = false;
               }

               if (likes_amount >= 1) {
                  var enough_likes = true;
               } else {
                  var enough_likes = false;
               }

               if (comment_amount >= 1) {
                  var enough_comments = true;
               } else {
                  var enough_comments = false;
               }

            } else {
               // Project has no saves or likes
               var user_saved = false;
               var saves_amount = 0;

               var user_liked = false;
               var likes_amount = 0;
            }

            var admin_amount = project.admins.length;

            if (project.categories.length > 0) {
               Project.find({ 'categories': { $in: project.categories} }, (err, related_projects) => {
                  if (err) throw err;

                  var reverse_related_projects = related_projects.reverse();

                  res.render('p/details/details', {
                     project: project,
                     related_projects: reverse_related_projects,
                     page_title: project.project_title,
                     is_admin_of_project: false,
                     comment_amount: comment_amount,
                     enough_comments: enough_comments,
                     enough_saves: enough_saves,
                     saves_amount: saves_amount,
                     enough_likes: enough_likes,
                     likes_amount: likes_amount,
                     user_saved: false,
                     user_liked: false,
                     admin_amount: admin_amount,
                     user_is_guest: true
                  });
               }).limit(5);
            } else {
               Project.find({}, (err, related_projects) => {
                  if (err) throw err;

                  var reverse_related_projects = related_projects.reverse();

                  res.render('p/details/details', {
                     project: project,
                     related_projects: reverse_related_projects,
                     page_title: project.project_title,
                     is_admin_of_project: false,
                     comment_amount: comment_amount,
                     enough_saves: enough_saves,
                     saves_amount: saves_amount,
                     enough_likes: enough_likes,
                     likes_amount: likes_amount,
                     user_saved: false,
                     user_liked: false,
                     admin_amount: admin_amount,
                     user_is_guest: true
                  });
               }).limit(5);
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
         req.flash('success_msg', "Project Saved");
         res.redirect('/p/details/' + req.body.project_id);
      });
   } else {
      res.redirect('/welcome');
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
      res.redirect('/welcome');
   }
});

// Post Project Detail - Like
router.post('/details/like/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      info = [];
      info['profileUsername'] = req.user.username;
      info['projectId'] = req.body.project_id;
      info['projectTitle'] = req.body.project_title;
      info['isPrivate'] = req.body.is_private;
      info['projectImage'] = req.body.project_image;

      // Add like to project
      Project.addLikes(info, (err, user) => {
         if(err) throw err;
         req.flash('success_msg', "Project Liked");
         res.redirect('/p/details/' + req.body.project_id);
      });
   } else {
      res.redirect('/welcome');
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
      res.redirect('/welcome');
   }
});


// Post Project Detail - Comment
router.post('/details/comment/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      info = [];
      info['profileUsername'] = req.user.username;
      info['projectId'] = req.body.project_id;
      info['profileimage'] = req.body.profileimage;
      info['comment'] = req.body.comment.replace(/\r\n/g,'');

      // Add save to project
      Project.addComment(info, (err, user) => {
         if(err) throw err;
         req.flash('success_msg', "Added Comment");
         res.redirect('/p/details/' + req.body.project_id);
      });
   } else {
      res.redirect('/welcome');
   }
});


// Post Project Detail - Uncomment
router.post('/details/uncomment/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      info = [];
      info['profileUsername'] = req.user.username;
      info['projectId'] = req.params.id;
      info['commentId'] = req.body.comment_id;

      // Add save to project
      Project.removeComment(info, (err, user) => {
         if(err) throw err;
         req.flash('success_msg', "Removed Comment");
         res.redirect('/p/details/' + req.params.id);
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

         if(project.admins.indexOf(req.user.username) > -1 || req.user.username === 'hryzn') {

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
            if(project.admins.length > 0) {
               for (var i = 0, len = project.admins.length; i < len; i++) {
                  info['profileUsername'] = project.admins[i];
                  info['projectId'] = req.params.id;

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

            // Delete the project
            Project.findByIdAndRemove(req.params.id, (err) => {
              if (err) throw err;
              req.flash('success_msg', "Project Deleted");
              res.location('/');
              res.redirect('/');
            });

         } else {

            // Send them to the homepage
            res.location('/');
            res.redirect('/');

         }

      });
   } else {
      res.redirect('/welcome');
   }
});

router.post('/upload', upload.single('editor_image'), (req, res, next) => {
   if(req.isAuthenticated()) {
      // var fileExt = req.file.originalname.split('.').pop();
      res.status(200).send({"file": "https://s3.amazonaws.com/hryzn-app-static-assets/" + dateNow + req.file.originalname, "success":true});
   } else {
      res.redirect('/welcome');
   }
});

module.exports = router;
