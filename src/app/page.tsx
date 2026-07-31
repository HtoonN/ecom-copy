import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Storefront from '@/features/buyer/components/Storefront'
import HeroBanner from '@/features/buyer/components/HeroBanner'
import { prisma } from '@/lib/prisma'
import { readSession } from '@/lib/auth'
import { productListInclude, productListWhere } from '@/lib/product-listing'
import { redirect } from 'next/navigation'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>
}) {
  const [products, session, query, brands, sports, productTypes] = await Promise.all([
    prisma.product.findMany({
      where: productListWhere({}),
      include: productListInclude,
      orderBy: { createdAt: 'desc' },
    }),
    readSession(),
    searchParams,
    prisma.brand.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.sport.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.productType.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])
  if (session?.role === 'VENDOR') redirect('/vendor?tab=dashboard')
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
          brands={brands.map((brand) => ({ nameEn: brand.nameEn, nameTh: brand.nameTh }))}
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
