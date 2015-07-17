var istanbul = require('browserify-istanbul');
var isparta  = require('isparta');

module.exports = function(config) {
  config.set({
    basePath: './',
    // source-map-support inclusion allows original files numbers in error reporting
    frameworks: ['mocha', 'chai', 'source-map-support', 'browserify'],

    files: [
     'src/**/*.js',
     'test/**/*.js'
    ],

    // files will be converted from ES6 to ES5 with babel(ify), and modules handled with browserify
    preprocessors: {
     'src/**/*.js': ['browserify', 'babel', 'coverage'],
     'test/**/*.js': ['browserify', 'babel']
    },

    browserify: {
     debug: true,
     transform: [
      'bulkify',
      istanbul({
        instrumenter: isparta,
        ignore: ['**/node_modules/**', '**/test/**']
      })]
    },

    // optionally, configure the reporter
    coverageReporter: {
      reporters: [{
        type: 'text-summary',
      },{
        type: 'html',
        dir: 'coverage/',
      }]
    },

    reporters: ['progress', 'coverage'],
    colors: true,
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,
    browsers: ['Chrome']
  })
}
