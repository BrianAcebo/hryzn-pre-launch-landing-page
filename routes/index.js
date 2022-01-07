const express = require('express');
const router = express.Router();
const path = require('path');
const keys = require('../config/keys');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const sendEmail = require("../utils/sendEmail.js");
const isEmail = require('validator/lib/isEmail');

const Email = require('../models/emails');
const Blog = require('../models/blogs');
const Post = require('../models/post');


// To create csv file for email list

// const createCsvWriter = require('csv-writer').createObjectCsvWriter;
// var emails = [];
//
// User.find({}, (err, users) => {
//   users.forEach(function(user, key) {
//     var emailObject = {
//       email: user.email
//     }
//     emails.push(emailObject);
//   });
//
//
//  console.log(emails);
//
//  const csvWriter = createCsvWriter({
//    path: 'email-list_2.csv',
//    header: [
//      {id: 'email', title: 'Email'}
//    ]
//  });
//
//  csvWriter
//    .writeRecords(emails)
//    .then(()=> console.log('The CSV file was written successfully'));
//
// });


// Get Home Landing Page
router.get('/', (req, res, next) => {

  const { email_error } = req.query;

  let emailErrorMsg = false;

  if (email_error && email_error === 'exists') {

    emailErrorMsg = 'Sorry, this email is already in use.';

  } else if (email_error) {

    emailErrorMsg = 'Sorry, there was an error.';

  }

  Post.find({}, (err, posts) => {

     if (err) throw err;

     const blog_posts = []
     const rev_posts = posts.reverse();

     // Check if first 4 posts are drafts and skip over them
     if (typeof posts != 'undefined') {

       if (posts[0].is_draft) {

         blog_posts.push(posts[1]);
         blog_posts.push(posts[2]);
         blog_posts.push(posts[3]);
         blog_posts.push(posts[4]);

       } else if (posts[1].is_draft) {

         blog_posts.push(posts[0]);
         blog_posts.push(posts[2]);
         blog_posts.push(posts[3]);
         blog_posts.push(posts[4]);

       } else if (posts[2].is_draft) {

         blog_posts.push(posts[0]);
         blog_posts.push(posts[1]);
         blog_posts.push(posts[3]);
         blog_posts.push(posts[4]);

       } else if (posts[3].is_draft) {

         blog_posts.push(posts[0]);
         blog_posts.push(posts[1]);
         blog_posts.push(posts[2]);
         blog_posts.push(posts[4]);

       } else {

         blog_posts.push(posts[0]);
         blog_posts.push(posts[1]);
         blog_posts.push(posts[2]);
         blog_posts.push(posts[3]);

       }

     }

      res.render('index', {
         page_title: "Find your people with the power of Web 3.0",
         blog_posts: blog_posts,
         email_error: emailErrorMsg
      });

 });

});


// POST Create Post
router.post('/', (req, res, next) => {

  const email = req.body.email.trim();
  const honeyPot = req.body.hp_name;

  // Form Validation
  req.checkBody('email', 'Please Enter An Email Address').notEmpty();
  req.checkBody('email', 'Please Enter A Valid Email Address').isEmail();

  const errors = req.validationErrors();

  if (!errors && !honeyPot) {

    // Check to see if the email already exists
    Email.findOne({ email: email }, async (err, emailInDataBase) => {

      if (!emailInDataBase) {

        // Send confirmation email to new sign up with send grid
        const emailData = {
          templateName: 'confirmation_verify_email', // email template
          sender: 'Hryzn <hello@myhryzn.com>', // sender email
          receiver: email // receiver email
        };

        sendEmail.sendEmail(emailData);

        // Send them to verify page
        res.render('email-verify', {
           page_title: "Let's verify your email",
           email: email
        });

      } else {
        res.redirect('/?email_error=exists');
      }

    });

  } else {

    res.redirect('/?email_error=true');

  }
});


// Get resend verify email
router.get('/resend/:email', (req, res, next) => {

  const { email } = req.params;

  // Send confirmation email to new sign up with send grid
  const emailData = {
    templateName: 'confirmation_verify_email', // email template
    sender: 'Hryzn <hello@myhryzn.com>', // sender email
    receiver: email // receiver email
  };

  sendEmail.sendEmail(emailData);

  // Send them to verify page
  res.render('email-verify', {
     page_title: "Let's verify your email",
     email: email,
     resend: true
  });

});


// Get success after confirmed email address
router.get('/success/:email', (req, res, next) => {

  const { email } = req.params;

  if (!isEmail(email)) {

    // User sent invalid email
    res.redirect('/');

  } else {

    // Check to see if the email already exists
    Email.findOne({ email: email }, async (err, emailInDataBase) => {

      if (!emailInDataBase) {

        // Check to see if the share link reference already exists
        let share_ref;
        let shareRefExists;


        // Run a loop just to keep changing share ref if it already exists
        do {
          share_ref = 'H'+(Math.random()*0xFFFFFF<<0).toString(16);
          shareRefExists = await Email.findOne({ share_ref: share_ref });
        }
        while (shareRefExists);

        let place_in_wait_list = 0;


        if (!shareRefExists) {

          // Find the last email in line
          const lastInLine = await Email.find().sort({ _id:-1 }).limit(1);

          if (lastInLine[0].place_in_wait_list) {

            // Add their place in line at the end
            place_in_wait_list = parseInt(lastInLine[0].place_in_wait_list) + 1;

          } else {

            // First in line
            place_in_wait_list = 1;

          }

        }


        // Create object in db
        const emailSuccess = await new Email({
          email: email,
          share_ref: share_ref,
          place_in_wait_list: place_in_wait_list
        }).save();


        if (emailSuccess) {

          // Send confirmation email to new sign up with send grid
          const emailData = {
            templateName: 'welcome_wait_list', // email template
            sender: 'Hryzn <hello@myhryzn.com>', // sender email
            receiver: email, // reciever email
            place_in_wait_list: place_in_wait_list - 1, // people ahead in line
            share_ref: share_ref // share link reference
          };

          sendEmail.sendEmail(emailData);


          // Gmail credentials for nodemailer
          const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
              user: 'hello@myhryzn.com',
              pass: '+ar+oo-55'
            }
          });


          // Email Brian about new user
          let mailOptions = {
            from: '"Hryzn" <hello@myhryzn.com>',
            to: '"Brian" <brianacebo@gmail.com>',
            subject: 'New email in waitlist!',
            text: email + ' was added to the Hryzn email waitlist.'
          }

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log(error)
            }
          });


          // Email Brandon about new user
          mailOptions = {
            from: '"Hryzn" <hello@myhryzn.com>',
            to: '"Brandon" <wokeupwitabankroll@protonmail.com>',
            subject: 'New email in waitlist!',
            text: email + ' was added to the Hryzn email waitlist.'
          }

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log(error)
            }
          });

          res.render('email-success', {
             page_title: "Welcome to our community!",
             email: email,
             share_ref: share_ref,
             people_ahead: place_in_wait_list - 1
          });
        }

      } else {

        // Email exists so let's show them their data
        res.render('email-success', {
           page_title: "Welcome to our community!",
           email: emailInDataBase.email,
           share_ref: emailInDataBase.share_ref,
           people_ahead: emailInDataBase.place_in_wait_list - 1
        });
      }

    });

  }

});


// GET Contribute
router.get('/contribute', (req, res, next) => {
   res.redirect('https://wefunder.com/hryzninc')
});


module.exports = router;
