const { model } = require("mongoose");

const Comment = new model("Comment", {
    comment: String,
    commentedByID: String,
    postID: String,
    dateCommented: Date
})

module.exports = Comment;