// Vendor listings arrive from marketplaces with decoration baked into the title
// — emoji, flame markers, "พร้อมส่ง!!" shouting. It renders on our pages as-is
// and reads as a scraped listing rather than a Matchday product.
//
// This is a display-layer clean-up, not a catalogue migration: the stored name
// is left untouched so re-imports and vendor edits stay comparable.

// Emoji and pictographs, plus the variation selectors and zero-width joiners
// that hold multi-codepoint sequences together.
const DECORATION =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu

export function cleanProductName(name: string): string {
  return (
    name
      .replace(DECORATION, ' ')
      // Runs of !!! or ！！ left behind by the shouting half of a title.
      .replace(/[!！]{2,}/g, '')
      .replace(/\s{2,}/g, ' ')
      // A title that began with decoration can be left starting on punctuation.
      .replace(/^[\s\-–—|/,.]+/, '')
      .trim()
  )
}
