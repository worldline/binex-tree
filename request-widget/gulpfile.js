var gulp = require('gulp');
var tasks = require('../gulp-tasks');
var runSequence = require('run-sequence');
var sourcemaps = require('gulp-sourcemaps');
var webserver = require('gulp-webserver');
var sass = require('gulp-sass');
var karma = require('karma').server;
var path = require('path');
var _ = require('lodash');
var webpack = require('webpack');


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
  stylesMain: './src/styles/main.scss',
  // destination folder
  dest: './build',
  coverage: './coverage'
};

tasks.clean(gulp, [paths.dest, paths.coverage]);
tasks.lint(gulp, paths.sources, paths.tests);

// Thrn 'bundle' task gets all compiled scripts and bundle them for System.js
gulp.task('bundle', ['lint'], function (done) {
  webpack(_.assign({}, {
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
        exclude: /node_modules/,
        loader: 'babel-loader'
      }]
    },
    resolve: {
      extensions: ['', '.js']
    }
  }, {
    plugins: [new (require('webpack/lib/optimize/UglifyJsPlugin'))()]
  }), done);
});

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
  var conf = {
    configFile: '',
    singleRun: true,

    basePath: './',
    frameworks: ['mocha', 'chai'],
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
          exclude: /(test|node_modules)/,
          loader: 'isparta-instrumenter-loader'
        }],
        loaders: [{
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader'
        }]
      }
    },
    reporters: ['progress', 'coverage'],
    colors: true,
    logLevel: 'WARN',
    browsers: ['Chrome']
  };
  conf.preprocessors[paths.tests] = ['webpack', 'sourcemap'];

  karma.start(conf, function(err) {
    done();
    process.exit(err);
  });
});

// build will cleen, lint, compile and bundle source for usage in braowser
gulp.task('build', function(done) {
  runSequence('clean', ['bundle', 'styles'], done);
});

// Default development task is to build, then to watch for files changes.
gulp.task('default', ['build'], function() {
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
  gulp.watch(paths.sources, ['bundle']);
  gulp.watch(paths.styles, ['styles']);
});
