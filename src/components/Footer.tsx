'use client'

import Link from 'next/link'
import { t, useLanguageSync } from '@/features/buyer/locales'

export default function Footer() {
  useLanguageSync()
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div className="site-footer-brand">
          <Link href="/" className="site-footer-logo-link">
            <img className="site-footer-logo" src="/logo_red.png" alt="Matchday" />
          </Link>
          <p>{t('footerTagline')}</p>
          <a
            className="site-footer-social"
            href="https://www.facebook.com/matchday.co.th"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Matchday on Facebook"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M13.5 21v-7.6h2.6l.4-3h-3v-1.9c0-.9.2-1.5 1.5-1.5h1.6V4.3C16.3 4.2 15.3 4 14.2 4c-2.4 0-4 1.5-4 4.1v2.3H7.6v3h2.6V21z"
              />
            </svg>
          </a>
        </div>
        <nav className="site-footer-col" aria-label={t('footerForYou')}>
          <h3>{t('footerForYou')}</h3>
          <a href="https://matchday.co.th/faqs" target="_blank" rel="noopener noreferrer">
            {t('footerFaq')}
          </a>
        </nav>
        <nav className="site-footer-col" aria-label={t('footerOurProducts')}>
          <h3>{t('footerOurProducts')}</h3>
          <a href="https://matchday.co.th/" target="_blank" rel="noopener noreferrer">
            {t('footerMatchdayApp')}
          </a>
          <a href="https://matchday.co.th/arenapos" target="_blank" rel="noopener noreferrer">
            {t('footerArenaPos')}
          </a>
        </nav>
        <nav className="site-footer-col" aria-label={t('footerAboutUs')}>
          <h3>{t('footerAboutUs')}</h3>
          <a href="https://matchday.co.th/aboutus" target="_blank" rel="noopener noreferrer">
            {t('footerAboutUs')}
          </a>
          <a href="https://matchday.co.th/ourservices" target="_blank" rel="noopener noreferrer">
            {t('footerOtherServices')}
          </a>
        </nav>
        <nav className="site-footer-col" aria-label={t('footerContactUs')}>
          <h3>{t('footerContactUs')}</h3>
          <a href="https://matchday.co.th/contact" target="_blank" rel="noopener noreferrer">
            {t('footerContactUs')}
          </a>
          <a href="https://blog.matchday.co.th/" target="_blank" rel="noopener noreferrer">
            {t('footerLearnMore')}
          </a>
        </nav>
      </div>
      <div className="site-footer-bottom">
        <div className="container site-footer-bottom-inner">
          <span>{t('footerRights', { year })}</span>
          <Link href="/#shop">{t('footerTerms')}</Link>
        </div>
      </div>
    </footer>
  )
}
