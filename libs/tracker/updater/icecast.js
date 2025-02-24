'use strict';
var util = require('util');
var client = require('../client/icecast');

function IcecastUpdater (config) {
    this.config = config;
    this.client = client.create(config.net.host, config.net.port, config.credential.username, config.credential.password);
}

IcecastUpdater.prototype.update = function (data, isRawData) {
    var mounts = this.config.mounts || [];
    var i = mounts.length;
    if (isRawData) {
        data = format (data);
    }
    for (; i--; ) {
        this.client.updateMount(mounts[i], data);
    }
};

function format (data) {
    return util.format('%s - %s', data.artist, data.name);
}

exports.create = function (config) {
    return new IcecastUpdater(config);
};
