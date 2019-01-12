var mongoose = require("mongoose");

var listSchema = new mongoose.Schema({
    title: String,
    image: String,
    lastRead: String,
    genre: String,
    rating: Number,
    author: String,
});

var List = mongoose.model("List", listSchema);

module.exports = List;