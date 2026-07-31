import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseCsvParam, productListInclude, productListWhere } from '@/lib/product-listing'

function parsePriceCents(value: string | null): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : undefined
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query = url.searchParams.get('q') || ''
  const category = url.searchParams.get('category') || ''
  const productTypes = parseCsvParam(url.searchParams.get('productType'))
  const genders = parseCsvParam(url.searchParams.get('gender'))
  const sports = parseCsvParam(url.searchParams.get('sport'))
  const brands = parseCsvParam(url.searchParams.get('brand'))
  const shopSlug = url.searchParams.get('shop') || ''
  const minPriceCents = parsePriceCents(url.searchParams.get('minPrice'))
  const maxPriceCents = parsePriceCents(url.searchParams.get('maxPrice'))
  const products = await prisma.product.findMany({
    where: productListWhere({
      query,
      category,
      productTypes,
      genders,
      sports,
      brands,
      shopSlug,
      minPriceCents,
      maxPriceCents,
    }),
    include: productListInclude,
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(products)
}
