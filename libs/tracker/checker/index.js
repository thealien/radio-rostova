var lastfm = require('./lastfm');

exports.create = function (config) {
    var checker;
    switch (config.type) {
        case 'lastfm':
            checker = lastfm;
            break;
        default:
            throw Error('Unknown checker type ' + config.type);
    }
    return checker.create(config.config);
}