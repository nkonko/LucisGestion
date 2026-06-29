export const COMPACT_BRAND_SCROLL_THRESHOLD = 24;

export function isBrandCompactByScroll(scrollY: number): boolean {
  return scrollY > COMPACT_BRAND_SCROLL_THRESHOLD;
}
