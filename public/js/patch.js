// Root-cause fix for the every-page console error:
//   TypeError: Cannot read properties of undefined (reading 'call') @ runtime.js
//
// napsgear.org's main.js eagerly fires webpack dynamic import()s for offline
// feature widgets (uploaders / video player):
//   n.e(604).then(n.bind(n,2604))   n.e(671).then(n.bind(n,2671))
//   n.e(261).then(n.bind(n,1249))   Promise.all([n.e(675)->1364, ->4946])
// The offline-saved chunk files (public/js/chunks/{604,671,675,261}.*.js) are
// empty stubs: push([[ID],{}]) — zero modules. The chunk "loads" so the import
// promise resolves, but __webpack_modules__[2604] is undefined, so the runtime's
// `modules[id].call(...)` throws inside the .then(), producing an unhandled
// rejection on every page (the uploader chain has no .catch).
//
// The React clone does not reimplement these widgets, so we register benign
// no-op modules for the exact ids those imports require. The requires now
// resolve to a callable no-op proxy, the promises settle cleanly, and no
// rejection is produced. Registered here (loads after runtime.js, before
// main.js) so the modules exist before the dynamic imports run.

(function () {
  function noopModule(module) {
    var noop = function () {}
    // Callable + any property access returns the same no-op. Covers
    // `e.initVideoPlayers()`, `t.initAllUploaders`, default imports, etc.
    module.exports = new Proxy(noop, {
      get: function (_t, prop) {
        if (prop === '__esModule') return true
        return noop
      },
    })
  }

  ;(self.webpackChunknapsgear2_org = self.webpackChunknapsgear2_org || []).push([
    [9999],
    {
      // 8747: referenced by entry 3904 before bootstrap.js (the real module,
      // chunk 547) is guaranteed registered. Harmless empty stub; overwritten
      // by the real Bootstrap module when chunk 547 loads.
      8747: function (module, exports) { 'use strict' },
      // Dynamic-import targets from the empty offline chunks:
      1249: noopModule, // chunk 261 — video players (.js-vjs)
      2604: noopModule, // chunk 604 — uploaders (initAllUploaders)
      2671: noopModule, // chunk 671 — uploaders (stage 2)
      1364: noopModule, // chunk 675 — lazy feature
      4946: noopModule, // chunk 675 — lazy feature
    },
  ])
})()

// Suppress Swiper loop-mode warnings — fires when a slider has marginally fewer
// slides than the internal duplicate threshold. Benign: Swiper falls back
// gracefully. (Unrelated to the fix above; kept as-is.)
;(function () {
  var _warn = console.warn
  console.warn = function () {
    if (typeof arguments[0] === 'string' && arguments[0].indexOf('Swiper Loop Warning') !== -1) return
    _warn.apply(console, arguments)
  }
})()

// NOTE: the previous unhandledrejection-swallower was removed. It masked the
// symptom above instead of fixing it (and Next.js's own listener forwarded it
// to the terminal anyway). With the no-op modules registered, there is no
// rejection to swallow — and keeping a blanket suppressor would hide future
// real errors.
