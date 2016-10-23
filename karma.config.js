var webpackConfig = require('./webpack.config.js');
var path = require("path");

webpackConfig.entry = './test/test.index.js';

module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine-jquery', 'jasmine'],
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['Chrome'],
        singleRun: false,
        autoWatchBatchDelay: 300,

        files: [
            './test/test.index.js',
            './node_modules/jquery/dist/jquery.min.js',
            './src/javascript/d3.v3.min.js',
            './src/javascript/papaparse.min.js',
            './src/javascript/gsap/TweenLite.min.js',
            './src/javascript/gsap/TimelineLite.min.js'
        ],

        preprocessors: {
            './test/test.index.js': ['webpack'],
            './test/*.spec.js': ['babel']
        },

        plugins: [
            'karma-webpack',
            'karma-chrome-launcher',
            'karma-babel-preprocessor',
            'karma-jasmine',
            'karma-jasmine-jquery'
        ],

        webpack: webpackConfig,

        webpackMiddleware: {
            noInfo: true
        }
    });
}
