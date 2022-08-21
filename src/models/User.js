const { model } = require("mongoose");

const User = new model("User", {
    name: String,
    email: String,
    password: String,
    pronoun: String,
    dateJoined: Date,
    joined: String,
    followers: [String],
    following: [String],
})

module.exports = User;