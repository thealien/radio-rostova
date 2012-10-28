var EventEmitter = require("events").EventEmitter,
    util = require('util'),
    client = require('../client/lastfm');



function LastfmChecker (config) {
    this.config = config;
    this.client = client.create(this.config.credential.api_key);

    this.inPause = false;

    var currentTrack = {};
    this.getCurrentTrack = function () {
        return currentTrack;
    }
    this.setCurrentTrack = function (track) {
        currentTrack = track;
        this.emit('trackUpdate', this, track)
        return this;
    }

    var prevTrack = {};
    this.getPrevTrack = function () {
        return prevTrack;
    }
    this.setPrevTrack = function (track) {
        prevTrack = track;
        return this;
    }
}

LastfmChecker.prototype = new EventEmitter;
LastfmChecker.constructor = LastfmChecker;

LastfmChecker.prototype.getClient = function () {
    return this.client;
}

LastfmChecker.prototype.setClient = function (client) {
    this.client = client;
    return this;
}

LastfmChecker.prototype.check = function () {
    var checker = this;
    this.getClient().getRecentTracks(this.config.channel, 1, function(data){
        var currentTrack = {},
            prevTrack = {};
        if(data){
            try {
                var track = data.recenttracks.track;
                if(util.isArray(track)){
                    currentTrack    =  checker.parse(track[0]);
                    prevTrack       =  checker.parse(track[1]);
                    checker.inPause    = false;
                } else { // case with jingle
                    //console.log('def track', checker.config.defaultTrack);
                    currentTrack    = checker.config.defaultTrack;
                    prevTrack       = { name:   '', artist: '', ts: 0 };
                    checker.inPause    = true;
                }
            }
            catch (e){
                console.log(e);
            }

            if(
                (checker.inPause && checker.getPrevTrack().ts)   // включился джингл/реклама
                    ||
                    ((prevTrack.ts > (checker.getPrevTrack().ts || 0))) // сменилась песня, судя по времени
                    ||
                    (checker.getCurrentTrack().mbid != currentTrack.mbid)    // сменилась песня, судя по mbid
                )
            {
                checker.setPrevTrack(prevTrack);
                checker.setCurrentTrack(currentTrack);
            }
        } else {
            currentTrack    = Object.create(checker.config.defaultTrack);
            checker.setCurrentTrack(currentTrack);
        }

        setTimeout(
            function(){
                checker.check();
            },
            checker.config.refreshTime * 1000
        );
    });
    return true;
}

LastfmChecker.prototype.parse = function (data) {
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
        console.log(e);
    }
    return result;
}

LastfmChecker.prototype.getName = function () {
    return this.name;
}

LastfmChecker.prototype.setName = function (name) {
    this.name = name;
    return this;
}

LastfmChecker.prototype.start = function () {
    this.check();
}

exports.create = function (config) {
    return new LastfmChecker(config);
}