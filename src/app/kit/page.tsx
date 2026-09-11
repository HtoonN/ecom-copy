import Header from '@/components/Header'
import KitWizard, { type WizardSport } from '@/features/buyer/components/KitWizard'
import { MIN_ITEMS } from '@/lib/kit-compose'
import { prisma } from '@/lib/prisma'

// The wizard composes against the live catalogue, so the page must never be
// prerendered at build time — the build would need a database, and the sport
// list would freeze as it was on build day.
export const dynamic = 'force-dynamic'

export default async function KitPage() {
  const [sports, counts] = await Promise.all([
    prisma.sport.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.product.groupBy({
      by: ['sport'],
      where: { active: true },
      _count: { _all: true },
    }),
  ])

  // Offering a sport we cannot build a kit for is offering a dead end. Only ask
  // about sports the catalogue can actually answer for.
  const stocked = new Map(counts.map((row) => [row.sport, row._count._all]))
  const options: WizardSport[] = sports
    .filter((sport) => (stocked.get(sport.nameEn) ?? 0) >= MIN_ITEMS)
    .map((sport) => ({ nameEn: sport.nameEn, nameTh: sport.nameTh }))

  return (
    <>
      <Header />
      <main>
        <section className="buyer-scope buyer-catalog">
          <div className="buyer-container">
            <KitWizard sports={options} />
          </div>
        </section>
      </main>
    </>
  )
}
