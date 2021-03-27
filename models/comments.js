const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const keys = require('../config/keys');

mongoose.connect(keys.mongoURI);

// User Schema
const CommentSchema = mongoose.Schema({
   project_id: {
      type: String
   },
   comments: [{
      username: {
         type: String
      },
      profileimage: {
         type: String
      },
      comment_content: {
         type: String
      },
      likes: [],
      replies: [{
        username: {
           type: String
        },
        profileimage: {
           type: String
        },
        reply_content: {
           type: String
        },
        likes: []
      }]
   }]
});

const Comment = module.exports = mongoose.model('Comment', CommentSchema);

// Create comment
module.exports.saveComment = (newComment, callback) => {
   newComment.save(callback);
}

// Add comment
module.exports.addComment = (info, callback) => {
   username = info['profileUsername'];
   commentId = info['commentId'];
   profileimage = info['profileimage'];
   comment_content = info['comment_content'];
   likes = info['likes'];
   replies = info['replies'];

   const query = { _id: commentId };

   Comment.findOneAndUpdate(query,
      {
         $addToSet: {"comments": [{
            "username": username,
            "profileimage": profileimage,
            "comment_content": comment_content,
            "likes": likes,
            "replies": replies
         }]},
      },
      { safe: true, upsert: true },
      callback
   );
}


// Remove Comment
module.exports.removeComment = (info, callback) => {
   commentId = info['commentId'];
   commentContentId = info['commentContentId'];

   const query = { _id: commentId };

   Comment.findOneAndUpdate(query,
      { $pull: { comments: { '_id': commentContentId } } },
      { multi: true },
      callback
   );
}

  // Like comment
module.exports.likeComment = (info, callback) => {
   commentId = info['commentId'];
   commentContentId = info['commentContentId'];
   username = info['username'];

   const query = { _id: commentId, "comments._id": commentContentId };

   Comment.findOneAndUpdate(query,
      { $addToSet: { "comments.$.likes": username } },
      { safe: true, upsert: true },
      callback
   );
}


// Remove Like From Comment
module.exports.removeLikeComment = (info, callback) => {
   commentId = info['commentId'];
   commentContentId = info['commentContentId'];
   username = info['username'];

   const query = { _id: commentId, "comments._id": commentContentId };

   Comment.findOneAndUpdate(query,
      { $pull: { "comments.$.likes": username } },
      { safe: true, upsert: true },
      callback
   );
}


// Add reply
module.exports.replyToComment = (info, callback) => {
  commentId = info['commentId'];
  commentContentId = info['commentContentId'];
  commentReply = info['commentReply'];
  username = info['username'];
  profileimage = info['profileimage'];

   const query = { _id: commentId, "comments._id": commentContentId };

   Comment.findOneAndUpdate(query,
      { $addToSet: {
        "comments.$.replies": {
          username: username,
          profileimage: profileimage,
          reply_content: commentReply,
          likes: []
        }
      } },
      { safe: true, upsert: true },
      callback
   );
}


// Remove Reply From Comment
module.exports.removeReply = (info, callback) => {
   commentId = info['commentId'];
   commentContentId = info['commentContentId'];
   commentReplyId = info['commentReplyId'];

   const query = { _id: commentId, "comments._id": commentContentId };

   Comment.findOneAndUpdate(query,
      { $pull: { "comments.$.replies": { _id: commentReplyId} } },
      { safe: true, upsert: true },
      callback
   );
}
