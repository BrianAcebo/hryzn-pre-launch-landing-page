const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const mongo = require('mongodb');
const mongoose = require('mongoose');


const indexRouter = require('./routes/index'); // General site usage
const blogRouter = require('./routes/blog'); // Main Hryzn Blog


const app = express();


// View Engine
const hbs = exphbs.create({});
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'layout'}));
app.set('view engine', 'handlebars');


app.use('/scripts', express.static(__dirname + '/node_modules/'));


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


var cookieDomain;
var cookieHttp;
var cookieSecure;

// Redirect http to https
app.use(function (req, res, next) {

   var url_host = req.get('Host');
   var url_path = req.path;

   if (req.subdomains.length && req.subdomains.slice(-1)[0] != 'www') {

     if (url_path != '/') {

       return res.redirect('https://www.myhryzn.com' + url_path);

       var wildcard_subdomain = false;
       var continue_url = false;

     } else {
       var wildcard_subdomain = true;
       var continue_url = true;

       res.locals.on_wildcard_profile = true;
     }

   } else {
     var wildcard_subdomain = false;
     var continue_url = true;
   }

   if (continue_url) {
     if (url_host === 'localhost:5000' || url_host === '127.0.0.1:5000') {

        // Set to development
        var env = process.env.NODE_ENV || 'development';
        cookieHttp = false;
        cookieSecure = false;

        if (url_host === 'localhost:5000') {
          cookieDomain = 'localhost:5000';
        } else {
          cookieDomain = '127.0.0.1:5000';
        }

        console.log('In development mode');

     } else {

        // Set to production
        var env = process.env.NODE_ENV || 'production';
        cookieHttp = true;
        cookieSecure = true;
        cookieDomain = '.myhryzn.com';

        if (req.headers['x-forwarded-proto'] !== 'https') {
           return res.redirect(['https://', req.get('Host'), req.url].join(''));
        }

     }
   }

   next();
});


// Express Session
app.set('trust proxy', 1);
app.use(session({
   secret: '$2a$10$BJn0b4OzBarDigcTVxUl0urmExfHuhuVxSI.JrlLKeSsOi8oKqBAK',
   saveUninitialized: true,
   resave: true,
   rolling: true,
   cookie: {
      maxAge: 365 * 24 * 60 * 60 * 1000, // One Year
      secure: true,//cookieSecure,//true,
      //httpOnly: true,//cookieHttp,//true,
      //domain: '.myhryzn.com',//cookieDomain,//'.myhryzn.com',
      expires: 365 * 24 * 60 * 60 * 1000
   }
}));


// Express Validator
app.use(expressValidator({
   errorFormatter: function(param, msg, value) {
      var namespace = param.split('.'),
      root = namespace.shift(),
      formParam = root;

      while(namespace.length) {
         formParam += '[' + namespace.shift() + ']';
      }
      return {
         param: formParam,
         msg: msg,
         value: value
      };
   }
}));


// Connect-flash
app.use(flash());


// Global Variables
app.use(function (req, res, next) {
   res.locals.success_msg = req.flash('success_msg');
   res.locals.error_msg = req.flash('error_msg');
   res.locals.error = req.flash('error');
   res.locals.site_url = req.get('host');
   res.locals.path = req.path;

   next();
});


app.use('/', indexRouter); // General site usage
app.use('/blog', blogRouter); // Main Hryzn Blog


// Catch 404
app.use( function(req, res, next) {
  next(createError(404));
});

// Error Handler
app.use( function(err, req, res, next) {
   // set locals, only providing error in development
   res.locals.message = err.message;
   res.locals.error = req.app.get('env') === 'development' ? err : {};

   // render the error page
   res.status(err.status || 500);

   if(err.status === 404) {
      res.render('error', {
         page_title: 'File Not Found',
         error_404: true,
         message: err.message
      });
   } else {
      res.render('error', {
         page_title: 'There Seems To Be An Error',
         error_404: false,
         message: err.message
      });
   }
});

module.exports = app;
