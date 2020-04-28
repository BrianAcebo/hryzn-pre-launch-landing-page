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
const Blog = require('../models/blogs')


// GET Create Blog Post
router.get('/create-post', (req, res, next) => {
   if(req.isAuthenticated()) {

      if (req.user.username === 'hryzn') {
         res.render('blog/create-project', {
            page_title: 'Create Post',
            editProject: true
         });
      } else {
         res.redirect('/');
      }

   } else {
      res.redirect('/blog/auth');
   }
});


// GET All Blog Posts
router.get('/', (req, res, next) => {
   Blog.find({}, (err, posts) => {
      if (err) throw err;

      var reversed_posts = posts.reverse();

      res.render('blog/all-posts', {
         page_title: 'Blog',
         posts: reversed_posts,
         blog: true
      });
   });
});


// GET All Blog Login
router.get('/auth', (req, res, next) => {
   res.render('blog/auth', {
      page_title: 'Blog',
      blog: true
   });
});

passport.serializeUser( (user, done) => { done(null, user._id); });

passport.deserializeUser( (id, done) => {
   User.getUserById(id, (err, user) => { done(err, user); });
});

// POST Login
router.post('/auth', passport.authenticate('local-auth', { failureRedirect:'/blog/auth', failureFlash: true }), (req, res, next) => {
   res.redirect('/blog/create-post');
});

passport.use('local-auth', new LocalStrategy( (username, password, done) => {
   // Check for username

   if (username === 'hryzn') {
      User.getUserByUsername(username, (err, user) => {
         if(err) throw err;
         if(!user) {
            return done(null, false, { message: 'Incorrect Password Or Username. Please Try Again' });
         } else {
            User.comparePassword(password, user.password, (err, isMatch) => {
               if(err) throw err;
               if(isMatch) {
                  return done(null, user);
               } else {
                  return done(null, false, { message: 'Incorrect Password Or Username. Please Try Again' });
               }
            });
         }
      });
   } else {
      return done(null, false, { message: 'Incorrect Password Or Username. Please Try Again' });
   }

}));


module.exports = router;
