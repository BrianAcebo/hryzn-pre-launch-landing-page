const express = require('express');
const router = express.Router();
const path = require('path');
const nodemailer = require('nodemailer');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
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
const Post = require('../models/blogs')


// GET All Blog Posts
router.get('/', (req, res, next) => {
   Post.find({}, (err, posts) => {
      if (err) throw err;

      var reversed_posts = posts.reverse();
      var most_recent_posts = []

      var break_count = 0;

      for (let post of reversed_posts) {
         if (break_count < 2) {
            if (!post.is_draft) {
               most_recent_posts.push(post);
               break_count += 1;
            }
         } else {
            break;
         }
      }

      if(req.isAuthenticated()) {
         if (req.user.username === 'hryzn') {
            var hryznAdmin = true;
            console.log('yes')
         } else {
            var hryznAdmin = false;
            console.log('noe')
         }
      }

      res.render('blog/all-posts', {
         page_title: 'Blog',
         posts: reversed_posts,
         blog: true,
         most_recent_posts: most_recent_posts,
         hryznAdmin: hryznAdmin
      });
   });
});


// GET Blog Post Category
router.get('/category/:category', (req, res, next) => {
   Post.find({'post_categories': { $in: req.params.category}}, (err, posts) => {
      if (err) throw err;

      var reversed_posts = posts.reverse();

      console.log(posts);

      if(req.isAuthenticated()) {
         if (req.user.username === 'hryzn') {
            var hryznAdmin = true;
         } else {
            var hryznAdmin = false;
         }
      }

      res.render('blog/all-posts', {
         page_title: 'Blog',
         posts: reversed_posts,
         blog: true,
         hryznAdmin: hryznAdmin
      });
   });
});


// GET Create Blog Post
router.get('/create-post', (req, res, next) => {
   if(req.isAuthenticated()) {

      if (req.user.username === 'hryzn') {
         res.render('blog/create-post', {
            page_title: 'Create Post',
            editProject: true
         });
      } else {
         res.redirect('/');
      }

   } else {
      res.redirect('/');
   }
});


// POST Create Post
router.post('/create-post', upload.single('post_image'), (req, res, next) => {

   if(req.isAuthenticated()) {

      var post_title = req.body.post_title.replace(/\r\n/g,'');
      var post_description = req.body.post_description.replace(/\r\n/g,'');
      var admin = req.body.admin; // Owner of project
      var is_draft = req.body.is_private;
      var id = req.body.user_id;
      var user = req.body.user;
      var post_notes = req.body.post_notes.replace(/\r\n/g,'');


      // Form Validation
      req.checkBody('post_title', 'Please Enter A Post Title').notEmpty();
      req.checkBody('post_title', 'Post Title Is Too Long').isLength({ min: 0, max:200 });
      req.checkBody('post_description', 'Description Must Be Less Than 500 Characters').isLength({ min: 0, max: 500 });

      errors = req.validationErrors();

      if(errors) {

         User.findById(id, (err, user) => {
            if(err) throw err;

            res.render('blog/create-post', {
               errors: errors,
               page_title: 'Create Post',
               post_title: post_title,
               post_description: post_description,
               post_notes: post_notes,
               user: user
            });
         });

      } else {

         if (req.file) {

            // If user uploaded an image for project
            var ext = path.extname(req.file.originalname);

            // Check if file is an image
            if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {

               User.findById(id, (err, user) => {
                  if(err) throw err;

                  res.render('blog/create-post', {
                     error_msg: 'Uploaded File Must End With .jpg .jpeg .png .gif',
                     page_title: 'Create Post',
                     post_title: post_title,
                     post_description: post_description,
                     post_notes: post_notes,
                     is_draft: is_draft,
                     categories: post_categories,
                     user: user
                  });
               });

            } else {
               // No errors have been made
               // var fileExt = req.file.originalname.split('.').pop();
               var post_image = dateNow + req.file.originalname;

               if (req.body.post_categories) {
                  if (req.body.post_categories.length > 0) {
                     var post_categories = req.body.post_categories;
                  } else {
                     var post_categories;
                  }
               } else {
                  var post_categories;
               }

               var post_date = new Date();
               post_date = (post_date.getMonth() + 1) + "/" + post_date.getDate() + "/" + post_date.getFullYear();

               var post_slug = post_title.replace(/\s+/g, '-').toLowerCase();
               post_slug = post_slug.replace("?", "");
               post_slug = post_slug.replace("#", "");

               var newPost = new Post({
                  post_title: post_title,
                  post_description: post_description,
                  is_draft: is_draft,
                  post_image: post_image,
                  post_categories: post_categories,
                  post_owner: admin,
                  post_notes: post_notes,
                  post_date: post_date,
                  post_slug: post_slug

               });

               // Create project in database
               Post.savePost(newPost, (err, post) => {
                  if(err) throw err;

                  req.flash('success_msg', "Post was created.");
                  res.redirect('/blog');
               });

            }
         } else {
            // If user did not upload an image for project
            User.findById(id, (err, user) => {
               if(err) throw err;

               res.render('blog/create-post', {
                  error_msg: 'Please upload an image for the post.',
                  page_title: 'Create Post',
                  post_title: post_title,
                  post_description: post_description,
                  post_notes: post_notes,
                  is_draft: is_draft,
                  categories: post_categories,
                  post_notes: post_notes,
                  user: user
               });
            });
         }
      }

   } else {
      res.redirect('/users/register');
   }
});


// Get Post Detail
router.get('/:title', (req, res, next) => {

   var slug = req.params.title.replace("?", "");

   Post.findOne({ 'post_slug': { $in: slug} }, (err, post) => {
      if (err) throw err;

      if (post) {

         if(req.isAuthenticated()) {
            if (req.user.username === 'hryzn') {
               var hryznAdmin = true;
            } else {
               var hryznAdmin = false;
            }
         }

         Post.find({}, (err, posts) => {
            if (err) throw err;

            var reversed_posts = posts.reverse();
            var most_recent_posts = []

            var break_count = 0;

            for (let post of reversed_posts) {
               if (break_count < 2) {
                  if (!post.is_draft) {
                     most_recent_posts.push(post);
                     break_count += 1;
                  }
               } else {
                  break;
               }
            }

            res.render('blog/post', {
               post: post,
               page_title: post.post_title,
               hryznAdmin: hryznAdmin,
               blog: true,
               most_recent_posts: most_recent_posts
            });
         });

      } else {
         console.log(req.params.title + '\n lol');
         res.redirect('/');
      }
   });
});


// Get Edit Post
router.get('/edit-post/:id', (req, res, next) => {

   if(req.isAuthenticated()) {
      if (req.user.username === 'hryzn') {

         var hryznAdmin = true;

         Post.findOne({ '_id': { $in: req.params.id} }, (err, post) => {
            if (err) throw err;

            if (post) {

               res.render('blog/edit-post', {
                  post: post,
                  page_title: post.post_title,
                  hryznAdmin: hryznAdmin,
                  editProject: true,
                  blog: true
               });

            } else {
               res.redirect('/');
            }
         });
      } else {

         var hryznAdmin = false;
         res.redirect('/');

      }
   } else {
      res.redirect('/');
   }

});


// POST Edit Post
router.post('/edit-post/:id', upload.single('post_image'), (req, res, next) => {

   if(req.isAuthenticated()) {

      var post_title = req.body.post_title.replace(/\r\n/g,'');
      var post_description = req.body.post_description.replace(/\r\n/g,'');
      var is_draft = req.body.is_private;
      var id = req.body.user_id;
      var user = req.body.user;
      var post_notes = req.body.post_notes.replace(/\r\n/g,'');

      var post_slug = post_title.replace(/\s+/g, '-').toLowerCase();
      post_slug = post_slug.replace("?", "");
      post_slug = post_slug.replace("#", "");


      // Form Validation
      req.checkBody('post_title', 'Please Enter A Post Title').notEmpty();
      req.checkBody('post_title', 'Post Title Is Too Long').isLength({ min: 0, max:200 });
      req.checkBody('post_description', 'Description Must Be Less Than 500 Characters').isLength({ min: 0, max: 500 });

      errors = req.validationErrors();

      if(errors) {

         console.log(errors);

         User.findById(id, (err, user) => {
            if(err) throw err;

            Post.findById(req.params.id, (err, post) => {
               if(err) throw err;

               res.render('blog/edit-post', {
                  error_msg: 'Uploaded File Must End With .jpg .jpeg .png .gif',
                  page_title: 'Edit Post',
                  post_title: post_title,
                  post_description: post_description,
                  post_notes: post_notes,
                  is_draft: is_draft,
                  user: user,
                  post: true,
                  post_error: true,
                  hryznAdmin: true,
                  editProject: true,
                  blog: true
               });
            });
         });

      } else {

         if (req.file) {

            // If user uploaded an image for project
            var ext = path.extname(req.file.originalname);

            // Check if file is an image
            if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {

               User.findById(id, (err, user) => {
                  if(err) throw err;

                  Post.findById(req.params.id, (err, post) => {
                     if(err) throw err;

                     res.render('blog/edit-post', {
                        error_msg: 'Uploaded File Must End With .jpg .jpeg .png .gif',
                        page_title: 'Edit Post',
                        post_title: post_title,
                        post_description: post_description,
                        post_notes: post_notes,
                        is_draft: is_draft,
                        user: user,
                        post: true,
                        post_error: true,
                        hryznAdmin: true,
                        editProject: true,
                        blog: true
                     });
                  });
               });

            } else {
               // No errors have been made
               // var fileExt = req.file.originalname.split('.').pop();
               var post_image = dateNow + req.file.originalname;

               if (req.body.post_categories) {
                  if (req.body.post_categories.length > 0) {
                     Post.findByIdAndUpdate(req.params.id, {
                        post_title: post_title,
                        post_description: post_description,
                        is_draft: is_draft,
                        post_image: post_image,
                        post_categories: req.body.post_categories,
                        post_notes: post_notes,
                        post_slug: post_slug
                     }, (err, user) => {
                        if (err) throw err;

                        req.flash('success_msg', "Post was updated.");
                        res.redirect('/blog/' + post_slug);
                     });
                  } else {
                     Post.findByIdAndUpdate(req.params.id, {
                        post_title: post_title,
                        post_description: post_description,
                        is_draft: is_draft,
                        post_image: post_image,
                        post_notes: post_notes,
                        post_slug: post_slug
                     }, (err, user) => {
                        if (err) throw err;

                        req.flash('success_msg', "Post was updated.");
                        res.redirect('/blog/' + post_slug);
                     });
                  }
               } else {
                  Post.findByIdAndUpdate(req.params.id, {
                     post_title: post_title,
                     post_description: post_description,
                     is_draft: is_draft,
                     post_image: post_image,
                     post_notes: post_notes,
                     post_slug: post_slug
                  }, (err, user) => {
                     if (err) throw err;

                     req.flash('success_msg', "Post was updated.");
                     res.redirect('/blog/' + post_slug);
                  });
               }

            }
         } else {
            if (req.body.post_categories) {
               if (req.body.post_categories.length > 0) {
                  Post.findByIdAndUpdate(req.params.id, {
                     post_title: post_title,
                     post_description: post_description,
                     is_draft: is_draft,
                     post_categories: req.body.post_categories,
                     post_notes: post_notes,
                     post_slug: post_slug
                  }, (err, user) => {
                     if (err) throw err;

                     req.flash('success_msg', "Post was updated.");
                     res.redirect('/blog/' + post_slug);
                  });
               } else {
                  Post.findByIdAndUpdate(req.params.id, {
                     post_title: post_title,
                     post_description: post_description,
                     is_draft: is_draft,
                     post_notes: post_notes,
                     post_slug: post_slug
                  }, (err, user) => {
                     if (err) throw err;

                     req.flash('success_msg', "Post was updated.");
                     res.redirect('/blog/' + post_slug);
                  });
               }
            } else {
               Post.findByIdAndUpdate(req.params.id, {
                  post_title: post_title,
                  post_description: post_description,
                  is_draft: is_draft,
                  post_notes: post_notes,
                  post_slug: post_slug
               }, (err, user) => {
                  if (err) throw err;

                  req.flash('success_msg', "Post was updated.");
                  res.redirect('/blog/' + post_slug);
               });
            }
         }
      }

   } else {
      res.redirect('/users/register');
   }
});


// Delete project
router.get('/delete/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      // Find post to delete
      Post.findById(req.params.id, (err, post) => {
         if(err) throw err;

         if(req.user.username === 'hryzn') {

            // Only delete if admin

            info = [];

            // Delete post image
            var s3_instance = new aws.S3();
            var s3_params = {
               Bucket: 'hryzn-app-static-assets',
               Key: post.post_image
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
            Post.findByIdAndRemove(req.params.id, (err) => {
              if (err) throw err;
              req.flash('success_msg', "Destroyed From Existence...");
              res.redirect('/blog');
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


module.exports = router;
