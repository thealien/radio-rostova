'use strict';

// libs
var express = require('express'),
  TelegramBot = require('node-telegram-bot-api'),
  socketio = require('socket.io'),
  routes = require('./routes');

var app = express();
var server = app.listen(process.env.PORT || 6789);
var io = socketio.listen(server);

var env = process.env.NODE_ENV || 'development';
var data_tracker = require('./libs/tracker/');

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

app.locals.IS_PROD = env === 'production';

app.get('/', routes.index);

// exception handler
process.on('uncaughtException', function (err) {
  console.log('Uncaught exception!', err);
});

// Telegram Bot
var tgConfig = require('./config/telegram');
var tgToken = tgConfig.bot_token;
var tgChannel = tgConfig.channel_id;
var tgBot = new TelegramBot(tgToken, { polling: false });

// Tracker
var tracker = data_tracker.create(require('./config/tracker.js').sources);

tracker.on('dataUpdate', function (name, track /*, formattedTrack*/) {
  //console.log(new Date(), formattedTrack);
  if (name === 'radiorostov') {
    io.sockets.emit('trackUpdate', track);
  }
});

var sentToChannel = [];
tracker.on('dataUpdate', function (name, track, formattedTrack) {
  if (name === 'radiorostov' && track.mbid) {
    if (sentToChannel[sentToChannel.length - 1] === formattedTrack) {
      return;
    }

    var images = track.image;
    var defaultImage =
      'https://lastfm-img2.akamaized.net/i/u/300x300/c6f59c1e5e7240a4c0d427abd71f3dbb';
    var image = images[images.length - 1];
    var photo = (image && image['#text']) || defaultImage;
    // var url = track.url;
    // tgBot.sendPhoto(tgChannel, photo, {caption: formattedTrack + '\n' + url, disable_notification: true});
    sentToChannel.push(formattedTrack);
    if (sentToChannel.length > 30) {
      sentToChannel = sentToChannel.slice(-10);
    }
    tgBot.sendPhoto(tgChannel, photo, {
      caption: formattedTrack,
      disable_notification: true,
    });
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
