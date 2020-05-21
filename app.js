//jshint esversion:6
const express  = require("express");
const ejs = require("ejs");
//needed for db
const mongoose = require("mongoose");

//needed to create sessions.
const session = require("express-session");
//needed for authentiaction
const passport = require("passport");
//makes it easier to communicate with db for registration, searialization, deserialization,etc.
//also  when it registers the user, it does salting and hashing on the password.
const plmongoose = require("passport-local-mongoose");

const app = express();

const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({extended:true}) );

//create session.
app.use(
  session(
    {
      secret: 'keyboard cat',
      resave: false,
      saveUninitialized: false,
    }
  )
);

//initilize and set session for passport.
app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");
//=================CONFIG END===============//

//==================DB STRT=================//

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

const authSchema = new mongoose.Schema(
  {
    username: String,
    password: String
  }
);

//add passport local mongoose as a plugin to schema.
authSchema.plugin(plmongoose);

const authModel = mongoose.model("auth", authSchema);

//create stratergy based on model for passport to use.
passport.use(authModel.createStrategy());

//serialize and deserialize methods based on user id, to help authenticate with session.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  authModel.findById(id, function(err, user) {
    done(err, user);
  });
});


//==================DB END===================//
app.get("/", (req, res)=>{
  console.log(req.sessionID);
  res.render("home");
});

app.get("/secrets", (req, res)=>{
  console.log("scret");
  console.log(req.user);
  console.log(req.session);
  console.log(req.sessionID);
  //isAuthenticated probably checks to see the req.user value, thats why when session is reloaded,
  //even though we hava cookie it still returns false.
  if(req.isAuthenticated()){
    console.log("is authenticated !!");
    console.log(req.user);
    console.log(req.session);
    console.log(req.sessionID);
    res.render("secrets");
  }
  else {
    res.redirect("login");
  }
});

app.get("/login", (req, res)=>{
  console.log(req.sessionID);
  if(req.isAuthenticated())
    res.redirect("/secrets");
  else
    res.render("login");
});

app.get("/register", (req, res)=>{
  console.log(req.sessionID);
  if(req.isAuthenticated())
    res.redirect("/secrets");
  else
    res.render("register");
});

app.get("/logout",(req, res)=>{
  //req.logout will not delete the cookie or session. 
  req.logout();
  res.redirect("/");
});

app.post("/register", (req, res)=>{
  //plmongoose method to register to db.
  authModel.register({username: req.body.username}, req.body.password, (err, user)=>{
    if(err){
      console.log("register error: ");
      return res.redirect("/register");
    }
    //this is a curry function, searching for currying in js for more info.
    // let auth = passport.authenticate("local", { successRedirect: '/secrets',
    //                                 failureRedirect: '/register'
    //                                 }
    //                       );
    // auth(req,res);
    passport.authenticate("local", {successRedirect: '/secrets', failureRedirect: '/register'})(req, res);
  });

});

app.post("/login",(req, res)=>{
  // const user = new authModel(
  //   {
  //     username: req.body.username,
  //     password: req.body.password
  //   }
  // );
  //
  // req.login(user, function(err) {
  //   if (err) {
  //     console.log(err);
  //   }
  //   return res.redirect("/secrets");
  // });
  //========IMP================//
  //authenticae by default calls login, which creates a session and auth assignes a value to req.user in session
  passport.authenticate("local", {successRedirect: '/secrets', failureRedirect: '/register'})(req, res);

});



//=================SERVER LISTEN============//
app.listen(port, ()=>{
  console.log("listening at port :"+port);
});
