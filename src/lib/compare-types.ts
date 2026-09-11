// Client-safe types and constants for the comparison feature — split out of
// compare.ts so client components can import them without pulling in
// compare.ts's server-only Claude dependency (@anthropic-ai/sdk must never
// reach a browser bundle).

export type CompareProduct = {
  id: number
  name: string
  description: string
  brand: string | null
  sport: string | null
  gender: string | null
  productType: string | null
  priceCents: number
  shopName: string
}

// Every customer-facing string carries both languages. The model is asked for
// both rather than for English we would have to translate at display time —
// the page can switch language without a second call.
export type Bilingual = { en: string; th: string }

export type ComparisonRow = { label: Bilingual; cells: Bilingual[] }

export type Comparison = {
  // Rows are aligned to the product order the caller passed in: cells[i]
  // belongs to products[i], always, including when the answer is "not stated".
  rows: ComparisonRow[]
  verdicts: { productId: number; text: Bilingual }[]
}

export const MAX_COMPARE = 3

// The same pair compared in either order is the same question.
export function comparisonKey(productIds: number[]): string {
  return [...new Set(productIds)].sort((a, b) => a - b).join(':')
}
