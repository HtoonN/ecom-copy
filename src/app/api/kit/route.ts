import { NextResponse } from 'next/server'
import { MIN_ITEMS, candidatesFor, composeKit, kitSlug, kitTitle } from '@/lib/kit-compose'
import { prisma } from '@/lib/prisma'

// What a customer is allowed to ask for. Below the floor no kit is possible on
// this catalogue; the ceiling stops a stray keystroke composing against every
// product we stock.
const MIN_BUDGET = 500
const MAX_BUDGET = 100000

const bundleInclude = {
  items: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          imageUrls: true,
          affiliateUrl: true,
          shop: { select: { name: true } },
        },
      },
    },
  },
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const payload = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const sportName = typeof payload.sport === 'string' ? payload.sport : ''
  const budget = Math.round(Number(payload.budget))

  if (!Number.isSafeInteger(budget) || budget < MIN_BUDGET || budget > MAX_BUDGET)
    return NextResponse.json({ error: 'Budget out of range.' }, { status: 400 })

  const sport = await prisma.sport.findFirst({
    where: { OR: [{ nameEn: sportName }, { nameTh: sportName }] },
  })
  if (!sport) return NextResponse.json({ error: 'Unknown sport.' }, { status: 400 })

  const budgetCents = budget * 100
  const slug = kitSlug(sport.nameEn, budget)

  // A kit already composed for this exact cell is the answer. The batch script
  // writes the same slugs, so the presets are warm and only an unusual budget
  // costs a composition.
  const cached = await prisma.bundle.findFirst({
    where: { slug, active: true },
    include: bundleInclude,
  })
  if (cached) return NextResponse.json({ kit: toView(cached), source: 'cache' })

  const candidates = await candidatesFor(sport.nameEn)
  if (candidates.length < MIN_ITEMS)
    return NextResponse.json({ error: 'Not enough products for this sport.' }, { status: 404 })

  const result = await composeKit(sport.nameEn, budget, candidates)
  if (!result) return NextResponse.json({ error: 'No kit fits that budget.' }, { status: 404 })

  const { kit, source } = result
  const created = await prisma.$transaction(async (tx) => {
    // Replace rather than edit: a shorter new kit would otherwise keep items
    // from the older one. Two customers asking at once resolve to the same row.
    await tx.bundle.deleteMany({ where: { slug } })
    return tx.bundle.create({
      data: {
        slug,
        title: kitTitle(sport.nameTh, budget),
        sport: sport.nameEn,
        budgetCents,
        totalCents: kit.totalCents,
        source,
        items: {
          create: kit.items.map((item, index) => ({
            productId: item.candidate.id,
            role: item.role.slice(0, 64),
            sortOrder: index,
            unitPriceCents: item.candidate.priceCents,
          })),
        },
      },
      include: bundleInclude,
    })
  })

  return NextResponse.json({ kit: toView(created), source })
}

type BundleRow = Awaited<ReturnType<typeof prisma.bundle.findFirstOrThrow>> & {
  items: {
    id: number
    role: string
    unitPriceCents: number
    product: {
      id: number
      name: string
      imageUrls: unknown
      affiliateUrl: unknown
      shop: { name: string }
    }
  }[]
}

function toView(bundle: BundleRow) {
  return {
    id: bundle.id,
    slug: bundle.slug,
    title: bundle.title,
    totalCents: bundle.totalCents,
    budgetCents: bundle.budgetCents,
    items: bundle.items.map((item) => ({
      id: item.id,
      role: item.role,
      unitPriceCents: item.unitPriceCents,
      product: {
        ...item.product,
        imageUrls: item.product.imageUrls as string[],
        affiliateUrl: item.product.affiliateUrl as string[],
      },
    })),
  }
}
