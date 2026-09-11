import { NextResponse } from 'next/server'
import { loadFacets } from '@/lib/facets'
import { prisma } from '@/lib/prisma'
import {
  EMPTY_FILTERS,
  type SearchFilters,
  interpretByRules,
  interpretWithClaude,
  normaliseQuery,
} from '@/lib/search-interpret'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const raw = typeof body === 'object' && body !== null ? (body as { q?: unknown }).q : undefined
  const query = typeof raw === 'string' ? raw : ''
  const key = normaliseQuery(query)
  if (!key) return NextResponse.json({ filters: EMPTY_FILTERS, source: 'empty' })

  // Cache first: a phrase we have already understood costs nothing to
  // understand again, and popular phrases are the ones people repeat.
  const cached = await prisma.searchInterpretation.findUnique({ where: { query: key } })
  if (cached) {
    // Not awaited — a counter must never delay the search it is counting.
    prisma.searchInterpretation
      .update({ where: { query: key }, data: { hits: { increment: 1 } } })
      .catch(() => undefined)
    return NextResponse.json({ filters: cached.filters as SearchFilters, source: 'cache' })
  }

  const facets = await loadFacets()
  let filters: SearchFilters
  let source: string

  try {
    filters = await interpretWithClaude(query, facets)
    source = 'model'
  } catch {
    // Same response shape, same behaviour on the page — only the accuracy of
    // the reading changes, and a rule reading is far better than an error.
    filters = interpretByRules(query, facets)
    source = 'rules'
  }

  // Only a model reading is worth caching. A rule reading is what we can always
  // produce anyway, and storing it would freeze the weaker answer in place.
  if (source === 'model') {
    await prisma.searchInterpretation
      .create({ data: { query: key, filters: filters as object } })
      .catch(() => undefined)
  }

  return NextResponse.json({ filters, source })
}
