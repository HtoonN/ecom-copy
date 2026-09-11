import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Storefront from '@/features/buyer/components/Storefront'
import HeroBanner from '@/features/buyer/components/HeroBanner'
import { prisma } from '@/lib/prisma'
import { productListInclude, productListWhere } from '@/lib/product-listing'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>
}) {
  const [products, query, merchants, sports, productTypes] = await Promise.all([
    prisma.product.findMany({
      where: productListWhere({}),
      include: productListInclude,
      orderBy: { createdAt: 'desc' },
    }),
    searchParams,
    // Every active shop, listed whether or not it currently has products: the filter
    // roster is meant to read as the marketplace's full set of merchants.
    prisma.shop.findMany({
      where: { active: true },
      select: { name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
    prisma.sport.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.productType.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])
  const initialQuery = Array.isArray(query.q) ? query.q[0] : query.q || ''
  return (
    <>
      <Header initialQuery={initialQuery} />
      <main>
        <HeroBanner />
        <Storefront
          initialProducts={products.map((product) => ({
            ...product,
            imageUrls: product.imageUrls as string[],
            affiliateUrl: product.affiliateUrl as string[],
          }))}
          merchants={merchants}
          sports={sports.map((sport) => ({ nameEn: sport.nameEn, nameTh: sport.nameTh }))}
          productTypes={productTypes.map((type) => ({ nameEn: type.nameEn, nameTh: type.nameTh }))}
          initialQuery={initialQuery}
          showHeader={false}
        />
      </main>
      <Footer />
    </>
  )
}
