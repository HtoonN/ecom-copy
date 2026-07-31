import { Prisma } from '@/generated/prisma/client'

export const productListInclude = {
  shop: { select: { name: true, slug: true, logoUrl: true } },
  _count: { select: { views: true } },
} satisfies Prisma.ProductInclude

export type ProductListFilters = {
  query?: string
  category?: string
  productTypes?: string[]
  genders?: string[]
  sports?: string[]
  brands?: string[]
  shopSlug?: string
  minPriceCents?: number
  maxPriceCents?: number
}

export function productListWhere(filters: ProductListFilters): Prisma.ProductWhereInput {
  const { query, category, productTypes, genders, sports, brands, shopSlug, minPriceCents, maxPriceCents } =
    filters
  return {
    active: true,
    ...(query
      ? { OR: [{ name: { contains: query } }, { description: { contains: query } }] }
      : {}),
    ...(category ? { category } : {}),
    ...(productTypes?.length ? { productType: { in: productTypes } } : {}),
    ...(genders?.length ? { gender: { in: genders } } : {}),
    ...(sports?.length ? { sport: { in: sports } } : {}),
    ...(brands?.length ? { brand: { in: brands } } : {}),
    ...(shopSlug ? { shop: { slug: shopSlug } } : {}),
    ...(minPriceCents != null || maxPriceCents != null
      ? {
          priceCents: {
            ...(minPriceCents != null ? { gte: minPriceCents } : {}),
            ...(maxPriceCents != null ? { lte: maxPriceCents } : {}),
          },
        }
      : {}),
  }
}

// Joined with "|" rather than "," because some values contain a literal comma
// (e.g. sport name "Yoga, Pilates") — "|" never appears in any facet label.
export function parseCsvParam(value: string | null): string[] {
  return (value || '')
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function encodeCsvParam(values: string[]): string {
  return values.join('|')
}
