'use strict';

var querystring = require('querystring'),
    http = require('http');

function IcecastClient (host, port, username, password) {
    this.getHost = function () {
        return host;
    };
    this.getPort = function () {
        return port;
    };
    this.getUsername = function () {
        return username;
    };
    this.getPassword = function () {
        return password;
    };
}

IcecastClient.prototype.updateMount = function (mount, data) {
    var buf = new Buffer(data);
    this.request({
        path: '/admin/metadata.xsl?' + querystring.stringify({
            mount:      '/'+mount,
            mode:       'updinfo',
            song:       buf.toString('utf8')
        })
    });
};

IcecastClient.prototype.request = function (data) {
    var ops = {
        host: this.getHost(),
        port: this.getPort(),
        auth: [this.getUsername(), this.getPassword()].join(':')
    };
    for (var field in data) {
        if (data.hasOwnProperty(field)) {
            ops[field] = data[field];
        }
    }
    http.get(ops).on('error', function (error){
        console.error('Error icecast updater');
        console.error(error);
    });
};

exports.create = function (host, port, username, password) {
    return new IcecastClient(host, port, username, password);
};
