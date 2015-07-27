/* eslint-env node, browser */
if (global && 'document' in global) {
  // Code invoked in karma browser, used to set a main node
  var main = document.createElement('div');
  main.id = 'main';
  document.body.appendChild(main);
} else {
  // Code invoked in karma, used to declare the "framework"

  /* eslint no-inner-declarations: 0 */
  function preprocessor(logger, files) {
    files.unshift({
      pattern: __filename,
      included: true,
      served: true,
      watched: false
    });
    logger.create('html').info('Prepending html init');
  }

  preprocessor.$inject = ['logger', 'config.files'];

  module.exports = {
    'framework:html-prepend': ['factory', preprocessor]
  };
}
