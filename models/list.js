var mongoose = require("mongoose");

var listSchema = new mongoose.Schema({
    title: String,
    image: String,
    lastRead: String,
    genre: String,
    rating: Number,
    author: String,
    created: { type: Date, default: Date.now },
    creator: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

var List = mongoose.model("List", listSchema);

module.exports = List;