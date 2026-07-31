import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import buyerEn from '@/features/buyer/locales/en.json'
import buyerTh from '@/features/buyer/locales/th.json'
import vendorEn from '@/features/vendor/locales/en.json'
import vendorTh from '@/features/vendor/locales/th.json'

export const STORAGE_KEY = 'northstar-lang'
export type AppLanguage = 'en' | 'th'
export const DEFAULT_LANGUAGE: AppLanguage = 'th'

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'buyer',
    ns: ['buyer', 'vendor'],
    resources: {
      en: { buyer: buyerEn, vendor: vendorEn },
      th: { buyer: buyerTh, vendor: vendorTh },
    },
    // Locale JSON files use single-brace {var} placeholders (carried over from
    // the original hand-rolled t()), not i18next's {{var}} default.
    interpolation: { escapeValue: false, prefix: '{', suffix: '}' },
    react: { useSuspense: false },
  })
}

export function readStoredLanguage(): AppLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'en' || stored === 'th' ? stored : DEFAULT_LANGUAGE
}

export function storeLanguage(lang: AppLanguage) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, lang)
}

export default i18next
