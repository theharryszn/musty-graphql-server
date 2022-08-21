const { model } = require("mongoose");

const Topic = new model("Topic", {
    title: String,
})

module.exports = Topic;