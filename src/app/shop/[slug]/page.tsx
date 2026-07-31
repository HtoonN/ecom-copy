import { notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Storefront from '@/features/buyer/components/Storefront'
import { prisma } from '@/lib/prisma'
import { productListInclude } from '@/lib/product-listing'

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [shop, brands, sports, productTypes] = await Promise.all([
    prisma.shop.findUnique({
      where: { slug },
      include: {
        products: {
          where: { active: true },
          include: productListInclude,
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    prisma.brand.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.sport.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.productType.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])

  if (!shop || !shop.active) notFound()

  return (
    <>
      <Header />
      <main>
        <section className="shop-masthead">
          <div className="container">
            <Link className="shop-back" href="/">
              ← Back to marketplace
            </Link>
            <div className="shop-identity">
              <div
                className="shop-logo"
                style={{ backgroundImage: shop.logoUrl ? `url(${shop.logoUrl})` : undefined }}
              >
                {!shop.logoUrl && shop.name.charAt(0)}
              </div>
              <div>
                <div className="eyebrow">Independent seller</div>
                <h1>{shop.name}</h1>
                <p>{shop.description || 'Browse this seller’s products.'}</p>
                <div className="shop-address">
                  <span aria-hidden="true">⌖</span>
                  {shop.address || 'Address not provided'}
                </div>
              </div>
            </div>
          </div>
        </section>
        <Storefront
          initialProducts={shop.products.map((product) => ({
            ...product,
            imageUrls: product.imageUrls as string[],
            affiliateUrl: product.affiliateUrl as string[],
          }))}
          brands={brands.map((brand) => ({ nameEn: brand.nameEn, nameTh: brand.nameTh }))}
          sports={sports.map((sport) => ({ nameEn: sport.nameEn, nameTh: sport.nameTh }))}
          productTypes={productTypes.map((type) => ({ nameEn: type.nameEn, nameTh: type.nameTh }))}
          shopSlug={shop.slug}
          eyebrow="Shop collection"
          title="Products"
          subtitle={`Shop all products from ${shop.name}.`}
        />
      </main>
    </>
  )
}
