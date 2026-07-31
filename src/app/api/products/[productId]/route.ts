import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { productListInclude, productListWhere } from '@/lib/product-listing'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params
  const id = Number(productId)
  if (!Number.isSafeInteger(id)) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const product = await prisma.product.findFirst({
    where: { id, ...productListWhere({}) },
    include: productListInclude,
  })
  if (!product) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  return NextResponse.json(product)
}
