//------------------------------------------------------------------------------
//  App Requirements
//------------------------------------------------------------------------------

var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var app = express();

//------------------------------------------------------------------------------
//  App Config
//------------------------------------------------------------------------------

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

//------------------------------------------------------------------------------
//  Database Config
//------------------------------------------------------------------------------

mongoose.connect(
    "mongodb://localhost:27017/webreadinglist_app", {useNewUrlParser:true}
);

var listSchema = new mongoose.Schema({
    title: String,
    image: String,
    lastRead: String,
    genre: String,
    rating: Number,
    author: String
});

var List = mongoose.model("List", listSchema);

// List.create({
//     title      : "驭灵师",
//     lastRead   : "第十五话 寻龙（01）",
//     genre      : "少年",
//     rating     : "5",
//     author     : "时代漫王"
// }, function(err, Blog) {
//     if (err) {
//         console.log("Cannot create new list:")
//         console.log(err);
//     }
//     else {
//         console.log("New list is created:")
//         console.log(Blog);
//     }
// });

//------------------------------------------------------------------------------
//  RESTful Routes
//------------------------------------------------------------------------------

//-- Root --//
app.get("/", function(req, res) {
    res.redirect("/lists");
});

//-- Index --//
app.get("/lists", function(req, res) {
    List.find({}, function(err, lists) {
        if (err) {
           console.log("Cannot find lists");
           console.log(err);
       }
       else {
           res.render("index", {lists: lists});
       }
    });
    
});

//-- New --//
app.get("/lists/new", function(req, res) {
   res.render("new");
});

//-- Create --//
app.post("/lists", function(req, res) {
   List.create(req.body.list, function(err, newList) {
       if (err) {
           res.render("new");
           console.log("Cannot create new blog post.");
       }
       else {
           res.redirect("/lists");
       }
   });
});

//-- Show --//
app.get("/lists/:id", function(req, res) {
    List.findById(req.params.id, function(err, foundList) {
       if (err) {
           alert("Cannot find this book.");
           res.redirect("/lists");
       }
       else {
           res.render("show", {list: foundList});
       }
    });
});

//------------------------------------------------------------------------------
//  Cloud9 Server
//------------------------------------------------------------------------------

app.listen(process.env.PORT, process.env.IP, function() {
   console.log("Server is up..."); 
});