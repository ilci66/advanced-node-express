'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const routes = require('./routes');
const auth = require('./auth.js');

// const passportSocketIo = require('passport.socketio');
// const MongoStore = require('connect-mongo');
// const cookieParser = require('cookie-parser');

const app = express();

const http = require('http').createServer(app);
const io = require('socket.io')(http);

// const MongoStore = require('connect-mongo')(session);
// const URI = process.env.MONGO_URI;
// const store = new MongoStore({ url: URI });

// io.use(
//   passportSocketIo.authorize({
//     cookieParser: cookieParser,
//     key: 'express.sid',
//     secret: process.env.SESSION_SECRET,
//     store: store,
//     success: onAuthorizeSuccess,
//     fail: onAuthorizeFail
//   })
// );

app.set('view engine', 'pug');

fccTesting(app); // For fCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false },
}));

app.use(passport.initialize());
app.use(passport.session());

myDB(async (client) => {
  const myDataBase = await client.db('database').collection('users');
  let currentUsers = 0;
  io.on('connection', socket => {
//all the events that a socket can emit are handled in connection
//if you call it on io (or server) you send it to all the clients, sockets 
//send it to the client that you are working with

    currentUsers += 1;
    io.emit('user count', currentUsers);
    console.log('A user has connected');
    
    socket.on('disconnect', () => {
      currentUsers -=1;
      console.log('A user has disconnected')
    });
  });
  
//I need to instantiate this way, otherwise fails
//takes the names from the variables I defined on line 8 and 9
  routes(app, myDataBase);
  auth(app, myDataBase);
}).catch((e) => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port ' + process.env.PORT);
});