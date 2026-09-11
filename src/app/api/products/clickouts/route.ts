import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MARKETPLACES = ['Shopee', 'Lazada']

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const payload = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const productId = 'productId' in payload ? Number(payload.productId) : Number.NaN

  if (!Number.isSafeInteger(productId) || productId < 1)
    return NextResponse.json({ error: 'Invalid product.' }, { status: 400 })

  // Anything outside the known marketplaces is stored as null rather than
  // rejected — a click that happened is worth recording even unattributed.
  const raw = payload.marketplace
  const marketplace = typeof raw === 'string' && MARKETPLACES.includes(raw) ? raw : null

  const product = await prisma.product.findFirst({
    where: { id: productId, active: true },
    select: { id: true },
  })
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  await prisma.productClickOut.create({ data: { productId, marketplace } })
  return new Response(null, { status: 204 })
}
