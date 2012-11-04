(function (window, undefined) {

    function abstractFunc(){ throw new Error('Abstract function '); }

    //
    // BasePlayer
    //

    function BasePlayer(player, options){
        if (typeof player ==='string') {
            player = window.document.getElementById(player);
            if (!player) {
                throw new Error('Cant found player element with id '+player);
            }
        }
        this.getPlayer = function(){
            return player;
        };

        options = options || {};
        options.files = options.files || [];
        this.options = options;

        var currentFileIndex = 0,
            inPlay = false;

        this.getCurrentFileIndex = function(){
            return currentFileIndex;
        };
        this.setCurrentFileIndex = function(index){
            index = parseInt(index, 10) || 0;
            if (index < 0 || index > options.files.length) {
                index = 0;
            }
            currentFileIndex = index;
            return this;
        };
        this.getCurrentFile = function(){
            var file = this.options.files[this.getCurrentFileIndex()];
            if (!file) {
                throw Error('File #'+this.getCurrentFileIndex()+' does not exists');
            }
            return file;
        };
        this.inPlay = function(status){
            return arguments.length ? (inPlay = !!status) : (inPlay);
        };
    }

    BasePlayer.prototype.getOptions = function(){
        return this.options;
    };

    BasePlayer.prototype.getOption = function(name){
        return this.options[name];
    };

    BasePlayer.prototype.setOption = function(name, value){
        this.options[name] = value;
        return this;
    };

    BasePlayer.prototype.play = abstractFunc;

    BasePlayer.prototype.stop = abstractFunc;

    BasePlayer.prototype.pause = abstractFunc;

    BasePlayer.prototype.next = abstractFunc;

    BasePlayer.prototype.prev = abstractFunc;

    BasePlayer.prototype.getVolume = abstractFunc;

    BasePlayer.prototype.setVolume = abstractFunc;

    BasePlayer.prototype.toNext = function(){
        var index = this.getCurrentFileIndex() || 0;
        index++;
        if (index == this.getOption('files').length) {
            index = 0;
        }
        this.setCurrentFileIndex(index);
    };

    BasePlayer.prototype.toPrev = function(){
        var index = this.getCurrentFileIndex() || 0;
        index--;
        if (index < 0) {
            index = this.getOption('files').length - 1;
        }
        this.setCurrentFileIndex(index);
    };

    BasePlayer.prototype.addFile = function(file){
        this.options.push(file);
        return this;
    };


    //
    // HTML5 player
    //

    function Html5Player(player, options){
        this.parent.apply(this, arguments);

        var self = this;
        var p = this.getPlayer();
        // events
        window.jQuery(p).on('play', function(){
            self.onStartPlay();
        });
        window.jQuery(p).on('canplaythrough',function(){
            self.onPlay();
        });
    }

    Html5Player.prototype = new BasePlayer;
    Html5Player.prototype.parent = BasePlayer;
    Html5Player.prototype.constructor = Html5Player;

    Html5Player.isSupport = function(){
        if (window.Audio !== undefined) {
            try {
                new window.Audio();
                return true;
            } catch(e){}
        }
        return false;
    };

    Html5Player.isSupportFormat = function(format){
        var result = false;
        if (Html5Player.isSupport()) {
            format = format.toLowerCase();
            var formats = {
                ogg: 'audio/ogg;',
                mp3: 'audio/mpeg;'
            };
            var a = new window.Audio();
            result = (formats[format] && !!a.canPlayType(formats[format]));
        }
        return result;
    };

    Html5Player.prototype.play = function(){
        var file = this.getCurrentFile();
        this.getPlayer().setAttribute('src', file);
        this.getPlayer().play();
        this.inPlay(true);
    };

    Html5Player.prototype.stop = function(){
        this.getPlayer().pause();
        this.inPlay(false);
    };

    Html5Player.prototype.next = function(){
        this.toNext();
        this.inPlay() && this.play();
        return this;
    };

    Html5Player.prototype.prev = function(){
        this.toPrev();
        this.inPlay() && this.play();
    };

    Html5Player.prototype.setVolume = function(volume){
        if (volume < 0 || volume > 100) {
            return false;
        }
        this.getPlayer().volume = volume/100;
        return this;
    };

    Html5Player.prototype.onStartPlay = function(){
        if(typeof this.options.onStartPlay == 'function') {
            this.options.onStartPlay();
        }
    };

    Html5Player.prototype.onPlay = function(){
        if(typeof this.options.onPlay == 'function') {
            this.options.onPlay();
        }
    };


    //
    // Uppod Player
    //


    function UppodPlayer(player, options){
        this.parent.apply(this, arguments);
    }

    UppodPlayer.prototype = new BasePlayer;
    UppodPlayer.prototype.parent = BasePlayer;
    UppodPlayer.prototype.constructor = UppodPlayer;

    UppodPlayer.prototype.send = function(cmd){
        try {
            uppodSend(this.getPlayer().id, cmd);
        } catch (e) {
            console.warn(e);
        }
        return this;
    };

    UppodPlayer.prototype.play = function(){
        var file = this.getCurrentFile();
        this.send('file:' + file);
        this.inPlay(true);
    };

    UppodPlayer.prototype.stop = function(){
        this.send('stop');
        this.inPlay(false);
    };

    UppodPlayer.prototype.next = function(){
        this.toNext();
        this.inPlay() && this.play();
        return this;
    };

    UppodPlayer.prototype.prev = function(){
        this.toPrev();
        this.inPlay() && this.play();
    };

    UppodPlayer.prototype.setVolume = function(volume){
        if (volume < 0 || volume > 100) {
            return false;
        }
        return this.send('v' + volume);
    };

    UppodPlayer.createPlayerObject = function(options){
        options = options || {};
        options.width = options.width || 1;
        options.height = options.height || 1;
        options.arguments = options.arguments || {};
        checkOptions(options);

        var isMSIE = (!!top.execScript),
            obj = (isMSIE) ? createIeObject(options.movie) : document.createElement("object");

        if (!isMSIE) {
            obj.setAttribute("type", "application/x-shockwave-flash");
            obj.setAttribute("data", options.movie);
        }

        obj.setAttribute("id", options.id);
        obj.setAttribute("width", options.width);
        obj.setAttribute("height", options.height);

        var param_flashvars = document.createElement("param");
        param_flashvars.setAttribute("name", "flashvars");
        param_flashvars.setAttribute("value", createArgs(options.arguments));
        obj.appendChild(param_flashvars);
        document.body.appendChild(obj);
        return obj;

        // helpers
        function createIeObject(url){
            var div = document.createElement("div");
            div.innerHTML = "<object classid='clsid:D27CDB6E-AE6D-11cf-96B8-444553540000'><param name='movie' value='" +url + "'></object>";
            return div.firstChild;
        }

        function checkOptions(options){
            if(!options.movie) throw Error('options.movie does not exist');
            if(!options.id)throw  Error('options.id does not exist');
        }

        function createArgs(args){
            args = args || {};
            var result = [];
            var arg;
            for(arg in args){
                if(!args.hasOwnProperty(arg))continue;
                result.push(arg+'='+args[arg]);
            }
            return result.join('&');
        }
    };

    // export
    window.BasePlayer = BasePlayer;
    window.Html5Player = Html5Player;
    window.UppodPlayer = UppodPlayer;

})(window);

//	JavaScript API 2.0 for Uppod 1+
//  http://uppod.ru/js

// Events

function uppodEvent(playerID,event) {
    switch(event){

        case 'init':

            break;

        case 'start':

            break;

        case 'play':

            break;

        case 'pause':

            break;

        case 'stop':

            break;

        case 'seek':

            break;

        case 'loaded':

            break;

        case 'end':

            break;

        case 'download':

            break;

        case 'quality':

            break;

        case 'error':

            break;

        case 'ad_end':

            break;

        case 'pl':

            break;
    }

}

// Commands

function uppodSend(playerID,com,callback) {
    document.getElementById(playerID).sendToUppod(com);
}

// Requests

function uppodGet(playerID,com,callback) {
    return document.getElementById(playerID).getUppod(com);
}


(function(window, undefined){

    function LastFmClient(apiKey){
        var apiUrl = 'http://ws.audioscrobbler.com/2.0/';

        this.request = function(data, success, error){
            data = data || {};
            if (data.method === undefined) {
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
        }
    }

    LastFm.prototype.getRecentTracks = function(options, success, error){
        if (options.user === undefined) {
            throw new Error('User is undefined');
        }
        options.method = 'user.getrecenttracks';
        options.limit = options.limit || 1;
        this.getClient().request(options, success, error);
    };

    // exports
    window.LastFm = LastFm;

})(window);

// track-searcher
(function(window, undefined){
    var $ = window.jQuery;
    var lastFm = new LastFm('c7cf555ada3061e1a0fe8b258185d6d9');
    var tabButton = $('#track-searcher .tab-button.search:first');
    var wrapper = $('#track-searcher .wrapper');
    var form = $('.form:first', wrapper);
    var result = $('ul.list:first', wrapper);
    tabButton.click(function(){
        tabButton.hide();
        wrapper.slideDown();
    });
    var dayButtons = $('p.buttons a.day-button', form);
    dayButtons.click(function(){
        var me = $(this);
        dayButtons.removeClass('selected');
        me.addClass('selected');
        updateDayInput(me.attr('data-day'));
        return false;
    });
    var closeBtn = $('p.buttons a.close:first');
    closeBtn.click(function(){
        clearSearchResult(true);
        wrapper.slideUp(function(){
            tabButton.show();
        });
    });
    var inputs = {
        date: $('.inputs input.date:first'),
        time: $('.inputs input.time:first'),
        search: $('.inputs input.submit:first')
    };

    updateDayInput('today', true);

    inputs.search.click(function(){
        clearSearchResult(true);
        var date = inputs.date.val();
        date = date.split('.').reverse();
        if (date[0].length < 4) date[0] = '20'+date[0];
        date = date.join('-');

        var time = inputs.time.val();
        time = time.split(':').concat(['00']).join(':');

        var dt = new Date(date + 'T' + time+getGMTOffset());
        if (!dt) return false;
        searchTrack(dt);
    });

    function searchTrack (date) {
        var ts = parseInt((+date)/1000);
        var delta = 10*60;
        lastFm.getRecentTracks(
            {
                user:   'radiorostova',
                from:   ts-delta,
                to:     ts+delta,
                limit:  5
            },
            function(data){
                var tracks;
                try {
                    tracks = data.recenttracks.track;
                } catch (e) {
                    tracks = [];
                }
                showSearchResult(tracks, ts);
            },
            function(a, b){

            }
        );
    }

    function showSearchResult (tracks, ts) {
        tracks = tracks || [];
        var count = tracks.length;

        if (count<1) {
            return showEmptySearchResult();
        }
        clearSearchResult();
        var i, track, res = '', time = ts, target = null, cls, date;
        for (i=0; i<count; i++) {
            track = tracks[i];
            var trackDt = new Date();
            trackDt.setSeconds(0);
            if( track.date ) {
                date = parseInt(track.date.uts, 10);
                trackDt.setTime((date)* 1000);
                trackDt.setSeconds(0);
            } else {
                continue;
            }
            date = parseInt(trackDt/1000, 10);
            cls = '';
            if(!target && time >= date) {
                cls = 'target';
                target = true;
            }
            var elem = '<li class="track '+cls+'">' +
                '<img class="poster" src="'+track.image[0]['#text']+'">' +
                '<div class="info">' +
                '<a class="name" target="_blank" href="'+track.url+'">'+track.name+'</a>' +
                '<a class="artist" target="_blank" href="'+track.url+'">'+track.artist['#text']+'</a>' +
                '<div class="dt">' +
                '<span class="time">'+getTime(trackDt)+'</span><br><span class="date"> '+getDate(trackDt)+'</span>' +
                '</div>' +
                '</div>' +
                '<div class="clear"></div>' +
                '</li>';
            res = elem + res;
        }
        result.html(res).slideDown();
    }

    function clearSearchResult (hide) {
        if (hide) result.hide();
        result.empty();
    }

    function showEmptySearchResult () {
        clearSearchResult();
        result.html('К сожалению ничего не найдено');
        result.slideDown();
    }

    function updateDayInput(type, setTime) {
        type = type || 'today';
        if (!{today:1, yesterday:1, other:1}[type]) {
            return false;
        }
        var date = new Date();
        switch (type) {
            case 'yesterday':
                date.setDate(date.getDate()-1);
            case 'today':
                inputs.date.attr('disabled', true);
                break;
            case 'other':
            default:
                inputs.date.attr('disabled', null);
                inputs.date[0].focus();
                inputs.date[0].select();
        }
        var str = getDate(date);
        inputs.date.val(str);
        if (setTime) {
            date.setMinutes(0);
            str = getTime(date);
            inputs.time.val(str);
        }
    }

    function getTime(date){
        return [
            String(date.getHours()).replace(/^(\d){1}$/, '0\$1'),
            String(date.getMinutes()).replace(/^(\d){1}$/, '0\$1')
        ].join(':');
    }

    function getDate (date) {
        return [
            String(date.getDate()).replace(/^(\d){1}$/, '0\$1'),
            date.getMonth()+1,
            String(date.getFullYear()).replace(/^(\d){2}/, '')
        ].join('.')
    }

    function getGMTOffset () {
        var tz = new Date().getTimezoneOffset()/60
        var sign = (tz<0) ? '+':'-';
        tz = String(Math.abs(tz));
        if(tz.length<2) tz = '0'+tz;
        return sign+tz+':00';
    }
}(window));

// tracker
(function(window, undefined){
    var currentTrack = null;
    var $ = window.jQuery;
    var l = window.location;
    var host = l.protocol + '//'+ l.host+':6789';
    var socket = io.connect(host);
    socket.on('trackUpdate', function (data) {
        currentTrack = parseTrackData(data);
        if (!currentTrack) return false;
        updateTrack(currentTrack);
    });

    var infoControlsContainer = $('#rr-player .track');
    var infoControls = {
        name:   $('span.name', infoControlsContainer),
        artist: $('span.artist', infoControlsContainer),
        coverLinks: $('#rr-player .track a.track-link, #cover-link'),
        coverImage: $('#cover-image')
    };

    function updateTrack(track){
        if(track.artist && track.name){
            infoControls.name.html(track.name);
            infoControls.artist.html(track.artist);
            infoControls.coverLinks.attr('href', track.url);
            infoControls.coverImage.attr('src', track.image);
        }
    }

    function parseTrackData(track){
        var image;
        try {
            image = track.image[2]['#text']
        } catch(e){}
        image = image || 'images/player/poster.jpg';
        return {
            name:   track.name || null,
            artist: track.artist || null,
            url:    track.url || null,
            image: image
        };
    }
})(window);

//player
(function(window, undefined){
    var $ = window.$;
    var streams = [
        'http://radio.romanziva.ru:8000/rostovradio',
        'http://zavalinka.in:8000/rostovradio',
        'http://178.76.238.182:8000/rostovradio',
        'http://zavalinka.in:8000/rostovradiofm',
        'http://178.76.238.182:8000/rostovradiofm',
        'http://81.19.85.204:80/rostov.mp3'
    ];

    var player;
    // HTML5
    if (Html5Player.isSupportFormat('mp3')) {
        player = new Html5Player((new Audio()), {
            files: streams,
            onStartPlay: function(){
                //console.log(1); // TODO
            },
            onPlay: function(){
                //console.log(2); // TODO
            }
        });
        afterPlayerInit();
    }
    // FLASH
    else if(checkFlash()) {
        var playerObj = UppodPlayer.createPlayerObject({
            movie: 'swf/uppod-audio.swf',
            id: 'player',
            arguments:{
                uid:'player',
                file: 'http%3A%2F%2Fzavalinka.in%3A8000%2Frostovradio',
                st:'/swf/youtube.txt'
            }
        });
        playerObj.style.visibility = 'hidden';
        player = new UppodPlayer(playerObj, {
            files: streams
        });
        window.uppodEvent = function(playerId, event){
            switch (event) {
                case 'init':
                    afterPlayerInit();
                    break;
            }
        };
    }
    // NO FLASH
    else{
        $('#rr-player').addClass('no-flash');
    }

    function afterPlayerInit(){
        var volume = loadVolume();
        var controls = getControls(window.$);
        controls.play.click(onPlayClick);
        controls.prev.mousedown(onPrevClick);
        controls.next.mousedown(onNextClick);
        controls.stop.mousedown(onStopClick);
        controls.volume.progress.on('mousemove mousedown', function(e){
            if (e.type == 'mousedown') {
                this.mousedown = true;
            }
            if (!this.mousedown) {
                return false;
            }
            var me = $(this);
            this.width = this.width || (this.width = me.innerWidth());
            var diff = e.clientX - me.offset().left;
            var value = Math.round(diff/this.width*100);
            onVolumeChange(value);
        });
        $(document).on('mouseup', function(){
            controls.volume.progress[0].mousedown = false;
        });

        onVolumeChange(volume, true); //volume on load
        function getControls($){
            var controlsContainer = $('#rr-player .track-info');
            var controls = {};
            controls.volume = {
                progress: $('.volume .progress', controlsContainer),
                slider: $('.volume .progress .slider', controlsContainer),
                value: $('.volume .value', controlsContainer)
            };
            controls.buttons = $('.controls', controlsContainer);
            controls.play   = $('.button.play', controlsContainer);
            controls.prev   = $('.button.prev', controlsContainer);
            controls.next   = $('.button.next', controlsContainer);
            controls.stop   = $('.button.pause', controlsContainer);
            controls.stream = $('.stream-info .stream-index');
            controls.url    = $('.stream-info .url');
            return controls;
        }

        function onVolumeChange(v, force){
            if (v != volume || force){
                controls.volume.slider.css('width', v+'%');
                controls.volume.value.text( v+'%');
                player.setVolume(volume);
                volume = v;
                saveVolume(volume);
            }
        }

        function onPlayClick(){
            player.play();
            controls.buttons.addClass('inplay');
        }

        function onPrevClick(){
            player.prev();
            emulateClick(controls.prev);
            updateStreamLabel();
        }

        function onNextClick(){
            player.next();
            emulateClick(controls.next);
            updateStreamLabel();
        }

        function onStopClick(){
            player.stop();
            emulateClick(controls.stop);
            controls.buttons.removeClass('inplay');
        }

        function emulateClick(button){
            button.addClass('vc-control-active');
            window.setTimeout(function(){
                button.removeClass('vc-control-active');
            }, 200);
        }

        function updateStreamLabel(){
            controls.stream.text('#'+(player.getCurrentFileIndex()+1));
            controls.url.attr('href', player.getCurrentFile() + '.m3u').text(player.getCurrentFile());
        }

        function getCookie(name) {
            var matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"));
            return matches ? decodeURIComponent(matches[1]) : undefined;
        }


        function setCookie(name, value, props) {
            props = props || {};
            var exp = props.expires;
            if (typeof exp == "number" && exp) {
                var d = new Date();
                d.setTime(d.getTime() + exp * 1000);
                exp = props.expires = d;
            }
            if (exp && exp.toUTCString) {
                props.expires = exp.toUTCString();
            }

            value = encodeURIComponent(value);
            var updatedCookie = name + "=" + value;
            for (var propName in props) {
                updatedCookie += "; " + propName;
                var propValue = props[propName];
                if (propValue !== true) {
                    updatedCookie += "=" + propValue;
                }
            }
            window.document.cookie = updatedCookie;
        }

        function loadVolume(){
            var volume = parseInt(getCookie('playerVolume'));
            if(isNaN(volume) || volume < 0 || volume > 100)
                volume = 50;
            return volume;
        }

        var saveVolumeTimer;
        var date = new Date();
        function saveVolume(volume){
            if (saveVolumeTimer) {
                window.clearTimeout(saveVolumeTimer);
                saveVolumeTimer = null;
            }
            saveVolumeTimer = window.setTimeout(function(){
                setCookie('playerVolume', volume, {
                    expires: (new Date()).setFullYear(date.getFullYear()+1)
                });
            }, 25);
        }
    }

    function checkFlash() {
        var hasFlash = false;
        try {
            var fo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
            if (fo) hasFlash = true;
        } catch (e) {
            if (navigator.mimeTypes ["application/x-shockwave-flash"] != undefined) hasFlash = true;
        }
        return !!hasFlash;
    }

})(window);

// VK comments
$(function(){
    var pageUrl = 'http://radio.romanziva.ru/';
    VK.init({apiId: 2859319, onlyWidgets: true});
    VK.Widgets.Like("vk_like", {type: "mini", height: 18, pageUrl: pageUrl});
    VK.Widgets.Comments("vk_comments", {limit: 10, width: "500", attach: "*", pageUrl: pageUrl});
});