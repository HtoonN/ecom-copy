import { requireRole } from '@/lib/auth'
import AdminDashboard from '@/components/AdminDashboard'
import { resolveTab } from '@/lib/dashboard-tabs'
const tabs = ['Overview', 'Users', 'Products', 'Orders', 'Refunds'] as const
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>
}) {
  const [s, query] = await Promise.all([requireRole('ADMIN'), searchParams])
  const initialTab = resolveTab(query.tab, tabs, 'Overview')
  return <AdminDashboard key={initialTab} name={s.name} initialTab={initialTab} />
}
