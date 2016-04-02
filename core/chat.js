/**
 * Created by mini on 29.02.16.
 */

var monk = require('monk');
var db = monk('localhost:27017/chat_patch');
var users = db.get('users');
var common = require('./common.js');
//var clients = [];
exports.subscribe = function(req, res) {
    //clients.push(res);
};
exports.onlineUsers = function (activeUsers) {
    var activeUsers_ = {};
    activeUsers.forEach(function(user, i) {
        activeUsers_[i] = {
            "login": user.login,
            "_id": user._id
        };
    });
    activeUsers.forEach(function(user, i) {
        user.res.end(activeUsers_);
    });
};
exports.publish = function(message, activeUsers, sessId) {
        var pubUser = {
            "login": "anonymous"
        };
        var activeUsers_ = {};
        activeUsers.forEach(function(user, i) {
            activeUsers_[i] = {
                "login": user.login,
                "_id": user._id
            };
            if(user.sessId == sessId) {
                pubUser = {
                    "login": user.login,
                    "_id": user._id
                };
            }
        });
        console.log('activeUsers_', activeUsers_);
    //    console.log('pubUser', pubUser);
    //    //var obj_message = {
    //    //    "message": message,
    //    //    "user": pubUser
    //    //
    //    //};
    //    //console.log('obj_message', obj_message);
    //  activeUsers.forEach(function(user) {
    //    //user.res.end(JSON.stringify(obj_message));
    //      user.res.end('hui tebe')
    //  });
    ////console.log(sessID)
    console.log(activeUsers);
    activeUsers.forEach(function(item) {

        item.res.end(JSON.stringify({
            "message": message,
            "user": pubUser,
            "activeUsers": activeUsers_
        }
        ))
    })
};
exports.addActiveUser = function(arr, obj) {
    if(obj.login) {
        arr.push(obj);
    }
    else {
        arr.forEach(function(item) {
            if(item.sessId == obj.sessId) {
                item.res = obj.res;
            }
        });
    }
    console.log('addActiveUser', arr, obj.login);
    //if(notHere) {
    //    users.find({"sessId": obj.sessId}, {}, function(err, data) {
    //        if(err) throw err;
    //        //obj["login"] = data.login;
    //        //obj["_id"] = data._id;
    //        data.forEach(function(item){
    //            obj["login"] = item.login;
    //            obj["_id"] = item._id;
    //        });
    //        console.log('arr', arr);
    //    });
    //    return 1
    //}
    //else {
    //    return 0
    //}
};