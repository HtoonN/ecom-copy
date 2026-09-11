import { Prisma } from '@/generated/prisma/client'

export const productListInclude = {
  shop: { select: { name: true, slug: true, logoUrl: true } },
  // Views measure interest; click-outs measure the only action that can earn a
  // commission, since every product here is fulfilled by the shop that sells it.
  _count: { select: { views: true, clickOuts: true } },
} satisfies Prisma.ProductInclude

export type ProductListFilters = {
  query?: string
  category?: string
  productTypes?: string[]
  genders?: string[]
  sports?: string[]
  brands?: string[]
  shopSlug?: string
  shopSlugs?: string[]
  minPriceCents?: number
  maxPriceCents?: number
}

export function productListWhere(filters: ProductListFilters): Prisma.ProductWhereInput {
  const {
    query,
    category,
    productTypes,
    genders,
    sports,
    brands,
    shopSlug,
    shopSlugs,
    minPriceCents,
    maxPriceCents,
  } = filters
  return {
    active: true,
    ...(query ? { OR: [{ name: { contains: query } }, { description: { contains: query } }] } : {}),
    ...(category ? { category } : {}),
    ...(productTypes?.length ? { productType: { in: productTypes } } : {}),
    ...(genders?.length ? { gender: { in: genders } } : {}),
    ...(sports?.length ? { sport: { in: sports } } : {}),
    ...(brands?.length ? { brand: { in: brands } } : {}),
    // shopSlug scopes a whole page to one merchant (/shop/[slug]); shopSlugs is the
    // buyer-facing merchant filter. They have to fold into a single `shop` key — two
    // spreads would silently overwrite each other.
    ...shopCondition(shopSlug, shopSlugs),
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

function shopCondition(shopSlug?: string, shopSlugs?: string[]): Prisma.ProductWhereInput {
  const slugs = shopSlugs?.length ? shopSlugs : undefined
  if (shopSlug && slugs) {
    // A merchant filter inside a single-merchant page can only ever narrow to that page's
    // own merchant, or to nothing at all.
    return slugs.includes(shopSlug) ? { shop: { slug: shopSlug } } : { id: -1 }
  }
  if (shopSlug) return { shop: { slug: shopSlug } }
  if (slugs) return { shop: { slug: { in: slugs } } }
  return {}
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
