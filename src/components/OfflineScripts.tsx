'use client'
import Script from 'next/script'

// Scripts must load in this exact order (matches offline HTML defer order).
// We use a single afterInteractive inline script that chains them sequentially
// via onload callbacks, guaranteeing order WITHOUT defer (which runs before
// React hydration and causes hydration mismatches when Swiper modifies the DOM).
const SCRIPTS = [
  '/js/vendors/jquery/jquery.min.js',
  '/js/runtime.js',
  '/js/patch.js',
  '/js/bootstrap.js',
  '/js/swiper.js',
  '/js/dayjs.js',
  '/js/vendors.js',
  '/js/main.js',
]

const loaderCode = `
(function(){
  var scripts = ${JSON.stringify(SCRIPTS)};
  function next(i) {
    if (i >= scripts.length) return;
    var s = document.createElement('script');
    s.src = scripts[i];
    s.onload = function(){ next(i + 1); };
    s.onerror = function(){ next(i + 1); };
    document.head.appendChild(s);
  }
  next(0);
})();
`

export default function OfflineScripts() {
  return (
    <Script
      id="offline-scripts-loader"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: loaderCode }}
    />
  )
}
