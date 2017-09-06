'use strict';

const express = require('express');
const staticFavicon = require('static-favicon');
const methodOverride = require('method-override');
const serveStatic = require('serve-static');
const morgan = require('morgan');
const errorhandler = require('errorhandler');

const TelegramBot = require('node-telegram-bot-api');
const socketio = require('socket.io');
const data_tracker = require('data-tracker');

const port = parseInt(process.env.PORT, 10) || 6789;

const app = express();
app.isProd = app.get('env') === 'production';
app.set('port', port);
app.set('views',  `${__dirname}/views`);
app.set('view engine', 'jade');
app.use(staticFavicon());
app.use(methodOverride());
app.use(serveStatic(`${__dirname}/public`));

const server = app.listen(port);
const io = socketio.listen(server);

if (!app.isProd) {
    app.use(morgan('dev'));
    app.use(errorhandler());
}

app.locals.IS_PROD = app.isProd;
app.get('/', (req, res) => res.render('index'));

// exception handler
process.on('uncaughtException', err => console.log("Uncaught exception!", err));

// Telegram Bot
const tgConfig = require('./config/telegram');
const tgToken = tgConfig.bot_token;
const tgChannel = tgConfig.channel_id;
const tgBot = new TelegramBot(tgToken, {polling: false});

// Tracker
const tracker = data_tracker.create(require('./config/tracker.js').sources);

if (app.isProd) {
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

tracker.on('dataUpdate', (name, track) =>{
    if (name === 'radiorostov') {
        io.sockets.emit('trackUpdate', track);
    }
});

tracker.on('dataUpdate', (name, track, formattedTrack) => {
    if (name === 'radiorostov' && track.mbid) {
        const images = track.image;
        const image = images[images.length-1];
        if (image) {
            const photo = image['#text'];
            // var url = track.url;
            // tgBot.sendPhoto(tgChannel, photo, {caption: formattedTrack + '\n' + url, disable_notification: true});
            // tgBot.sendPhoto(tgChannel, photo, {caption: formattedTrack, disable_notification: true});
        }
    }
});

tracker.start();

io.sockets.on('connection', socket => {
    socket.emit('trackUpdate', tracker.getCurrentData('radiorostov'));
    socket.on('error', function (e) {
        console.error('socketio error');
        console.error(e);
    });
});

