'use client'

import { t, useLanguageSync } from '@/features/buyer/locales'

export default function HomeNavLink() {
  useLanguageSync()
  return (
    <a href="/">{t('homeNavLink')}</a>
  )
}
