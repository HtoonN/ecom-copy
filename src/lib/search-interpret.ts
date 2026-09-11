// Turns a sentence like "ไม้แบดตีคู่ หัวเบา งบไม่เกินสามพัน" into the filter set
// the catalogue already understands.
//
// Two interpreters sit behind one interface, and the caller cannot tell which
// answered: Claude reads the phrase, and a deterministic rule pass matches facet
// names and price expressions directly. The rules run when Claude is
// unreachable, so the feature degrades in accuracy, never in behaviour — same
// search box, same chips, same results.

import { z } from 'zod'
import type { Facet, Facets } from './facets'
import { parseJson } from './llm'

export type SearchFilters = {
  productType?: string
  sport?: string
  brand?: string
  genders: string[]
  minPrice?: number
  maxPrice?: number
  // Whatever the phrase still means once the filters are lifted out of it.
  text?: string
}

export const EMPTY_FILTERS: SearchFilters = { genders: [] }

export function normaliseQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 191)
}

/* ------------------------------------------------------------------ prices */

const THAI_DIGITS: Record<string, number> = {
  หนึ่ง: 1,
  สอง: 2,
  สาม: 3,
  สี่: 4,
  ห้า: 5,
  หก: 6,
  เจ็ด: 7,
  แปด: 8,
  เก้า: 9,
  สิบ: 10,
}
const THAI_SCALES: Record<string, number> = { ร้อย: 100, พัน: 1000, หมื่น: 10000 }

// "สามพัน" -> 3000, "5พัน" -> 5000, "2,500" -> 2500. Deliberately narrow: the
// shapes people actually type into a search box, not a general number parser.
function readAmount(text: string): number | null {
  const scaled = text.match(/(\d+|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ)\s*(ร้อย|พัน|หมื่น)/)
  if (scaled) {
    const unit = /^\d+$/.test(scaled[1]) ? Number(scaled[1]) : THAI_DIGITS[scaled[1]]
    return unit * THAI_SCALES[scaled[2]]
  }
  const plain = text.match(/(\d[\d,]{2,})/)
  return plain ? Number(plain[1].replace(/,/g, '')) : null
}

// "ไม่เกิน" contains "เกิน", so UNDER must be tested before OVER — otherwise every
// budget ceiling reads as a floor, which is the exact opposite of what was asked.
const UNDER = /(ไม่เกิน|ต่ำกว่า|ภายใน|งบ|ราคาไม่เกิน|under|below|max)/
const OVER = /(มากกว่า|เกิน|ขึ้นไป|เริ่มต้นที่|over|above|min)/

const AMOUNT = /(?:\d[\d,]*|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ)\s*(?:ร้อย|พัน|หมื่น)?/g

export function readPriceRange(query: string): { minPrice?: number; maxPrice?: number } {
  const range = query.match(/(\d[\d,]*)\s*[-–ถึง]+\s*(\d[\d,]*)/)
  if (range) {
    const low = Number(range[1].replace(/,/g, ''))
    const high = Number(range[2].replace(/,/g, ''))
    if (low && high) return { minPrice: Math.min(low, high), maxPrice: Math.max(low, high) }
  }

  // Anchor on the number and read the words either side of it by index. Matching
  // a window of leading context instead lets a greedy prefix swallow the digits.
  for (const match of query.matchAll(AMOUNT)) {
    const amount = readAmount(match[0])
    if (!amount || match.index === undefined) continue
    const before = query.slice(Math.max(0, match.index - 14), match.index)
    const after = query.slice(match.index + match[0].length, match.index + match[0].length + 12)
    if (UNDER.test(before) || UNDER.test(after)) return { maxPrice: amount }
    if (OVER.test(before) || OVER.test(after)) return { minPrice: amount }
  }
  return {}
}

/* ------------------------------------------------------- rule interpreter */

const matchFacet = (query: string, options: Facet[]) =>
  options.find(
    (option) =>
      (option.nameTh && query.includes(option.nameTh.toLowerCase())) ||
      (option.nameEn && query.includes(option.nameEn.toLowerCase())),
  )

export function interpretByRules(query: string, facets: Facets): SearchFilters {
  const lower = normaliseQuery(query)
  const filters: SearchFilters = { genders: [], ...readPriceRange(lower) }

  filters.productType = matchFacet(lower, facets.productTypes)?.nameEn
  filters.sport = matchFacet(lower, facets.sports)?.nameEn
  filters.brand = matchFacet(lower, facets.brands)?.nameEn
  const gender = matchFacet(lower, facets.genders)
  if (gender) filters.genders = [gender.nameEn]

  // Nothing recognised at all — fall back to searching the phrase as text, which
  // is exactly what the box did before any of this existed. A price counts as
  // recognised: pairing a bound with a text search for the whole phrase
  // ("ราคา 5000 ขึ้นไป") matches no product name and empties the page.
  const recognised =
    filters.productType ||
    filters.sport ||
    filters.brand ||
    filters.genders.length ||
    filters.minPrice ||
    filters.maxPrice
  if (!recognised) filters.text = query.trim()
  return filters
}

/* ------------------------------------------------------ Claude interpreter */

const InterpretationSchema = z.object({
  productType: z.string().nullable(),
  sport: z.string().nullable(),
  brand: z.string().nullable(),
  genders: z.array(z.string()),
  minPrice: z.number().nullable(),
  maxPrice: z.number().nullable(),
  text: z.string().nullable(),
})

const SYSTEM = [
  'You convert Thai and English shopping phrases into catalogue filters for a',
  'sports equipment marketplace.',
  'Return JSON only. Every value you choose for productType, sport, brand and',
  'genders must be copied exactly from the lists provided, in English — never',
  'invent a value and never translate one. Use null when the phrase does not',
  'say anything about that field.',
  'Prices are Thai baht as plain numbers. "งบไม่เกินสามพัน" means maxPrice 3000.',
  'Put anything the filters cannot express — a model name, a colour, a feel like',
  '"หัวเบา" — into text, so it can still be matched against product names. If the',
  'phrase is fully captured by the filters, text is null.',
].join(' ')

function toList(options: Facet[]): string {
  return options.map((option) => `${option.nameEn} (${option.nameTh})`).join(', ')
}

export async function interpretWithClaude(query: string, facets: Facets): Promise<SearchFilters> {
  const raw = await parseJson(InterpretationSchema, {
    system: SYSTEM,
    user: [
      `Phrase: ${query}`,
      `productType options: ${toList(facets.productTypes)}`,
      `sport options: ${toList(facets.sports)}`,
      `brand options: ${toList(facets.brands)}`,
      `gender options: ${toList(facets.genders)}`,
    ].join('\n'),
  })
  return validateFilters(raw, facets)
}

/* ----------------------------------------------------------- validation */

const known = (value: string | null | undefined, options: Facet[]) => {
  if (!value) return undefined
  const hit = options.find(
    (option) =>
      option.nameEn.toLowerCase() === value.toLowerCase() ||
      option.nameTh.toLowerCase() === value.toLowerCase(),
  )
  return hit?.nameEn
}

const money = (value: unknown) => {
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : undefined
}

// A filter naming something we do not stock would silently return nothing and
// read to the customer as "you have none of these". Drop it instead.
export function validateFilters(raw: unknown, facets: Facets): SearchFilters {
  const input = (raw ?? {}) as Record<string, unknown>
  const filters: SearchFilters = {
    productType: known(input.productType as string, facets.productTypes),
    sport: known(input.sport as string, facets.sports),
    brand: known(input.brand as string, facets.brands),
    genders: Array.isArray(input.genders)
      ? input.genders
          .map((value) => known(String(value), facets.genders))
          .filter((value): value is string => Boolean(value))
      : [],
    minPrice: money(input.minPrice),
    maxPrice: money(input.maxPrice),
    text: typeof input.text === 'string' && input.text.trim() ? input.text.trim() : undefined,
  }
  if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
    const low = filters.maxPrice
    filters.maxPrice = filters.minPrice
    filters.minPrice = low
  }
  return filters
}
