# Binex-tree
A pure D3 tree widget to represent and edit a boolean expression.
Otherwise known as [binary expression tree][1].

# Use
TODO

# API Documentation
TODO

# Build
To make your own build, you'll need to install [NodeJS][2] and NPM.
Once Node is installed, open a console and go in the folder when you've got the sources.
Install [Gulp][3] as a global executable (only needed if you never installed gulp before, must be done just once).

    > npm install -g gulp

Then get external dependencies. Network access is required, so don't forget to configure `HTTPS_PROXY` and `HTTP_PROXY` environment variables if you're behind a proxy:

    > npm install

Then build everything:

    > npm run dist
    [17:02:42] Using gulpfile C:\workspace\binex-tree\gulpfile.js
    [17:02:42] Starting 'lint'...
    [17:02:44] Finished 'lint' after 2.02 s
    [17:02:44] Starting 'dist'...
    [17:02:53] Finished 'dist' after 8.9 s


Code is now available under the `build/` folder.

# Develop and contribute
If you wish to modify the code itself, or perhaps bring your own contribution, you will edit the [ES6][4] and [SaSS][5] files under the `src/` folder.

During the build process, the [Babel][6] transpiler will translate ES6 code to plain JavaScript (for browsers that does not supports it), and [Webpack][7] will compact multiple files and dependencies to a single bundle.
The linter [ESLint][8] will also check that the code fulfill required style and good practices.

At last, you're required to test new features and bug fixes as well with [Karma][9] (test runner), [Mocha][10] (tests declaration) and [Chai][11] (assertion library).
You can launches test on single shot with:

    > gulp test

or as a long-running process, which will re-play test on every source file change:

    > gulp test-watch (or npm test)

During tests, a coverage report is written under the `coverage/` folder, and the coverage must not drop under given thresholds.

Last but not least, you can check by ourself the instanciated tree locally by running:

    > gulp (or npm start)

This will start a static web server at http://localhost:8001, which will live-reload opened browsers on every file change.

We usually work with both `> gulp` and `> gulp test-watch` opened in different consoles.

[1]: https://en.wikipedia.org/wiki/Binary_expression_tree
[2]: https://nodejs.org/download/release/latest/
[3]: http://gulpjs.com/
[4]: http://es6-features.org
[5]: http://sass-lang.com/
[6]: https://babeljs.io/
[7]: https://webpack.github.io/
[8]: http://eslint.org/
[9]: http://karma-runner.github.io
[10]: http://mochajs.org/
[11]: http://chaijs.com/api/bdd/
