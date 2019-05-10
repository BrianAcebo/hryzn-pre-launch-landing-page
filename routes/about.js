const express = require('express');
const router = express.Router();
const path = require('path');

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
     notLoginPage: false
   });
});


module.exports = router;
