/**
 * Created by mini on 26.02.16.
 */
function messageTemplate(message, user){
    console.log(message, user);
    var temp = '<p><b>'+user.login+'</b>: <span>'+message.text+'</span></p>'
    return temp;
}

function auth(data) {
    $.post( "/auth", data).done(function( data ) {
        data =  JSON.parse(data);
        if(data.length) {
            logIn();
            $('.name').text(data[0].login);
        }
    });
}
function logIn () {
    $('.forms_log').hide();
    $('.logout').show();
    $('.messages').show();
    subscribe();
}
function logOut () {
    $.post('/auth', {"logout": 'Y'}).done(function() {
        $('.forms_log').show();
        $('.logout').hide();
        $('.messages').hide();
    });
}
function subscribe () {
    console.log('start polling');
    $.ajax({
        type: 'GET',
        url: '/sub',
        success: function(data){
            data =  JSON.parse(data);
            console.log('stop polling', data);
            $('#text_messages').append(messageTemplate(data.message, data.user));
            subscribe();
        }
    });
}

function publish (message) {
    $.ajax({
        type: 'POST',
        url: '/pub',
        data: {"message": message}
    });
}

$(document).ready(function() {
    $('#reg').submit(function(event) {
        event.preventDefault();
        var reg_data = $(this).serialize();
        $.post( "/reg", reg_data)
            .done(function( data ) {
                data = JSON.parse(data);
                if(data.error) {
                    alert(data.error);
                }
                else {
                   auth({});
                }
                console.log(data);
            });
    });
    $('.logout').click(function(event) {
        event.preventDefault();
        logOut();
    });
    $('#auth').submit(function(event) {
        event.preventDefault();
        var auth_data = $(this).serialize();
        $.post( "/auth", auth_data)
            .done(function( data ) {
                data = JSON.parse(data);
                if(data.error) {
                    alert(data.error);
                }
                else {
                    logIn();
                    $('.name').text(data[0].login);
                }
            });
    });
    auth();
    //
    $('.starPolling').click(function(event) {
        event.preventDefault();
        subscribe();
    });
    $('.stopPolling').click(function(event) {
        event.preventDefault();
        publish('messages');
    });
    $('#message').submit(function(event){
        event.preventDefault();
        publish(this.message.value);
    });
});