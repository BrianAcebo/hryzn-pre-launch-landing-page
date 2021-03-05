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


// Twilio Account Info
const accountSid = 'AC270b0d054e0fc564733342d934441402';
const authToken = '8b8b777629c294c6379a848a8dec1430';
const client = require('twilio')(accountSid, authToken);

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
      //var fileExt = file.originalname.split('.').pop();
      var filename = dateNow + file.originalname;
      filename = filename.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); // replace everything except letters and numbers
      cb(null, filename);
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

   var username = req.body.username.replace(/\r\n/g,'').trim();
   var email = req.body.email.replace(/\r\n/g,'').trim();
   var password = req.body.password.replace(/\r\n/g,'').trim();
   var password2 = req.body.password2.replace(/\r\n/g,'').trim();
   var bypassEmail = 'brian@bypassEmail.com';

   var dob_day = req.body.dob_day.replace(/\r\n/g,'').trim();
   var dob_month = req.body.dob_month.replace(/\r\n/g,'').trim();
   var dob_year = req.body.dob_year.replace(/\r\n/g,'').trim();

   var curr_dateObj = new Date();
   var curr_month = curr_dateObj.getUTCMonth() + 1; //months from 1-12
   var curr_day = curr_dateObj.getUTCDate();
   var curr_year = curr_dateObj.getUTCFullYear();

   var dob_error = true;

   if (parseInt(curr_year) - parseInt(dob_year) > 13) {
      dob_error = false;
   } else if (parseInt(curr_month) - parseInt(dob_month) > 0 && parseInt(curr_year) - parseInt(dob_year) == 13) {
      dob_error = false;
   } else if (parseInt(curr_day) - parseInt(dob_day) >= 0 && parseInt(curr_month) - parseInt(dob_month) == 0 && parseInt(curr_year) - parseInt(dob_year) == 13) {
      dob_error = false;
   } else {
      dob_error = true;
   }

   var profile_dob = dob_day + '/' + dob_month + '/' + dob_year;

   // var promo_code; req.body.promo_code.replace(/\r\n/g,'').trim();

   // if (promo_code != '') {
   //    if (promo_code === 'deathB4DECAF') {
   //       // Gmail Credentials
   //       var transporter = nodemailer.createTransport({
   //          service: 'Gmail',
   //          auth: {
   //             user: 'hello@myhryzn.com',
   //             pass: '+ar+oo-55'
   //          }
   //       });
   //
   //       // Mail Body
   //       var mailOptions = {
   //          from: '"Hryzn" <hello@myhryzn.com>',
   //          to: 'hello@myhryzn.com',
   //          subject: 'User Registered With Free Website Promo Code!',
   //          text: username + ' created an account and used the promo_code for a free website.'
   //       }
   //
   //       transporter.sendMail(mailOptions, (error, info) => {
   //       });
   //    } else {
   //       var promo_error = [{
   //          param: 'promo_error',
   //          msg: "Sorry, we couldn't recognize that promotional code. Please try again.",
   //          value: ''
   //       }]
   //    }
   // }

   var firstname = "";
   var lastname = "";

   // Form Validation
   req.checkBody('username', 'Please Enter A Username').notEmpty();
   req.checkBody('username', 'Username Must Be Between 5-50 Characters').isLength({ min: 5, max:50 });
   req.checkBody('email', 'Please Enter An Email Address').notEmpty();
   req.checkBody('email', 'Please Enter A Valid Email Address').isEmail();
   req.checkBody('password', 'Please Enter A Password').notEmpty();
   req.checkBody('password', 'Password Must Be Greater Than 8 Characters').isLength({ min: 8, max:50 });
   req.checkBody('password2', 'Passwords Do Not Match').equals(req.body.password);

   var errors = req.validationErrors();

   // if(errors || promo_error) {
   //    if (errors) {
   //       var err = errors;
   //    } else {
   //       var err = promo_error;
   //    }
   // }

   if(errors || dob_error) {
      if (errors) {
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
         res.render('users/register', {
            error_msg: 'Sorry, you are not old enough.',
            firstname: firstname,
            lastname: lastname,
            username: username,
            email: email,
            password: password,
            inviteAllowed: true,
            page_title: 'Register Your Account',
            notLoginPage: false
         });
      }
   } else {
      User.getUserByUsername(username, (err, user) => {
         if(err) throw err;
         if(!user) {
            User.getUserByEmail(email, (err, user) => {
               if(err) throw err;

               if(!user || email === bypassEmail) {

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

                        //var fileExt = req.file.originalname.split('.').pop();

                        var filename = dateNow + req.file.originalname;
                        filename = filename.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); // replace everything except letters and numbers

                        var profileimage = filename;

                        var hex = 'H'+(Math.random()*0xFFFFFF<<0).toString(16);
                        var verify_code = hex + '$21B3';

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
                           to: email,
                           subject: 'Verify Your Account',
                           html: '<p>Hi there, your verification code: ' + hex + '</p><br /><p>If this was not you, please <a href="https://www.myhryzn.com/welcome#contact">contact us</a></p>',
                        }

                        transporter.sendMail(mailOptions, (error, info) => {
                           if(!error) {
                           }
                        });

                        res.render('users/register-next', {
                           firstname: firstname,
                           lastname: lastname,
                           username: username,
                           email: email,
                           password: password,
                           profile_dob: profile_dob,
                           profileimage: profileimage,
                           inviteAllowed: true,
                           verify_code: verify_code,
                           verify_through_email: true,
                           page_title: 'Verify Your Account',
                           notLoginPage: false
                        });

                     }
                  } else {

                     var hex = 'H'+(Math.random()*0xFFFFFF<<0).toString(16);
                     var verify_code = hex + '$21B3';

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
                        to: email,
                        subject: 'Verify Your Account',
                        html: '<p>Hi there, your verification code: ' + hex + '</p><br /><p>If this was not you, please <a href="https://www.myhryzn.com/welcome#contact">contact us</a></p>',
                     }

                     transporter.sendMail(mailOptions, (error, info) => {
                        if(!error) {
                        }
                     });

                     res.render('users/register-next', {
                        firstname: firstname,
                        lastname: lastname,
                        username: username,
                        email: email,
                        password: password,
                        profile_dob: profile_dob,
                        inviteAllowed: true,
                        verify_code: verify_code,
                        verify_through_email: true,
                        page_title: 'Verify Your Account',
                        notLoginPage: false
                     });

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

// POST Register Next
router.post('/register-next', (req, res, next) => {

   var username = req.body.username.replace(/\r\n/g,'').trim();
   var email = req.body.email.replace(/\r\n/g,'').trim();
   var password = req.body.password.replace(/\r\n/g,'').trim();
   var user_code = req.body.user_code.replace(/\r\n/g,'').trim();
   var profile_dob = req.body.profile_dob.replace(/\r\n/g,'').trim();

   var verify_code = req.body.verify_code.split('$21B3')[0];

   user_code = user_code.toUpperCase();
   verify_code = verify_code.toUpperCase();

   if (user_code === verify_code) {

      if (req.body.profileimage) {
         var newUser = new User({
            username: username,
            email: email,
            password: password,
            profileimage: req.body.profileimage,
            profile_theme: 'default',
            completed_interest_onboarding: false,
            completed_modal_walkthrough: false,
            completed_profile_setup: false,
            date_of_birth: profile_dob
         });

         // Create user in database
         User.saveUser(newUser, (err, user) => {
            if(err) throw err;

            // Follow @welcome_to_hryzn
            User.findOne({ '_id': { $in: '5fe22ee746497818fbb7c9d3' } }, (err, welcome_user) => {

               info = [];
               info['userUsername'] = welcome_user.username;
               info['profileId'] = user._id;
               info['profileUsername'] = user.username;
               info['userId'] = welcome_user._id;

               // Update following for User
               User.addFollowing(info, (err, user) => {
                  if(err) throw err;
               });

               // Add followers to profile
               User.addFollowers(info, (err, user) => {
                  if(err) throw err;
               });

               info = [];
               info['userUsername'] = user.username;
               info['profileId'] = welcome_user._id;
               info['profileUsername'] = welcome_user.username;
               info['userId'] = user._id;

               // Update following for User
               User.addFollowing(info, (err, user) => {
                  if(err) throw err;
               });

               // Add followers to profile
               User.addFollowers(info, (err, user) => {
                  if(err) throw err;
               });
            });
         });

         ///// Thank You Email /////

         // Gmail Credentials
         var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
               user: 'hello@myhryzn.com',
               pass: '+ar+oo-55'
            }
         });


         // Email Brian about new user
         var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

         var mailOptions = {
            from: '"Hryzn" <hello@myhryzn.com>',
            to: '"Brian" <brianacebo@gmail.com>',
            subject: 'New User',
            text: email + ' created a new account through email with IP = ' + ip
         }

         transporter.sendMail(mailOptions, (error, info) => {
            if(!error) {
            }
         });


         // Email Brandon about new user
         var mailOptions = {
            from: '"Hryzn" <hello@myhryzn.com>',
            to: '"Brandon" <wokeupwitabankroll@protonmail.com>',
            subject: 'New User',
            text: email + ' created a new account through email with IP = ' + ip
         }

         transporter.sendMail(mailOptions, (error, info) => {
            if(!error) {
            }
         });


         // Thank you email //
         var mailOptions = {
            from: '"Hryzn" <hello@myhryzn.com>',
            to: email,
            subject: 'Hello From Hryzn!',
            text: 'Hi, we want to say thank you for signing up and welcome to our community! Hryzn is a social network so you can connect and collaborate with your friends, show off your content to followers, or simply just write privately. Hryzn can also help you rank higher in search engines, showcase expertise in your field, and promote your brand\'s awareness.',
            html: { path: thanks_email }
         }

         transporter.sendMail(mailOptions, (error, info) => {
            if(!error) {
               req.flash('success_msg', "Account Created. Please Log In");
               res.redirect('/users/login');
            }
         });
         //////////
      } else {
         var newUser = new User({
            username: username,
            email: email,
            password: password,
            profile_theme: 'default',
            completed_interest_onboarding: false,
            completed_modal_walkthrough: false,
            completed_profile_setup: false,
            date_of_birth: profile_dob
         });

         // Create user in database
         User.saveUser(newUser, (err, user) => {
            if(err) throw err;

            // Follow @welcome_to_hryzn
            User.findOne({ '_id': { $in: '5fe22ee746497818fbb7c9d3' } }, (err, welcome_user) => {

               info = [];
               info['userUsername'] = welcome_user.username;
               info['profileId'] = user._id;
               info['profileUsername'] = user.username;
               info['userId'] = welcome_user._id;

               // Update following for User
               User.addFollowing(info, (err, user) => {
                  if(err) throw err;
               });

               // Add followers to profile
               User.addFollowers(info, (err, user) => {
                  if(err) throw err;
               });

               info = [];
               info['userUsername'] = user.username;
               info['profileId'] = welcome_user._id;
               info['profileUsername'] = welcome_user.username;
               info['userId'] = user._id;

               // Update following for User
               User.addFollowing(info, (err, user) => {
                  if(err) throw err;
               });

               // Add followers to profile
               User.addFollowers(info, (err, user) => {
                  if(err) throw err;
               });
            });
         });


         ///// Thank You Email /////

         // Gmail Credentials
         var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
               user: 'hello@myhryzn.com',
               pass: '+ar+oo-55'
            }
         });


         // Email Brian about new user
         var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

         var mailOptions = {
            from: '"Hryzn" <hello@myhryzn.com>',
            to: '"Brian" <brianacebo@gmail.com>',
            subject: 'New User',
            text: email + ' created a new account through email with IP = ' + ip
         }

         transporter.sendMail(mailOptions, (error, info) => {
            if(!error) {
            }
         });


         // Email Brandon about new user
         var mailOptions = {
            from: '"Hryzn" <hello@myhryzn.com>',
            to: '"Brandon" <wokeupwitabankroll@protonmail.com>',
            subject: 'New User',
            text: email + ' created a new account through email with IP = ' + ip
         }

         transporter.sendMail(mailOptions, (error, info) => {
            if(!error) {
            }
         });


         // Thank you email //
         var mailOptions = {
            from: '"Hryzn" <hello@myhryzn.com>',
            to: email,
            subject: 'Hello From Hryzn!',
            text: 'Hi, we want to say thank you for signing up and welcome to our community! Hryzn is a social network so you can connect and collaborate with your friends, show off your content to followers, or simply just write privately. Hryzn can also help you rank higher in search engines, showcase expertise in your field, and promote your brand\'s awareness.',
            html: { path: thanks_email }
         }

         transporter.sendMail(mailOptions, (error, info) => {
            if(!error) {
               req.flash('success_msg', "Account Created. Please Log In");
               res.redirect('/users/login');
            }
         });
         //////////
      }

   } else {
      res.render('users/register-next', {
         error_msg: 'Sorry That Verification Code Is Incorrect',
         email: email,
         username: username,
         password: password,
         profile_dob: profile_dob,
         inviteAllowed: true,
         page_title: 'Verify Your Account',
         notLoginPage: false,
         profileimage: req.body.profileimage,
         verify_code: verify_code
      });
   }
});

// POST Register Next / Text
router.post('/register-next/text', (req, res, next) => {

   var username = req.body.username.replace(/\r\n/g,'').trim();
   var email = req.body.email.replace(/\r\n/g,'').trim();
   var password = req.body.password.replace(/\r\n/g,'').trim();
   var phone = req.body.phone.replace(/\r\n/g,'').trim();
   var profile_dob = req.body.profile_dob.replace(/\r\n/g,'').trim();
   var profileimage = req.body.profileimage;
   var verify_code = req.body.verify_code.split('$21B3')[0];

   client.messages
     .create({
        body: 'Hryzn | Hi there, your verification code: ' + verify_code,
        from: '+12078025238',
        to: phone
      })
     .then(message => console.log(message.sid));

   res.render('users/register-next', {
      username: username,
      email: email,
      password: password,
      profile_dob: profile_dob,
      phone: phone,
      profileimage: profileimage,
      inviteAllowed: true,
      verify_code: req.body.verify_code,
      page_title: 'Verify Your Account',
      verify_through_email: false,
      notLoginPage: false
   });
});

// POST Register Next / Text - Sign Up
router.post('/register-next/text/1', (req, res, next) => {

   var username = req.body.username.replace(/\r\n/g,'').trim();
   var email = req.body.email.replace(/\r\n/g,'').trim();
   var phone = req.body.phone.replace(/\r\n/g,'').trim();
   var password = req.body.password.replace(/\r\n/g,'').trim();
   var profile_dob = req.body.profile_dob.replace(/\r\n/g,'').trim();
   var profileimage = req.body.profileimage;

   var user_code = req.body.user_code.replace(/\r\n/g,'').trim();

   var verify_code = req.body.verify_code.split('$21B3')[0];

   user_code = user_code.toUpperCase();
   verify_code = verify_code.toUpperCase();

   if (user_code === verify_code) {

      if (req.body.profileimage) {

         ///// Thank You Email /////

         // Gmail Credentials
         var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
               user: 'hello@myhryzn.com',
               pass: '+ar+oo-55'
            }
         });


         // Email Brian about new user
         var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

         var mailOptions = {
            from: '"Hryzn" <hello@myhryzn.com>',
            to: '"Brian" <brianacebo@gmail.com>',
            subject: 'New User',
            text: email + ' created a new account through text with IP = ' + ip
         }

         transporter.sendMail(mailOptions, (error, info) => {
            if(!error) {
            }
         });


         // Email Brandon about new user
         var mailOptions = {
            from: '"Hryzn" <hello@myhryzn.com>',
            to: '"Brandon" <wokeupwitabankroll@protonmail.com>',
            subject: 'New User',
            text: email + ' created a new account through text with IP = ' + ip
         }

         transporter.sendMail(mailOptions, (error, info) => {
            if(!error) {
            }
         });
         //////////

         var newUser = new User({
            username: username,
            email: email,
            password: password,
            profileimage: req.body.profileimage,
            profile_theme: 'default',
            completed_interest_onboarding: false,
            completed_modal_walkthrough: false,
            completed_profile_setup: false,
            date_of_birth: profile_dob
         });

         // Create user in database
         User.saveUser(newUser, (err, user) => {
            if(err) throw err;

            // Follow @welcome_to_hryzn
            User.findOne({ '_id': { $in: '5fe22ee746497818fbb7c9d3' } }, (err, welcome_user) => {

               info = [];
               info['userUsername'] = welcome_user.username;
               info['profileId'] = user._id;
               info['profileUsername'] = user.username;
               info['userId'] = welcome_user._id;

               // Update following for User
               User.addFollowing(info, (err, user) => {
                  if(err) throw err;
               });

               // Add followers to profile
               User.addFollowers(info, (err, user) => {
                  if(err) throw err;
               });

               info = [];
               info['userUsername'] = user.username;
               info['profileId'] = welcome_user._id;
               info['profileUsername'] = welcome_user.username;
               info['userId'] = user._id;

               // Update following for User
               User.addFollowing(info, (err, user) => {
                  if(err) throw err;
               });

               // Add followers to profile
               User.addFollowers(info, (err, user) => {
                  if(err) throw err;
               });
            });
         });

         client.messages
           .create({
              body: 'Hi, we want to say thank you for signing up and welcome to our community! Hryzn is a social network so you can connect and collaborate with your friends, show off your content to followers, or simply just write privately. Hryzn can also help you rank higher in search engines, showcase expertise in your field, and promote your brand\'s awareness.',
              from: '+12078025238',
              to: phone
            })
           .then(message => console.log(message.sid));

         req.flash('success_msg', "Account Created. Please Log In");
         res.redirect('/users/login');
      } else {

         ///// Thank You Email /////

         // Gmail Credentials
         var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
               user: 'hello@myhryzn.com',
               pass: '+ar+oo-55'
            }
         });


         // Email Brian about new user
         var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

         var mailOptions = {
            from: '"Hryzn" <hello@myhryzn.com>',
            to: '"Brian" <brianacebo@gmail.com>',
            subject: 'New User',
            text: email + ' created a new account through text with IP = ' + ip
         }

         transporter.sendMail(mailOptions, (error, info) => {
            if(!error) {
            }
         });


         // Email Brandon about new user
         var mailOptions = {
            from: '"Hryzn" <hello@myhryzn.com>',
            to: '"Brandon" <wokeupwitabankroll@protonmail.com>',
            subject: 'New User',
            text: email + ' created a new account through text with IP = ' + ip
         }

         transporter.sendMail(mailOptions, (error, info) => {
            if(!error) {
            }
         });
         //////////

         var newUser = new User({
            username: username,
            email: email,
            password: password,
            profile_theme: 'default',
            completed_interest_onboarding: false,
            completed_modal_walkthrough: false,
            completed_profile_setup: false,
            date_of_birth: profile_dob
         });

         // Create user in database
         User.saveUser(newUser, (err, user) => {
            if(err) throw err;

            // Follow @welcome_to_hryzn
            User.findOne({ '_id': { $in: '5fe22ee746497818fbb7c9d3' } }, (err, welcome_user) => {

               info = [];
               info['userUsername'] = welcome_user.username;
               info['profileId'] = user._id;
               info['profileUsername'] = user.username;
               info['userId'] = welcome_user._id;

               // Update following for User
               User.addFollowing(info, (err, user) => {
                  if(err) throw err;
               });

               // Add followers to profile
               User.addFollowers(info, (err, user) => {
                  if(err) throw err;
               });

               info = [];
               info['userUsername'] = user.username;
               info['profileId'] = welcome_user._id;
               info['profileUsername'] = welcome_user.username;
               info['userId'] = user._id;

               // Update following for User
               User.addFollowing(info, (err, user) => {
                  if(err) throw err;
               });

               // Add followers to profile
               User.addFollowers(info, (err, user) => {
                  if(err) throw err;
               });
            });
         });


         client.messages
           .create({
              body: 'Hi, we want to say thank you for signing up and welcome to our community! Hryzn is a social network so you can connect and collaborate with your friends, show off your content to followers, or simply just write privately. Hryzn can also help you rank higher in search engines, showcase expertise in your field, and promote your brand\'s awareness.',
              from: '+12078025238',
              to: phone
            })
           .then(message => console.log(message.sid));

         req.flash('success_msg', "Account Created. Please Log In");
         res.redirect('/users/login');
      }

   }
});

// GET Login
router.get('/login', (req, res, next) => {
   res.render('users/login', {
     page_title: 'Login To Your Account',
     notLoginPage: false
   });
});

passport.serializeUser( (user, done) => {
   done(null, user._id);
});

passport.deserializeUser( (id, done) => {
   User.getUserById(id, (err, user) => {
      done(err, user);
   });
});

// POST Login
router.post('/login', passport.authenticate('local-login', { failureRedirect:'/users/login', failureFlash: true }), (req, res, next) => {
   // Logged In successfully
   if (req.user.completed_profile_setup) {
      if (req.user.completed_interest_onboarding) {
         if (req.user.completed_modal_walkthrough) {
            res.redirect('/');
         } else {
            res.redirect('/walkthrough/modal');
         }
      } else {
         res.redirect('/walkthrough/interests');
      }
   } else {
      res.redirect('/setup-profile');
   }
});

passport.use('local-login', new LocalStrategy( (username, password, done) => {

   // Check for username
   User.getUserByUsername(username, (err, user) => {

      if(err) throw err;

      // Can't find existing user through the username given
      if(!user) {

         // Check for email
         User.getUserByEmail(username, (err, user) => {
            if(err) throw err;

            if(!user) {
               // Can't find existing user through the email given
               return done(null, false, { message: 'Incorrect Password Or Username. Please Try Again' });
            }

            // Check password with email combination
            User.comparePassword(password, user.password, (err, isMatch) => {
               if(err) throw err;

               if(isMatch) {
                  // Logged in succesfully
                  return done(null, user);
               } else {
                  // Password didn't match DB password
                  return done(null, false, { message: 'Incorrect Password Or Username. Please Try Again' });
               }
            });
         });

      } else {

         // Check password with username combination
         User.comparePassword(password, user.password, (err, isMatch) => {
            if(err) throw err;
            if(isMatch) {

               // Logged in succesfully
               return done(null, user);
            } else {

               // Password didn't match DB password
               return done(null, false, { message: 'Incorrect Password Or Username. Please Try Again' });
            }
         });

      }
   });
}));

module.exports = router;
