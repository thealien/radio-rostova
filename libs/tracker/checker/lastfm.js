'use strict';

var EventEmitter = require("events").EventEmitter,
    util = require('util'),
    client = require('../client/lastfm');

function parse (data) {
    var result = false;
    try {
        result = {
            name:   data.name || '',
            artist: data.artist['#text'] || '',
            album:  data.album['#text'] || '',
            ts:     data.date ? data.date.uts : 0,
            mbid:   data.mbid || 0,
            image:  data.image || null,
            url:    data.url || null
        };
    }
    catch(e){
        // console.log(e);
    }
    return result;
}

function isSame (track1, track2) {
    return track1 && (track1.name === track2.name);
}

function LastfmChecker (config) {
    this.config = config;
    this.client = client.create(this.config.credential.api_key);

    var currentTrack = {};
    this.getCurrentTrack = function () {
        return currentTrack;
    };
    this.setCurrentTrack = function (track) {
        var me = this;

        if (!isSame(this.getCurrentTrack(), track)) {
            currentTrack = track;
            me.getClient().getTrackInfo2(track.artist, track.name, function (error, result) {
                if (!error) {
                    try {
                        track.image = result.track.album.image;
                    } catch (e) {
                        console.warn(e);
                    }
                }
                me.emit('dataUpdate', me, JSON.parse(JSON.stringify(track)));
            });
        }
        return this;
    };
    this.getCurrentData = this.getCurrentTrack;

    var prevTrack = {};
    this.getPrevTrack = function () {
        return prevTrack;
    };
    this.setPrevTrack = function (track) {
        if (!isSame(this.getPrevTrack(), track)) {
            prevTrack = parse(track);
        }
        return this;
    };
}

util.inherits(LastfmChecker, EventEmitter);

LastfmChecker.prototype.getClient = function () {
    return this.client;
};

LastfmChecker.prototype.check = function (callback) {
    var checker = this;
    this.getClient().getRecentTracks(this.config.channel, 1, function(error, data){
        if (error) {
            console.error(error);
        } else if (!data || !data.recenttracks || !data.recenttracks.track) {
            console.error(new Date(), data);
        } else {
            var tracks = data.recenttracks.track;
            if (tracks instanceof Array) {
            // 2 TRACKS
                checker.setCurrentTrack(parse(tracks[0]));
                checker.setPrevTrack(parse(tracks[1]));
            } else {
            // SINGLE TRACK
                var track =  tracks;
                if (track['@attr'] && track['@attr'].nowplaying) {
            // NOW PLAYNG
                    checker.setCurrentTrack(parse(track));
                } else {
            // STOP PLAYNG
                    checker.setCurrentTrack(checker.config.defaultTrack);
                    checker.setPrevTrack(parse(track));
                }
            }
        }
        return callback();
    });
    return true;
};

LastfmChecker.prototype.getName = function () {
    return this.name;
};

LastfmChecker.prototype.setName = function (name) {
    this.name = name;
    return this;
};

LastfmChecker.prototype.start = function () {
    var checker = this;

    var next = function () {
        checker.check(function () {
            setTimeout(next, checker.config.refreshTime * 1000);
        });
    };

    next();
};

exports.create = function (config) {
    return new LastfmChecker(config);
};
