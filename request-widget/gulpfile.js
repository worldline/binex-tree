var gulp = require('gulp');
var gutil = require('gulp-util');
var tasks = require('../gulp-tasks');
var runSequence = require('run-sequence');
var sourcemaps = require('gulp-sourcemaps');
var webserver = require('gulp-webserver');
var sass = require('gulp-sass');
var karma = require('karma').server;
var path = require('path');
var _ = require('lodash');
var webpack = require('webpack');
var log = gutil.log;
var colors = gutil.colors;

// Single path declarations
var paths = {
  // base folder for ES6 bundeling
  source: './src',
  // all ES6 files to be linted watched
  sources: './src/**/*.js',
  tests: './test/**/*.js',
  // entry point for sources
  sourcesMain: 'app.js',
  // all scss files to be watched
  styles: './src/styles/**/*.scss',
  // entry point for styles
  stylesMain: ['./src/styles/main.scss', './src/styles/app.scss'],
  // destination folder
  dest: './build',
  coverage: './coverage'
};

tasks.clean(gulp, [paths.dest, paths.coverage]);
tasks.lint(gulp, paths.sources, paths.tests);

// Karma configuration
var conf = {
  configFile: '',
  basePath: './',
  frameworks: ['html-prepend', 'mocha', 'chai'],
  files: [paths.tests],
  // Will be configured just after
  preprocessors: {},
  coverageReporter: {
    reporters: [{
      type: 'text-summary'
    }, {
      type: 'html',
      dir: paths.coverage
    }]
  },
  webpack: {
    devtool: '#source-map',
    debug: false,
    module: {
      preLoaders: [{
        test: /\.js$/,
        exclude: /(test|node_modules|common)/,
        loader: 'isparta-instrumenter-loader'
      }],
      loaders: [{
        test: /\.js$/,
        exclude: /node_modules|common/,
        loader: 'babel-loader'
      }]
    }
  },
  reporters: ['progress', 'coverage'],
  colors: true,
  logLevel: 'WARN',
  browsers: ['Chrome'],
  plugins: [
    'karma-chai',
    'karma-coverage',
    'karma-chrome-launcher',
    'karma-firefox-launcher',
    'karma-mocha',
    'karma-sourcemap-loader',
    'karma-webpack',
    require('./test/html-prepend')
  ]
};
conf.preprocessors[paths.tests] = ['webpack', 'sourcemap'];

// Thrn 'bundle' task gets all compiled scripts and bundle them for System.js
gulp.task('bundle', ['lint'], bundle(false));

var bundler = webpack(_.assign({}, {
  entry: path.resolve(paths.source, paths.sourcesMain),
  output: {
    path: path.resolve(paths.dest),
    filename: paths.sourcesMain,
    devtoolModuleFilenameTemplate: '[resource-path]'
  },
  devtool: 'source-map',
  debug: false,
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules|common/,
      loader: 'babel-loader'
    }]
  },
  resolve: {
    extensions: ['', '.js']
  }
}/*, {
  plugins: [new (require('webpack/lib/optimize/UglifyJsPlugin'))()]
}*/));

function bundle(watch) {
  return function(done) {
    if (watch) {
      bundler.watch({}, function (err, stats) {
        stats = stats.toJson({
          cached: false,
        }).modules.forEach(function (module) {
          log(module.name + colors.cyan(' rebuilt'));
        });
      });
    } else {
      bundler.run(done);
    }
  };
}

gulp.task('styles', function() {
  return gulp.src(paths.stylesMain)
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.dest));
});

// test tasks, entierly relying on karma
gulp.task('test', function (done) {
  karma.start(_.assign({
    singleRun: true
  }, conf), function(err) {
    done();
    process.exit(err);
  });
});

gulp.task('test-watch', function (done) {
  karma.start(_.assign({
    singleRun: false
  }, conf), done);
});

// build will cleen, lint, compile and bundle source for usage in braowser
gulp.task('build', function(done) {
  runSequence('clean', ['bundle', 'styles'], done);
});

// Default development task is to build, then to watch for files changes.
gulp.task('default', ['build'], function() {
  bundle(true)();
  gulp.src('.')
    .pipe(webserver({
      livereload: {
        enable: true,
        filter: function(fileName) {
          // only built files and html page are to be watched
          return fileName.match(/((\\|\/)build|index.html$)/) && !fileName.match(/.map$/);
        }
      }
    }));
  gulp.watch(paths.styles, ['styles']);
});
