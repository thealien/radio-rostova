var EventEmitter = require("events").EventEmitter,
    util = require('util'),
    checker = require('./checker'),
    updater = require('./updater');

function Tracker(config) {
    this.config = config;

    var checkers = {};
    this.addChecker = function (checker) {
        checkers[checker.getName()] = checker;
        this.initListeners(checker);
        return this;
    };
    this.getChecker = function (name) {
        return checkers[name];
    };

    var modifiers = {};
    this.addModifier = function (name, modifiersList) {
        modifiers[name] = modifiersList;
        return this;
    };
    this.getModifier = function (name) {
        return modifiers[name];
    };

    var updaters = {};
    this.addUpdater = function (name, updater) {
        if (!updaters[name]) updaters[name] = [];
        updaters[name].push(updater);
        return this;
    };
    this.getUpdater = function (name) {
        return updaters[name];
    };

    this.initListeners = function (checker) {
        var tracker = this;
        function trackUpdate(checker, track){ tracker.trackUpdate(checker, track); }
        checker.on('trackUpdate', trackUpdate);
    };
}

Tracker.prototype = new EventEmitter;
Tracker.constructor = Tracker;

Tracker.prototype.trackUpdate = function (checker, track) {
    //console.log('\n------ trackUpdate -----\n');
    var midifiedTrack = this.modify(checker.getName(), track);
    this.emit('trackUpdate', checker.getName(), midifiedTrack);

    var updaters = this.getUpdater(checker.getName()) || [];
    var song = this.format(midifiedTrack);
    var i = updaters.length;
    for (; i--; ) {
        updaters[i].update(song);
    }
    // DEBUG
    //console.log(song);
}

Tracker.prototype.modify = function (name, data) {
    var result = data;
    var modifiersList = this.getModifier(name) || [];
    var i = modifiersList.length;
    for (; i--; ) {
        if (typeof modifiersList[i] !== 'function') continue;
        result = modifiersList[i](data);
    }
    return result;
};

Tracker.prototype.format = function (data) {
    data = data || {};
    return util.format('%s - %s', data.artist, data.name)
};

Tracker.prototype.start = function(){
    var streams = this.config || [];
    var i = streams.length;
    for (; i--; ) {
        var stream = streams[i];

        var modifiers = stream.modifiers || [];
        this.addModifier(stream.name, modifiers);

        var destinations = stream.destinations || [];
        var j = destinations.length;
        for (; j--; ) {
            var destination = destinations[j];
            var upd = updater.create(destination);
            this.addUpdater(stream.name, upd);
        }

        var ch = checker.create(stream.source);
        ch.setName(stream.name);
        this.addChecker(ch);
        ch.start();
    }
};

Tracker.prototype.getCurrentTrack = function (name) {
    return this.getChecker(name).getCurrentTrack();
}

exports.create = function(config){
    return new Tracker(config);
};