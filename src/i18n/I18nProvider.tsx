'use client'

import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18next, { readStoredLanguage } from './index'

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = readStoredLanguage()
    if (i18next.language !== stored) i18next.changeLanguage(stored)
  }, [])
  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
}
