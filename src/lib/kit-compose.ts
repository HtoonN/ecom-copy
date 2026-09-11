// Composes a kit for one (sport, budget): the main piece of equipment plus the
// things that genuinely go with it, inside one budget.
//
// Two composers behind one call, the same shape as search and compare. Claude
// reads the product names — which is the only place this catalogue says whether
// a "Racket & Bat Sports" row is a racket, a string or a grip — and a rule pass
// picks by product type and price when Claude is unreachable.
//
// Used by both the on-demand wizard and the batch script, so a kit built by a
// customer and a kit built by a nightly run are the same kit.

import { z } from 'zod'
import { llmModel, parseJson } from './llm'
import { prisma } from './prisma'

export const BUDGETS_BAHT = [2500, 3500, 6000]
export const MIN_ITEMS = 3
export const MAX_ITEMS = 6
// Cap per product type so the prompt stays small on a large catalogue; a bigger
// candidate list makes a mid-size model drift off the budget constraint.
const CANDIDATES_PER_TYPE = 10
// Share of the budget the main item is allowed to take. Below this the kit is a
// pile of accessories; above it there is nothing left to go with the main item.
const MAIN_ITEM_BUDGET_SHARE = 0.6

export type Candidate = {
  id: number
  name: string
  productType: string
  brand: string | null
  priceCents: number
}

export type ModelPick = { id: number; role: string }

export type ComposedKit = {
  items: { candidate: Candidate; role: string }[]
  totalCents: number
}

export const baht = (cents: number) => (cents / 100).toLocaleString('en-US')

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/* --------------------------------------------------------------- catalogue */

export async function candidatesFor(sport: string): Promise<Candidate[]> {
  const products = await prisma.product.findMany({
    where: { active: true, sport },
    select: { id: true, name: true, productType: true, brand: true, priceCents: true },
    orderBy: { priceCents: 'asc' },
  })

  const byType = new Map<string, Candidate[]>()
  for (const product of products) {
    const key = product.productType || 'Other'
    const bucket = byType.get(key) ?? []
    if (bucket.length < CANDIDATES_PER_TYPE) {
      bucket.push(product)
      byType.set(key, bucket)
    }
  }
  return [...byType.values()].flat()
}

/* ------------------------------------------------------------- validation */

// Anything the composer got wrong is dropped here rather than shown. A missing
// kit is a non-event; a kit citing a product we do not sell is a broken page.
export function validate(
  picks: ModelPick[],
  candidates: Candidate[],
  budgetCents: number,
): ComposedKit | null {
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]))
  const seen = new Set<number>()
  const roles = new Set<string>()
  const kept: { candidate: Candidate; role: string }[] = []

  for (const pick of picks) {
    const candidate = byId.get(pick.id)
    const role = pick.role.toLowerCase()
    // One item per role. Two rackets in a starter kit is a wrong answer even
    // when both are real products inside the budget.
    if (!candidate || seen.has(pick.id) || roles.has(role) || kept.length >= MAX_ITEMS) continue
    seen.add(pick.id)
    roles.add(role)
    kept.push({ candidate, role })
  }

  let total = kept.reduce((sum, item) => sum + item.candidate.priceCents, 0)
  // Trim from the cheapest end rather than rejecting outright: an over-budget kit
  // is usually one accessory too many, and the main item is what earns the click.
  while (total > budgetCents && kept.length > MIN_ITEMS) {
    const dropped = kept.pop()
    total -= dropped?.candidate.priceCents ?? 0
  }

  if (kept.length < MIN_ITEMS || total > budgetCents) return null
  return { items: kept, totalCents: total }
}

/* ---------------------------------------------------------- rule composer */

// Broad product types, ranked by what a starter kit actually needs first. The
// live catalogue puts rackets, strings and grips in one "Racket & Bat Sports"
// bucket, so these match loosely on substrings.
const EQUIPMENT_TYPES = ['racket', 'bat', 'ball', 'shuttle', 'shoe']
const APPAREL_TYPES = ['shirt', 'shorts', 'pants', 'skirt', 'suit', 'apparel']

// Product types are catalogue labels ("Sports Balls & Shuttlecocks"); roles are
// what the item IS. The page translates roles, so they have to be canonical —
// the raw type string matches nothing and every line renders as "accessory".
const ROLE_BY_KEYWORD: [string, string][] = [
  ['shuttle', 'shuttlecock'],
  ['ball', 'ball'],
  ['racket', 'racket'],
  ['bat', 'racket'],
  ['shoe', 'shoes'],
  // Tops, bottoms and skirts are separate roles, not one "apparel" role: the
  // one-item-per-role rule would otherwise throw away the shorts because a
  // shirt already filled the slot, and a two-item kit fails validation outright.
  ['shirt', 'apparel'],
  ['skirt', 'skirt'],
  ['shorts', 'bottoms'],
  ['pants', 'bottoms'],
  ['suit', 'apparel'],
  ['bag', 'bag'],
]

export const roleForType = (type: string) => {
  const lower = type.toLowerCase()
  return ROLE_BY_KEYWORD.find(([needle]) => lower.includes(needle))?.[1] ?? 'other'
}

const typeRank = (type: string) => {
  const lower = type.toLowerCase()
  if (EQUIPMENT_TYPES.some((needle) => lower.includes(needle))) return 0
  if (APPAREL_TYPES.some((needle) => lower.includes(needle))) return 2
  return 1
}

// Composes a kit without a model: the priciest affordable item from the type
// that anchors the sport (the racket, the shoes), then the cheapest item from
// each remaining type until the budget or MAX_ITEMS runs out.
//
// Its ceiling is the catalogue's category granularity: because one product type
// covers rackets, strings and grips, this can only ever take one of the three.
// Reading the product name to tell them apart is the model's actual advantage.
export function composeByRule(candidates: Candidate[], budgetCents: number): ModelPick[] {
  const byType = new Map<string, Candidate[]>()
  for (const candidate of candidates) {
    const key = candidate.productType || 'Other'
    byType.set(key, [...(byType.get(key) ?? []), candidate])
  }
  for (const bucket of byType.values()) bucket.sort((a, b) => a.priceCents - b.priceCents)

  // Equipment first, then everything else, then clothing. Ordering by price
  // instead let cheap apparel eat the budget before the racket was considered.
  const types = [...byType.entries()].sort(([aType, aItems], [bType, bItems]) => {
    const rank = typeRank(aType) - typeRank(bType)
    return rank !== 0 ? rank : (bItems.at(-1)?.priceCents ?? 0) - (aItems.at(-1)?.priceCents ?? 0)
  })
  if (!types.length) return []

  // Distinct product types must end up with distinct roles. Several types map to
  // the same role ("Other", and anything unrecognised), and validation keeps one
  // item per role — so without this a kit of three different types collapses to
  // one item and fails. The label falls back to a generic one either way.
  const usedRoles = new Set<string>()
  const uniqueRole = (type: string) => {
    const base = roleForType(type)
    if (!usedRoles.has(base)) {
      usedRoles.add(base)
      return base
    }
    let suffix = 2
    while (usedRoles.has(`${base}-${suffix}`)) suffix += 1
    const role = `${base}-${suffix}`
    usedRoles.add(role)
    return role
  }

  const [anchorType, anchorBucket] = types[0]
  const anchorCap = Math.floor(budgetCents * MAIN_ITEM_BUDGET_SHARE)
  const anchor =
    [...anchorBucket].reverse().find((candidate) => candidate.priceCents <= anchorCap) ??
    anchorBucket[0]
  if (!anchor) return []

  const picks: ModelPick[] = [{ id: anchor.id, role: uniqueRole(anchorType) }]
  const taken = new Set<string>([anchorType])
  let spent = anchor.priceCents

  // Pass 1: equipment and gear, and at most one garment — shorts and a skirt in
  // the same kit is a wrong answer.
  // Pass 2: only if the kit is still too short. Sports whose catalogue is almost
  // entirely clothing (yoga, running) have nothing else to offer, and one garment
  // plus nothing is not a kit.
  for (const pass of [1, 2]) {
    let garments = 0
    for (const [type, bucket] of types.slice(1)) {
      if (picks.length >= MAX_ITEMS) break
      if (taken.has(type)) continue
      const isApparel = typeRank(type) === 2
      if (pass === 1 && isApparel && garments >= 1) continue

      // Spend up on equipment while budget allows, but stay cheap on the rest.
      const affordableHere = bucket.filter((item) => spent + item.priceCents <= budgetCents)
      const chosen = typeRank(type) === 0 ? affordableHere.at(-1) : affordableHere[0]
      if (!chosen) continue

      picks.push({ id: chosen.id, role: uniqueRole(type) })
      taken.add(type)
      spent += chosen.priceCents
      if (isApparel) garments += 1
    }
    if (picks.length >= MIN_ITEMS) break
  }

  // Last resort: top up from types already used. One item per type is the right
  // default, but a catalogue where one broad type holds rackets, strings and
  // grips alike (tennis, here) can only ever offer two types — and two items is
  // not a kit. These extras get their own role so they survive validation, and a
  // generic label, because the rules genuinely cannot say what they are. Telling
  // them apart is the model's job.
  if (picks.length < MIN_ITEMS) {
    const chosen = new Set(picks.map((pick) => pick.id))
    const remaining = candidates
      .filter((candidate) => !chosen.has(candidate.id))
      .sort((a, b) => a.priceCents - b.priceCents)
    for (const candidate of remaining) {
      if (picks.length >= MIN_ITEMS) break
      if (spent + candidate.priceCents > budgetCents) continue
      picks.push({ id: candidate.id, role: `accessory-${picks.length}` })
      spent += candidate.priceCents
    }
  }

  return picks
}

/* -------------------------------------------------------- Claude composer */

const KitSchema = z.object({
  items: z.array(z.object({ id: z.number().int().positive(), role: z.string() })),
  reason: z.string(),
})

const SYSTEM = [
  'You assemble sports equipment kits for a Thai marketplace.',
  'You pick products from a supplied catalogue. You never invent products.',
  'Reply with JSON only: {"items":[{"id":<number>,"role":"<slot>"}],"reason":"<one short English sentence>"}.',
  'Rules: every id must come from the catalogue; no duplicate ids; the combined',
  'price must not exceed the budget; include the main piece of equipment first,',
  'then consumables and accessories that genuinely fit it; a kit with fewer good',
  'items beats a kit padded to the budget.',
  'Product types in this catalogue are broad — "Racket & Bat Sports" covers',
  'rackets, strings and grips alike — so read the product name to decide what a',
  'thing actually is. Several items may share a type; each must fill a different',
  'role. Use short lowercase role names: racket, string, grip, shuttlecock, ball,',
  'shoes, bag, apparel.',
].join(' ')

export async function pickWithClaude(
  sport: string,
  budgetBaht: number,
  affordable: Candidate[],
): Promise<ModelPick[]> {
  const chosen = await parseJson(KitSchema, {
    system: SYSTEM,
    user: [
      `Sport: ${sport}`,
      `Budget: ${budgetBaht} THB total`,
      `Catalogue (price in THB):`,
      ...affordable.map(
        (candidate) =>
          `- id=${candidate.id} | ${candidate.productType} | ${candidate.brand ?? 'no brand'} | ${baht(candidate.priceCents)} | ${candidate.name}`,
      ),
    ].join('\n'),
  })
  return chosen.items
}

/* ------------------------------------------------------------ composition */

export type KitResult = { kit: ComposedKit; source: 'model' | 'rule' }

// One call for both callers. `offline` skips the model entirely, which is what
// the script's --offline flag means and what a missing API key amounts to.
export async function composeKit(
  sportEn: string,
  budgetBaht: number,
  candidates: Candidate[],
  { offline = false }: { offline?: boolean } = {},
): Promise<KitResult | null> {
  const budgetCents = budgetBaht * 100
  const affordable = candidates.filter((candidate) => candidate.priceCents <= budgetCents)
  if (affordable.length < MIN_ITEMS) return null

  let picks: ModelPick[]
  let source: 'model' | 'rule'
  if (offline) {
    picks = composeByRule(affordable, budgetCents)
    source = 'rule'
  } else {
    try {
      picks = await pickWithClaude(sportEn, budgetBaht, affordable)
      source = 'model'
    } catch {
      // A model that is unreachable, rate-limited or declining the request should
      // not leave the page empty when a serviceable kit can still be built.
      picks = composeByRule(affordable, budgetCents)
      source = 'rule'
    }
  }

  const kit = validate(picks, affordable, budgetCents)
  if (!kit) {
    // The model's answer failed validation. The rules are the second opinion,
    // not a second failure, so try them before giving up on the kit entirely.
    if (source === 'model') {
      const fallback = validate(composeByRule(affordable, budgetCents), affordable, budgetCents)
      if (fallback) return { kit: fallback, source: 'rule' }
    }
    return null
  }
  return { kit, source }
}

export function kitTitle(sportTh: string, budgetBaht: number): string {
  return `ชุดเริ่มเล่น${sportTh} งบไม่เกิน ${budgetBaht.toLocaleString('en-US')} บาท`
}

export function kitSlug(sportEn: string, budgetBaht: number): string {
  return `${slugify(sportEn)}-${budgetBaht}`
}

export { llmModel }
