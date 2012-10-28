var icecast = require('./icecast');

exports.create = function (config) {
    var updater;
    switch (config.type) {
        case 'icecast':
            updater = icecast;
            break;
        default:
            throw Error('Unknown updater type ' + config.type);
    }
    return updater.create(config.config);
}