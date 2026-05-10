// Stub for webpack module 8747, which is referenced by the entry module (3904)
// but whose value is immediately shadowed and never used. Without this stub,
// the webpack require call throws "Cannot read properties of undefined (reading 'call')"
// and the entire main.js entry point fails to initialize.
//
// The chunk array must be non-empty: webpack's push handler guards module registration
// with `if(a.some(r=>0!==e[r]))` — [].some() always returns false, so an empty array
// silently skips registration. Using a fake chunk ID (9999) that has no status entry
// makes e[9999]===undefined, and 0!==undefined is true, so the guard passes.
(self.webpackChunknapsgear2_org = self.webpackChunknapsgear2_org || []).push([
  [9999],
  { 8747: function(module, exports) { "use strict"; } }
]);
