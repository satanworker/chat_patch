var express = require('express');
var router = express.Router();
var monk = require('monk');
var db = monk('localhost:27017/chat_patch');
var users = db.get('users');
var chat = require('../core/chat');
//db
//>>?>

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var activeUsers = [];

router.post('/reg', function(req, res, next) {
  var login = req.body.login;
  var password = req.body.password;
  if(password.length < 4) {
    res.end(JSON.stringify({'error': 'pass is as short as your dick'}))
  }
  else {
    users.find({"login": login}, {}, function(err, data) {
      if(err) throw err;
      console.log('req', data, data.length);
      if(data.length) {
        res.end(JSON.stringify({'error': 'stop copying people {*}'}))
      }
      else {
        users.insert({
          login: login,
          password: password,
          sessId: req.sessionID
        });
        //chat.addActiveUser(activeUsers, req.sessionID);
        res.end(JSON.stringify({}));
      }
    });
  }
});
router.post('/auth', function(req, res){
    var body = req.body;
    if(Object.keys(body).length !== 0) {
      if(body.logout == 'Y') {
        users.update({sessId: req.sessionID}, {$set: {sessId: ''}});
        chat.onlineUsers(activeUsers);
        res.end()
      }
      else {
        users.find({login: body.login, password: body.password }, {}, function(err, data) {
          if(err) throw err;
          if(data.length) {
            users.update({login: body.login}, {$set: {sessId: req.sessionID}});
            var obj = {
              'sessId': req.sessionID,
              "login": data[0].login,
              "_id": data[0]._id
            };
            chat.addActiveUser(activeUsers, obj);
            chat.onlineUsers(activeUsers);
            res.end(JSON.stringify(data));
          }
          else {
            res.end(JSON.stringify({'error': 'FUCK Offf'}));
          }
        })
      }
    }
    else {
      users.find({sessId: req.sessionID}, {}, function(err, data) {
        if(err) throw err;
        if(data.length) {
          var obj = {
            'sessId': req.sessionID,
            "login": data[0].login,
            "_id": data[0]._id
          };
          chat.addActiveUser(activeUsers, obj);
        }
        res.end(JSON.stringify(data));
      })
    }
});
var sub_req;
router.post('/pub', function(req, res) {
  var body = req.body;
  var message = {"text": body.message};
  console.log('pub server', message, activeUsers, req.sessionID);
  chat.publish(message, activeUsers, req.sessionID);
  res.end(JSON.stringify({}));
});
router.get('/sub', function(req, res) {
  sub_req = req.sessionID;
  var obj = {
    'sessId': req.sessionID,
    'res': res
  };
  chat.addActiveUser(activeUsers, obj);
  chat.subscribe(req, res);
});
module.exports = router;

/*
 sessions.find({"sessId": sessId}, {}, function(err, data) {
 if(!data.length) {
 sessions.insert({
 "sessId": sessId,
 "allowed": false
 });
 }
 });

 sessions.update(
 { 'sessId': req.sessionID},
 {
 $set: {
 'nickname': body.name
 }
 }
 );
 */