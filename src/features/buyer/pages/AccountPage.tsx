import { requireRole } from '@/lib/auth'
import BuyerDashboard from '../components/BuyerDashboard'
import { resolveTab } from '@/lib/dashboard-tabs'
import { BUYER_TABS } from '../constants/options'

const tabs = BUYER_TABS.map((tab) => tab.value)
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>
}) {
  const [s, query] = await Promise.all([requireRole('CUSTOMER'), searchParams])
  const initialTab = resolveTab(query.tab, tabs, 'Overview')
  return <BuyerDashboard key={initialTab} name={s.name} userId={s.userId} initialTab={initialTab} />
}
