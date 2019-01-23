//------------------------------------------------------------------------------
//  Package Requirements
//------------------------------------------------------------------------------

var LocalStrategy  = require("passport-local");
var passport       = require("passport");
var methodOverride = require("method-override");
var bodyParser     = require("body-parser");
var mongoose       = require("mongoose");
var express        = require("express");
var flash          = require("connect-flash");
var dotenv         = require('dotenv');
var app            = express();

//------------------------------------------------------------------------------
//  Cloudinary and Multer Configurations
//------------------------------------------------------------------------------

var multer = require('multer');
var storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');

dotenv.config();

cloudinary.config({ 
    cloud_name: 'yongchengzhu', 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//------------------------------------------------------------------------------
//  App Configurations
//------------------------------------------------------------------------------

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(flash());

app.locals.moment = require("moment");

//------------------------------------------------------------------------------
//  Database Configurations
//------------------------------------------------------------------------------

mongoose.connect(
    "mongodb://localhost:27017/webreadinglist_app", {useNewUrlParser:true}
);

var List = require("./models/list.js");
var User = require("./models/user.js");

// List.update({}, { $set: { creator: {
//     id: "5c4561b2750b36235f37666f",
//     username: "ycz"
// }}}, { multi:true }, function(err, updatedUsers) {
//     if (err) {
//         console.log(err);
//     } else {
//         console.log(updatedUsers);
//     }
// });

// User.update({}, { $set: { rank: "Member" } }, { multi: true }, function(err, updatedUsers) {
//     if (err) {
//         console.log(err);
//     } else {
//         console.log(updatedUsers);
//     }
// });

// User.update({ username: "ycz"}, { $set: { rank: "Administrator"} }, function(err, updatedUser) {
//     if (err) {
//         console.log(err);
//     } else {
//         console.log(updatedUser);
//     }    
// });

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
    res.locals.error       = req.flash("error");
    res.locals.success     = req.flash("success");
    next();
});

//------------------------------------------------------------------------------
//  Routes
//------------------------------------------------------------------------------
  
// 
// ROOT: Landing page.
// 
app.get("/", function(req, res) {
    res.render("landing")
    // res.redirect("/login");
});

// 
// SORT
// 
var sortOrder = -1;
var key;

app.get("/:user/books/sorted", function(req, res) {
    var sortObj = {};
    
    sortObj[key] = sortOrder;
    
    List.find({"creator.username": req.params.user}).sort(sortObj).exec(function(err, sortedLists) {
        if (err) {
            console.log("Cannot sort.");
        }
        else {
            res.render("books", {lists: sortedLists, sortBy: key});
        }
    });
});

app.post("/:user/books/sorted", function(req, res) {
    var sortObj = {};
    
    if (key == req.body.sort) {
        sortOrder *= -1;
    }
    else {
        key = req.body.sort;
        sortOrder = -1;
    }
    
    sortObj[key] = sortOrder;
    
    List.find({"creator.username": req.params.user}).sort(sortObj).exec(function(err, sortedLists) {
        if (err) {
            console.log("Cannot sort.");
        }
        else {
            // res.redirect("/" + req.user.username + "/books/sorted");
            // res.render("books", {lists: sortedLists, sortBy: key});
            res.redirect("/" + req.params.user + "/books/sorted");
        }
    });
});

// 
// INDEX: Show all user books.
// 
app.get("/:user/books", function(req, res) {
    List.find({"creator.username": req.params.user}).sort({created: "-1"}).exec(function(err, lists) {
        if (err) {
           console.log(err);
       }
       else {
           res.render("books", {lists: lists, page: "home"});
       }
    });
});

// 
// NEW: Show form to add new book.
// 
app.get("/:user/new", isLoggedIn, function(req, res) {
    res.render("books_new", {page: "new"});
});

// 
// CREATE: Add a new book into the database.
// 
app.post("/:user/books", isLoggedIn, function(req, res) {
    // Push user information into this book.
    req.body.list.creator = {
        id: req.user._id,
        username: req.user.username
    };
    
    List.create(req.body.list, function(err, newBook) {
       if (err) {
           req.flash("error", "Cannot add this book into the database!");
           res.render("back");
       }
       else {
           req.flash("success", "You've added '" + newBook.title + "' into your list!");
           res.redirect("/" + req.user.username + "/books");
       }
    });    
});

// 
// SHOW: Show more information about this book.
// 
app.get("/:user/books/:book_id", function(req, res) {
    List.findById(req.params.book_id, function(err, foundBook) {
       if (err) {
           req.flash("error", "Cannot find this book in the database!");
           res.redirect("back");
       }
       else {
           res.render("books_show", {list: foundBook});
       }
    });
});

// 
// EDIT: Show form to edit current book.
// 
app.get("/:user/books/:book_id/edit", checkListOwnership, function(req, res) {
    List.findById(req.params.book_id, function(err, foundBook) {
        if (err) {
            req.flash("error", "Cannot find this book in the database!");
            res.redirect("back");
        }
        else {
            res.render("books_edit", {list: foundBook});
        }
    });
});

// 
// UPDATE: Make changes to current book in the database.
// 
app.put("/:user/books/:book_id", checkListOwnership, function(req, res) {
    req.body.list.created = Date(Date.now());
    console.log("/" + req.params.user + "/books");
    List.findByIdAndUpdate(req.params.book_id, req.body.list, function(err, foundBook) {
        if (err) {
            req.flash("error", "Cannot find this book in the database!");
            res.redirect("back");
        }
        else {
            req.flash("success", "You've updated '" + foundBook.title + "' on your list!");
            res.redirect("/" + req.params.user + "/books");
        }
    });    
});

// 
// Delete: Remove current book from the database.
// 
app.delete("/:user/books/:book_id", checkListOwnership, function(req, res) {
    List.findByIdAndRemove(req.params.book_id, req.body.list, function(err, foundBook) {
        if (err) {
            req.flash("error", "Cannot find this book in the database!");
            res.redirect("back");
        }
        else {
            req.flash("success", "You've removed '" + foundBook.title + "' from your list!");
            res.redirect("/" + req.params.user + "/books");
        }
    });
});

// 
// Register: New Route
// 
app.get("/register", function(req, res) {
    res.render("register", {page: "register"});
});

// 
// Register: Create route
// 
app.post("/register", upload.single('image'), function(req, res) {
    cloudinary.uploader.upload(req.file.path, function(result) {
        req.body.avatar = result.secure_url;
        
        User.register(new User({username: req.body.username, avatar: req.body.avatar}), req.body.password, function(err, createdUser) {
            if (err) {
                req.flash("error", err.message);
                res.redirect("/register");
            }
            else {
                passport.authenticate("local")(req, res, function() {
                    req.flash("success", "Welcome to MyReadingList, " + createdUser.username + "!");
                    res.redirect("/" + createdUser.username + "/books");
                });
            }
        });        
    });

});

// 
// Login: New route
// 
app.get("/login", function(req, res) {
    res.render("login", {page: "login"});
});

// 
// Login: Create route
// 
app.post("/login", passport.authenticate("local", {
    // successRedirect: "/lists", 
    failureRedirect: "/login",
    failureFlash: true
    // successFlash: "Welcome back!"
}), function(req, res) {
    req.flash("success", "Welcome back, " + req.user.username + "!");
    res.redirect("/" + req.user.username + "/books");
});

// 
// Logout Route
// 
app.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "You've logged out!");
    res.redirect("/");
});

// 
// Members Route
// 
app.get("/members", function(req, res) {
    User.find({}, function(err, foundUsers) {
        if (err) {
            console.log(err);
            res.redirect("/lists");
        }
        else {
            res.render("members", {users: foundUsers, page: "members"});
        }
    });
});

// 
// Profile route
// 
app.get("/:user/profile", function(req, res) {
    res.render("profile");
});

// 
// Middleware
// 
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    else {
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("/login");
    }
}

function checkListOwnership(req, res, next) {
    if (req.isAuthenticated()) {
        List.findById(req.params.book_id, function(err, foundList) {
            if(err) {
                res.redirect("back");
            }
            else {
                if (foundList.creator.id.equals(req.user._id) || req.user.rank == "Administrator") {
                    return next();
                }
                else {
                    res.redirect("back");
                }
            }
        })
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