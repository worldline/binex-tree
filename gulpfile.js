var gulp = require('gulp');
var gutil = require('gulp-util');
var webserver = require('gulp-webserver');
var eslint = require('gulp-eslint');
var rm = require('rimraf');
var karma = require('karma').server;
var path = require('path');
var _ = require('lodash');
var webpack = require('webpack');
var Extractor = require('extract-text-webpack-plugin');
var log = gutil.log;
var colors = gutil.colors;

// Coverage thresholds: bellow first is error, bellow second is warning
var defaultThresholds = {
  branches: [70, 90],
  functions: [70, 90],
  lines: [80, 90],
  statements: [70, 90]
};

// Single path declarations
var paths = {
  // all ES6 files to be linted
  sources: './src/**/*.js',
  // exception: test utilities must not be served by karma
  tests: './test/**/!(test-utilities)*.js',
  // entry point for bundles
  example: './example/app.js',
  main: './src/binex-tree.js',
  // destination folder
  dest: './build',
  coverage: './coverage'
};

// Karma configuration
var karmaConf = {
  configFile: '',
  basePath: './',
  frameworks: ['html-prepend', 'mocha', 'chai'],
  files: [
    paths.tests,
    'node_modules/babel-core/browser-polyfill.js'
  ],
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
        loaders: ['isparta-instrumenter']
      }],
      loaders: [{
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: ['babel']
      }, {
        test: /\.scss$/,
        loaders: ['style', 'css', 'sass']
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
karmaConf.preprocessors[paths.tests] = ['webpack', 'sourcemap'];

function reportWebpackErrors (stats) {
  stats = stats.toJson({
    cached: false,
  });
  stats.errors.forEach(function (err) {
    var idx = err.indexOf(' in ');
    log(colors.red('error') + ': ' + err.substring(0, idx === -1 ? err.length : idx));
  });
  return stats;
}

function bundle(entry, watch, noDep) {

  var conf = _.assign({}, {
    entry: path.resolve(entry),
    output: {
      path: path.resolve(paths.dest),
      filename: path.basename(entry)
    },
    module: {
      loaders: [{
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: ['babel']
      }, {
        test: /\.scss$/,
        loaders: ['style', 'css', 'sass']
      }]
    },
    resolve: {
      extensions: ['', '.js', '.scss'],
    },
    plugins: []
  });

  if (watch) {
    // Dev bundle
    _.assign(conf, {
      devtool: 'source-map',
      debug: true,
      resolve: {
        alias: {
          d3: 'd3/d3.min.js'
        }
      }
    });
  } else {
    // Distribution bundle: minify
    conf.plugins = conf.plugins.concat(
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: 'production'
        }
      }),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.UglifyJsPlugin()
    );

    if (noDep) {
      // Make d3 an external tool and do not include stylesheet
      conf.externals = {d3: 'd3'};
      delete conf.module.loaders[1].loaders;
      conf.module.loaders[1].loader = Extractor.extract('style', 'css', 'sass');
      conf.plugins.push(new Extractor('binex-tree.css'));
    } else {
      // Or rename to indicate everything is included
      conf.output.filename = conf.output.filename.replace('.js', '.standalone.js');
    }
  }

  var bundler = webpack(conf);

  return function(done) {
    if (watch) {
      bundler.watch({}, function (err, stats) {
        reportWebpackErrors(stats).modules.forEach(function (module) {
          log(module.name + colors.cyan(' rebuilt'));
        });
      });
      done();
    } else {
      bundler.run(function(err, stats) {
        stats = reportWebpackErrors(stats);
        if(stats.errors.length > 0) {
          return done(new gutil.PluginError('bundle', 'errors found'));
        }
        done(err);
      });
    }
  };
}

// Generated file cleaning
gulp.task('clean', function(done) {
  var toRemove = [paths.dest, paths.coverage];
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

// Lint sources with esLint
gulp.task('lint', function() {
  return gulp.src(paths.sources.concat(paths.tests))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

// Test tasks, entierly relying on karma
gulp.task('test', function (done) {
  karma.start(_.assign({
    singleRun: true
  }, karmaConf), function(err) {
    done();
    process.exit(err);
  });
});

gulp.task('test-watch', function (done) {
  karma.start(_.assign({
    singleRun: false
  }, karmaConf), done);
});

// Make distribution files
gulp.task('dist', ['lint'], function(done) {
  bundle(paths.main, false)(function(err) {
    if (err) {
      return done(err);
    }
    return done();
    bundle(paths.main, false, true)(done);
  });
});

// Default development task is to build, then to watch for files changes.
gulp.task('default', ['lint'], function() {
  bundle(paths.example, true)(function() {
    gulp.src('.')
      .pipe(webserver({
        port: 8001,
        livereload: {
          enable: true,
          filter: function(fileName) {
            // only built files and html page are to be watched
            return fileName.match(/((\\|\/)build|index.html$)/) && !fileName.match(/.map$/);
          }
        }
      }));
    gulp.watch(paths.sources, ['lint']);
  });
});
