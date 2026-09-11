// The facet vocabulary, in both languages, loaded from the same tables the
// filter sidebar is built from. Shared so that every feature reading or writing
// a facet value agrees on what the catalogue actually stocks.

import { prisma } from './prisma'

export type Facet = { nameEn: string; nameTh: string }

export type Facets = {
  productTypes: Facet[]
  sports: Facet[]
  brands: Facet[]
  genders: Facet[]
}

// Gender is not a table: it is a fixed, short list stored directly on the
// product, so it lives here rather than in the database.
export const GENDER_FACETS: Facet[] = [
  { nameEn: 'Men', nameTh: 'ผู้ชาย' },
  { nameEn: 'Women', nameTh: 'ผู้หญิง' },
  { nameEn: 'Unisex', nameTh: 'ยูนิเซกส์' },
  { nameEn: 'Kids', nameTh: 'เด็ก' },
  { nameEn: 'Boys', nameTh: 'เด็กผู้ชาย' },
  { nameEn: 'Girls', nameTh: 'เด็กผู้หญิง' },
]

export async function loadFacets(): Promise<Facets> {
  const [productTypes, sports, brands] = await Promise.all([
    prisma.productType.findMany({ select: { nameEn: true, nameTh: true } }),
    prisma.sport.findMany({ select: { nameEn: true, nameTh: true } }),
    prisma.brand.findMany({ select: { nameEn: true, nameTh: true } }),
  ])
  return { productTypes, sports, brands, genders: GENDER_FACETS }
}
