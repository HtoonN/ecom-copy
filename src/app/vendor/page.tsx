import { requireRole } from '@/lib/auth'
import VendorDashboard from '@/components/VendorDashboard'
import { resolveTab } from '@/lib/dashboard-tabs'
const tabs = ['Dashboard', 'Products', 'Shop profile'] as const
export default async function VendorPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>
}) {
  const [s, query] = await Promise.all([requireRole('VENDOR'), searchParams])
  const initialTab = resolveTab(query.tab, tabs, 'Dashboard')
  return <VendorDashboard key={initialTab} name={s.name} initialTab={initialTab} />
}
