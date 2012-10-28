/**
 * Module dependencies.
 */

var express = require('express'),
    socketio = require('socket.io'),
    http = require('http'),
    routes = require('./routes'),
    lastfm_tracker = require('./libs/tracker/');

var app = express();

app.configure(function () {
    app.set('port', process.env.PORT || 6789);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function () {
    app.use(express.logger('dev'));
    app.use(express.errorHandler());
});

app.get('/', routes.index);

process.on('uncaughtException', function(err) {
    console.log("Uncaught exception!", err);
});

// HTTP Server
var server = http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});

// LastFm Tracker
var tracker = lastfm_tracker.create(require('./config/tracker.js').sources);

// socket.io
var io = socketio.listen(server);
io.configure('production', function(){
    io.enable('browser client minification');
    io.enable('browser client etag');
    io.enable('browser client gzip');
    io.set('log level', 1);
    io.set('transports', [
        'websocket'
        , 'flashsocket'
        , 'htmlfile'
        , 'xhr-polling'
        , 'jsonp-polling'
    ]);
});

tracker.on('trackUpdate', function(name, track){
    console.log(new Date(), tracker.format(track));
    if (name == 'radiorostov') {
        io.sockets.emit('trackUpdate', track);
    }
});
tracker.start();

io.sockets.on('connection', function (socket) {
    socket.emit('trackUpdate', tracker.getCurrentTrack('radiorostov'));
});