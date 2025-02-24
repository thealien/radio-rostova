'use strict';

var http = require('http'),
    request = require('request'),
    querystring = require('querystring');

var defaultApiHost = 'ws.audioscrobbler.com';
var defaultFormat= 'json';

function LastFmClient (apiKey) {
    if (apiKey === undefined) {
        throw new Error('apiKey is undefined');
    }

    var key = apiKey;
    this.getApiKey = function () {
        return key;
    };
    this.setApiKey = function (newKey) {
        key = newKey;
        return this;
    };

    var apiHost = defaultApiHost;
    this.getApiHost = function () {
        return apiHost;
    };
    this.setApiHost = function (newApiHost) {
        apiHost = newApiHost;
        return this;
    };

    var format = defaultFormat;
    this.getFormat = function () {
        return format;
    };
    this.setFormat = function(newFormat){
        format = newFormat;
        return this;
    };
}

LastFmClient.prototype.request = function(method, options, callback) {
    options = options || {};
    options.method     = method.toString();
    options.api_key    = this.getApiKey();
    options.format     = this.getFormat();
    options._c         = +(new Date());

    var url = 'http://' + this.getApiHost() + '/2.0/?' + querystring.stringify(options);

    request.get(url, {timeout: 5000}, function(error, res, body){
        var data = null;
        if (!error) {
            if (res.statusCode === 200) {
                try {
                    data = JSON.parse(body);
                }
                catch (e) {
                    error = e;
                }
            } else {
                error = new Error('LastFM error. Code ' + res.statusCode);
            }
        }
        callback(error, data);
    });
};

LastFmClient.prototype.getRecentTracks = function (user, limit, callback) {
    var options = {
        user: user,
        limit:    limit || 1
    };
    this.request('user.getrecenttracks', options, callback);
};

LastFmClient.prototype.getTrackInfo = function (mbid, callback) {
    var options = {
        mbid: mbid
    };
    this.request('track.getInfo', options, callback);
};

LastFmClient.prototype.getTrackInfo2 = function (artist, track, callback) {
    var options = {
        artist: artist,
        track: track
    };
    this.request('track.getInfo', options, callback);
};

exports.create = function(apiKey){
    return new LastFmClient(apiKey);
};
