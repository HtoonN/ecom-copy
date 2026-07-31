'use client'

import { t, useLanguageSync } from '../locales'

export default function HeroBanner() {
  useLanguageSync()
  return (
    <section className="market-banner">
      <div className="container market-banner-inner">
        <div className="market-banner-content">
          <span className="banner-label">{t('heroEyebrow')}</span>
          <h2>{t('heroTitle')}</h2>
          <p>{t('heroSubtitle')}</p>
          <a className="button banner-button" href="#shop">
            {t('heroCta')}
          </a>
        </div>
      </div>
    </section>
  )
}
