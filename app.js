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
const cors = require('cors')


const indexRouter = require('./routes/index'); // General site usage
const usersRouter = require('./routes/users'); // Registering / Logging in users
const projectsRouter = require('./routes/projects'); // Projects / Microposts
const aboutRouter = require('./routes/about'); // Site when not logged in
const blogRouter = require('./routes/blog'); // Main Hryzn Blog
const dashboardRouter = require('./routes/dashboard'); // Premium creator account dashboard
const creatorsRouter = require('./routes/creators'); // Checkout for creator subscriptions with Stripe


const app = express();

app.use(helmet());
app.use(cors());

const hbs = exphbs.create({});

// const http = require('http').Server(app);
// const io = require('socket.io')(http);
//
// io.on('connection', () =>{
//  console.log('a user is connected')
// })

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

const Category = require('./models/categories');
const User = require('./models/users');
const Project = require('./models/projects');
const Group = require('./models/groups');

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
   store: new MongoStore({ mongooseConnection: mongoose.connection }),
   rolling: true,
   cookie: {
      maxAge: 365 * 24 * 60 * 60 * 1000, // One Year
      secure: true,//cookieSecure,//true,
      httpOnly: true,//cookieHttp,//true,
      domain: '.myhryzn.com',//cookieDomain,//'.myhryzn.com',
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

    Category.find({}, (err, categories) => {

      User.find({}, (err, users) => {
         if (err) throw err;

         var all_public_users = [];

         users.forEach(function(user, key) {
           all_public_users.push(user.username);
         });

         Project.find({}, (err, projects) => {
            if (err) throw err;

            var all_public_projects = [];

            projects.forEach(function(project, key) {

               // Scan through every project

               var project = project.toObject();

               if (project.is_private != 'true') {
                 if(project.posted_to_collection) {
                    if (project.posted_to_collection.length > 0) {

                       // See if project has any collections

                       project.posted_to_collection.forEach(function(project_collection, key) {

                          if (project_collection.collection_is_private) {

                             // If collection was private skip project

                          } else {
                             // If collection was public mark that we scanned collection

                             if (project.project_title) {
                                all_public_projects.push(project.project_title);
                             } else {
                               if (project.micro_body) {
                                 all_public_projects.push(project.micro_body.slice(0, 100));
                               }
                            }
                          }
                       });
                    } else {
                       // No collections so we mark that we scanned project
                       if (project.project_title) {
                          all_public_projects.push(project.project_title);
                       } else {
                         if (project.micro_body) {
                           all_public_projects.push(project.micro_body.slice(0, 100));
                         }
                      }
                    }
                 } else {
                    // No collections so we mark that we scanned project
                    if (project.project_title) {
                       all_public_projects.push(project.project_title);
                    } else {
                      if (project.micro_body) {
                        all_public_projects.push(project.micro_body.slice(0, 100));
                      }
                   }
                 }
               }
            });

            Group.find({}, (err, groups) => {
               if (err) throw err;

               var all_public_groups = [];

               groups.forEach(function(group, key) {
                 if (group.is_private != 'true') {
                   all_public_groups.push(group.group_name);
                 }
               });

               res.locals.categories = categories;
               res.locals.all_usernames = all_public_users;
               res.locals.all_projects = all_public_projects;
               res.locals.all_groups = all_public_groups;

               next();
            })
         })
      })
    });
});

// Global Variables
app.use(function (req, res, next) {
   res.locals.success_msg = req.flash('success_msg');
   res.locals.error_msg = req.flash('error_msg');
   res.locals.error = req.flash('error');
   res.locals.site_url = req.get('host');
   res.locals.path = req.path;

   next();
});

app.use((req, res, next) => {
   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
   res.header('Access-Control-Allow-Headers', 'Authorization');
   res.header('Access-Control-Allow-Origin', '*');
   next();
});


app.use('/', indexRouter); // General site usage
app.use('/users', usersRouter); // Registering / Logging in users
app.use('/p', projectsRouter); // Projects / Microposts
app.use('/about', aboutRouter); // Site when not logged in
app.use('/blog', blogRouter); // Main Hryzn Blog
app.use('/dashboard', dashboardRouter); // Premium creator account dashboard
app.use('/creators', creatorsRouter); // Checkout for creator subscriptions with Stripe


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
