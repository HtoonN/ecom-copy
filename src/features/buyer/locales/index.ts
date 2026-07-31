import { useTranslation } from 'react-i18next'
import i18next from '@/i18n'
import en from './en.json'

export type BuyerTextKey = keyof typeof en

// Plain function (not a hook) so it can be called from module-level helper
// functions, not just component bodies. Components that display translated
// text must also call useLanguageSync() so they re-render when the language
// changes — otherwise this always returns the latest language anyway, but
// the already-rendered output won't update on screen.
export function t(key: BuyerTextKey, values: Record<string, string | number> = {}): string {
  return i18next.t(key, { ns: 'buyer', ...values })
}

export function useLanguageSync(): string {
  const { i18n } = useTranslation('buyer')
  return i18n.language
}
