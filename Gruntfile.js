/*global grunt*/
'use strict';
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            build: {
                files: {
                    'public/js/all.js': [
                        'public/js/player.js',
                        'public/js/uppod/uppod_api.js',
                        'public/js/lastFmClient.js',
                        'public/js/app.js'
                    ]
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Default task(s).
    grunt.registerTask('default', ['uglify']);

};