var gulp = require('gulp');
var rm = require('rimraf');
var runSequence = require('run-sequence');
var karma = require('karma').server;
var path = require('path');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var _ = require('lodash');


var port = 8080;

// Single path declarations
var paths = {
  sourceMain: './src/app.js',
  tests: './test/**/*.js',
  dest: './build',
  coverage: './coverage'
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
      dir: paths.coverage,
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
  });
});

var webpackConfig = {
  entry: path.resolve(paths.sourceMain),
  output: {
    path: path.resolve(paths.dest),
    filename: path.basename(paths.sourceMain)
  },
  debug: false,
  devtool: 'eval-source-map',
  module: {
    preLoaders: [{
      test: /\.js$/, loader: 'eslint-loader', exclude: /node_modules/
    }],
    loaders: [{
      test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/
    }, {
      test: /\.scss$/, loader: 'style!css?sass?outputStyle=expanded'
    }]
  },
  resolve: {
    extensions: ['', '.js']
  }
};

// Thrn 'bundle' task gets all compiled scripts and bundle them for System.js
gulp.task('bundle', function (done) {
  webpack(_.assign({}, webpackConfig, {
    plugins: [new (require('webpack/lib/optimize/UglifyJsPlugin'))({compress: {warnings: false}})]
  }), function(err, stats) {
    if(err) {
      return done(err);
    }
    if (stats.compilation && stats.compilation.warnings) {
      console.error(stats.compilation.warnings.join('\n'));
    }
    done();
  });
});

gulp.task('default', function(done) {
  new WebpackDevServer(webpack(webpackConfig), {
    publicPath: '/build/'
  }).listen(port, 'localhost', function(err) {
    if (err) {
      return done(err);
    }
    console.log('run server on http://localhost:' + port + '/webpack-dev-server/');
    done();
  });
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
  runSequence('clean', 'lint', 'bundle', done);
});
