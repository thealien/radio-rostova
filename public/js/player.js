/*global uppodSend */
'use strict';
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
                throw new Error('File #'+this.getCurrentFileIndex()+' does not exists');
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
        if (index === this.getOption('files').length) {
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

    function Html5Player(){
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

    Html5Player.prototype = new BasePlayer();
    Html5Player.prototype.parent = BasePlayer;
    Html5Player.prototype.constructor = Html5Player;

    Html5Player.isSupport = function(){
        var Audio = window.Audio;
        if (typeof Audio !== 'undefined') {
            try {
                return !!new Audio();
            } catch(e){}
        }
        return false;
    };

    Html5Player.isSupportFormat = function(format){
        var result = false;
        if (Html5Player.isSupport()) {
            format = format.toLowerCase();
            var formats = {
                ogg: 'audio/ogg',
                mp3: 'audio/mpeg',
                aac: 'audio/aac'
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
        if (this.inPlay()) {
            this.play();
        }
        return this;
    };

    Html5Player.prototype.prev = function(){
        this.toPrev();
        if (this.inPlay()) {
            this.play();
        }
    };

    Html5Player.prototype.setVolume = function(volume){
        if (volume < 0 || volume > 100) {
            return false;
        }
        this.getPlayer().volume = volume/100;
        return this;
    };

    Html5Player.prototype.onStartPlay = function(){
        if(typeof this.options.onStartPlay === 'function') {
            this.options.onStartPlay();
        }
    };

    Html5Player.prototype.onPlay = function(){
        if(typeof this.options.onPlay === 'function') {
            this.options.onPlay();
        }
    };


    //
    // Uppod Player
    //


    function UppodPlayer(){
        this.parent.apply(this, arguments);
    }

    UppodPlayer.prototype = new BasePlayer();
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
        if (this.inPlay()) {
            this.play();
        }
        return this;
    };

    UppodPlayer.prototype.prev = function(){
        this.toPrev();
        if (this.inPlay()) {
            this.play();
        }
    };

    UppodPlayer.prototype.setVolume = function(volume){
        if (volume < 0 || volume > 100) {
            return false;
        }
        return this.send('v' + volume);
    };

    // export
    window.BasePlayer = BasePlayer;
    window.Html5Player = Html5Player;
    window.UppodPlayer = UppodPlayer;

})(window);