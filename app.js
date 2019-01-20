//------------------------------------------------------------------------------
//  Package Requirements
//------------------------------------------------------------------------------

var methodOverride = require("method-override");
var bodyParser     = require("body-parser");
var mongoose       = require("mongoose");
var express        = require("express");
var app            = express();

//------------------------------------------------------------------------------
//  App Configurations
//------------------------------------------------------------------------------

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));

//------------------------------------------------------------------------------
//  Database Configurations
//------------------------------------------------------------------------------

mongoose.connect(
    "mongodb://localhost:27017/webreadinglist_app", {useNewUrlParser:true}
);

var List = require("./models/list.js");

//------------------------------------------------------------------------------
//  Routes
//------------------------------------------------------------------------------

//-- Root --//
app.get("/", function(req, res) {
    res.redirect("/lists");
});

//-- Sort --//
app.post("/", function(req, res) {
    console.log(req.body.sort);
    
    if (req.body.sort == "rating") {
        List.find({}).sort({rating: -1}).exec(function(err, sortedLists) {
            if (err) {
                console.log("Cannot sort.");
            }
            else {
                console.log("sorted by rate");
                res.render("index", {lists: sortedLists});
            }
        });
    }
    
    if (req.body.sort == "date") {
        List.find({}).sort({created: 1}).exec(function(err, sortedLists) {
            if (err) {
                console.log("Cannot sort.");
            }
            else {
                console.log("sorted by date");
                res.render("index", {lists: sortedLists});
            }
        });
    }
});

//-- Index --//
app.get("/lists", function(req, res) {
    List.find({}, function(err, lists) {
        if (err) {
           console.log("Cannot find books for index.");
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
           console.log("Cannot create new book.");
           res.render("new");
       }
       else {
           console.log(req.body.list);
           res.redirect("/lists");
       }
    });
});

//-- Show --//
app.get("/lists/:id", function(req, res) {
    List.findById(req.params.id, function(err, foundList) {
       if (err) {
           console.log("Cannot find this book for show.");
           res.redirect("/lists");
       }
       else {
           res.render("show", {list: foundList});
       }
    });
});

//-- Edit --//
app.get("/lists/:id/edit", function(req, res) {
    List.findById(req.params.id, function(err, foundList) {
        if (err) {
            console.log("Cannot find list to edit.");
            res.redirect("/lists");
        }
        else {
            res.render("edit", {list: foundList});
        }
    });
});

//-- Update --//
app.put("/lists/:id", function(req, res) {
    req.body.list.created = Date(Date.now());
    
    List.findByIdAndUpdate(req.params.id, req.body.list, function(err) {
        if (err) {
            console.log("Cannot update this book.");
            res.redirect("/lists");
        }
        else {
            res.redirect("/lists/" + req.params.id);
        }
    });
});

//-- Delete --//
app.delete("/lists/:id", function(req, res) {
    List.findByIdAndRemove(req.params.id, req.body.list, function(err) {
        if (err) {
            console.log("Cannot remove this book.");
            res.redirect("/lists");
        }
        else {
            res.redirect("/lists");
        }
    });
});

//-- Test --//
app.get("/test", function(req, res) {
    res.render("test");
    
});

//------------------------------------------------------------------------------
//  Cloud9 Server
//------------------------------------------------------------------------------

app.listen(process.env.PORT, process.env.IP, function() {
   console.log("Server is up..."); 
});