'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { IconButton } from '@/UI'
import { t, useLanguageSync } from '../locales'
import '../buyer.css'

function getCartCount(storageKey: string) {
  if (typeof window === 'undefined') return 0
  try {
    const cart = JSON.parse(localStorage.getItem(storageKey) || '[]')
    return Array.isArray(cart) ? cart.length : 0
  } catch {
    return 0
  }
}

function subscribeToCart(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener('northstar-cart-updated', onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener('northstar-cart-updated', onStoreChange)
  }
}

export default function CartButton({ storageKey }: { storageKey: string }) {
  useLanguageSync()
  const router = useRouter()
  const getSnapshot = useCallback(() => getCartCount(storageKey), [storageKey])
  const count = useSyncExternalStore(subscribeToCart, getSnapshot, () => 0)

  useEffect(() => {
    if (storageKey === 'northstar_cart_guest') return
    try {
      const account = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const transferable = ['northstar_cart_guest', 'northstar_cart'].flatMap((key) => {
        const value = JSON.parse(localStorage.getItem(key) || '[]')
        return Array.isArray(value) ? value : []
      })
      if (transferable.length) {
        localStorage.setItem(
          storageKey,
          JSON.stringify([...(Array.isArray(account) ? account : []), ...transferable]),
        )
        localStorage.removeItem('northstar_cart_guest')
        localStorage.removeItem('northstar_cart')
        window.dispatchEvent(new Event('northstar-cart-updated'))
      }
    } catch {}
  }, [storageKey])

  const checkoutPath = '/account?tab=checkout'
  return (
    <span className="buyer-scope buyer-cart-wrap">
      <IconButton
        label={t('cartLabel', { count })}
        onClick={() =>
          count
            ? router.push(
                storageKey === 'northstar_cart_guest'
                  ? `/login?next=${encodeURIComponent(checkoutPath)}`
                  : checkoutPath,
              )
            : router.push('/#shop')
        }
      >
        <svg className="buyer-cart-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
          <path
            d="M3.5 4.5h2l1.8 9.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4l1.4-5.6H6.3M9.5 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </IconButton>
      {count > 0 && (
        <span className="buyer-cart-badge" aria-hidden="true">
          {count}
        </span>
      )}
    </span>
  )
}
