var http = require('http'),
    querystring = require('querystring');

var defaultApiHost = 'ws.audioscrobbler.com';
var defaultFormat= 'json';

function LastFmClient (apiKey) {
    if (apiKey === undefined) {
        throw Error('apiKey is undefined');
    }

    var key = apiKey;
    this.getApiKey = function () {
        return key;
    }
    this.setApiKey = function (newKey) {
        key = newKey;
        return this;
    }

    var apiHost = defaultApiHost;
    this.getApiHost = function () {
        return apiHost;
    }
    this.setApiHost = function (newApiHost) {
        apiHost = newApiHost;
        return this;
    }

    var format = defaultFormat;
    this.getFormat = function () {
        return format;
    }
    this.setFormat = function(newFormat){
        format = newFormat;
        return this;
    }
}

LastFmClient.prototype.request = function(method, options, callback) {
    options = options || {};
    options.method     = method.toString();
    options.api_key    = this.getApiKey();
    options.format     = this.getFormat();
    options._c         = +(new Date());

    var defaults = {
        host: this.getApiHost(),
        path: '/2.0/?' + querystring.stringify(options)
    };

    http.get(defaults, function(res){
        var data = '';
        res.on('data', function(chunk){
            data += chunk;
        });
        res.on('end', function(){
            try {
                data = JSON.parse(data);
            }
            catch (e) {
                data = null;
                console.log('lastfm error. code', res.statusCode)
            }
            callback(data);
        })
    })
        .on('error', function(e) {
            console.log("Got error: " + e.message);
            callback(null);
        });
};

LastFmClient.prototype.getRecentTracks = function (user, limit, callback) {
    var options = {
        user: user,
        limit:    limit || 1
    };
    this.request('user.getrecenttracks', options, callback);
};



exports.create = function(apiKey){
    return new LastFmClient(apiKey);
};