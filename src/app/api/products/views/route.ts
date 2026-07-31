import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const productId =
    typeof body === 'object' && body !== null && 'productId' in body
      ? Number(body.productId)
      : Number.NaN

  if (!Number.isSafeInteger(productId) || productId < 1)
    return NextResponse.json({ error: 'Invalid product.' }, { status: 400 })

  const product = await prisma.product.findFirst({
    where: { id: productId, active: true },
    select: { id: true },
  })
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  await prisma.productView.create({ data: { productId } })
  return new Response(null, { status: 204 })
}
