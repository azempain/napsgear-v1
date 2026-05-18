// Pure threshold decision for the sticky-header hook.
// scrollY is treated as 0 when negative (iOS rubber-band) so the header
// stays in its document-flow position.
export function shouldFix(scrollY: number, threshold: number): boolean {
  return Math.max(0, scrollY) > threshold
}
