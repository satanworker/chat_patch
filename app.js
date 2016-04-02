var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');



//mongo db without a monk

var db = require('./db');

var app = express();





// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//session
//var session = require('express-session');

var session = require("express-session")({
    secret: "my-secret",
    resave: true,
    saveUninitialized: true
});
var sharedsession = require("express-socket.io-session");


/*const MongoStore = require('connect-mongo')(session);
var sessionStore = new MongoStore({url: 'mongodb://localhost:27017/chat'});
var socketHandshake = require('socket.io-handshake');

//create middleware for socket
var sessionMiddleware = session(
    {
      secret: 'sdsdsd',
      store: new MongoStore({url: 'mongodb://localhost:27017/chat'}),
      resave: true,
      saveUninitialized: true
    }
//);


 app.use( session(
 {
 secret: 'sdsdsd',
 store: sessionStore,
 resave: true,
 saveUninitialized: true
 }
 ));




 */

//socket.io connection

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(session);

io.use(sharedsession(session));

/*io.use(function(socket, next) {
  sessionMiddleware(socket.request, socket.request.res, next);
});

app.use(sessionMiddleware);
*/

/*
 //socket.handshake.session.login = 'socket session';
 //socket.handshake.session.save();

 вот так сука заработало
*/

function authUser(socket, request, broadcast) {
    if(!broadcast) { broadcast = false; }
    var login = request.login;
    var authObj = {};
    authObj.onlineUsers = onlineUsers;
    authObj.message = 'прибыл пацан '+ login +', встречайте' ;
    socket.join('authorized');
    request = JSON.stringify(request);
    authObj = JSON.stringify(authObj);
    socket.emit('auth', request);
    console.log(onlineUsers, 'login', login);
    console.log(onlineUsers);
    if(broadcast) {
        io.to('authorized').emit('updateOnline', authObj);
    }
    var collection = db.get().collection('messages');
    collection.find().sort({$natural:-1}).limit(20).toArray(function(err, data) {
        if (err) throw err;
        if(data.length) {
            console.log(data);
            data =  data.reverse();
            data.forEach(function(item, i) {
                data[i] = {
                    user:  {
                        login: item.user
                    },
                    message: item.message.text
                };
            });
            console.log(data);
            data = JSON.stringify(data);
            socket.emit('loadMessages', data);
        }
    });
}

function inArray(ar, key, needle) {
    var notHere = true;
    ar.forEach(function(item) {
        console.log(item);
        if(item[key] == needle) {
            notHere = false;
        }
    });
    return !notHere;
}
function getFormArray(ar, key, needle) {
    var result = false;
    ar.forEach(function(item) {
        console.log(item);
        if(item[key] == needle) {
            result = item;
        }
    });
    return result;
}
var onlineSockets = [];
var onlineUsers = [];

io.on('connection', function(socket) {
    var collection = db.get().collection('testsess');
    // ^ db connection
    //>>socket auth on connection
    if(typeof socket.handshake.session.login !== 'undefined' ) {
        var request = {};
        request.login = socket.handshake.session.login;
        request.callback =  true;
        request.message = 'все збс вошел пацан, будь как дома';
        var authObj = {};
        authObj.onlineUsers = onlineUsers;
        authObj = JSON.stringify(authObj);
        socket.emit('updateOnline', authObj);
        authUser(socket, request);
    }
    //>>socket auth on connection


    //>> socket reg
      socket.on('reg', function (data) {
        var broadcast = false;
         var userdata = JSON.parse(data);
          var request = {};
          collection.find({
              login: userdata.login
          }).toArray(function(err, data) {
              if(err) throw err;
              if(data.length) {
                  request.callback = false;
                  request.message = 'хуй тебе';
                  request = JSON.stringify(request);
                  socket.emit('auth', request);
              }
              else {
                  collection.update(
                      { login: userdata.login},
                      {
                          login: userdata.login,
                          pass: userdata.pass
                      },

                      { upsert: true }
                  );
                  socket.handshake.session.login = userdata.login;
                  socket.handshake.session.save();
                  request.callback = true;
                  request.message = 'все збс';
                  request.login = userdata.login;
                  var socketObj = {
                      login: userdata.login,
                      socket: socket
                  };
                  var userObj = {
                      login: userdata.login
                  };
                  if(!inArray(onlineUsers, 'login', userObj.login)) {
                      broadcast = true;
                      onlineUsers.push(userObj);
                  }
                  onlineSockets.push(socketObj);
                  var authObj = {};
                  authObj.onlineUsers = onlineUsers;
                  authObj = JSON.stringify(authObj);
                  socket.emit('updateOnline', authObj);
                authUser(socket, request, broadcast);
              }
              //console.log(onlineSockets);
          });
      });
    //>> socket reg

    //>> socket auth
    socket.on('auth', function(data) {
        data = JSON.parse(data);
        collection.find({
            login: data.login,
            pass: data.pass
        }).toArray(function(err, data) {
            if(err) throw err;
            var request = {};
            var broadcast = false;
            if(data.length) {
                    request.login = data[0].login;
                    request.callback =  true;
                    request.message = 'все збс вошел пацан, будь как дома';
                    socket.handshake.session.login = data[0].login;
                    socket.handshake.session.save();
                    var socketObj = {
                        login: data[0].login,
                        socket: socket
                    };
                    var userObj = {
                        login: data[0].login
                    };
                    if(!inArray(onlineUsers, 'login', userObj.login)) {
                        broadcast = true;
                        onlineUsers.push(userObj);
                    }
                    else {
                        var authObj = {};
                        authObj.onlineUsers = onlineUsers;
                        authObj = JSON.stringify(authObj);
                        socket.emit('updateOnline', authObj);
                    }
                    onlineSockets.push(socketObj);
                    authUser(socket, request, broadcast);
            }
            else {
                request.callback =  false;
                request.message = 'нахуй послан';
                //authUser(socket, request, broadcast);
                request = JSON.stringify(request);
                socket.emit('auth', request);
            }
            //request = JSON.stringify(request);
            //socket.emit('auth', request);
        });
    });
    //>> socket auth

    //>> message
    socket.on('message', function(data) {
        collection = db.get().collection('messages');
        data  = JSON.parse(data);
        console.log(data.to);
        //>> commoon chat
        if(typeof socket.handshake.session.login !== 'undefined') {
            var obj = {
                message: data.message,
                user: getFormArray(onlineUsers, 'login', socket.handshake.session.login)
            };
            var dbObj = {
                user: socket.handshake.session.login,
                message: {
                    text: data.message
                }
            };
            collection.insert(dbObj);
            obj = JSON.stringify(obj);
            io.to('authorized').emit('message', obj);
        }
        else {
            socket.emit('customError', 'нахуй иди тии кто')
        }
    });
    //>> message
    socket.on('typing', function(data) {
        if(typeof socket.handshake.session.login.length) {
            var obj = {
                login: socket.handshake.session.login,
                typing: data
            };
            obj = JSON.stringify(obj);
            socket.broadcast.to('authorized').emit('typing', obj);
        }
    });
});



//routes
app.get('/', function(req, res) {
    res.render('index', {title: req.session.login});
});

app.get('/test', function(req, res) {
  var collection = db.get().collection('testsess');

  collection.update({ name: 'client'},
    {
      name: 'client',
      sessid: req.session.id
    },

    { upsert: true }
  );

  console.log('sessname', req.session.login);

  collection.find().toArray(function(err, data) {
    if(err) throw err;
      res.render('index', {title: req.session.login});
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

db.connect('mongodb://localhost:27017/chat', function(err) {
  if (err) {
    console.log('Unable to connect to Mongo.');
    process.exit(1)
  } else {
   http.listen(3000, function() {
      console.log('Listening on port 3000...');
    })
  }
});

module.exports = app;



/* >>>> db usage
 var db = require('./db');

 db.connect('mongodb://localhost:27017/chat', function(err) {
 if (err) {
 console.log('Unable to connect to Mongo.');
 process.exit(1)
 } else {
 app.listen(3000, function() {
 console.log('Listening on port 3000...');
 })
 }
 });


 methods

 var collection = db.get().collection('testsess');

 collection.find({name: 'taco'}).toArray(function(err, data) {
 if(err) throw err;
 console.log(data);
 });

 collection.update({ name: 'client'},
 {
 name: 'client',
 sessid: req.session.id
 },

 { upsert: true }
 );

 >>>> */