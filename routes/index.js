const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const keys = require('../config/keys');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const dateNow = Date.now().toString();

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

// Get Welcome Landing Page
router.get('/welcome', (req, res, next) => {
   if(req.isAuthenticated()) {
      res.redirect('/');
   } else {

      var featured_projects = [
         '5cdc5b07294e1e0017d3f87e',
         '5ec2d44b3140810017388fd9',
         '5ec7e44081ccba00177f86d0',
         '5ec16bceb65710001792819c',
         '5e9379216387290017b85ebb',
         '5cda25cc5f66f6001759268a',
         '5e7d700888041a0017351dc4',
         '5e8e799102b32d001725d5bb'
      ];

      Project.find({ '_id': { $in: featured_projects } }, (err, projects) => {
         if (err) throw err;

         res.render('welcome', {
           page_title: 'Create, explore, and share your ideas on a powerful social writing platform',
           notLoginPage: false,
           projects: projects,
           welcomePage: true
         });
      }).limit(8);

   }
});

// Get Index (User is logged in)
router.get('/', (req, res, next) => {
   if(req.isAuthenticated()) {

      // Greeting was not working on iphone

      // var now = new Date();
      // var time = now.getHours();
      //
      // console.log(time);

      // if (time >= 12 && time < 18) {
      //    var greeting = 'Good afternoon';
      // } else if (time >= 18 && time < 24) {
      //    var greeting = 'Good evening';
      // } else {
      //    var greeting = 'Good morning';
      // }

      var greeting = 'Hello'

      // User's Subscriptions Feed
      if (req.user.following) {
         User.find({ 'username': { $in: req.user.following } }, (err, profiles) => {
            if (err) throw err;

            var profile_project = [];

            profiles.forEach(function(profile, key) {
               profile.own_projects.forEach(function(proj, key) {
                  profile_project.push(proj);
               });
               profile.reposted_projects.forEach(function(proj, key) {
                  profile_project.push(proj);
               });
            });

            Project.find({ '_id': { $in: profile_project } }, (err, projects) => {
               if (err) throw err;

               res.render('index', {
                  page_title: 'Explore Projects',
                  greeting: greeting,
                  projects: projects.reverse(),
                  profiles: profiles,
                  explore_default: true
               });
            });
         });
      } else {
         res.redirect('/explore');
      }
   } else {
      res.redirect('/welcome');
   }
});


// Get All Groups
router.get('/groups', (req, res, next) => {
   if(req.isAuthenticated()) {

      var group_ids = [];

      req.user.groups.forEach(function(group, key) {
         group_ids.push(group.group_id);
      });
      Group.find({ '_id': { $in: group_ids} }, (err, groups) => {

         if (err) throw err;

         res.render('groups', {
            page_title: 'Groups',
            groups: groups,
            groupEdit: true
         });

      });

   } else {
      res.redirect('/welcome');
   }
});


// POST Create Group
router.post('/create-group', upload.single('group_image'), (req, res, next) => {

   if(req.isAuthenticated()) {

      var id = req.body.id;
      var user = req.body.user;
      var group_name = req.body.group_name.replace(/\r\n/g,'');
      var is_private = req.body.is_private;
      var group_admin = req.user.username;
      var users = [user];

      if (req.body.group_categories) {
         var group_categories = req.body.group_categories;
      } else {
         var group_categories = [];
      }

      if(is_private) {
         var hex = 'G'+(Math.random()*0xFFFFFF<<0).toString(16);
         var dateNow = Date.now().toString();
         dateNow = dateNow.slice(0,3);
         var group_code = hex + dateNow;
      }

      if(req.file) {

         // If user uploaded an image for project
         var ext = path.extname(req.file.originalname);

         // Check if file is an image
         if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {

            User.findById(id, (err, user) => {
               if(err) throw err;

               res.render('groups', {
                  error_msg: 'File Must End With .jpg .jpeg .png .gif',
                  page_title: 'Groups',
                  group_name: group_name,
                  is_private: is_private,
                  group_admin: group_admin,
                  group_error: true,
                  groupEdit: true,
                  user: user
               });
            });

         } else {
            // No errors have been made
            // var fileExt = req.file.originalname.split('.').pop();
            var group_image = dateNow + req.file.originalname;

            var newGroup = new Group({
               users: users,
               group_name: group_name,
               is_private: is_private,
               group_admin: group_admin,
               group_image: group_image,
               group_code: group_code,
               group_categories: group_categories
            });

            // Create group in database
            Group.saveGroup(newGroup, (err, group) => {
               if(err) throw err;

               // Add group to User document
               info = [];
               info['profileUsername'] = req.user.username;
               info['groupId'] = group._id.toString();
               info['groupName'] = group.group_name.toString();

               User.addGroup(info, (err, user) => {
                  if(err) throw err;
               });

               req.flash('success_msg', "Group was created.");
               res.redirect('/groups/' + group._id);
            });

         }
      } else {

         var group_image = 'hryzn-placeholder-01.jpg';

         var newGroup = new Group({
            users: users,
            group_name: group_name,
            is_private: is_private,
            group_admin: group_admin,
            group_image: group_image,
            group_code: group_code,
            group_categories: group_categories
         });

         // Create group in database
         Group.saveGroup(newGroup, (err, group) => {
            if(err) throw err;

            // Add group to User document
            info = [];
            info['profileUsername'] = req.user.username;
            info['groupId'] = group._id.toString();
            info['groupName'] = group.group_name.toString();

            User.addGroup(info, (err, user) => {
               if(err) throw err;
            });

            req.flash('success_msg', "Group was created.");
            res.redirect('/groups/' + group._id);
         });
      }

   } else {
      res.redirect('/welcome');
   }
});


// Get Group Detail
router.get('/groups/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      Group.findOne({ '_id': { $in: req.params.id} }, (err, group) => {

         if (err) throw err;

         if (group) {

            if (group.users.indexOf(req.user.username) > -1) {
               var userNotJoined = false;
            } else {
               var userNotJoined = true;
            }

            var allowed;

            if (group.is_private) {
               group.users.forEach(function(user, key) {
                  if (user === req.user.username) {
                     allowed = true;
                  } else {
                     // Hryzn Admin
                     if (req.user.username === 'hryzn') {
                        allowed = true;
                     } else {
                        allowed = false;
                     }
                  }
               });
            } else {
               allowed = true;
            }

            if (allowed) {

               if (group.group_admin === req.user.username) {
                  var groupAdmin = true;
               } else {
                  // Hryzn Admin
                  if (req.user.username === 'hryzn') {
                     var groupAdmin = true;
                  } else {
                     var groupAdmin = false;
                  }
               }

               Project.find({ '_id': { $in: group.projects} }, (err, projects) => {
                  if (err) throw err;

                  User.find({ 'username': { $in: group.users} }, (err, users) => {
                     if (err) throw err;

                     res.render('groups/group-detail', {
                        page_title: group.group_name,
                        group: group,
                        projects: projects,
                        groupAdmin: groupAdmin,
                        users: users,
                        userNotJoined: userNotJoined
                     });
                  });
               });
            } else {
               res.redirect('/groups');
            }
         } else {
            res.redirect('/groups');
         }

      });

   } else {
      res.redirect('/welcome');
   }
});


// Get Edit Group
router.get('/groups/edit/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      Group.findOne({ '_id': { $in: req.params.id} }, (err, group) => {

         if (err) throw err;

         if (group.group_admin === req.user.username) {
            res.render('groups/edit-group', {
               page_title: group.group_name,
               group: group,
               groupEdit: true
            });
         } else {
            res.redirect('/groups');
         }

      });

   } else {
      res.redirect('/welcome');
   }
});


// POST Edit Group
router.post('/groups/edit/:id', upload.single('group_image'), (req, res, next) => {

   if(req.isAuthenticated()) {

      var id = req.body.id;
      var user = req.body.user;
      var group_name = req.body.group_name.replace(/\r\n/g,'');
      var is_private = req.body.is_private;

      if (req.body.group_categories) {
         var group_categories = req.body.group_categories;
      } else {
         var group_categories = false;
      }

      if(req.file) {

         // If user uploaded an image for project
         var ext = path.extname(req.file.originalname);

         // Check if file is an image
         if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {

            User.findById(id, (err, user) => {
               if(err) throw err;

               res.render('groups/edit-group', {
                  error_msg: 'File Must End With .jpg .jpeg .png .gif',
                  page_title: 'Groups',
                  group_name: group_name,
                  is_private: is_private,
                  group_error: true,
                  groupEdit: true,
                  user: user
               });
            });

         } else {
            // No errors have been made
            // var fileExt = req.file.originalname.split('.').pop();
            var group_image = dateNow + req.file.originalname;

            var info = [];
            info['groupId'] = req.params.id;
            info['groupName'] = group_name;
            info['groupIsPrivate'] = is_private;

            Group.findOne({ '_id': { $in: req.params.id} }, (err, group) => {
               if (group.projects) {
                  group.projects.forEach(function(project, key) {
                     Project.findOne({ '_id': { $in: project} }, (err, project) => {
                        if (project) {
                           info['projectId'] = project._id.toString();
                           Project.updateGroup(info, (err, project) => {
                              if(err) throw err;
                           });
                        }
                     });
                  });
               }

               if (group.users) {
                  group.users.forEach(function(user, key) {
                     User.findOne({ 'username': { $in: user} }, (err, user) => {
                        if (user) {
                           info['userId'] = user._id.toString();
                           User.updateGroup(info, (err, user) => {
                              if(err) throw err;
                           });
                        }
                     });
                  });
               }
            });

            if (group_categories) {
               Group.findByIdAndUpdate(req.params.id, {
                  group_name: group_name,
                  is_private: is_private,
                  group_image: group_image,
                  group_categories: group_categories
               }, (err, user) => {
                  if (err) throw err;
               });
            } else {
               Group.findByIdAndUpdate(req.params.id, {
                  group_name: group_name,
                  is_private: is_private,
                  group_image: group_image
               }, (err, user) => {
                  if (err) throw err;
               });
            }

            req.flash('success_msg', "Group was updated.");
            res.redirect('/groups/' + req.params.id);

         }
      } else {

         var info = [];
         info['groupId'] = req.params.id;
         info['groupName'] = group_name;
         info['groupIsPrivate'] = is_private;

         Group.findOne({ '_id': { $in: req.params.id} }, (err, group) => {
            if (group.projects) {
               group.projects.forEach(function(project, key) {
                  Project.findOne({ '_id': { $in: project} }, (err, project) => {
                     if (project) {
                        info['projectId'] = project._id.toString();
                        Project.updateGroup(info, (err, project) => {
                           if(err) throw err;
                        });
                     }
                  });
               });
            }

            if (group.users) {
               group.users.forEach(function(user, key) {
                  User.findOne({ 'username': { $in: user} }, (err, user) => {
                     if (user) {
                        info['userId'] = user._id.toString();
                        User.updateGroup(info, (err, user) => {
                           if(err) throw err;

                           console.log(user);
                        });
                     }
                  });
               });
            }
         });

         if (group_categories) {
            Group.findByIdAndUpdate(req.params.id, {
               group_name: group_name,
               is_private: is_private,
               group_categories: group_categories
            }, (err, user) => {
               if (err) throw err;
            });
         } else {
            Group.findByIdAndUpdate(req.params.id, {
               group_name: group_name,
               is_private: is_private
            }, (err, user) => {
               if (err) throw err;
            });
         }

         req.flash('success_msg', "Group was updated.");
         res.redirect('/groups/' + req.params.id);
      }

   } else {
      res.redirect('/welcome');
   }
});


// Get Join Group
router.get('/groups/:groupId/join', (req, res, next) => {
   if(req.isAuthenticated()) {

      Group.findOne({ '_id': { $in: req.params.groupId} }, (err, group) => {

         if (err) throw err;

         if (group) {
            if (group.users.indexOf(req.user.username) > -1) {
               res.redirect('/groups/' + req.params.groupId);
            } else {
               // Add group to User document
               info = [];
               info['profileUsername'] = req.user.username;
               info['groupId'] = req.params.groupId;
               info['groupName'] = group.group_name.toString();

               // Send notification to the user mentioned
               User.findOne({ 'username': { $in: group.group_admin} }, (err, reciever) => {
                  if (err) throw err;

                  var newNotification = new Notification({
                     sender: req.user._id,
                     reciever: reciever._id,
                     type: '@' + req.user.username + ' joined your group.',
                     link: '/groups/' + req.params.groupId
                  });

                  // Create notification in database
                  Notification.saveNotification(newNotification, (err, notification) => {
                     if(err) throw err;

                     // Add Notification for User
                     User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                        if (err) throw err;
                     });
                  });
               });

               User.addGroup(info, (err, user) => {
                  if(err) throw err;
               });

               Group.addUser(info, (err, group) => {
                  if(err) throw err;

                  req.flash('success_msg', "Joined group.");
                  res.redirect('/groups/' + req.params.groupId);
               });
            }
         } else {
            res.redirect('/groups');
         }

      });

   } else {
      res.redirect('/welcome');
   }
});


// Post Join Private Group
router.post('/groups/join/private/code', (req, res, next) => {
   if(req.isAuthenticated()) {

      Group.findOne({ 'group_code': { $in: req.body.group_code} }, (err, group) => {

         if (err) throw err;

         if (group) {
            if (group.group_admin === req.user.username) {
               res.redirect('/groups');
            } else {
               // Add group to User document
               info = [];
               info['profileUsername'] = req.user.username;
               info['groupId'] = group._id;
               info['groupName'] = group.group_name.toString();

               // Send notification to group admin
               User.findOne({ 'username': { $in: group.group_admin} }, (err, reciever) => {
                  if (err) throw err;

                  var newNotification = new Notification({
                     sender: req.user._id,
                     reciever: reciever._id,
                     type: '@' + req.user.username + ' joined your group.',
                     link: '/groups/' + group._id
                  });

                  // Create notification in database
                  Notification.saveNotification(newNotification, (err, notification) => {
                     if(err) throw err;

                     // Add Notification for User
                     User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                        if (err) throw err;
                     });
                  });
               });

               User.addGroup(info, (err, user) => {
                  if(err) throw err;
               });

               Group.addUser(info, (err, group) => {
                  if(err) throw err;

                  req.flash('success_msg', "Joined group.");
                  res.redirect('/groups/' + group._id);
               });
            }
         } else {
            res.redirect('/groups');
         }

      });

   } else {
      res.redirect('/welcome');
   }
});


// Get Kick Out User
router.get('/groups/:groupId/kick/profile/:username', (req, res, next) => {
   if(req.isAuthenticated()) {

      if (req.params.username === req.user.username) {
         var self_kick = true;
      } else {
         var self_kick = false;
      }

      Group.findOne({ '_id': { $in: req.params.groupId} }, (err, group) => {

         if (err) throw err;

         if (group.group_admin === req.user.username || self_kick) {
            if (group.group_admin === req.params.username) {
               res.redirect('/groups/' + req.params.groupId);
            } else {
               // Add group to User document
               info = [];
               info['profileUsername'] = req.params.username;
               info['groupId'] = req.params.groupId;
               info['groupName'] = group.group_name.toString();


               if (self_kick) {
                  var link = '/groups';
                  var msg = 'Left the group.'
               } else {
                  var link = '/groups/' + req.params.groupId;
                  var msg = 'User was removed.'

                  // Send notification to the user mentioned
                  User.findOne({ 'username': { $in: req.params.username} }, (err, reciever) => {
                     if (err) throw err;

                     var newNotification = new Notification({
                        sender: req.user._id,
                        reciever: reciever._id,
                        type: 'Sorry, you were removed from the group ' + group.group_name,
                        link: '/groups'
                     });

                     // Create notification in database
                     Notification.saveNotification(newNotification, (err, notification) => {
                        if(err) throw err;

                        // Add Notification for User
                        User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                           if (err) throw err;
                        });
                     });
                  });
               }

               User.removeGroup(info, (err, user) => {
                  if(err) throw err;
               });

               Group.removeUser(info, (err, group) => {
                  if(err) throw err;

                  req.flash('success_msg', msg);
                  res.redirect(link);
               });
            }
         } else {
            res.redirect('/groups');
         }

      });

   } else {
      res.redirect('/welcome');
   }
});


// Get Remove Project
router.get('/groups/:groupId/remove/:projectId', (req, res, next) => {
   if(req.isAuthenticated()) {

      Group.findOne({ '_id': { $in: req.params.groupId} }, (err, group) => {

         if (err) throw err;

         if (group.group_admin === req.user.username) {

            Project.findOne({ '_id': { $in: req.params.projectId} }, (err, project) => {

               info = [];
               info['projectId'] = req.params.projectId;
               info['groupId'] = req.params.groupId;
               info['groupName'] = group.group_name.toString();

               // Send notification to the user mentioned
               User.findOne({ 'username': { $in: project.project_owner} }, (err, reciever) => {
                  if (err) throw err;

                  var newNotification = new Notification({
                     sender: req.user._id,
                     reciever: reciever._id,
                     type: 'Sorry, your project removed from the group ' + group.group_name,
                     link: '/groups'
                  });

                  // Create notification in database
                  Notification.saveNotification(newNotification, (err, notification) => {
                     if(err) throw err;

                     // Add Notification for User
                     User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                        if (err) throw err;
                     });
                  });
               });

               Project.removeGroup(info, (err, user) => {
                  if(err) throw err;
               });

               Group.removeProject(info, (err, group) => {
                  if(err) throw err;

                  req.flash('success_msg', "Project was removed.");
                  res.redirect('/groups/' + group._id);
               });
            });
         } else {
            res.redirect('/groups');
         }

      });

   } else {
      res.redirect('/welcome');
   }
});


// Delete Group
router.get('/groups/delete/:id/:deleteAll', (req, res, next) => {
   if(req.isAuthenticated()) {

      if (req.params.deleteAll === 'true') {
         var deleteProjects = true;
      } else  {
         var deleteProjects = false;
      }

      Group.findById(req.params.id, (err, group) => {
         if(err) throw err;

         if (group.group_admin === req.user.username) {

            if (group.is_private && deleteProjects) {

               // Delete Everything

               if(group.projects.length) {

                  group.projects.forEach(function(proj, key) {
                     // Find project to delete
                     Project.findById(proj, (err, project) => {
                        if(err) throw err;

                        var info = [];

                        // If project has saves
                        if(project.saves.length) {

                           for (var i = 0, len = project.saves.length; i < len; i++) {
                              info['profileUsername'] = project.saves[i];
                              info['projectId'] = project._id;

                              User.unsaveToProfile(info, (err, user) => {
                                 if(err) throw err;
                              });
                           }

                        }

                        // If project has admins
                        if(project.project_owner.length) {
                           info['profileUsername'] = project.project_owner;
                           info['projectId'] = project._id;

                           console.log(info['projectId']);

                           User.deleteFromProfile(info, (err, user) => {
                              if(err) throw err;

                              console.log(user);
                           });
                        }

                        // If project has reposts
                        if(project.reposts.length) {
                           for (var i = 0, len = project.reposts.length; i < len; i++) {
                              info['profileUsername'] = project.reposts[i];
                              info['projectId'] = project._id;

                              User.unrepostProject(info, (err, user) => {
                                 if(err) throw err;
                              });
                           }
                        }

                        // Delete project image
                        var s3_instance = new aws.S3();
                        var s3_params = {
                           Bucket: 'hryzn-app-static-assets',
                           Key: project.project_image
                        };
                        s3_instance.deleteObject(s3_params, (err, data) => {
                           if(data) {
                              console.log("File deleted");
                           }
                           else {
                              console.log("No delete : " + err);
                           }
                        });

                        // Delete the project
                        Project.findByIdAndRemove(project._id, (err) => {
                          if (err) throw err;
                        });

                     });
                  });

               }

               // If group has users
               if(group.users.length) {

                  for (var i = 0, len = group.users.length; i < len; i++) {
                     var info = [];
                     info['profileUsername'] = group.users[i];
                     info['groupId'] = req.params.id;

                     User.removeGroup(info, (err, user) => {
                        if(err) throw err;
                     });
                  }

               }

               // Delete the Group
               Group.findByIdAndRemove(req.params.id, (err) => {
                 if (err) throw err;
                 req.flash('success_msg', "Destroyed From Existence...");
                 res.redirect('/groups');
               });

            } else {

               // Keep Projects

               if(group.projects.length) {

                  group.projects.forEach(function(proj, key) {
                     var info = [];
                     info['projectId'] = proj;
                     info['groupId'] = req.params.id;

                     Project.removeGroup(info, (err, project) => {
                        if(err) throw err;
                     });

                  });

               }

               // If group has users
               if(group.users.length) {

                  for (var i = 0, len = group.users.length; i < len; i++) {
                     var info = [];
                     info['profileUsername'] = group.users[i];
                     info['groupId'] = req.params.id;

                     User.removeGroup(info, (err, user) => {
                        if(err) throw err;
                     });
                  }

               }

               // Delete the Group
               Group.findByIdAndRemove(req.params.id, (err) => {
                 if (err) throw err;
                 req.flash('success_msg', "Destroyed From Existence...");
                 res.redirect('/groups');
               });

            }

         } else {
            res.redirect('/groups');
         }
      });
   } else {
      res.redirect('/welcome');
   }
});


// Get All Chats
router.get('/messages', (req, res, next) => {
   if(req.isAuthenticated()) {
      Message.find({ '_id': { $in: req.user.messages} }, (err, messages) => {

         if (err) throw err;

         if (messages.length > 0) {
            var has_messages = true;
         } else {
            var has_messages = false;
         }

         User.find({ 'username': { $in: req.user.following} }, (err, following) => {

            if (err) throw err;

            res.render('messages', {
               page_title: 'Messages',
               has_messages: has_messages,
               messages: messages,
               following: following
            });

         });

      });

   } else {
      res.redirect('/welcome');
   }
});


// New / Old Message Redirect
router.get('/messages/:username', (req, res, next) => {
   if(req.isAuthenticated()) {

      User.findOne({ 'username': { $in: req.params.username} }, (err, user) => {

         if (err) throw err;

         var chat_id;

         user.messages.forEach(function(msg, key) {
            req.user.messages.forEach(function(user_msg, key) {
               if (user_msg === msg) {
                  chat_id = user_msg;
               }
            });
         });

         Message.findOne({ '_id': { $in: chat_id } }, (err, message) => {

            if (err) throw err;

            if (message) {
               res.redirect('/messages/chat/' + message.id);
            } else {
               res.redirect('/messages/new/' + req.params.username);
            }

         });


      });

   } else {
      res.redirect('/welcome');
   }
});


// Get Old Message Chat
router.get('/messages/chat/:messageId', (req, res, next) => {
   if(req.isAuthenticated()) {

      Message.findOne({ '_id': { $in: req.params.messageId } }, (err, message) => {

         if (err) throw err;

         res.render('messages/chat', {
            page_title: 'Messages',
            new_chat: false,
            message: message,
            chat: true
         });

      });

   } else {
      res.redirect('/welcome');
   }
});


// Delete Old Message Chat
router.get('/messages/chat/delete/:messageId', (req, res, next) => {
   if(req.isAuthenticated()) {

      Message.findById(req.params.messageId, (err, message) => {
         if(err) throw err;

         var info = [];

         // Delete chat from user's profile
         if(message.users.length) {

            for (var i = 0, len = message.users.length; i < len; i++) {
               info['profileUsername'] = message.users[i];
               info['messageId'] = req.params.messageId;

               User.removeChat(info, (err, user) => {
                  if(err) throw err;
               });
            }

         }

         Message.findByIdAndRemove(message._id, (err) => {
            if (err) throw err;

            req.flash('success_msg', "Chat was deleted.");
            res.redirect('/messages');
         });

      });

   } else {
      res.redirect('/welcome');
   }
});


// Post Old Message Chat
router.post('/messages/chat/:messageId', (req, res, next) => {
   if(req.isAuthenticated()) {

      info = [];
      info['userUsername'] = req.body.username;
      info['messageId'] = req.params.messageId;
      if (req.body.profileimage) {
         info['profileimage'] = req.body.profileimage;
      } else {
         info['profileimage'] = 'hryzn-placeholder-01.jpg';
      }
      info['message'] = req.body.message.replace(/\r\n/g,'');

      // Add message
      Message.addMessage(info, (err, message) => {
         if(err) throw err

         Message.findOne({ '_id': { $in: req.params.messageId} }, (err, message) => {
            message.users.forEach(function(user, key) {
               if (user != req.user.username) {
                  // Send notification to the user mentioned
                  User.findOne({ 'username': { $in: user} }, (err, reciever) => {
                     if (err) throw err;

                     var newNotification = new Notification({
                        sender: req.user._id,
                        reciever: reciever._id,
                        type: '@' + req.body.username + ' messaged you.',
                        link: '/messages/chat/' + req.params.messageId
                     });

                     // Create notification in database
                     Notification.saveNotification(newNotification, (err, notification) => {
                        if(err) throw err;

                        // Add Notification for User
                        User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                           if (err) throw err;
                        });
                     });
                  });
               }
            });
         });

         req.flash('success_msg', "Message Sent");
         res.redirect('/messages/chat/' + req.params.messageId);
      });

   } else {
      res.redirect('/welcome');
   }
});


// Get New Message Chat
router.get('/messages/new/:username', (req, res, next) => {
   if(req.isAuthenticated()) {

      User.findOne({ 'username': { $in: req.params.username} }, (err, user) => {

         if (err) throw err;

         res.render('messages/chat', {
            page_title: 'Messages',
            new_chat: true,
            other_user: user.username,
            chat: true
         });

      });

   } else {
      res.redirect('/welcome');
   }
});


// Post New Message Chat
router.post('/messages/new/:username', (req, res, next) => {
   if(req.isAuthenticated()) {

      var info = [];

      var users = req.body.users;
      var sent_by = req.user.username;
      if (req.body.profileimage) {
         info['profileimage'] = req.body.profileimage;
      } else {
         info['profileimage'] = 'hryzn-placeholder-01.jpg';
      }
      var message = req.body.message.replace(/\r\n/g,'');

      var newMessage = new Message({
         users: users,
         messages: {
            username: sent_by,
            profileimage: info['profileimage'],
            message: message
         }
      });

      // Create message in database
      Message.saveMessage(newMessage, (err, message) => {
         if(err) throw err;

         // Add chat for User
         users.forEach(function(user, key) {
            info = [];
            info['profileUsername'] = user;
            info['messageId'] = message._id.toString();

            User.addChat(info, (err, user) => {
               if(err) throw err;
            });
         });

         // Send notification to the user mentioned
         User.findOne({ 'username': { $in: req.params.username} }, (err, reciever) => {
            if (err) throw err;

            var newNotification = new Notification({
               sender: req.user._id,
               reciever: reciever._id,
               type: '@' + req.user.username + ' messaged you.',
               link: '/messages/chat/' + message._id
            });

            // Create notification in database
            Notification.saveNotification(newNotification, (err, notification) => {
               if(err) throw err;

               // Add Notification for User
               User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                  if (err) throw err;
               });
            });
         });

         req.flash('success_msg', "Message was sent.");
         res.redirect('/messages');
      });

   } else {
      res.redirect('/welcome');
   }
});


// Get User Logout
router.get('/logout', (req, res, next) => {
   if(req.isAuthenticated() || req.session) {
      req.logout();
      req.session.destroy( (err) => {
         res.clearCookie('connect.sid');
         res.redirect('/welcome');
      });
   } else {
      res.redirect('/welcome');
   }
});


// Get Notifications
router.get('/notifications', (req, res, next) => {
   if(req.isAuthenticated()) {
      Notification.find({ 'reciever': { $in: req.user._id} }, (err, notifications) => {

         if (err) throw err;

         // Add Notification for User
         User.findByIdAndUpdate(req.user._id, { has_notification: false }, (err, user) => {
            if (err) throw err;
         });

         res.render('notifications', {
            page_title: 'Notifications',
            notifications: notifications.reverse(),
            notification_page: true
         });

      });

   } else {
      res.redirect('/welcome');
   }
});


// Post Notifications - Delete
router.post('/notifications/remove/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      Notification.findByIdAndRemove(req.params.id, (err) => {
         if (err) throw err;

         req.flash('success_msg', "Notification was deleted.");
         res.redirect('/notifications');
      });

   } else {
      res.redirect('/welcome');
   }
});


// GET Profile
router.get('/profile/:username', (req, res, next) => {

   User.findOne({ 'username': { $in: req.params.username} }, (err, profile) => {

      if (profile) {

         if(err) throw err;

         if(req.isAuthenticated()) {
         } else {
            var guestUser = true;
         }

         if(req.isAuthenticated()) {
            // User is seeing their own profile
            if(profile.username === req.user.username) {
               var viewing_own_profile = true;
            } else {
               var viewing_own_profile = false;
            }

            // Hryzn Admin
            if (req.user.username === 'hryzn') {
               var hryznAdmin = true;
            } else {
               var hryznAdmin = false;
            }
         } else {
            var viewing_own_profile = false;
         }


         if(profile.followers) {

            var amount_of_followers = profile.followers.length;

            if(req.isAuthenticated()) {
               if(profile.followers.indexOf(req.user.username) === -1) {
                  var user_follows_profile = false;
               } else {
                  var user_follows_profile = true;
               }
            } else {
               var user_follows_profile = false;
            }

         } else {

            // Profile has no followers
            var user_follows_profile = false;
            var amount_of_followers = 0;

         }


         if(profile.following) {
            var amount_of_following = profile.following.length;
         } else {
            // Profile is not following anyone
            var amount_of_following = 0;
         }


         if(profile.own_projects) {
            var amount_of_projects = profile.own_projects.length;
         } else {
            var amount_of_projects = 0;
         }


         Project.find({ '_id': { $in: profile.own_projects} }, (err, projects) => {
            if (err) throw err;

            var reversed_projects = projects.reverse();

            var private_amount = [];
            projects.forEach(function(project, index) {
               if (project.is_private) {
                  private_amount.push(project);
               }
            });

            amount_of_projects = amount_of_projects - private_amount.length;

            Project.find({ '_id': { $in: profile.saved_projects} }, (err, saved_projects) => {
               if (err) throw err;

               var reversed_saved_projects = saved_projects.reverse();

               Project.find({ '_id': { $in: profile.reposted_projects} }, (err, reposted_projects) => {
                  if (err) throw err;

                  var reversed_reposted_projects = reposted_projects.reverse();

                  res.render('profile', {
                     page_title: profile.username,
                     profile: profile,
                     projects: reversed_projects,
                     saved_projects: reversed_saved_projects,
                     reposted_projects: reversed_reposted_projects,
                     user_follows_profile: user_follows_profile,
                     amount_of_followers: amount_of_followers,
                     amount_of_following: amount_of_following,
                     amount_of_projects: amount_of_projects,
                     viewing_own_profile: viewing_own_profile,
                     guestUser: guestUser,
                     hryznAdmin: hryznAdmin
                  });
               });
            });
         });

      } else {
         res.redirect('/');
      }

   });

});

// Post Profile - Follow
router.post('/profile/follow/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      info = [];
      info['userUsername'] = req.user.username;
      info['profileId'] = req.params.id;
      info['profileUsername'] = req.body.profile_username;
      info['userId'] = req.user._id;

      // Update following for User
      User.addFollowing(info, (err, user) => {
         if(err) throw err;
      });

      // Add followers to profile
      User.addFollowers(info, (err, user) => {
         if(err) throw err;

         // Send notification to the user mentioned
         User.findOne({ 'username': { $in: req.body.profile_username } }, (err, reciever) => {
            if (err) throw err;

            var newNotification = new Notification({
               sender: req.user._id,
               reciever: reciever._id,
               type: '@' + req.user.username + ' started following you.',
               link: '/profile/' + req.user.username
            });

            // Create notification in database
            Notification.saveNotification(newNotification, (err, notification) => {
               if(err) throw err;

               // Add Notification for User
               User.findByIdAndUpdate(reciever._id, { has_notification: true }, (err, user) => {
                  if (err) throw err;
               });
            });
         });

         req.flash('success_msg', "Following " + info['profileUsername']);
         res.redirect('/profile/' + info['profileUsername']);
      });
   } else {
      res.redirect('/welcome');
   }
});

// Post Profile - Unfollow
router.post('/profile/unfollow/:id', (req, res, next) => {
   if(req.isAuthenticated()) {
      info = [];
      info['userUsername'] = req.user.username;
      info['profileId'] = req.params.id;
      info['profileUsername'] = req.body.profile_username;
      info['userId'] = req.user._id;

      // Update following for User
      User.removeFollowing(info, (err, user) => {
         if(err) throw err;
      });

      // Remove followers from profile
      User.removeFollowers(info, (err, user) => {
         if(err) throw err;
         req.flash('success_msg', "Unfollowed " + info['profileUsername']);
         res.redirect('/profile/' + info['profileUsername']);
      });
   } else {
      res.redirect('/welcome');
   }
});

// GET Profile Followers
router.get('/profile/:username/followers', (req, res, next) => {
   if(req.isAuthenticated()) {
      User.getUserByUsername(req.params.username, (err, profile) => {
         if(err) throw err;

         User.find({ 'username': { $in: profile.followers} }, (err, profiles) => {
            if (err) throw err;
            res.render('followers', {
               page_title: profile.username,
               profiles: profiles
            });
         });
      });
   } else {
      res.redirect('/welcome');
   }
});

// GET Profile Following
router.get('/profile/:username/following', (req, res, next) => {
   if(req.isAuthenticated()) {
      User.getUserByUsername(req.params.username, (err, profile) => {
         if(err) throw err;

         User.find({
             'username': { $in: profile.following}
         }, (err, profiles) => {
            if (err) throw err;
            res.render('followers', {
               page_title: profile.username,
               profiles: profiles
            });
         });
      });
   } else {
      res.redirect('/welcome');
   }
});

// GET Settings
router.get('/settings', (req, res, next) => {
   if(req.isAuthenticated()) {
      res.render('settings', { page_title: 'Settings' });
   } else {
      res.redirect('/welcome');
   }
});

// POST Settings
router.post('/settings', upload.array('images[]', 2), (req, res, next) => {
   if(req.isAuthenticated()) {

      function capitalize(string) {
         return string.charAt(0).toUpperCase() + string.slice(1);
      }

      // var username = req.body.username;
      var oldUsername = req.user.username;
      var email = req.body.email;
      var oldEmail = req.user.email;
      var bio = req.body.bio.replace(/\r\n/g,'');;
      var website_link = req.body.website_link;
      var youtube_link = req.body.youtube_link;
      var twitter_link = req.body.twitter_link;
      var instagram_link = req.body.instagram_link;
      var facebook_link = req.body.facebook_link;
      var id = req.body.id;
      var user = req.body.user;

      if(req.body.firstname === "") {
         var firstname = "";
      } else {
         var firstname = req.body.firstname;
         firstname = capitalize(firstname);
         req.checkBody('firstname', 'First Name Is Too Long').isLength({ min: 0, max:50 });
      }

      if(req.body.lastname === "") {
         var lastname = "";
      } else {
         var lastname = req.body.lastname;
         lastname = capitalize(lastname);
         req.checkBody('lastname', 'Last Name Is Too Long').isLength({ min: 0, max:50 });
      }

      // See if website_link has https://
      var has_https = website_link.search("https://");
      if(has_https > -1) {

         var url_without_https = website_link.split("https://")[1];
         website_link = url_without_https;

      }

      // Form Validation
      // req.checkBody('username', 'Please Enter A Username').notEmpty();
      // req.checkBody('username', 'Username Must Be Between 5-50 Characters').isLength({ min: 5, max:50 });
      req.checkBody('bio', 'Bio Is Too Long.').isLength({ min: 0, max: 200 });
      req.checkBody('email', 'Please Enter An Email Address').notEmpty();
      req.checkBody('email', 'Please Enter A Valid Email Address').isEmail();

      errors = req.validationErrors();

      if(errors) {
         User.findById(id, (err, user) => {
            if(err) throw err;

            res.render('settings', {
               errors: errors,
               page_title: 'Settings',
               user: user
            });
         });
      } else {

         /*
            Must be edited to update username if the user was
            an admin to a project, owner of a project,
            following someone, etc.
         */

         // User.getUserByUsername(username, (err, user) => {
         //    if(err) throw err;
         //    if(!user || user.username === oldUsername) {
         //       User.getUserByEmail(email, (err, user) => {
         //          if(err) throw err;
         //          if(!user || user.email === oldEmail) {
         //
         //             if(req.file) {
         //                var ext = path.extname(req.file.originalname);
         //                if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {
         //                   User.findById(id, (err, user) => {
         //                      if(err) throw err;
         //
         //                      res.render('settings', {
         //                         error_msg: 'Uploaded File Must End With .jpg .jpeg .png .gif',
         //                         firstname: firstname,
         //                         lastname: lastname,
         //                         username: username,
         //                         email: email,
         //                         page_title: 'Settings',
         //                         user: user
         //                      });
         //                   });
         //                } else {
         //                   // var fileExt = req.file.originalname.split('.').pop();
         //                   var backgroundimage = dateNow + file.originalname;
         //
         //                   User.findByIdAndUpdate(id, {
         //                      firstname: firstname,
         //                      lastname: lastname,
         //                      username: username,
         //                      email: email,
         //                      backgroundimage: backgroundimage
         //                   }, (err, user) => {
         //                      if (err) throw err;
         //                   });
         //
         //                   res.redirect('/profile/' + username);
         //                }
         //             } else {
         //
         //                User.findByIdAndUpdate(id, {
         //                   firstname: firstname,
         //                   lastname: lastname,
         //                   username: username,
         //                   email: email
         //                }, (err, user) => {
         //                   if (err) throw err;
         //                });
         //
         //                res.redirect('/profile/' + username);
         //             }
         //
         //          } else {
         //             // Email address is taken
         //             User.findById(id, (err, user) => {
         //                if(err) throw err;
         //
         //                res.render('settings', {
         //                   error_msg: 'Sorry That Email Address Is Taken',
         //                   firstname: firstname,
         //                   lastname: lastname,
         //                   username: username,
         //                   email: email,
         //                   page_title: 'Settings',
         //                   user: user
         //                });
         //             });
         //          }
         //       });
         //    } else {
         //       // Username is taken
         //       User.findById(id, (err, user) => {
         //          if(err) throw err;
         //
         //          res.render('settings', {
         //             error_msg: 'Sorry That Username Is Taken',
         //             firstname: firstname,
         //             lastname: lastname,
         //             username: username,
         //             email: email,
         //             page_title: 'Settings',
         //             user: user
         //          });
         //       });
         //    }
         // });

         User.getUserByEmail(email, (err, user) => {
            if(err) throw err;
            if(!user || user.email === oldEmail) {

               if(req.body.images) {

                  console.log('files');

                  var img_indices = req.body.img_indices;

                  good_files = [];

                  req.files.forEach(function(file, key) {
                     var ext = file.originalname.split('.').pop();
                     if(ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG') {
                        good_files.push(file.originalname);
                     }
                  })

                  if(good_files.length < 2 && img_indices == 3) {
                     User.findById(id, (err, user) => {
                        if(err) throw err;

                        res.render('settings', {
                           error_msg: 'Uploaded File Must End With .jpg .jpeg .png .gif',
                           firstname: firstname,
                           lastname: lastname,
                           email: email,
                           page_title: 'Settings',
                           user: user
                        });
                     });
                  } else {

                     if(good_files.length < 1 && img_indices <= 2) {
                        User.findById(id, (err, user) => {
                           if(err) throw err;

                           res.render('settings', {
                              error_msg: 'Uploaded File Must End With .jpg .jpeg .png .gif',
                              firstname: firstname,
                              lastname: lastname,
                              email: email,
                              page_title: 'Settings',
                              user: user
                           });
                        });
                     } else {

                        good_files = [];

                        req.files.forEach(function(file, key) {
                           // var fileExt = file.originalname.split('.').pop();
                           var img = dateNow + file.originalname;
                           good_files.push(img);
                        })

                        if (img_indices == 3) {

                           User.findByIdAndUpdate(id, {
                              firstname: firstname,
                              lastname: lastname,
                              email: email,
                              bio: bio,
                              website: website_link,
                              youtube: youtube_link,
                              twitter: twitter_link,
                              instagram: instagram_link,
                              facebook: facebook_link,
                              profileimage: good_files[0],
                              backgroundimage: good_files[1]
                           }, (err, user) => {
                              if (err) throw err;
                           });

                           res.redirect('/profile/' + req.user.username);

                        } else if (img_indices == 2) {

                           User.findByIdAndUpdate(id, {
                              firstname: firstname,
                              lastname: lastname,
                              email: email,
                              bio: bio,
                              website: website_link,
                              youtube: youtube_link,
                              twitter: twitter_link,
                              instagram: instagram_link,
                              facebook: facebook_link,
                              profileimage: good_files[0]
                           }, (err, user) => {
                              if (err) throw err;
                           });

                           res.redirect('/profile/' + req.user.username);

                        } else {

                           User.findByIdAndUpdate(id, {
                              firstname: firstname,
                              lastname: lastname,
                              email: email,
                              bio: bio,
                              website: website_link,
                              youtube: youtube_link,
                              twitter: twitter_link,
                              instagram: instagram_link,
                              facebook: facebook_link,
                              backgroundimage: good_files[0]
                           }, (err, user) => {
                              if (err) throw err;
                           });

                           res.redirect('/profile/' + req.user.username);

                        }

                     }
                  }
               } else {

                  User.findByIdAndUpdate(id, {
                     firstname: firstname,
                     lastname: lastname,
                     email: email,
                     bio: bio,
                     website: website_link,
                     youtube: youtube_link,
                     twitter: twitter_link,
                     instagram: instagram_link,
                     facebook: facebook_link
                  }, (err, user) => {
                     if (err) throw err;
                  });

                  res.redirect('/profile/' + req.user.username);
               }

            } else {
               // Email address is taken
               User.findById(id, (err, user) => {
                  if(err) throw err;

                  res.render('settings', {
                     error_msg: 'Sorry That Email Address Is Taken',
                     firstname: firstname,
                     lastname: lastname,
                     bio: bio,
                     website: website_link,
                     youtube: youtube_link,
                     twitter: twitter_link,
                     instagram: instagram_link,
                     facebook: facebook_link,
                     email: email,
                     page_title: 'Settings',
                     user: user
                  });
               });
            }
         });
      }
   } else {
      res.redirect('/welcome');
   }
});

// Delete Profile
router.get('/delete/:id', (req, res, next) => {
   if(req.isAuthenticated()) {

      User.findById(req.params.id, (err, user) => {
         if(err) throw err;

         if(user.projects) {

            var info = [];

            for (var i = 0, len = user.projects.length; i < len; i++) {
               info['projectId'] = user.projects[i]._id;

               // Find project to delete
               Project.findById(info['projectId'], (err, project) => {
                  if(err) throw err;

                  // User would no longer have project saved
                  if(project.followers.length > 0) {
                     for (var i = 0, len = project.followers.length; i < len; i++) {
                        info['profileUsername'] = project.followers[i];

                        User.unsaveToProfile(info, (err, user) => {
                           if(err) throw err;
                        });
                     }
                  }

                  // User will no longer be an admin
                  if(project.admins.length > 0) {
                     for (var i = 0, len = project.admins.length; i < len; i++) {
                        info['profileUsername'] = project.admins[i];

                        User.deleteFromProfile(info, (err, user) => {
                           if(err) throw err;
                        });
                     }
                  }

                  // Delete project image
                  var s3_instance = new aws.S3();
                  var s3_params = {
                     Bucket: 'hryzn-app-static-assets',
                     Key: project.project_image
                  };
                  s3_instance.deleteObject(s3_params, (err, data) => {
                     if(data) {
                        console.log("File deleted");
                     }
                     else {
                        console.log("No delete : " + err);
                     }
                  });

                  // Delete the project if owner
                  if(project.project_owner === req.user.username) {
                     Project.findByIdAndRemove(info['projectId'], (err) => {
                       if (err) throw err;
                     });
                  }

               });
            }
         }

         // Delete profile image
         var s3_instance = new aws.S3();
         var s3_params = {
            Bucket: 'hryzn-app-static-assets',
            Key: user.backgroundimage
         };
         s3_instance.deleteObject(s3_params, (err, data) => {
            if(data) {
               console.log("File deleted");
            }
            else {
               console.log("No delete : " + err);
            }
         });

         User.findByIdAndRemove(req.params.id, (err) => {
           if (err) throw err;
           res.location('/welcome');
           res.redirect('/welcome');
         });
      });
   } else {
      res.redirect('/welcome');
   }
});

// Get Explore
router.get('/explore', (req, res, next) => {
   if(req.isAuthenticated()) {
      Project.find({}, (err, projects) => {
         if (err) throw err;

         Group.find({}, (err, groups) => {
            res.render('explore', {
               page_title: 'Explore Projects',
               projects: projects.reverse(),
               groups: groups.reverse(),
               explore_default: true
            });
         });

      });

   } else {
      res.redirect('/welcome');
   }
});

// Get Category
router.get('/explore/:category', (req, res, next) => {
   if(req.isAuthenticated()) {

      Project.find({ 'categories': { $in: req.params.category} }, (err, projects) => {
         if (err) throw err;

         Group.find({ 'group_categories': { $in: req.params.category} }, (err, groups) => {

            res.render('explore', {
               page_title: 'Explore ' + req.params.category,
               projects: projects.reverse(),
               groups: groups.reverse(),
               explore_default: true,
               category_title: req.params.category
            });

         });
      });

   } else {
      res.redirect('/welcome');
   }
});

// Get Search
router.get('/search', (req, res, next) => {
   if(req.isAuthenticated()) {
      var searchTerm = req.query.p;

      User.find({$text: { $search: searchTerm }}, {score: { $meta: "textScore" }}, (err, user) => {
         if (err) throw err;

         Project.find({$text: { $search: searchTerm }}, {score: { $meta: "textScore" }}, (err, projects) => {
            if (err) throw err;

            Group.find({$text: { $search: searchTerm }}, {score: { $meta: "textScore" }}, (err, groups) => {
               if (err) throw err;

               res.render('explore', {
                  page_title: 'Explore Projects',
                  projects: projects,
                  group_search: groups,
                  user_search: user,
                  project_search: projects,
                  explore_default: false
               });
            }).sort({score: { $meta: "textScore" }});
         }).sort({score: { $meta: "textScore" }});
      }).sort({score: { $meta: "textScore" }});

   } else {
      res.redirect('/welcome');
   }
});

// Get Sitemap
router.get('/sitemap', (req, res, next) => {
   res.render('sitemap', {
      page_title: 'Sitemap',
      sitemap: true
   });
});

module.exports = router;
