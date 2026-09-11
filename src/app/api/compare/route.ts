import { NextResponse } from 'next/server'
import {
  type CompareProduct,
  type Comparison,
  MAX_COMPARE,
  compareByRules,
  compareWithClaude,
  comparisonKey,
} from '@/lib/compare'
import { loadFacets } from '@/lib/facets'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const raw = typeof body === 'object' && body !== null ? (body as { productIds?: unknown }) : {}
  const ids = [
    ...new Set(
      (Array.isArray(raw.productIds) ? raw.productIds : [])
        .map((value) => Number(value))
        .filter((value) => Number.isSafeInteger(value) && value > 0),
    ),
  ].slice(0, MAX_COMPARE)

  if (ids.length < 2)
    return NextResponse.json({ error: 'Choose at least two products.' }, { status: 400 })

  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, active: true },
    select: {
      id: true,
      name: true,
      description: true,
      brand: true,
      sport: true,
      gender: true,
      productType: true,
      priceCents: true,
      shop: { select: { name: true } },
    },
  })
  if (rows.length < 2) return NextResponse.json({ error: 'Products not found.' }, { status: 404 })

  // Keep the order the customer chose. Prisma returns rows by id, and the table
  // columns must match the order the page laid them out in.
  const products: CompareProduct[] = ids
    .map((id) => rows.find((row) => row.id === id))
    .filter((row): row is (typeof rows)[number] => Boolean(row))
    .map(({ shop, ...product }) => ({ ...product, shopName: shop.name }))

  const key = comparisonKey(products.map((product) => product.id))

  const cached = await prisma.productComparison.findUnique({ where: { key } })
  if (cached) {
    // Not awaited — a counter must never delay the answer it is counting.
    prisma.productComparison
      .update({ where: { key }, data: { hits: { increment: 1 } } })
      .catch(() => undefined)
    return NextResponse.json({
      comparison: orderFor(cached.payload as unknown as Comparison, products, key),
      source: 'cache',
    })
  }

  let comparison: Comparison
  let source: string
  try {
    comparison = await compareWithClaude(products)
    source = 'model'
  } catch {
    // Same table, same dialog — a shallower reading rather than an error.
    comparison = compareByRules(products, await loadFacets())
    source = 'rules'
  }

  if (source === 'model') {
    await prisma.productComparison
      .create({ data: { key, payload: storedFor(comparison, products) } })
      .catch(() => undefined)
  }

  return NextResponse.json({ comparison, source })
}

// A comparison is cached under the sorted id key, but the cells were built in
// whatever order that first customer picked. Store it in key order so a later
// customer picking the same products in the other order can be served from it.
function storedFor(comparison: Comparison, products: CompareProduct[]): object {
  const target = [...products].sort((a, b) => a.id - b.id).map((product) => product.id)
  return reorder(
    comparison,
    products.map((product) => product.id),
    target,
  ) as unknown as object
}

function orderFor(comparison: Comparison, products: CompareProduct[], key: string): Comparison {
  const stored = key.split(':').map(Number)
  return reorder(
    comparison,
    stored,
    products.map((product) => product.id),
  )
}

function reorder(comparison: Comparison, from: number[], to: number[]): Comparison {
  const index = to.map((id) => from.indexOf(id))
  if (index.some((position) => position < 0)) return comparison
  return {
    ...comparison,
    rows: comparison.rows.map((row) => ({
      ...row,
      cells: index.map((position) => row.cells[position]),
    })),
  }
}
