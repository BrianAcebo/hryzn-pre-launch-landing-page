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
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongo = require('mongodb');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const MongoStore = require('connect-mongo')(session);
const jwt = require('jsonwebtoken');
const helmet = require('helmet');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const projectsRouter = require('./routes/projects');
const aboutRouter = require('./routes/about');
const blogRouter = require('./routes/blog');
const dashboardRouter = require('./routes/dashboard');

const app = express();

app.use(helmet());

const hbs = exphbs.create({});

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'layout'}));
app.set('view engine', 'handlebars');

app.use('/scripts', express.static(__dirname + '/node_modules/'));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

hbs.handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

var cookieDomain;
var cookieHttp;
var cookieSecure;

// Redirect http to https
app.use(function (req, res, next) {

   var url_host = req.get('Host');

   if (req.subdomains.length && req.subdomains.slice(-1)[0] != 'www') {
     var wildcard_subdomain = true;
     console.log('yes wild subdomains');
   } else {
     var wildcard_subdomain = false;
     console.log('no wild subdomains');
   }

   if (url_host === 'localhost:5000' || url_host === '127.0.0.1:5000' || wildcard_subdomain) {

      // Set to development
      var env = process.env.NODE_ENV || 'development';
      var cookieDomain = 'localhost:5000';
      var cookieHttp = false;
      var cookieSecure = false;
      console.log('In development mode');

   } else {

      // Set to production
      var env = process.env.NODE_ENV || 'production';
      var cookieDomain = '.myhryzn.com';
      var cookieHttp = true;
      var cookieSecure = true;

      // if (req.headers['x-forwarded-proto'] !== 'https') {
      //    return res.redirect(['https://', req.get('Host'), req.url].join(''));
      // }

      console.log(cookieDomain);

   }

   next();
});


// Express Session
app.set('trust proxy', 1);
app.use(session({
   secret: '$2a$10$BJn0b4OzBarDigcTVxUl0urmExfHuhuVxSI.JrlLKeSsOi8oKqBAK',
   saveUninitialized: true,
   resave: true,
   store: new MongoStore({ mongooseConnection: mongoose.connection }),
   rolling: true,
   cookie: {
      maxAge: 365 * 24 * 60 * 60 * 1000, // One Year
      secure: cookieSecure,
      httpOnly: cookieHttp,
      domain: cookieDomain,
      expires: 365 * 24 * 60 * 60 * 1000
   }
}));

// Passport JS
app.use(passport.initialize());
app.use(passport.session());

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

// Global User Object
app.get('*', function (req, res, next) {
   res.locals.user = req.user || null;
   if(req.user) {
      res.locals.username = req.user.username;
      res.locals.email = req.user.email;
      res.locals.profileimage = req.user.profileimage;
   }

   jwt.sign({user: req.user}, 'SuperSecretKey', { expiresIn: "1h" }, (err, token) => {
      res.locals.csrf_web_token = 'Bearer '+ token;
   });
   next();
});

// Global Variables
app.use(function (req, res, next) {
   res.locals.success_msg = req.flash('success_msg');
   res.locals.error_msg = req.flash('error_msg');
   res.locals.error = req.flash('error');
   res.locals.site_url = req.get('host');
   next();
});

app.use((req, res, next) => {
   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
   res.header('Access-Control-Allow-Headers', 'Authorization');
   next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/p', projectsRouter);
app.use('/about', aboutRouter);
app.use('/blog', blogRouter);
app.use('/dashboard', dashboardRouter);

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
         error_404: true
      });
   } else {
      res.render('error', {
         page_title: 'There Seems To Be An Error',
         error_404: false
      });
   }
});

module.exports = app;
