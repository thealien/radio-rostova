'use strict';

var EventEmitter = require("events").EventEmitter,
    util = require('util'),
    checker = require('./checker'),
    updater = require('./updater');

var modules = {
    checkers: {},
    updaters: {}
};

/**
 *
 * @param config
 * @constructor
 */
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

    var formatters = {};
    this.addFormatter = function (name, formatter) {
        formatters[name] = formatter;
        return this;
    };
    this.getFormatter = function (name) {
        return formatters[name];
    };

    var updaters = {};
    this.addUpdater = function (name, updater) {
        if (!updaters[name]) { updaters[name] = []; }
        updaters[name].push(updater);
        return this;
    };
    this.getUpdater = function (name) {
        return updaters[name];
    };

    var tracker = this;
    function dataUpdate(checker, data){ tracker.dataUpdate(checker, data); }
    this.initListeners = function (checker) {
        checker.on('dataUpdate', dataUpdate);
    };

    this.addCoreModules();
}

util.inherits(Tracker, EventEmitter);

/**
 *
 * @param name
 * @param module
 */
Tracker.prototype.addCheckerModule = function (name, module) {
    modules.checkers[name] = module;
};

/**
 *
 * @param name
 * @param module
 */
Tracker.prototype.addUpdaterModule = function (name, module) {
    modules.updaters[name] = module;
};

/**
 *
 */
Tracker.prototype.addCoreModules = function () {
    // checkers
    this.addCheckerModule('lastfm', require('./checker/lastfm'));
    // updaters
    this.addUpdaterModule('icecast', require('./updater/icecast'));
};

/**
 *
 * @param checker
 * @param data
 */
Tracker.prototype.dataUpdate = function (checker, data) {
    var sourceName = checker.getName();
    var modifiedData = this.modify(sourceName, data);
    var formattedData = modifiedData;
    var formatter = this.getFormatter(sourceName);
    var isRawData = true;
    if (typeof formatter === 'function') {
        isRawData = false;
        formattedData = formatter(modifiedData);
    }

    this.emit('dataUpdate', sourceName, modifiedData, formattedData);

    var updaters = this.getUpdater(sourceName) || [];
    var i = updaters.length;
    for (; i--; ) {
        updaters[i].update(formattedData, isRawData);
    }
};

/**
 *
 * @param name
 * @param data
 * @return {*}
 */
Tracker.prototype.modify = function (name, data) {
    var result = data;
    var modifiersList = this.getModifier(name) || [];
    var i = modifiersList.length;
    for (; i--; ) {
        if (typeof modifiersList[i] !== 'function') { continue; }
        result = modifiersList[i](data);
    }
    return result;
};

/**
 *
 */
Tracker.prototype.start = function(){
    var streams = this.config || [];
    var i = streams.length;
    for (; i--; ) {
        var stream = streams[i];

        var modifiers = stream.modifiers || [];
        this.addModifier(stream.name, modifiers);

        if (stream.formatter) {
            this.addFormatter(stream.name, stream.formatter);
        }

        var destinations = stream.destinations || [];
        var j = destinations.length;
        for (; j--; ) {
            var destination = destinations[j];
            var upd = updater.create(destination, modules.updaters);
            this.addUpdater(stream.name, upd);
        }

        var ch = checker.create(stream.source, modules.checkers);
        ch.setName(stream.name);
        this.addChecker(ch);
        ch.start();
    }
};

/**
 *
 * @param name
 * @return {*}
 */
Tracker.prototype.getCurrentData = function (name) {
    return this.getChecker(name).getCurrentData();
};

/**
 *
 * @param config
 * @return {Tracker}
 */
exports.create = function(config){
    return new Tracker(config);
};