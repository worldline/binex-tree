var gulp = require('gulp');
var tasks = require('../gulp-tasks');

// Single path declarations
var paths = {
  sources: './src/**/*.js',
  tests: './test/**/*.js',
  dest: './build',
  coverage: './coverage',
  ciOutput: 'test_report.xml'
};

tasks.clean(gulp, [paths.dest].concat(paths.coverage));
tasks.test(gulp, paths.sources, paths.tests, paths.ciOutput, paths.coverage);
tasks.lint(gulp, paths.sources, paths.tests);
tasks.build(gulp, paths.sources, paths.dest);
tasks.testWatch(gulp, paths.sources, paths.tests);
tasks.buildWatch(gulp, paths.sources);
gulp.task('default', ['buildWatch']);
