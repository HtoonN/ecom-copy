import Link from 'next/link'
import { readSession } from '@/lib/auth'
import HeaderSearch from './HeaderSearch'
import HomeNavLink from './HomeNavLink'
import LanguageSwitch from './LanguageSwitch'

export default async function Header({ initialQuery = '' }: { initialQuery?: string }) {
  const session = await readSession()
  const dashboard =
    session?.role === 'ADMIN' ? '/admin' : session?.role === 'VENDOR' ? '/vendor' : '/account'
  const accountLabel = !session
    ? ''
    : session.role === 'CUSTOMER'
      ? session.name.split(' ')[0]
      : `${session.name.split(' ')[0]} · ${session.role.toLowerCase()}`
  return (
    <>
      <div className="topbar">
        <nav className="container topbar-links" aria-label="Matchday sites">
          <HomeNavLink />
          <a href="https://matchday.co.th/" target="_blank" rel="noopener noreferrer">
            Matchday Website
          </a>
          <a href="https://matchday.co.th/books/all" target="_blank" rel="noopener noreferrer">
            Bookings
          </a>
          <a href="https://matchday.co.th/arenapos" target="_blank" rel="noopener noreferrer">
            Arena POS
          </a>
        </nav>
      </div>
      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/" className="brand">
            <img className="brand-mark" src="/favicon-32x32.png" alt="" />
            Matchday Shop
          </Link>
          <HeaderSearch initialQuery={initialQuery} />
          <div className="nav-links">
            <LanguageSwitch />
            {session && (
              <Link className="button soft" href={dashboard}>
                {accountLabel}
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}
