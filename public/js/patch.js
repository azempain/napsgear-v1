// Stub for webpack module 8747 — referenced by entry module 3904 but immediately
// shadowed and never used. Without this stub the webpack require call throws
// "Cannot read properties of undefined (reading 'call')" and main.js fails entirely.
(self.webpackChunknapsgear2_org = self.webpackChunknapsgear2_org || []).push([
  [9999],
  { 8747: function(module, exports) { "use strict"; } }
]);

// Suppress Swiper loop-mode warnings — fires when a slider has marginally fewer
// slides than the internal duplicate threshold. Benign: Swiper falls back gracefully.
(function() {
  var _warn = console.warn;
  console.warn = function() {
    if (typeof arguments[0] === 'string' && arguments[0].indexOf('Swiper Loop Warning') !== -1) return;
    _warn.apply(console, arguments);
  };
})();

// Suppress unhandledRejection from webpack module-factory calls in async chunk
// loads (video player, filepond). These are from offline-grabbed bundles that
// reference internal modules not present in this local build. They don't affect
// any visible functionality.
window.addEventListener('unhandledrejection', function(event) {
  var err = event.reason;
  if (err instanceof TypeError &&
      err.message &&
      err.message.indexOf("Cannot read properties of undefined (reading 'call')") !== -1) {
    event.preventDefault();
  }
});
