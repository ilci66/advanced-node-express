'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
//const ObjectID = require('mongodb').ObjectID;
const mongodb = require('mongodb');
const {ObjectID} = mongodb;
const { MongoClient } = require('mongodb');
const LocalStrategy = require('passport-local');
const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.set('view engine', 'pug')
app.set('views', './views/pug')


//this will create a seesion for every request and give access to bunch of info
//we can save or read information from it, very useful
//this are the options here
app.use(session({
  secret: process.env.SESSION_SECRET,
//keeps saving the same info required for testing though
  resave: true,
//forces a new session to be saved(new and unmodified session)
  saveUninitialized: true,
//read the doc for this
  cookie: { secure: false }
}));

//this one does some basic configurations
app.use(passport.initialize());
//alters the req, changes the 'user' value that is currently the session id (from the client cookie) into the true deserialized user object.
app.use(passport.session());


// app.route('/').get((req, res) => {
//   res.render(process.cwd() + '/views/pug/index', {title: 'Hello', message:'Please login'});
  
//   //I can even add  another key value pair that shows how many times
//   //this root has been accessed, counts are uniqiue for each session
//   //req.session.count ++;
//   //console.log(req.session)//check out all the info you get 
//  //this also works this way
//   // res.render('index', {title: 'Hello', message:'Please login'});
//   // console.log(process.cwd())
// });


//connection is handled in the connection.js

myDB(async client => {

  const myDataBase = await client.db('database').collection('users');
  console.log("connected")


  //This is to save user Id to a cookie, bare minimum basically 
  //to keep the file small, with this small info you can still 
  //retrieve related data from the database
  //we are only going to serialize the user ID, and find the user by ID when deserializing
  passport.serializeUser((user, done) => {
    done(null, user._id)
  });
  //retrieve user details(id) from the cookie and find the doc
  passport.deserializeUser((id, done) => {
      myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  })

  app.route('/').get((req, res) => {
    //Change the response to render the Pug template
    res.render(process.cwd() + '/views/pug/index', {
      showLogin: true,
      title: 'Connected to Database',
      message: 'Please login'
    });
  });


  passport.use(new LocalStrategy(
  function(username, password, done) {
    myDataBase.findOne({ username: username }, function (err, user) {
      console.log('User '+ username +' attempted to log in.');
      if (err) { return done(err); }
//false indicated that we cound't find the user or there was a problem
//with the authentication, these are not errors
      if (!user) { return done(null, false); }
      if (password !== user.password) { return done(null, false); }
      return done(null, user);
//this user object will be user in the serializing and stuff
    });
  }
));

//read the passport-local doc, explained clearly
app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
  console.log('User {USERNAME}, attempted to log in.')
  res.redirect('/')
  
})

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};
app
 .route('/profile')
 .get(ensureAuthenticated, (req,res) => {
    res.render(process.cwd() + '/views/pug/profile', {username: req.user.username});
 });

}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });
});

//when define listen here, the first render of the page shows an error
//I'm supposed to put it in the database call but this is what the test 
//spesifically told me to do, so moving on 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});