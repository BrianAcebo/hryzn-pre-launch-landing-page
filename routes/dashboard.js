const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const keys = require('../config/keys');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const dateNow = Date.now().toString();
const jwt = require('jsonwebtoken');

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
const multipleUpload = multer({storage: multerS3(storage)}).any();

const User = require('../models/users');
const Project = require('../models/projects');
const Message = require('../models/messages');
const Notification = require('../models/notifications');
const Group = require('../models/groups');


// Get Dashboard
router.get('/', (req, res, next) => {
   if(req.isAuthenticated()) {
      res.render('dashboard/overview', {
        page_title: 'Dashboard Overview',
        notLoginPage: false,
        welcomePage: false,
        dashboard: true
      });
   } else {
      res.redirect('/');
   }
});


// Get Dashboard Build
router.get('/build', (req, res, next) => {
   if(req.isAuthenticated()) {
      res.render('dashboard/build', {
        page_title: 'Dashboard Build',
        notLoginPage: false,
        welcomePage: false,
        dashboard: true
      });
   } else {
      res.redirect('/');
   }
});


// Get Dashboard Manage
router.get('/manage', (req, res, next) => {
   if(req.isAuthenticated()) {
      res.render('dashboard/manage', {
        page_title: 'Dashboard Manage',
        notLoginPage: false,
        welcomePage: false,
        dashboard: true
      });
   } else {
      res.redirect('/');
   }
});


// Get Dashboard Marketing
router.get('/marketing', (req, res, next) => {
   if(req.isAuthenticated()) {
      res.render('dashboard/marketing', {
        page_title: 'Dashboard Marketing',
        notLoginPage: false,
        welcomePage: false,
        dashboard: true
      });
   } else {
      res.redirect('/');
   }
});


// Get Dashboard Monetize
router.get('/monetize', (req, res, next) => {
   if(req.isAuthenticated()) {
      res.render('dashboard/monetize', {
        page_title: 'Dashboard Monetize',
        notLoginPage: false,
        welcomePage: false,
        dashboard: true
      });
   } else {
      res.redirect('/');
   }
});


// Get Dashboard Analytics
router.get('/analytics', (req, res, next) => {
   if(req.isAuthenticated()) {
      res.render('dashboard/analytics', {
        page_title: 'Dashboard Analytics',
        notLoginPage: false,
        welcomePage: false,
        dashboard: true
      });
   } else {
      res.redirect('/');
   }
});


// Verify JS Web Token
function verifyToken(req, res, next) {

   var bearerReq = req.body._c_;

   console.log(bearerReq);

   if (typeof bearerReq !== 'undefined') {

      var bearerToken = bearerReq.split(' ')[1];
      req.token = bearerToken;

   } else {
      res.sendStatus(403);
   }

   next()
}

module.exports = router;
