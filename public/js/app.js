/*global Html5Player, UppodPlayer, VK, io, LastFm, ActiveXObject */
// Date hack for IE8
(function(){
    var D= new Date('2011-06-02T09:34:29+02:00');
    if(!D || +D!== 1307000069000){
        Date.fromISO= function(s){
            var day, tz,
                rx=/^(\d{4}\-\d\d\-\d\d([tT][\d:\.]*)?)([zZ]|([+\-])(\d\d):(\d\d))?$/,
                p= rx.exec(s) || [];
            if(p[1]){
                day= p[1].split(/\D/);
                for(var i= 0, L= day.length; i<L; i++){
                    day[i]= parseInt(day[i], 10) || 0;
                }
                day[1]-= 1;
                day= new Date(Date.UTC.apply(Date, day));
                if(!day.getDate()) return NaN;
                if(p[5]){
                    tz= (parseInt(p[5], 10)*60);
                    if(p[6]) { tz+= parseInt(p[6], 10);}
                    if(p[4] === '+') { tz*= -1; }
                    if(tz) { day.setUTCMinutes(day.getUTCMinutes()+ tz);}
                }
                return day;
            }
            return NaN;
        };
    }
    else{
        Date.fromISO=function(s){
            return new Date(s);
        };
    }
})();

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


    inputs.search.on('click', preSearch);
    inputs.date.on('keypress', onInputKePress);
    inputs.time.on('keypress', onInputKePress);

    function onInputKePress (e) {
        if (e.keyCode === 13) {
            preSearch();
        }
    }

    function preSearch () {
        // date
        var date = trim(inputs.date.val());
        date = date.split(/[^\d]/).reverse();
        if (date.length < 3) {
            alert('Неверный формат даты. Введите в виде дд.мм.гг');
        }
        date[1] = zeroFill(date[1], 2);
        date[2] = zeroFill(date[2], 2);
        if (date[0].length < 4) { date[0] = '20'+date[0]; }
        date = date.join('-');
        // time
        var time = trim(inputs.time.val());
        time = time.split(/[^\d]/);
        if (time.length < 2) {
            alert('Неверный формат времени. Введите в виде чч:мм');
        }
        time[0] = zeroFill(time[0], 2);
        time = time.concat(['00']).join(':');

        var dt = Date.fromISO(date + 'T' + time+getGMTOffset());
        if (isNaN(+dt)) {
            alert('Ошибочная дата. Повнимательнее.');
            return false;
        }
        clearSearchResult(true);
        searchTrack(dt);
    }

    function searchTrack (date) {
        var ts = parseInt((+date)/1000, 10);
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
            function(){}
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
        if (hide) { result.hide(); }
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
        var disabled  = null;
        switch (type) {
            case 'yesterday':
                date.setDate(date.getDate()-1);
                disabled = true;
                break;
            case 'today':
                disabled = true;
                break;
            default:
                inputs.date[0].focus();
                inputs.date[0].select();
        }
        inputs.date.attr('disabled', disabled);
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
            zeroFill(date.getHours(), 2),
            zeroFill(date.getMinutes(), 2)
        ].join(':');
    }

    function getDate (date) {
        return [
            zeroFill(date.getDate(), 2),
            zeroFill(date.getMonth()+1, 2),
            String(date.getFullYear()).replace(/^(\d){2}/, '')
        ].join('.');
    }

    function getGMTOffset () {
        var tz = new Date().getTimezoneOffset()/60;
        var sign = (tz<0) ? '+':'-';
        tz = String(Math.abs(tz));
        if (tz.length<2) { tz = '0'+tz; }
        return sign+tz+':00';
    }

    function zeroFill(value, count){
        count = Number(count);
        var result = String(value);
        if (count && result.length < count) {
            result = (new Array(count-result.length+1)).join('0') + value;
        }
        return result;
    }
}(window));

// Hand Pointer
(function (window, undefined) {
    var $, $hand, $tabButton;
    var hideHelper = Number(getCookie('search-helper'));
    if (!hideHelper) {
        $ = window.jQuery;
        $hand = $('#hand-pointer');
        $tabButton = $('#track-searcher .tab-button.search:first');
        $tabButton.click(function () {
            if (!hideHelper) {
                hideHelper = true;
                var date = new Date();
                date.setFullYear(date.getFullYear()+1);
                setCookie('search-helper', 1, {
                    expires: date
                });
                $hand.remove();
            }
        });
        $hand.show();
        animate(false);
    }
    function animate (forward) {
        if (hideHelper) { return; }
        $hand.animate({
            left: (forward?'+':'-')+'=20'
        },{
            duration: 500,
            complete: function () {
                animate(!forward);
            }
        });
    }
})(window);

// tracker
(function(window, undefined){
    var currentTrack = null;
    var $ = window.jQuery;
    var l = window.location;
    var win = $(window);
    var host = l.protocol + '//'+ l.host+':6789';
    var socket = io.connect(host);
    socket.on('trackUpdate', function (data) {
        currentTrack = parseTrackData(data);
        if (!currentTrack) { return false; }
        win.trigger('trackUpdate', currentTrack);
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
            image = track.image[2]['#text'];
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

// like button
(function (window, undefined) {
    var $ = window.jQuery, afterShareClick;
    var $likeIcon = $('#like');
    var $fbLike = $likeIcon.children('.target.facebook:first');
    var $vkLike = $likeIcon.children('.target.vkontakte:first');
    var $twLike = $likeIcon.children('.target.twitter:first');
    //var $googleLike = $likeIcon.children('.target.google:first');
    if (isTouchDevice()) {
        $likeIcon.addClass('touch');
        $likeIcon.on('click', function () {
            $likeIcon.addClass('touched');
            return false;
        });
        afterShareClick = function (e) {
            e.stopPropagation();
            $likeIcon.removeClass('touched');
        };
        $fbLike.on('click', afterShareClick);
        $vkLike.on('click', afterShareClick);
        $twLike.on('click', afterShareClick);
        $(document).on('click', afterShareClick);
    }

    $(window).on('trackUpdate', function (e, track) {
        if(track.artist === 'Радио Ростова на 101.6 FM' || track.artist === 'Радио Ростова') {
            $likeIcon.hide();
        } else {
            var tr = $.extend({}, track);
            tr.text = 'Я слушаю "'+ tr.artist+' - ' + tr.name + '" на Радио Ростова';
            tr.url = 'http://live.radiorostov.ru';
            updateFbLike(tr);
            updateVkLike(tr);
            updateTwLike(tr);
            //updateGoogleLike(track);
            $likeIcon.show();
        }
    });

    function updateFbLike (data) {
        var url = 'http://www.facebook.com/sharer/sharer.php?s=100&p[title]=Радио Ростова 101.6 FM&p[summary]='+encodeURIComponent(data.text)+'&p[url]='+encodeURIComponent(data.url)+'&p[images][0]='+encodeURIComponent(data.image);
        $fbLike.attr('href', url);
    }
    function updateVkLike (data) {
        var url = 'http://vk.com/share.php?url='+encodeURIComponent(data.url)+'&description='+encodeURIComponent(data.text)+'&title=Радио Ростова 101.6 FM&image='+encodeURIComponent(data.image)+'&noparse=true';
        $vkLike.attr('href', url);
    }
    function updateTwLike (data) {
        var text = '#nowlistening "'+ data.artist+' - ' + data.name + '" on @radiorostova';
        var url = 'http://twitter.com/home?status='+encodeURIComponent(text)+' - '+encodeURIComponent(data.url);
        $twLike.attr('href', url);
    }
})(window);

//player
(function(window, undefined){
    var $ = window.$;
    var streams = [
        'http://live.radiorostov.ru:8000/rostovradio',
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
                //console.log(1);
            },
            onPlay: function(){
                //console.log(2);
            }
        });
        afterPlayerInit();
    }
    // FLASH
    else if(checkFlash()) {
        window.uppodEvent = function(playerId, event){
            if (event === 'init') {
                afterPlayerInit();
            }
        };

        var playerObj = $(
            '<object width="400" height="60" type="application/x-shockwave-flash" data="swf/uppod-audio.swf" id="rrplayer" style="visibility: visible;">' +
                '<param name="movie" value="swf/uppod-audio.swf">'+
                '<param name="id" value="rrplayer">' +
                '<param name="allowScriptAccess" value="always">' +
                '<param name="flashvars" value="uid=rrplayer&amp;st=/swf/youtube.txt&amp;file=http%3A%2F%2Fzavalinka.in%3A8000%2Frostovradio">' +
                '</object>'
        );

        $(playerObj).appendTo($('#rr-player-c'));
        player = new UppodPlayer(playerObj[0], {
            files: streams
        });

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
            if (e.type === 'mousedown') {
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
            if (v !== volume || force){
                controls.volume.slider.css('width', v+'%');
                controls.volume.value.text( v+'%');
                volume = v;
                player.setVolume(volume);
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

        function loadVolume(){
            var volume = parseInt(getCookie('playerVolume'), 10);
            if(isNaN(volume) || volume < 0 || volume > 100) {
                volume = 50;
            }
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
            if (fo) { hasFlash = true; }
        } catch (e) {
            if (navigator.mimeTypes ["application/x-shockwave-flash"] !== undefined) {
                hasFlash = true;
            }
        }
        return !!hasFlash;
    }

})(window);

// VK comments
(function (window, undefined) {
    var $ = window.$;
    if (typeof($) === 'function') {
        $(function(){
            if (typeof(VK) !== 'undefined') {
                var pageUrl = 'http://radio.romanziva.ru/';
                VK.init({apiId: 2859319, onlyWidgets: true});
                VK.Widgets.Like("vk_like", {type: "mini", height: 18, pageUrl: pageUrl});
                VK.Widgets.Comments("vk_comments", {limit: 10, width: "500", attach: "*", pageUrl: pageUrl});
            }
        });
    }
})(window);

function trim(str) {
    if (typeof(str) !== "string") {
        return str;
    }
    return str.replace(/^\s+|\s+$/g,'');
}

function getCookie(name) {
    var matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+\^])/g, '\\$1') + "=([^;]*)"));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

function setCookie(name, value, props) {
    props = props || {};
    var exp = props.expires;
    if (typeof exp === "number" && exp) {
        var d = new Date();
        d.setTime(d.getTime() + exp * 1000);
        exp = props.expires = d;
    }
    if (exp && exp.toUTCString) {
        props.expires = exp.toUTCString();
    }

    value = encodeURIComponent(value);
    var updatedCookie = name + "=" + value;
    var propName;
    for (propName in props) {
        if (props.hasOwnProperty(propName)) {
            updatedCookie += "; " + propName;
            var propValue = props[propName];
            if (propValue !== true) {
                updatedCookie += "=" + propValue;
            }
        }
    }
    window.document.cookie = updatedCookie;
}

function isTouchDevice () {
    return !!("ontouchstart" in document.documentElement);
}