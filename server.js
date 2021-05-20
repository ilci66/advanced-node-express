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
    done(null, null);
  });
})



app.route('/').get((req, res) => {
  res.render(process.cwd() + '/views/pug/index', {title: 'Hello', message:'Please login'});
  
  //I can even add  another key value pair that shows how many times
  //this root has been accessed, counts are uniqiue for each session
  //req.session.count ++;
  //console.log(req.session)//check out all the info you get 

 
 //this also works this way
  // res.render('index', {title: 'Hello', message:'Please login'});
  // console.log(process.cwd())
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
