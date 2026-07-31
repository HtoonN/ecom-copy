'use client'

import { t, useLanguageSync } from '@/features/buyer/locales'

export default function HomeNavLink() {
  useLanguageSync()
  return (
    <a href="/" target="_blank" rel="noopener noreferrer">
      {t('homeNavLink')}
    </a>
  )
}
