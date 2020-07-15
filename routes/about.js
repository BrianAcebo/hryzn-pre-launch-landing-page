const express = require('express');
const router = express.Router();
const path = require('path');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

const User = require('../models/users');

// Get Start
router.get('/start', (req, res, next) => {
   res.render('about/start', {
     page_title: 'Start Your Writing Journey',
     notLoginPage: false,
     page_description: 'Share your knowledge and thoughts with others, showcase expertise in your industry, and build a loyal fanbase with compelling content on a platform built for writers.'
   });
});


// Get Grow
router.get('/grow', (req, res, next) => {

   res.render('about/grow', {
     page_title: 'Grow With Content Marketing',
     notLoginPage: false,
     page_description: 'Grow With Content Marketing'
   });
});


// Get Branding
router.get('/branding', (req, res, next) => {
   res.render('about/branding', {
     page_title: 'Branding',
     notLoginPage: false
   });
});


// Get Press
router.get('/press', (req, res, next) => {
   res.render('about/press', {
     page_title: 'Press',
     notLoginPage: false
   });
});


// Get Contact
router.get('/contact', (req, res, next) => {
   res.render('about/contact', {
     page_title: 'Contact Us',
     notLoginPage: false,
     form_submitted: false,
     forgotPassword: false
   });
});


// Get Contact Thanks
router.get('/contact/thanks', (req, res, next) => {
   res.render('about/contact', {
     page_title: 'Thank You',
     notLoginPage: false,
     form_submitted: true,
     forgotPassword: false
   });
});

// Get Contact Thanks
router.get('/forgot/thanks', (req, res, next) => {
   res.render('about/contact', {
     page_title: 'Thank You',
     notLoginPage: false,
     form_submitted: true,
     forgotPassword: true
   });
});


// Post Contact Form - Contact
router.post('/contact', (req, res, next) => {

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
      from: req.body.contact_name,
      to: 'hello@myhryzn.com',
      subject: 'Form Submit From myhryzn.com Contact Page',
      text: 'The contact page form sends: ' + req.body.contact_name + 'Email: ' + req.body.contact_email + 'Subject: ' + req.body.contact_subject + 'Message: ' + req.body.conatct_message,
      html: '<p>The contact page form sends:</p><ul><li>Name: '+ req.body.contact_name +'</li><li>Email: '+ req.body.contact_email +'</li><li>Subject: ' + req.body.contact_subject +'</li><li>Message: '+ req.body.contact_message +'</li></ul>'
   }

   transporter.sendMail(mailOptions, (error, info) => {
      if(!error) {
         res.redirect('/about/contact/thanks');
      }
   });

});


// Get Terms Of Service
router.get('/terms', (req, res, next) => {
   res.render('about/terms', {
     page_title: 'Terms Of Service',
     notLoginPage: false
   });
});


// Get Privacy Policy
router.get('/privacy', (req, res, next) => {
   res.render('about/privacy', {
     page_title: 'Privacy Policy'
   });
});


// Get Forgot Password
router.get('/forgot', (req, res, next) => {
   res.render('about/contact', {
     page_title: 'Forgot Password',
     notLoginPage: false,
     form_submitted: false,
     forgotPassword: true
   });
});


// Post Contact Form - Forgot Password
router.post('/contact/forgot', (req, res, next) => {

   var contact_email = req.body.contact_email;

   User.getUserByEmail(contact_email, (err, user) => {

      if(err) throw err;


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
         to: contact_email,
         subject: 'Change Your Password On Hryzn',
         html: '<p>Hi ' + user.firstname + ',<p><p style="display:inline-block">We received your request to change your password, which you can do </p><a href="https://www.myhryzn.com/about/reset/' + user.id + '" style="display:inline-block; margin-left: 2px;">here</a><br /><p>If this was not you, please <a href="https://www.myhryzn.com/welcome#contact">contact us</a></p>'
      }

      transporter.sendMail(mailOptions, (error, info) => {
         if(!error) {
            res.redirect('/about/forgot/thanks');
         }
      });


   });

});


// Get Reset Password - User is ready
router.get('/reset/:id', (req, res, next) => {

   var user_id = req.params.id;

   User.getUserById(user_id, (err, user) => {

      if(err) throw err;

      if(user) {

         res.render('about/contact', {
           page_title: 'Reset Password',
           notLoginPage: false,
           form_submitted: false,
           resetForm: true,
           user_id: user.id
         });

      } else {
         res.redirect('/users/register');
      }

   });
});


// POST Forgot Password - User is ready
router.post('/reset/:id', (req, res, next) => {

   var new_password = req.body.password;

   User.getUserById(req.params.id, (err, user) => {

      var user_email = user.email;

      // Form Validation
      req.checkBody('password', 'Please Enter A Password').notEmpty();
      req.checkBody('password', 'Password Must Be Greater Than 8 Characters').isLength({ min: 8, max:50 });
      req.checkBody('password2', 'Passwords Do Not Match').equals(req.body.password);

      errors = req.validationErrors();

      if(errors) {
         User.getUserById(req.params.id, (err, user) => {

            if(err) throw err;

            res.render('about/contact', {
              page_title: 'Reset Password',
              notLoginPage: false,
              form_submitted: false,
              resetForm: true,
              user_id: user.id,
              errors: errors,
            });
         });
      } else {

         bcrypt.hash(new_password, 10, (err, hash) => {
            if(err) throw err;

            User.findByIdAndUpdate(req.params.id, {
               password: hash
            }, (err, user) => {
               if (err) throw err;
               req.flash('success_msg', "Password Changed. Please Log In");
               res.redirect('/users/login');
            });
         });

      }

   });

});


module.exports = router;
