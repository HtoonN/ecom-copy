import { redirect } from 'next/navigation'
import { readSession } from '@/lib/auth'
import LoginForm from '@/components/LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const [session, query] = await Promise.all([readSession(), searchParams])
  const requested = Array.isArray(query.next) ? query.next[0] : query.next
  const next = requested?.startsWith('/') && !requested.startsWith('//') ? requested : undefined
  if (session) redirect(session.role === 'CUSTOMER' && next ? next : '/dashboard')
  return (
    <main className="auth-wrap">
      <section className="auth-art">
        <span className="brand">
          <span className="brand-mark">✦</span>Matchday Marketplace
        </span>
        <h1>
          One market.
          <br />
          Three ways to
          <br />
          <i>make it yours.</i>
        </h1>
        <p style={{ position: 'relative', zIndex: 1 }}>
          Shop exceptional goods, grow your independent store, or keep the marketplace thriving.
        </p>
      </section>
      <section className="auth-panel">
        <LoginForm next={next} />
      </section>
    </main>
  )
}
