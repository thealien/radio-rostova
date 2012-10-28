var client = require('../client/icecast');

function IcecastUpdater (config) {
    this.config = config;
    this.client = client.create(config.net.host, config.net.port, config.credential.username, config.credential.password);
}

IcecastUpdater.prototype.update = function (data) {
    var mounts = this.config.mounts || [];
    var i = mounts.length;
    for (; i--; ) {
        this.client.updateMount(mounts[i], data);
    }
}

exports.create = function (config) {
    return new IcecastUpdater(config);
}
