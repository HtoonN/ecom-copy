import { redirect } from 'next/navigation'
import { readSession } from '@/lib/auth'
export default async function Dashboard() {
  const s = await readSession()
  if (!s) redirect('/login')
  redirect(s.role === 'ADMIN' ? '/admin' : s.role === 'VENDOR' ? '/vendor' : '/')
}
