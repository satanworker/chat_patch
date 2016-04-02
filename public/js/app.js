/**
 * Created by mini on 08.03.16.
 */
$(document).ready(function() {
    var socket = io();
    $('#reg').submit(function(event) {
        event.preventDefault();
        if(this.name.value.length && this.password.value.length) {
            var obj = {
                login: this.name.value,
                pass: this.password.value
            };
            obj = JSON.stringify(obj);
            socket.emit('reg', obj);
            this.name.value = '';
            this.password.value = '';
        }
    });
    $('#auth').submit(function(event) {
        event.preventDefault();
        if(this.name.value.length && this.password.value.length) {
            var obj = {
                login: this.name.value,
                pass: this.password.value
            };
            obj = JSON.stringify(obj);
            socket.emit('auth', obj);
            this.name.value = '';
            this.password.value = '';
        }
    });
    $('#message').submit(function(event) {
        event.preventDefault();
        var obj = {
            message: this.message.value
        };
        obj = JSON.stringify(obj);
        socket.emit('message', obj);
        this.message.value = '';

    });

    $('.pmmessage').submit(function(event) {
        event.preventDefault();
        var obj = {
            to: $(this).data('to'),
            message: this.message.value
        };
        obj = JSON.stringify(obj);
        socket.emit('message', obj);
    });

    var typing = false;
    var timeoutID;
    $('#message').find('input[type="text"]').keydown(function() {
        clearTimeout(timeoutID);
        timeoutID = setTimeout(function() {
        typing = false;
        socket.emit('typing', false);
        console.log('end typing');
        }, 1000);
        if(!typing) {
            console.log('start typing');
            typing = true;
            socket.emit('typing', true);
        }
    });
    socket.on('updateOnline', function(data) {
        data = JSON.parse(data);
        var str = 'онлайн:'+' (' + data.onlineUsers.length + ') ';
        data.onlineUsers.forEach(function(item) {
            str += item.login + ', ';
        });
        $('#onlineUsers').text(str);
        console.log(data);
    });
    socket.on('auth', function(data) {
       data = JSON.parse(data);
        if(data.callback) {
            $('#title').text(data.login);
            $('.tabs_container').hide();
        }
        else {
            alert(data.message);
        }
    });
    socket.on('message', function(data) {
        data = JSON.parse(data);
        var myclass ="";
        console.log(data.user.login, $('#title').text(), $('#title').text()==data.user.login);
        if(data.user.login==$('#title').text())
        {
            myclass="my";
        }
        else {
            myclass ="";
        }


        $('#chat').append('<li class="collection-item '+myclass+'"><span class="title">'+ data.user.login + ':</span> <p>' + data.message + '</p></li> <br />');
        $('#chat').scrollTop($('#chat')[0].scrollHeight);
        console.log(data);
    });
    socket.on('customError', function(data) {
        alert(data);
    });
    socket.on('loadMessages', function(data) {
        data = JSON.parse(data);
        var myclass ="";


        data.forEach(function(data) {
            console.log(data.user.login, $('#title').text(), $('#title').text()==data.user.login);
            if(data.user.login==$('#title').text())
            {
                myclass="my";
            }
            else {
                myclass="";
            }
            $('#chat').append('<li class="collection-item '+myclass+'"><span class="title">'+ data.user.login + ':</span> <p>' + data.message + '</p></li> <br />');
        });
        $('#chat').scrollTop($('#chat')[0].scrollHeight);
    });
    var typingPeople = [];
    socket.on('typing', function(data) {
        data =  JSON.parse(data);
        console.log(data);
        if(data.typing) {
            typingPeople.push(data.login);
        }
        else {
            var index = typingPeople.indexOf(data.login);
            if(index > -1) {
                typingPeople.splice(index, 1);
            }
        }
        if(typingPeople.length) {
            var str = '';
            typingPeople.forEach(function(item) {
               str += ' ' + item;
            });
            if(typingPeople.length > 1) {
                $('#typing').text('пацандре '+ str +' печатают, по царске')
            }
            else {
                $('#typing').text('пацандре '+ str +' печатает, как царь')
            }
        }
        else {
            $('#typing').text('');
        }

    });
    ///>> materialize
    $('ul.tabs').tabs();

});