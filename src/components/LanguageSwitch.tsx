'use client'

import { useTranslation } from 'react-i18next'
import { storeLanguage, type AppLanguage } from '@/i18n'
import { t, useLanguageSync } from '@/features/buyer/locales'

export default function LanguageSwitch() {
  const lang = useLanguageSync()
  const { i18n } = useTranslation()

  function toggle() {
    const next: AppLanguage = lang === 'en' ? 'th' : 'en'
    i18n.changeLanguage(next)
    storeLanguage(next)
  }

  return (
    <button type="button" className="lang-switch" aria-label={t('languageSwitch')} onClick={toggle}>
      <span className="lang-switch-flag">
        <img src={lang === 'en' ? '/eng.svg' : '/thai.png'} alt="" />
      </span>
      {lang === 'en' ? 'EN' : 'ไทย'}
    </button>
  )
}
