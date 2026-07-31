import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSession, fail } from '@/lib/api'

export async function GET() {
  const auth = await apiSession('CUSTOMER')
  if (auth.error) return auth.error
  const user = await prisma.user.findUnique({
    where: { id: auth.session!.userId },
    include: {
      addresses: true,
      orders: {
        include: {
          items: {
            include: {
              product: {
                include: {
                  shop: { select: { name: true, slug: true, logoUrl: true } },
                },
              },
            },
          },
          refunds: {
            select: { id: true, status: true, createdAt: true, updatedAt: true },
            orderBy: { createdAt: 'desc' },
          },
          payments: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  return NextResponse.json(user)
}

export async function POST(request: Request) {
  const auth = await apiSession('CUSTOMER')
  if (auth.error) return auth.error
  const body = await request.json()
  if (body.action === 'address') {
    if (body.isDefault)
      await prisma.address.updateMany({
        where: { userId: auth.session!.userId },
        data: { isDefault: false },
      })
    return NextResponse.json(
      await prisma.address.create({
        data: {
          userId: auth.session!.userId,
          label: body.label,
          recipient: body.recipient,
          phone: body.phone,
          line1: body.line1,
          city: body.city,
          postalCode: body.postalCode,
          isDefault: !!body.isDefault,
        },
      }),
    )
  }
  if (body.action === 'checkout') {
    const items: { productId: number; quantity: number }[] = body.items || []
    const products = await prisma.product.findMany({
      where: {
        id: { in: items.map((i) => i.productId) },
        active: true,
        listingMode: 'NATIVE',
      },
    })
    if (!products.length) return fail('Your cart is empty.')
    const subtotal = products.reduce(
      (sum, p) =>
        sum + p.priceCents * Math.max(1, items.find((i) => i.productId === p.id)?.quantity || 1),
      0,
    )
    let discount = 0
    if (body.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: String(body.couponCode).toUpperCase() },
      })
      if (coupon?.active && subtotal >= coupon.minimumCents)
        discount =
          coupon.type === 'PERCENT' ? Math.round((subtotal * coupon.value) / 100) : coupon.value
    }
    const shipping = subtotal >= 10000 ? 0 : 900
    const paymentMethod = ['CARD', 'BANK', 'COD'].includes(body.paymentMethod)
      ? body.paymentMethod
      : 'CARD'
    const paidNow = paymentMethod !== 'COD'
    const paymentProvider =
      paymentMethod === 'BANK'
        ? 'Demo Bank Transfer'
        : paymentMethod === 'COD'
          ? 'Cash on Delivery'
          : 'Demo Card'
    const order = await prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          reference: `NS-${Date.now()}`,
          customerId: auth.session!.userId,
          paymentStatus: paidNow ? 'PAID' : 'PENDING',
          subtotalCents: subtotal,
          discountCents: discount,
          shippingCents: shipping,
          totalCents: subtotal - discount + shipping,
          shippingAddress: body.shippingAddress || 'Default address',
          couponCode: body.couponCode || null,
          items: {
            create: products.map((product) => ({
              productId: product.id,
              quantity: Math.max(1, items.find((i) => i.productId === product.id)?.quantity || 1),
              unitPriceCents: product.priceCents,
            })),
          },
          payments: paidNow
            ? {
                create: {
                  reference: `PAY-${Date.now()}`,
                  provider: paymentProvider,
                  amountCents: subtotal - discount + shipping,
                  status: 'PAID',
                },
              }
            : undefined,
        },
        include: { items: true, payments: true },
      })
    })
    return NextResponse.json(order)
  }
  if (body.action === 'pay') {
    const order = await prisma.order.findFirst({
      where: { id: body.orderId, customerId: auth.session!.userId },
      include: { payments: true },
    })
    if (!order) return fail('Order not found.', 404)
    if (order.status === 'CANCELLED') return fail('Cancelled orders cannot be paid.')
    const paidAmount = order.payments
      .filter((payment) => payment.status === 'PAID')
      .reduce((sum, payment) => sum + payment.amountCents, 0)
    const outstandingAmount = Math.max(0, order.totalCents - paidAmount)
    if (!outstandingAmount) return fail('This order is already paid.', 409)
    const paymentMethod = body.paymentMethod === 'BANK' ? 'BANK' : 'CARD'
    const provider = paymentMethod === 'BANK' ? 'Demo Bank Transfer' : 'Demo Card'
    const [, updatedOrder] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          orderId: order.id,
          reference: `PAY-${Date.now()}`,
          provider,
          amountCents: outstandingAmount,
          status: 'PAID',
        },
      }),
      prisma.order.update({ where: { id: order.id }, data: { paymentStatus: 'PAID' } }),
    ])
    return NextResponse.json(updatedOrder)
  }
  return fail('Unknown action.')
}
