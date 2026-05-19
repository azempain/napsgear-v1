// Pure logic for ScrollToTop so the contract is testable in Node (no JSDOM).
//
// Contract:
//  - If the current URL has a hash ('#anchor'), do NOT scroll — let the
//    browser jump to that anchor.
//  - Otherwise, scroll to (0, 0) with 'instant' behavior so it never
//    competes with subsequent smooth-scroll hash clicks.

export type ScrollFn = (opts: ScrollToOptions) => void

export function resetScroll(hash: string, scrollTo: ScrollFn): void {
  if (hash) return
  scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
}
