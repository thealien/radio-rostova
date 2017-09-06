'use strict';

// libs
var express = require('express'),
    TelegramBot = require('node-telegram-bot-api'),
    socketio = require('socket.io'),
    routes = require('./routes'),
    data_tracker;

var app = express();
var server = app.listen(process.env.PORT || 6789);
var io = socketio.listen(server);

var env = process.env.NODE_ENV || 'development';

var data_tracker_lib = './libs/tracker/';
if (env === 'production') {
    data_tracker_lib = 'data-tracker';
}

data_tracker = require(data_tracker_lib);

app.set('port', process.env.PORT || 6789);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(require('static-favicon')());
app.use(require('body-parser')());
app.use(require('method-override')());
//app.use(app.router);
app.use(require('serve-static')(__dirname + '/public'));

if (env === 'development') {
    app.use(require('morgan')('dev'));
    app.use(require('errorhandler')());
}

app.locals.IS_PROD = (env === 'production');

app.get('/', routes.index);

// exception handler
process.on('uncaughtException', function(err) {
    console.log("Uncaught exception!", err);
});

// Telegram Bot
var tgConfig = require('./config/telegram');
var tgToken = tgConfig.bot_token;
var tgChannel = tgConfig.channel_id;
var tgBot = new TelegramBot(tgToken, {polling: false});

// Tracker
var tracker = data_tracker.create(require('./config/tracker.js').sources);

if (env === 'production') {
    io.set('browser client minification', true);
    io.set('browser client etag', true);
    io.set('browser client gzip', true);
    io.set('log level', 1);
    io.set('transports', [
        'websocket',
        'flashsocket',
        'htmlfile',
        'xhr-polling',
        'jsonp-polling'
    ]);
}


tracker.on('dataUpdate', function(name, track/*, formattedTrack*/){
    //console.log(new Date(), formattedTrack);
    if (name === 'radiorostov') {
        io.sockets.emit('trackUpdate', track);
    }
});

tracker.on('dataUpdate', function(name, track, formattedTrack){
    if (name === 'radiorostov' && track.mbid) {
        var images = track.image;
        var image = images[images.length-1];
        if (image) {
            var photo = image['#text'];
            // var url = track.url;
            // tgBot.sendPhoto(tgChannel, photo, {caption: formattedTrack + '\n' + url, disable_notification: true});
            tgBot.sendPhoto(tgChannel, photo, {caption: formattedTrack, disable_notification: true});
        }
    }
});

tracker.start();

io.sockets.on('connection', function (socket) {
    socket.emit('trackUpdate', tracker.getCurrentData('radiorostov'));
    socket.on('error', function (e) {
        console.error('socketio error');
        console.error(e);
    });
});

