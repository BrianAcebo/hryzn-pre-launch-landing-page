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

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const projectsRouter = require('./routes/projects');
const aboutRouter = require('./routes/about');

const app = express();

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'layout'}));
app.set('view engine', 'handlebars');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Express Session
app.use(session({
   secret: 'sessionSecretKey',
   saveUninitialized: true,
   resave: true,
   cookie: {
      maxAge: null
   }
}));

// Passport JS
app.use(passport.initialize());
app.use(passport.session());

// Express Validator
app.use(expressValidator({
   errorFormatter: (param, msg, value) => {
      var namespace = param.split('.')
      , root = namespace.shift()
      , formParam = root;

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
app.get('*', (req, res, next) => {
   res.locals.user = req.user || null;

   // Set global variables
   if(req.user) {
      res.locals.username = req.user.username;
      res.locals.email = req.user.email;
      res.locals.profileimage = req.user.profileimage;
   }
});

// Global
app.use((req, res, next) => {
   res.locals.success_msg = req.flash('success_msg');
   res.locals.error_msg = req.flash('error_msg');
   res.locals.errors_2 = req.flash('errors_2');
   res.locals.error = req.flash('error');
   res.locals.site_url = req.get('host');

   // Redirect all unsecure URLs to HTTPS
   if(!req.secure) {
     var httpsUrl = "https://" + req.headers['host'] + req.url;
     res.writeHead(301, { "Location":  httpsUrl });
     res.end();
   }

   next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/p', projectsRouter);
app.use('/about', aboutRouter);

// Catch 404
app.use((req, res, next) => {
  next(createError(404));
});

// Error Handler
app.use((err, req, res, next) => {
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
