'use client'

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { t, useLanguageSync } from '@/features/buyer/locales'

export default function HeaderSearch({ initialQuery = '' }: { initialQuery?: string }) {
  useLanguageSync()
  const [value, setValue] = useState(initialQuery)
  const router = useRouter()

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('northstar-search', { detail: value }))
  }, [value])

  return (
    <form
      className="header-search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        const trimmed = value.trim()
        router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}#shop` : '/#shop')
      }}
    >
      <MagnifyingGlassIcon aria-hidden="true" />
      <label className="header-search-label" htmlFor="header-search-input">
        {t('searchProducts')}
      </label>
      <input
        id="header-search-input"
        type="search"
        placeholder={t('headerSearchPlaceholder')}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      {/* The box now takes sentences, and nothing else on the page says so. */}
      <SparklesIcon className="header-search-ai" aria-hidden="true" />
    </form>
  )
}
