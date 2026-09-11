// Builds the comparison table for two or three products.
//
// The catalogue has no spec fields — no weight, no balance, no gauge. What it
// has is the marketplace title, and those titles carry the specs inside them:
// "ขนาด 1.25mm/17/12 m", "แพ็คคู่ (2ไม้)", "4U G5". Reading that back out is the
// whole job, and it is the part a rule cannot do well.
//
// So the same two-interpreter shape as search: Claude reads the titles into
// aligned rows, and a deterministic pass pulls out the handful of patterns a
// regex can be trusted with, plus the fields we already store. Same table, same
// dialog, same behaviour — only the depth of the reading changes.

import { z } from 'zod'
import type { Bilingual, CompareProduct, Comparison, ComparisonRow } from './compare-types'
import type { Facet, Facets } from './facets'
import { parseJson } from './llm'

export type { CompareProduct, Bilingual, ComparisonRow, Comparison }
export { MAX_COMPARE, comparisonKey } from './compare-types'

const BLANK: Bilingual = { en: '—', th: '—' }

// Titles and descriptions are usually the same string in this catalogue, so
// searching the pair as one text is enough — and avoids matching twice.
function textOf(product: CompareProduct): string {
  return product.description && product.description !== product.name
    ? `${product.name} ${product.description}`
    : product.name
}

/* ----------------------------------------------------------- rule reading */

// Only patterns that are unambiguous in a marketplace title. Anything needing
// judgement ("is this a racket or a string?") is left to the model — a rule that
// guesses is worse than a row that is simply absent.
const PATTERNS: { label: Bilingual; read: (text: string) => string | null }[] = [
  {
    label: { en: 'Weight class', th: 'น้ำหนัก' },
    read: (text) =>
      text
        .match(/\b([2-6])\s?U\b/i)?.[0]
        .replace(/\s/g, '')
        .toUpperCase() ?? null,
  },
  {
    label: { en: 'Grip size', th: 'ขนาดกริป' },
    read: (text) => text.match(/\bG\s?([1-6])\b/)?.[0].replace(/\s/g, '') ?? null,
  },
  {
    label: { en: 'Gauge', th: 'ขนาดเส้น' },
    read: (text) => {
      const hit = text.match(/(\d\.\d{1,2})\s*mm/i)
      return hit ? `${hit[1]} mm` : null
    },
  },
  {
    label: { en: 'Length', th: 'ความยาว' },
    read: (text) => {
      const hit = text.match(/(?:ยาว\s*)?(\d{2,3})\s*(?:m\b|เมตร)/i)
      return hit ? `${hit[1]} m` : null
    },
  },
  {
    label: { en: 'Size', th: 'ไซส์' },
    read: (text) => {
      const hit = text.match(/(?:eu|us|ไซส์|size)\s*(\d{2}(?:\.\d)?)/i)
      return hit ? hit[1] : null
    },
  },
  {
    label: { en: 'Pack', th: 'จำนวนต่อแพ็ค' },
    read: (text) => {
      const hit = text.match(/(\d+)\s*(ชิ้น|ไม้|เส้น|ลูก|คู่)/)
      return hit ? `${hit[1]} ${hit[2]}` : null
    },
  },
]

// Facet values are stored in English. A Thai reader must not be shown
// "Racket & Bat Sports" in a Thai table, so every stored value is looked up in
// the facet vocabulary and carried through with both names. Brand and shop are
// left alone: they are proper nouns, not vocabulary.
const localise = (value: string | null, options: Facet[]): Bilingual | null => {
  if (!value) return null
  const hit = options.find((option) => option.nameEn === value || option.nameTh === value)
  return hit ? { en: hit.nameEn, th: hit.nameTh } : { en: value, th: value }
}

const asIs = (value: string | null): Bilingual | null => (value ? { en: value, th: value } : null)

const FIELDS: {
  label: Bilingual
  read: (product: CompareProduct, facets: Facets) => Bilingual | null
}[] = [
  { label: { en: 'Brand', th: 'แบรนด์' }, read: (product) => asIs(product.brand) },
  {
    label: { en: 'Sport', th: 'กีฬา' },
    read: (product, facets) => localise(product.sport, facets.sports),
  },
  {
    label: { en: 'Type', th: 'ประเภท' },
    // "Other" is the column default, meaning unclassified rather than a type.
    // Repeating it down a comparison row tells the customer nothing.
    read: (product, facets) =>
      product.productType === 'Other' ? null : localise(product.productType, facets.productTypes),
  },
  {
    label: { en: 'For', th: 'สำหรับ' },
    read: (product, facets) => localise(product.gender, facets.genders),
  },
  { label: { en: 'Sold by', th: 'ร้าน' }, read: (product) => asIs(product.shopName) },
]

const CHEAPEST: Bilingual = { en: 'Lowest price here', th: 'ราคาต่ำสุดในกลุ่มนี้' }
const PRICIEST: Bilingual = { en: 'Highest price here', th: 'ราคาสูงสุดในกลุ่มนี้' }

export function compareByRules(products: CompareProduct[], facets: Facets): Comparison {
  const texts = products.map(textOf)
  const rows: ComparisonRow[] = []

  for (const field of FIELDS) {
    const values = products.map((product) => field.read(product, facets))
    if (values.every((value) => !value)) continue
    rows.push({ label: field.label, cells: values.map((value) => value ?? BLANK) })
  }

  for (const pattern of PATTERNS) {
    const values = texts.map((text) => pattern.read(text))
    // A row nobody has a value for says nothing, and a table of blanks reads as
    // a broken feature rather than as a catalogue that does not state the spec.
    if (values.every((value) => !value)) continue
    rows.push({
      label: pattern.label,
      cells: values.map((value) => (value ? { en: value, th: value } : BLANK)),
    })
  }

  // Deterministic verdicts: only what the prices actually prove, and only when
  // the extreme is unique. With a tie, nothing is claimed.
  const prices = products.map((product) => product.priceCents)
  const low = Math.min(...prices)
  const high = Math.max(...prices)
  const verdicts: Comparison['verdicts'] = []
  if (low !== high) {
    if (prices.filter((price) => price === low).length === 1) {
      verdicts.push({
        productId: products[prices.indexOf(low)].id,
        text: CHEAPEST,
      })
    }
    if (prices.filter((price) => price === high).length === 1) {
      verdicts.push({
        productId: products[prices.indexOf(high)].id,
        text: PRICIEST,
      })
    }
  }

  return { rows, verdicts }
}

/* --------------------------------------------------------- Claude reading */

const ComparisonSchema = z.object({
  rows: z.array(
    z.object({
      labelEn: z.string(),
      labelTh: z.string(),
      cells: z.array(z.object({ en: z.string(), th: z.string() })),
    }),
  ),
  verdicts: z.array(z.object({ productId: z.number(), en: z.string(), th: z.string() })),
})

const SYSTEM = [
  'You build a side-by-side comparison table for sports products sold on a Thai',
  'marketplace. The only description available is the marketplace title, which',
  'often contains the real specification inside it.',
  'Return JSON only.',
  'Give between three and six rows. A row is one attribute, with exactly one',
  'cell per product, in the order the products were listed.',
  'Only state what the product text actually says. Never infer a specification',
  'from the brand, the price, or from what is typical for the category. When a',
  'product does not state the attribute, its cell is the string "—".',
  'Skip a row entirely if no product states it.',
  'Never add a row for price, and never mention a price anywhere: prices change',
  'at the marketplace and are shown separately.',
  'Every label and every cell is given in both English and Thai. Keep cells',
  'short — a value, not a sentence. Keep brand and model names in their original',
  'script in both languages.',
  'Then give one verdict per product: who it suits, at most twelve words, in',
  'both languages. Base it only on what the rows show.',
].join(' ')

export async function compareWithClaude(products: CompareProduct[]): Promise<Comparison> {
  const raw = await parseJson(ComparisonSchema, {
    system: SYSTEM,
    user: products
      .map((product, index) =>
        [
          `Product ${index + 1}`,
          `id: ${product.id}`,
          `title: ${product.name}`,
          product.description && product.description !== product.name
            ? `description: ${product.description}`
            : null,
          `brand: ${product.brand ?? 'unknown'}`,
          `sport: ${product.sport ?? 'unknown'}`,
          `type: ${product.productType ?? 'unknown'}`,
        ]
          .filter(Boolean)
          .join('\n'),
      )
      .join('\n\n'),
  })
  return validateComparison(raw, products)
}

/* ------------------------------------------------------------- validation */

const clean = (value: unknown, limit: number): string => {
  const text = typeof value === 'string' ? value.trim() : ''
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text
}

// A misaligned row would put one product's spec under another product's name,
// which is worse than showing no table at all. Drop anything that does not line
// up, and treat an empty result as a failure so the caller falls back.
export function validateComparison(raw: unknown, products: CompareProduct[]): Comparison {
  const input = (raw ?? {}) as { rows?: unknown; verdicts?: unknown }
  const ids = new Set(products.map((product) => product.id))

  const rows: ComparisonRow[] = (Array.isArray(input.rows) ? input.rows : [])
    .map((entry) => {
      const row = (entry ?? {}) as { labelEn?: unknown; labelTh?: unknown; cells?: unknown }
      const cells = Array.isArray(row.cells) ? row.cells : []
      if (cells.length !== products.length) return null
      const labelEn = clean(row.labelEn, 40)
      const labelTh = clean(row.labelTh, 40)
      if (!labelEn && !labelTh) return null
      return {
        label: { en: labelEn || labelTh, th: labelTh || labelEn },
        cells: cells.map((cell) => {
          const value = (cell ?? {}) as { en?: unknown; th?: unknown }
          const en = clean(value.en, 60)
          const th = clean(value.th, 60)
          return en || th ? { en: en || th, th: th || en } : BLANK
        }),
      }
    })
    .filter((row): row is ComparisonRow => row !== null)
    // Every cell blank means the model had nothing and said so in six places.
    .filter((row) => row.cells.some((cell) => cell.en !== BLANK.en))
    .slice(0, 8)

  if (!rows.length) throw new Error('Claude produced no usable comparison rows.')

  const seen = new Set<number>()
  const verdicts = (Array.isArray(input.verdicts) ? input.verdicts : [])
    .map((entry) => {
      const verdict = (entry ?? {}) as { productId?: unknown; en?: unknown; th?: unknown }
      const productId = Number(verdict.productId)
      if (!ids.has(productId) || seen.has(productId)) return null
      const en = clean(verdict.en, 80)
      const th = clean(verdict.th, 80)
      if (!en && !th) return null
      seen.add(productId)
      return { productId, text: { en: en || th, th: th || en } }
    })
    .filter((verdict): verdict is Comparison['verdicts'][number] => verdict !== null)

  return { rows, verdicts }
}
