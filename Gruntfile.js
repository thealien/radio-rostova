/*global grunt*/
'use strict';
module.exports = function (grunt) {

    grunt.initConfig({
        cssmin:{
            combine:{
                files:{
                    'public/css/all.css': [
                        'public/css/main.css',
                        'public/css/new-player.css'
                    ]
                }
            }
        },

        uglify:{
            build:{
                files:{
                    'public/js/all.js':[
                        'public/js/player.js',
                        'public/js/uppod/uppod_api.js',
                        'public/js/lastFmClient.js',
                        'public/js/app.js'
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('default', ['uglify', 'cssmin']);

};