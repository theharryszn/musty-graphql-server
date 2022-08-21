const { model } = require("mongoose");

const Post = new model("Post", {
    caption: String,
    postedByID: String,
    topicID: String,
    datePosted: String
});

module.exports = Post;