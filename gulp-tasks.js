var gutil = require('gulp-util');
var babel = require('gulp-babel');
var prepend = require('gulp-insert').prepend;
var eslint = require('gulp-eslint');
var rm = require('rimraf');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var sourcemaps = require('gulp-sourcemaps');
var Instrumenter = require('isparta').Instrumenter;
var _ = require('lodash');
// for mocha to understand esNext
require('babel-core/register');
require('source-map-support').install();

// Coverage thresholds: bellow first is error, bellow second is warning
var defaultThresholds = {
  branches: [70, 90],
  functions: [70, 90],
  lines: [80, 90],
  statements: [70, 90]
};

/**
 * Declare a 'clean' task to remove folders and files
 * @param {Object} gulp - gulp instance
 * @param {String|String[]} toRemove - folders and files to remove
 */
exports.clean = function(gulp, toRemove) {
  gulp.task('clean', function(done) {
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
};

/**
 * Declare a 'build' task that use babel to build esNext sources into es5 JavaScript files,
 * with source-maps for stack traces.
 * Depends on 'lint' and 'clean' tasks.
 *
 * @param {Object} gulp - gulp instance
 * @param {String|String[]} sources - globs used to read esNext source files
 * @param {String} dest - destination folder for es5 files
 */
exports.build = function(gulp, sources, dest) {
  gulp.task('build', ['clean', 'lint'], function() {
    return gulp.src(sources)
      .pipe(sourcemaps.init())
      .pipe(babel())
      // to have explicit staccktraces with esNext files line numbers
      .pipe(prepend('require("source-map-support/register");'))
      .on('error', function(err) {
        gutil.beep();
        gutil.log(err.message);
      })
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(dest))
      .on('end', function() {
        gutil.log('sources built !');
      });
  });
};

/**
 * Declare a 'lint' task to enforce that sources and test are compliant to coding conventions
 * @param {Object} gulp - gulp instance
 * @param {String|String[]} sources - globs used to read esNext source files
 * @param {String|String[]} tests - globs used to read esNext tests files
  */
exports.lint = function(gulp, sources, tests) {
  if (!_.isArray(sources)) {
    sources = [sources];
  }
  gulp.task('lint', function() {
    return gulp.src(sources.concat(tests))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
  });
};

/**
 * Declare a 'test' task that run mocha's test (written in esNext also) and use istanbul's coverage report
 * Detect continuous integration with 'CI' environment variable: test and coverage reports will be in XML format.
 * Depends on 'lint' task.
 *
 * @param {Object} gulp - gulp instance
 * @param {String|String[]} test - globs used to read esNext test files
 * @param {String|String[]} sources - globs used to read esNext source files
 * @param {String} ciOutput - path used to write test results in XUnit format when running on CI
 * @param {String} coverageOutput - path used to write coverage output, either on dev and CI environements
 * @param {Object} thresholds - coverage error and warning thresholds. If provided, merged with defaultThresholds
 */
exports.test = function(gulp, sources, tests, ciOutput, coverageOutput, thresholds) {
  thresholds = _.merge(thresholds, defaultThresholds);
  gulp.task('test', ['lint'], function(done) {
    var isCI = process.env.CI != null;

    var coverageReporters = ['text', isCI ? 'lcov' : 'html'];
    var testOpts = isCI ? {
      reporter: 'xunit',
      reporterOptions: {output: ciOutput}
    } : {
      reporter: 'spec',
      useColors: true
    };

    var coverageOpts = {
      includeUntested: true,
      // keep comments that may contain istanbul instructions
      babel: {
        comments: false
      },
      // for Istanbull to understand esNext
      instrumenter: Instrumenter
    };

    process.env.NODE_ENV = 'test';
    gulp.src(sources)
      .pipe(istanbul(coverageOpts))
      .pipe(istanbul.hookRequire())
      .on('finish', function () {
        gulp.src(tests, {read: false})
          .pipe(mocha(testOpts))
          .on('error', done)
          .pipe(istanbul.writeReports({
            reporters: coverageReporters,
            reportOpts: {
              watermarks: thresholds,
              dir: coverageOutput
            }
          })).on('end', function() {
            var coverage = istanbul.summarizeCoverage();
            var errs = [];
            for (var kind in thresholds) {
              if (coverage[kind].pct < thresholds[kind][0]) {
                errs.push(kind + ' are below ' + thresholds[kind][0] + '%');
              }
            }
            if(errs.length === 0) {
              return done();
            }
            var err = new Error('Insuffisient coverage: ' + errs.join(', '));
            err.showStack = false;
            done(err);
          });
      });
  });
};

/**
 * Declare a 'test-watch' task that relaunches tests when sources or tests files are changed
 * Uses the 'test' task.
 *
 * @param {Object} gulp - gulp instance
 * @param {String|String[]} sources - globs used to read esNext source files
 * @param {String|String[]} tests - globs used to read esNext tests files
  */
exports.testWatch = function(gulp, sources, tests) {
  if (!_.isArray(sources)) {
    sources = [sources];
  }
  gulp.task('test-watch', function() {
    return gulp.watch(sources.concat(tests), ['test']);
  });
};

/**
 * Declare a 'build-watch' task that relaunches build when sources files are changed
 * Uses the 'build' task.
 *
 * @param {Object} gulp - gulp instance
 * @param {String|String[]} sources - globs used to read esNext source files
  */
exports.buildWatch = function(gulp, sources) {
  gulp.task('build-watch', function() {
    return gulp.watch(sources, ['build']);
  });
};
