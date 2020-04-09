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

var thanks_email = path.join(__dirname, '../public', 'email/register.html');

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
      var fileExt = file.originalname.split('.').pop();
      cb(null, dateNow + '.' + fileExt);
   }
}

const upload = multer({storage: multerS3(storage)});

const User = require('../models/users');

// GET Register
router.get('/register', (req, res, next) => {
   res.render('users/register', {
     page_title: 'Register Your Account',
     notLoginPage: false
   });
});

// POST Register
router.post('/register', upload.single('profileimage'), (req, res, next) => {

   function capitalize(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
   }

   var username = req.body.username;
   var email = req.body.email;
   var password = req.body.password;
   var password2 = req.body.password2;

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
   req.checkBody('username', 'Please Enter A Username').notEmpty();
   req.checkBody('username', 'Username Must Be Between 5-50 Characters').isLength({ min: 5, max:50 });
   req.checkBody('email', 'Please Enter An Email Address').notEmpty();
   req.checkBody('email', 'Please Enter A Valid Email Address').isEmail();
   req.checkBody('password', 'Please Enter A Password').notEmpty();
   req.checkBody('password', 'Password Must Be Greater Than 8 Characters').isLength({ min: 8, max:50 });
   req.checkBody('password2', 'Passwords Do Not Match').equals(req.body.password);

   errors = req.validationErrors();

   if(errors) {
      console.log(errors);
      res.render('users/register', {
         errors: errors,
         firstname: firstname,
         lastname: lastname,
         username: username,
         email: email,
         password: password,
         inviteAllowed: true,
         page_title: 'Register Your Account',
         notLoginPage: false
      });
   } else {
      User.getUserByUsername(username, (err, user) => {
         if(err) throw err;
         if(!user) {
            User.getUserByEmail(email, (err, user) => {
               if(err) throw err;

               if(!user) {

                  if(req.file) {
                     var ext = path.extname(req.file.originalname);
                     if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {
                        res.render('users/register', {
                           error_msg: 'Uploaded File Must End With .jpg .jpeg .png .gif',
                           firstname: firstname,
                           lastname: lastname,
                           username: username,
                           password: password,
                           email: email,
                           inviteAllowed: true,
                           page_title: 'Register Your Account',
                           notLoginPage: false
                        });
                     } else {
                        var fileExt = req.file.originalname.split('.').pop();
                        var profileimage = dateNow + '.' + fileExt;

                        var newUser = new User({
                           firstname: firstname,
                           lastname: lastname,
                           username: username,
                           email: email,
                           password: password,
                           profileimage: profileimage
                        });

                        // Create user in database
                        User.saveUser(newUser, (err, user) => {
                           if(err) throw err;
                        });

                        // Thank you email //
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
                           to: email,
                           subject: 'Hello From Hryzn!',
                           text: 'Hi ' + firstname + ', we want to say thank you for signing up and welcome to our community! Hryzn is a social network so you can connect and collaborate with your friends, show off your content to followers, or simply just write privately. Hryzn can also help you rank higher in search engines, showcase expertise in your field, and promote your brand\'s awareness.',
                           html: { path: thanks_email }
                        }

                        transporter.sendMail(mailOptions, (error, info) => {
                           if(!error) {
                              req.flash('success_msg', "Account Created. Please Log In");
                              res.redirect('/users/login');
                           }
                        });

                     }
                  } else {

                     var newUser = new User({
                        firstname: firstname,
                        lastname: lastname,
                        username: username,
                        email: email,
                        password: password
                     });

                     // Create user in database
                     User.saveUser(newUser, (err, user) => {
                        if(err) throw err;
                     });

                     // Thank you email //
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
                        to: email,
                        subject: 'Hello From Hryzn!',
                        text: 'Hi ' + firstname + ', we want to say thank you for signing up and welcome to our community! Hryzn is a social network so you can connect and collaborate with your friends, show off your content to followers, or simply just write privately. Hryzn can also help you rank higher in search engines, showcase expertise in your field, and promote your brand\'s awareness.',
                        html: { path: thanks_email }
                     }

                     transporter.sendMail(mailOptions, (error, info) => {
                        if(!error) {
                           req.flash('success_msg', "Account Created. Please Log In");
                           res.redirect('/users/login');
                        }
                     });

                     req.flash('success_msg', "Account Created. Please Log In");
                     res.redirect('/users/login');
                  }

               } else {
                  // Email address is taken
                  res.render('users/register', {
                     error_msg: 'Sorry That Email Address Is Taken',
                     firstname: firstname,
                     lastname: lastname,
                     username: username,
                     password: password,
                     inviteAllowed: true,
                     page_title: 'Register Your Account',
                     notLoginPage: false
                  });
               }
            });
         } else {
            // Username is taken
            res.render('users/register', {
               error_msg: 'Sorry That Username Is Taken',
               firstname: firstname,
               lastname: lastname,
               email: email,
               password: password,
               inviteAllowed: true,
               page_title: 'Register Your Account',
               notLoginPage: false
            });
         }
      });
   }
});

// GET Login
router.get('/login', (req, res, next) => {
   res.render('users/login', {
     page_title: 'Login To Your Account',
     notLoginPage: false
   });
});

passport.serializeUser( (user, done) => { done(null, user._id); });

passport.deserializeUser( (id, done) => {
   User.getUserById(id, (err, user) => { done(err, user); });
});

// POST Login
router.post('/login', passport.authenticate('local-login', { failureRedirect:'/users/login', failureFlash: true }), (req, res, next) => {
   res.redirect('/');
});

passport.use('local-login', new LocalStrategy( (username, password, done) => {
   // Check for username
   User.getUserByUsername(username, (err, user) => {
      if(err) throw err;
      if(!user) {
         // Check for email
         User.getUserByEmail(username, (err, user) => {
            if(err) throw err;
            if(!user) {
               return done(null, false, { message: 'Incorrect Password Or Username. Please Try Again' });
            }

            User.comparePassword(password, user.password, (err, isMatch) => {
               if(err) throw err;
               if(isMatch) {
                  return done(null, user);
               } else {
                  return done(null, false, { message: 'Incorrect Password Or Username. Please Try Again' });
               }
            });
         });
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
}));

module.exports = router;
