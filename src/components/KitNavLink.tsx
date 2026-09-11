'use client'

import Link from 'next/link'
import { t, useLanguageSync } from '@/features/buyer/locales'

// A client component purely so the label can be translated: Header is a server
// component and cannot import the locales module, which pulls in react-i18next.
export default function KitNavLink() {
  useLanguageSync()
  return (
    <Link className="button soft" href="/kit">
      {t('kitNavLink')}
    </Link>
  )
}
