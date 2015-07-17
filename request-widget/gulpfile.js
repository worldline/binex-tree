var gulp = require('gulp');
var eslint = require('gulp-eslint');
var rm = require('rimraf');
var runSequence = require('run-sequence');
var sourcemaps = require('gulp-sourcemaps');
var Builder = require('systemjs-builder');
var webserver = require('gulp-webserver');
var sass = require('gulp-sass');
var karma = require('gulp-karma');
var path = require('path');


// Single path declarations
var paths = {
  // base folder for ES6 bundeling
  source: './src',
  // all ES6 files to be linted watched
  sources: ['./src/**/*.js', './test/**/*.js'],
  // entry point for sources
  sourcesMain: 'app.js',
  // all scss files to be watched
  styles: ['./src/styles/**/*.scss'],
  // entry point for styles
  stylesMain: './src/styles/main.scss',
  // destination folder
  dest: './build'
};

function test (action) {
  return function() {
    return gulp.src(paths.sources)
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: action
    }));
  };
}

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
gulp.task('test-watch', test('watch'));
gulp.task('test', test('run'));

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
