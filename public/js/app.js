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