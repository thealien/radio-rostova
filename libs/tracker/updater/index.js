'use strict';

exports.create = function (config, modules) {
    if (!modules[config.type]) {
        throw new Error('No updater module for ' + config.type);
    }
    return modules[config.type].create(config.config);
};