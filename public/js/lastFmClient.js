'use strict';
(function(window){
    var $ = window.jQuery;

    function LastFmClient(apiKey){
        var apiUrl = 'http://ws.audioscrobbler.com/2.0/';

        this.request = function(data, success, error){
            data = data || {};
            if (typeof data.method === 'undefined') {
                throw new Error('method is undefined');
            }

            data.api_key = data.api_key || apiKey;
            data.format = data.format || 'json';
            $.ajax({
                url: apiUrl,
                crossDomain: true,
                dataType: 'jsonp',
                data: data,
                success: success,
                error: error
            });
        };
    }

    function LastFm(apiKey){
        var client = new LastFmClient(apiKey);
        this.getClient = function(){
            return client;
        };
    }

    LastFm.prototype.getRecentTracks = function(options, success, error){
        if (typeof options.user === 'undefined') {
            throw new Error('User is undefined');
        }
        options.method = 'user.getrecenttracks';
        options.limit = options.limit || 1;
        this.getClient().request(options, success, error);
    };

    // exports
    window.LastFm = LastFm;

})(window);