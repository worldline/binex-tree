var gulp = require('gulp');
var eslint = require('gulp-eslint');
var rm = require('rimraf');
var runSequence = require('run-sequence');
var sourcemaps = require('gulp-sourcemaps');
var Builder = require('systemjs-builder');
var webserver = require('gulp-webserver');
var sass = require('gulp-sass');
var karma = require('karma').server;
var path = require('path');


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
  dest: './build'
};

var karmaConf = {
  configFile: '',
  singleRun: true,

  basePath: './',
  frameworks: ['mocha', 'chai'],
  files: [paths.tests],
  // Will be configured just after
  preprocessors: {},
  coverageReporter: {
    reporters: [{
      type: 'text-summary',
    },{
      type: 'html',
      dir: 'coverage/',
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

karmaConf.preprocessors[paths.tests] = ['webpack', 'sourcemap'];

// Clean task removes every generated stuff
gulp.task('clean', function(done) {
  var toRemove = [paths.dest]
  var removed = 0;
  var lastErr = null;

  toRemove.forEach(function(path) {
    rm(path, function(err) {
      removed++;
      lastErr = err ? err : lastErr;
      if (removed === toRemove.length) {
        done(lastErr);
      }
    });
  })
});

// The 'lint' task checks that sources and test are compliant
gulp.task('lint', function() {
  return gulp.src(paths.sources)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

// Thrn 'bundle' task gets all compiled scripts and bundle them for System.js
gulp.task('bundle', function () {
  return new Builder({
    baseURL: 'file:///' + path.normalize(path.resolve(paths.source)),
    transpiler: 'babel',
    defaultJSExtensions: true
  }).buildSFX(paths.sourcesMain, path.join(paths.dest, paths.sourcesMain), {
    sourceMaps: true,
    minify: true
  });
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
  karma.start(karmaConf, function(err) {
    done();
    process.exit(err);
  });
});

// build will cleen, lint, compile and bundle source for usage in braowser
gulp.task('build', function(done) {
  runSequence('clean', 'lint', ['bundle', 'styles'], done);
});

// Default development task is to build, then to watch for files changes.
gulp.task('default', ['build'], function() {
  gulp.src('.')
    .pipe(webserver({
      livereload: {
        enable: true,
        filter: function(fileName) {
          return !fileName.match(/.map$/);
        }
      }
    }));
  gulp.watch(paths.sources, ['build']);
  gulp.watch(paths.styles, ['styles']);
});
