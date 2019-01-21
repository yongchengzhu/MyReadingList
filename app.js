//------------------------------------------------------------------------------
//  Package Requirements
//------------------------------------------------------------------------------

var passportLocalMongoose = require("passport-local-mongoose");
var LocalStrategy  = require("passport-local");
var passport       = require("passport");
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
var User = require("./models/user.js");

//------------------------------------------------------------------------------
//  Passport Configurations
//------------------------------------------------------------------------------

app.use(require("express-session")({
    secret: "Imagine reading a post, but over the course of it the quality seems to deteriorate and it gets wose an wose, where the swenetence stwucture and gwammer rewerts to a pwoint of uttew non swence, an u jus dont wanna wead it anymwore (o´ω｀o) awd twa wol owdewl",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    next();
});

//------------------------------------------------------------------------------
//  Routes
//------------------------------------------------------------------------------
  
//-- Root --//
app.get("/", function(req, res) {
    res.redirect("/lists");
});

//-- Index --//
app.get("/lists", function(req, res) {
    List.find({}).sort({created: "-1"}).exec(function(err, lists) {
        if (err) {
           console.log("Cannot find books for index.");
           console.log(err);
       }
       else {
           res.render("index", {lists: lists});
       }
    });
});

//-- Sort --//
var sortOrder = -1;
var key;

app.get("/lists/sorted", function(req, res) {
    var sortObj = {};
    
    sortObj[key] = sortOrder;
    
    List.find({}).sort(sortObj).exec(function(err, sortedLists) {
        if (err) {
            console.log("Cannot sort.");
        }
        else {
            res.render("index", {lists: sortedLists});
        }
    });
});


app.post("/lists/sorted", function(req, res) {
    var sortObj = {};
    
    if (key == req.body.sort) {
        sortOrder *= -1;
    }
    else {
        key = req.body.sort;
        sortOrder = -1;
    }
    
    sortObj[key] = sortOrder;
    
    List.find({}).sort(sortObj).exec(function(err, sortedLists) {
        if (err) {
            console.log("Cannot sort.");
        }
        else {
            // res.render("index", {lists: sortedLists});
            res.redirect("/lists/sorted");
        }
    });
});

//-- New --//
app.get("/lists/new", isLoggedIn, function(req, res) {
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

// 
// Register: New Route
// 
app.get("/register", function(req, res) {
    res.render("register");
});

// 
// Register: Create route
// 
app.post("/register", function(req, res) {
    User.register(new User({username: req.body.username}), req.body.password, function(err, createdUser) {
        if (err) {
            res.redirect("/register");
        }
        else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/lists");
            });
        }
    });
});

// 
// Login: New route
// 
app.get("/login", function(req, res) {
    res.render("login");
});

// 
// Login: Create route
// 
app.post("/login", passport.authenticate("local", {successRedirect: "/lists", failureRedirect: "/login"}), function(req, res) {
    
});

// 
// Logout Route
// 
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/lists");
});

// 
// Middleware
// 
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    else {
        res.redirect("/login");
    }
}


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