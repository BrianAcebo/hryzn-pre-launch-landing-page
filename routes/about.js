const express = require('express');
const router = express.Router();
const path = require('path');
const nodemailer = require('nodemailer');

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
   });
});

// Get Contact Thanks
router.get('/contact/thanks', (req, res, next) => {
   res.render('about/contact', {
     page_title: 'Thank You',
     notLoginPage: false,
     form_submitted: true,
   });
});

// Post Contact Form
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

module.exports = router;
