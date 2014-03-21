'use strict';

// libs
var express = require('express'),
    socketio = require('socket.io'),
    http = require('http'),
    routes = require('./routes'),
    data_tracker;

var app = express();

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

// HTTP Server
var server = http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});

// Tracker
var tracker = data_tracker.create(require('./config/tracker.js').sources);

// socket.io
var io = socketio.listen(server);
if (env === 'production') {
    io.enable('browser client minification');
    io.enable('browser client etag');
    io.enable('browser client gzip');
    io.set('log level', 1);
    io.set('transports', [
        'websocket',
        'flashsocket',
        'htmlfile',
        'xhr-polling',
        'jsonp-polling'
    ]);
}

tracker.on('dataUpdate', function(name, track, formattedTrack){
    console.log(new Date(), formattedTrack);
    if (name === 'radiorostov') {
        io.sockets.emit('trackUpdate', track);
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