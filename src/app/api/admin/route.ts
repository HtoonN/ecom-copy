import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSession, fail } from '@/lib/api'

export async function GET() {
  const auth = await apiSession('ADMIN')
  if (auth.error) return auth.error
  const [users, products, orders, refunds] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.findMany({
      include: { shop: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      include: { customer: { select: { name: true } }, items: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.refund.findMany({
      include: { user: { select: { name: true } }, order: { select: { reference: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ])
  return NextResponse.json({
    users,
    products,
    orders,
    refunds,
    stats: {
      users: users.length,
      vendors: users.filter((u) => u.role === 'VENDOR').length,
      orders: orders.length,
      revenue: orders
        .filter((o) => o.paymentStatus === 'PAID')
        .reduce((sum, o) => sum + o.totalCents, 0),
    },
  })
}

export async function POST(request: Request) {
  const auth = await apiSession('ADMIN')
  if (auth.error) return auth.error
  const body = await request.json()
  if (body.action === 'userStatus')
    return NextResponse.json(
      await prisma.user.update({ where: { id: body.id }, data: { active: body.active } }),
    )
  if (body.action === 'productStatus')
    return NextResponse.json(
      await prisma.product.update({ where: { id: body.id }, data: { active: body.active } }),
    )
  if (body.action === 'orderStatus')
    return NextResponse.json(
      await prisma.order.update({ where: { id: body.id }, data: { status: body.status } }),
    )
  if (body.action === 'refundStatus') {
    const refund = await prisma.refund.update({
      where: { id: body.id },
      data: { status: body.status, response: body.response || null },
      include: { order: true },
    })
    if (body.status === 'APPROVED') {
      await prisma.order.update({
        where: { id: refund.orderId },
        data: { paymentStatus: 'REFUNDED' },
      })
      await prisma.payment.updateMany({
        where: { orderId: refund.orderId },
        data: { status: 'REFUNDED' },
      })
    }
    return NextResponse.json(refund)
  }
  return fail('Unknown action.')
}
