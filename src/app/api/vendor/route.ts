import { NextResponse } from 'next/server'
import { Buffer } from 'node:buffer'
import { prisma } from '@/lib/prisma'
import { apiSession, fail } from '@/lib/api'
import { ListingMode, OrderStatus } from '@/generated/prisma/enums'
import { normalizeShopeeUrl } from '@/lib/shopee'
import { normalizeLazadaUrl } from '@/lib/lazada'
import { detectAffiliateMarketplace } from '@/lib/affiliate-marketplace'
import { deleteImage, publicIdFromUrl, uploadImage } from '@/lib/image-upload'

function requestedListingMode(value: unknown, fallback: ListingMode = ListingMode.NATIVE) {
  if (value === ListingMode.AFFILIATE) return ListingMode.AFFILIATE
  if (value === ListingMode.NATIVE) return ListingMode.NATIVE
  return fallback
}

function existingAffiliateUrls(value: unknown) {
  const urls = Array.isArray(value) ? value.filter((url): url is string => typeof url === 'string') : []
  return {
    shopeeAffiliateUrl: urls.find((url) => detectAffiliateMarketplace(url) === 'Shopee') || null,
    lazadaAffiliateUrl: urls.find((url) => detectAffiliateMarketplace(url) === 'Lazada') || null,
  }
}

function affiliateLinks(
  mode: ListingMode,
  body: Record<string, unknown>,
  fallback?: { shopeeAffiliateUrl: string | null; lazadaAffiliateUrl: string | null },
) {
  if (mode === ListingMode.NATIVE) return { listingMode: ListingMode.NATIVE, affiliateUrl: [] as string[] }

  const shopeeValue = productField(
    Object.hasOwn(body, 'shopeeAffiliateUrl')
      ? body.shopeeAffiliateUrl
      : fallback?.shopeeAffiliateUrl,
  )
  const lazadaValue = productField(
    Object.hasOwn(body, 'lazadaAffiliateUrl')
      ? body.lazadaAffiliateUrl
      : fallback?.lazadaAffiliateUrl,
  )
  const shopeeAffiliateUrl = shopeeValue ? normalizeShopeeUrl(shopeeValue).toString() : null
  const lazadaAffiliateUrl = lazadaValue ? normalizeLazadaUrl(lazadaValue).toString() : null
  if (!shopeeAffiliateUrl && !lazadaAffiliateUrl)
    throw new Error('Add at least one Shopee or Lazada affiliate link.')

  return {
    listingMode: ListingMode.AFFILIATE,
    affiliateUrl: [shopeeAffiliateUrl, lazadaAffiliateUrl].filter((url): url is string =>
      Boolean(url),
    ),
  }
}

function productImages(body: Record<string, unknown>) {
  return [body.imageUrl1, body.imageUrl2, body.imageUrl3, body.imageUrl4]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .slice(0, 4)
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_PRODUCT_NAME_LENGTH = 500
const MAX_PRODUCT_SLUG_BASE_LENGTH = 170

type ImagePayload = { mimeType: string; dataUri: string }

function validatedImagePayload(value: unknown, tooLargeMessage: string): ImagePayload {
  const mimeType =
    typeof value === 'object' && value !== null && 'type' in value ? String(value.type) : ''
  const base64 =
    typeof value === 'object' && value !== null && 'data' in value ? String(value.data) : ''
  if (!IMAGE_TYPES.has(mimeType)) throw new Error('Use a JPEG, PNG, WebP, or GIF image.')
  const byteLength = Buffer.byteLength(base64, 'base64')
  if (!byteLength || byteLength > MAX_IMAGE_BYTES) throw new Error(tooLargeMessage)
  return { mimeType, dataUri: `data:${mimeType};base64,${base64}` }
}

function uploadedProductImagePayloads(value: unknown): ImagePayload[] {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > 4) throw new Error('Select up to 4 product images.')
  return value.map((image) =>
    validatedImagePayload(image, 'Each product image must be 5 MB or smaller.'),
  )
}

function uploadedShopLogoPayload(value: unknown): ImagePayload | null {
  if (value === undefined || value === null) return null
  return validatedImagePayload(value, 'Your shop logo must be 5 MB or smaller.')
}

async function uploadImages(payloads: ImagePayload[], folder: string): Promise<string[]> {
  const uploads = await Promise.all(payloads.map((payload) => uploadImage(payload.dataUri, folder)))
  return uploads.map((upload) => upload.url)
}

// Best-effort cleanup of our own Cloudinary-hosted images that are no longer
// referenced (external affiliate URLs are silently skipped by publicIdFromUrl).
async function deleteRemovedImages(urls: string[]) {
  for (const url of urls) {
    const publicId = publicIdFromUrl(url)
    if (publicId) await deleteImage(publicId)
  }
}

function productField(value: unknown) {
  return String(value || '').trim()
}

function productName(value: unknown) {
  const name = productField(value)
  if (!name) throw new Error('Product name is required.')
  if (name.length > MAX_PRODUCT_NAME_LENGTH)
    throw new Error(`Product name must be ${MAX_PRODUCT_NAME_LENGTH} characters or fewer.`)
  return name
}

function productSlug(name: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, MAX_PRODUCT_SLUG_BASE_LENGTH)
      .replace(/-+$/g, '') || 'product'
  return `${base}-${Date.now()}`
}

export async function GET(request: Request) {
  const auth = await apiSession('VENDOR')
  if (auth.error) return auth.error
  const shop = await prisma.shop.findUnique({
    where: { ownerId: auth.session!.userId },
    include: {
      products: {
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { views: true } } },
      },
      coupons: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!shop) return fail('Shop not found.', 404)
  const [items, productTypes, brands, categories, sports] = await Promise.all([
    prisma.orderItem.findMany({
      where: { product: { shopId: shop.id } },
      include: {
        product: true,
        order: { include: { customer: { select: { name: true, email: true } } } },
      },
      orderBy: { order: { createdAt: 'desc' } },
    }),
    prisma.productType.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.brand.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.sport.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])
  const now = new Date(),
    todayStart = new Date(now),
    monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  todayStart.setHours(0, 0, 0, 0)
  const requestedDate = new URL(request.url).searchParams.get('date')
  const analyticsDay =
    requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
      ? new Date(`${requestedDate}T00:00:00`)
      : new Date(todayStart)
  const selectedDayStart = Number.isNaN(analyticsDay.getTime())
    ? new Date(todayStart)
    : analyticsDay
  const selectedDayEnd = new Date(selectedDayStart)
  selectedDayEnd.setDate(selectedDayStart.getDate() + 1)
  const paidItems = items.filter((item) => item.order.paymentStatus === 'PAID')
  const revenueFor = (source: typeof items) =>
    source.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0)
  const countOrders = (status: string) =>
    new Set(items.filter((item) => item.status === status).map((item) => item.orderId)).size
  const firstOrderByCustomer = new Map<number, Date>()
  for (const item of items) {
    const current = firstOrderByCustomer.get(item.order.customerId)
    if (!current || item.order.createdAt < current)
      firstOrderByCustomer.set(item.order.customerId, item.order.createdAt)
  }
  const stats = {
    totalRevenue: revenueFor(paidItems),
    todayRevenue: revenueFor(paidItems.filter((item) => item.order.createdAt >= todayStart)),
    monthRevenue: revenueFor(paidItems.filter((item) => item.order.createdAt >= monthStart)),
    totalOrders: new Set(items.map((item) => item.orderId)).size,
    pendingOrders: countOrders('PENDING'),
    processingOrders: countOrders('PROCESSING'),
    readyToShipOrders: countOrders('ACCEPTED'),
    shippedOrders: countOrders('SHIPPED'),
    completedOrders: countOrders('DELIVERED'),
    cancelledOrders: countOrders('CANCELLED'),
    refundedOrders: new Set(
      items.filter((item) => item.order.paymentStatus === 'REFUNDED').map((item) => item.orderId),
    ).size,
    totalProducts: shop.products.length,
    activeProducts: shop.products.filter((product) => product.active).length,
    draftProducts: shop.products.filter((product) => !product.active).length,
    totalCustomers: firstOrderByCustomer.size,
    newCustomersToday: [...firstOrderByCustomer.values()].filter((date) => date >= todayStart)
      .length,
    totalCoupons: shop.coupons.length,
    activePromotions: shop.coupons.filter((coupon) => coupon.active).length,
  }
  const viewEvents = await prisma.productView.findMany({
    where: {
      product: { shopId: shop.id },
      viewedAt: {
        gte: new Date(
          selectedDayStart.getFullYear(),
          selectedDayStart.getMonth(),
          selectedDayStart.getDate() - 6,
        ),
        lt: selectedDayEnd,
      },
    },
    select: { productId: true, viewedAt: true },
  })
  const dailyViews = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(selectedDayStart)
    date.setDate(selectedDayStart.getDate() - (6 - offset))
    const next = new Date(date)
    next.setDate(date.getDate() + 1)
    return {
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      views: viewEvents.filter((view) => view.viewedAt >= date && view.viewedAt < next).length,
    }
  })
  const selectedDayViewCounts = new Map<number, number>()
  for (const view of viewEvents) {
    if (view.viewedAt >= selectedDayStart && view.viewedAt < selectedDayEnd)
      selectedDayViewCounts.set(
        view.productId,
        (selectedDayViewCounts.get(view.productId) || 0) + 1,
      )
  }
  const topProducts = shop.products
    .flatMap((product) => {
      const views = selectedDayViewCounts.get(product.id) || 0
      const imageUrls = Array.isArray(product.imageUrls) ? (product.imageUrls as string[]) : []
      return views
        ? [
            {
              id: product.id,
              name: product.name,
              imageUrl: imageUrls[0] || null,
              views,
            },
          ]
        : []
    })
    .sort((a, b) => b.views - a.views || a.name.localeCompare(b.name))
    .slice(0, 5)
  const orderDistribution = [
    { label: 'Pending', value: stats.pendingOrders },
    { label: 'Processing', value: stats.processingOrders },
    { label: 'Ready to ship', value: stats.readyToShipOrders },
    { label: 'Shipped', value: stats.shippedOrders },
    { label: 'Completed', value: stats.completedOrders },
    { label: 'Cancelled', value: stats.cancelledOrders },
  ]
  return NextResponse.json({
    shop,
    items,
    stats,
    analytics: { dailyViews, topProducts, orderDistribution },
    catalogOptions: {
      productTypes: productTypes.map((productType) => ({
        nameEn: productType.nameEn,
        nameTh: productType.nameTh,
      })),
      brands: brands.map((brand) => ({ nameEn: brand.nameEn, nameTh: brand.nameTh })),
      categories: categories.map((category) => ({
        nameEn: category.nameEn,
        nameTh: category.nameTh,
      })),
      sports: sports.map((sport) => ({ nameEn: sport.nameEn, nameTh: sport.nameTh })),
    },
  })
}

export async function POST(request: Request) {
  const auth = await apiSession('VENDOR')
  if (auth.error) return auth.error
  const body = await request.json()
  const shop = await prisma.shop.findUnique({ where: { ownerId: auth.session!.userId } })
  if (!shop) return fail('Shop not found.', 404)
  if (body.action === 'product') {
    const listingMode = requestedListingMode(body.listingMode)
    let name: string
    try {
      name = productName(body.name)
    } catch (error) {
      return fail(error instanceof Error ? error.message : 'Invalid product name.')
    }
    const sku = productField(body.sku).toUpperCase()
    const productType = productField(body.productType)
    const sport = productField(body.sport)
    const gender = productField(body.gender)
    const brand = productField(body.brand)
    if (!sku || !productType || !sport || !gender || !brand)
      return fail('SKU, product type, sport, gender, and brand are required.')
    if (await prisma.product.findUnique({ where: { sku } })) return fail('This SKU already exists.')
    const externalImages = productImages(body)
    let uploadedPayloads: ImagePayload[]
    try {
      uploadedPayloads = uploadedProductImagePayloads(body.uploadedImages)
    } catch (error) {
      return fail(error instanceof Error ? error.message : 'Invalid product images.')
    }
    if (externalImages.length + uploadedPayloads.length > 4)
      return fail('A product can have at most 4 images.')
    if (externalImages.length + uploadedPayloads.length === 0)
      return fail('Add at least one product image.')
    let links: ReturnType<typeof affiliateLinks>
    try {
      links = affiliateLinks(listingMode, body)
    } catch (error) {
      return fail(error instanceof Error ? error.message : 'Invalid affiliate URL.')
    }
    let uploadedUrls: string[]
    try {
      uploadedUrls = await uploadImages(uploadedPayloads, `matchday/products/${shop.id}`)
    } catch (error) {
      console.error('Cloudinary upload failed', error)
      return fail('Could not upload product images. Please try again.', 502)
    }
    const slug = productSlug(name)
    const product = await prisma.product.create({
      data: {
        shopId: shop.id,
        name,
        sku,
        slug,
        category: body.category,
        productType,
        sport,
        gender,
        brand,
        description: body.description,
        imageUrls: [...externalImages, ...uploadedUrls],
        priceCents: Math.round(Number(body.price) * 100),
        ...links,
        active: true,
      },
    })
    return NextResponse.json(product)
  }
  if (body.action === 'updateProduct') {
    const product = await prisma.product.findFirst({ where: { id: body.id, shopId: shop.id } })
    if (!product) return fail('Product not found.', 404)
    const listingMode = requestedListingMode(body.listingMode, product.listingMode)
    let name: string
    try {
      name = productName(body.name)
    } catch (error) {
      return fail(error instanceof Error ? error.message : 'Invalid product name.')
    }
    const sku = productField(body.sku).toUpperCase()
    const productType = productField(body.productType)
    const sport = productField(body.sport)
    const gender = productField(body.gender)
    const brand = productField(body.brand)
    if (!sku || !productType || !sport || !gender || !brand)
      return fail('SKU, product type, sport, gender, and brand are required.')
    const skuOwner = await prisma.product.findFirst({ where: { sku, NOT: { id: product.id } } })
    if (skuOwner) return fail('This SKU already exists.')
    const externalImages = productImages(body)
    let uploadedPayloads: ImagePayload[]
    try {
      uploadedPayloads = uploadedProductImagePayloads(body.uploadedImages)
    } catch (error) {
      return fail(error instanceof Error ? error.message : 'Invalid product images.')
    }
    const existingImages: string[] = Array.isArray(product.imageUrls)
      ? (product.imageUrls as unknown[])
          .filter((image): image is string => typeof image === 'string')
          .slice(0, 4)
      : []
    const requestedRetainedImages: string[] = Array.isArray(body.retainedImages)
      ? (body.retainedImages as unknown[]).filter(
          (image: unknown): image is string => typeof image === 'string',
        )
      : existingImages
    if (requestedRetainedImages.some((image) => !existingImages.includes(image)))
      return fail('One or more retained product images are invalid.')
    const baseImages = externalImages.length ? externalImages : requestedRetainedImages
    if (baseImages.length + uploadedPayloads.length > 4)
      return fail('A product can have at most 4 images.')
    if (baseImages.length + uploadedPayloads.length === 0)
      return fail('Keep or add at least one product image.')
    let links: ReturnType<typeof affiliateLinks>
    try {
      links = affiliateLinks(listingMode, body, existingAffiliateUrls(product.affiliateUrl))
    } catch (error) {
      return fail(error instanceof Error ? error.message : 'Invalid affiliate URL.')
    }
    let uploadedUrls: string[]
    try {
      uploadedUrls = await uploadImages(uploadedPayloads, `matchday/products/${shop.id}`)
    } catch (error) {
      console.error('Cloudinary upload failed', error)
      return fail('Could not upload product images. Please try again.', 502)
    }
    const imageUrls = [...baseImages, ...uploadedUrls]
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        name,
        sku,
        category: body.category,
        productType,
        sport,
        gender,
        brand,
        description: body.description,
        imageUrls,
        priceCents: Math.round(Number(body.price) * 100),
        ...links,
        active: body.active ?? product.active,
      },
    })
    await deleteRemovedImages(existingImages.filter((url) => !imageUrls.includes(url)))
    return NextResponse.json(updated)
  }
  if (body.action === 'deleteProduct') {
    const product = await prisma.product.findFirst({ where: { id: body.id, shopId: shop.id } })
    if (!product) return fail('Product not found.', 404)
    const orderCount = await prisma.orderItem.count({ where: { productId: product.id } })
    if (orderCount > 0) {
      await prisma.product.update({ where: { id: product.id }, data: { active: false } })
      return NextResponse.json({
        ok: true,
        archived: true,
        message: 'Product archived because it belongs to an existing order.',
      })
    }
    await prisma.product.delete({ where: { id: product.id } })
    const imageUrls = Array.isArray(product.imageUrls)
      ? (product.imageUrls as unknown[]).filter((image): image is string => typeof image === 'string')
      : []
    await deleteRemovedImages(imageUrls)
    return NextResponse.json({ ok: true, archived: false, message: 'Product deleted permanently.' })
  }
  if (body.action === 'orderStatus') {
    const item = await prisma.orderItem.findFirst({
      where: { id: body.itemId, product: { shopId: shop.id } },
    })
    if (!item) return fail('Order item not found.', 404)
    if (!Object.values(OrderStatus).includes(body.status)) return fail('Invalid order status.')
    const result = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.orderItem.update({
        where: { id: item.id },
        data: { status: body.status },
      })
      const orderItems = await tx.orderItem.findMany({
        where: { orderId: item.orderId },
        select: { status: true },
      })
      const activeStatuses = orderItems
        .map((orderItem) => orderItem.status)
        .filter((status) => status !== OrderStatus.CANCELLED)
      const progress = [
        OrderStatus.PENDING,
        OrderStatus.ACCEPTED,
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
      ]
      const orderStatus = activeStatuses.length
        ? progress[Math.min(...activeStatuses.map((status) => progress.indexOf(status)))]
        : OrderStatus.CANCELLED
      await tx.order.update({ where: { id: item.orderId }, data: { status: orderStatus } })
      return {
        updatedItem,
        orderStatus,
        message: `Order status updated to ${orderStatus.toLowerCase()}.`,
      }
    })
    return NextResponse.json(result)
  }
  if (body.action === 'coupon')
    return NextResponse.json(
      await prisma.coupon.create({
        data: {
          shopId: shop.id,
          code: String(body.code).toUpperCase(),
          type: body.type,
          value: Number(body.value),
          minimumCents: Math.round(Number(body.minimum || 0) * 100),
        },
      }),
    )
  if (body.action === 'shop') {
    let logoPayload: ImagePayload | null
    try {
      logoPayload = uploadedShopLogoPayload(body.logoImage)
    } catch (error) {
      return fail(error instanceof Error ? error.message : 'Invalid shop logo.')
    }
    let logoUrl: string | undefined
    if (logoPayload) {
      try {
        ;[logoUrl] = await uploadImages([logoPayload], `matchday/shops/${shop.id}`)
      } catch (error) {
        console.error('Cloudinary upload failed', error)
        return fail('Could not upload shop logo. Please try again.', 502)
      }
    }
    const updatedShop = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        name: body.name,
        description: body.description,
        ...(logoUrl ? { logoUrl } : {}),
        address: body.address || null,
      },
    })
    if (logoUrl && shop.logoUrl) await deleteRemovedImages([shop.logoUrl])
    return NextResponse.json(updatedShop)
  }
  return fail('Unknown action.')
}
