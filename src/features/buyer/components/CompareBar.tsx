'use client'

import { SparklesIcon } from '@heroicons/react/24/solid'
import { useCallback, useEffect, useState } from 'react'
import { Button, Dialog } from '@/UI'
import { detectAffiliateMarketplace } from '@/lib/affiliate-marketplace'
import { type Bilingual, type Comparison, MAX_COMPARE } from '@/lib/compare-types'
import { cleanProductName } from '@/lib/product-name'
import { t, useLanguageSync } from '../locales'
import { recordProductClickOut } from '../record-product-clickout'
import AiMark from './AiMark'
import '../buyer.css'

export type CompareCandidate = {
  id: number
  name: string
  imageUrls: string[]
  priceCents: number
  affiliateUrl: string[]
}

const money = (cents: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(cents / 100)

const firstDestination = (urls: string[]) =>
  urls
    .map((url) => ({ marketplace: detectAffiliateMarketplace(url), url }))
    .find((destination) => destination.marketplace !== null)

export default function CompareBar({
  selected,
  onRemove,
  onClear,
}: {
  selected: CompareCandidate[]
  onRemove: (productId: number) => void
  onClear: () => void
}) {
  const lang = useLanguageSync()
  const [open, setOpen] = useState(false)
  const [comparison, setComparison] = useState<Comparison | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  // The dialog reads whatever is selected right now, so removing a product from
  // inside it re-runs the comparison rather than leaving a stale column behind.
  const ids = selected.map((product) => product.id)
  const key = ids.join(':')

  const load = useCallback(async (productIds: number[]) => {
    setLoading(true)
    setFailed(false)
    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds }),
      })
      if (!response.ok) throw new Error('compare failed')
      const payload = (await response.json()) as { comparison: Comparison }
      setComparison(payload.comparison)
    } catch {
      setComparison(null)
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const productIds = key.split(':').map(Number).filter(Boolean)
    if (productIds.length < 2) {
      setComparison(null)
      return
    }
    load(productIds)
  }, [open, key, load])

  useEffect(() => {
    if (open && selected.length === 0) setOpen(false)
  }, [open, selected.length])

  if (!selected.length) return null

  const read = (value: Bilingual) => (lang === 'en' ? value.en : value.th)
  const verdictFor = (productId: number) =>
    comparison?.verdicts.find((verdict) => verdict.productId === productId)?.text

  return (
    <>
      {/* The bar is fixed, so the page has to give back the height it covers —
          otherwise the last row of results sits underneath it. */}
      <div className="buyer-compare-spacer" aria-hidden="true" />
      <div className="buyer-compare-bar" role="region" aria-label={t('compareTitle')}>
        <div className="buyer-compare-bar-inner">
          <ul className="buyer-compare-picks">
            {selected.map((product) => (
              <li key={product.id}>
                <span
                  className="buyer-compare-thumb"
                  style={
                    product.imageUrls[0]
                      ? { backgroundImage: `url(${product.imageUrls[0]})` }
                      : undefined
                  }
                  aria-hidden="true"
                />
                <span className="buyer-compare-pick-name">{cleanProductName(product.name)}</span>
                <button
                  type="button"
                  className="buyer-compare-remove"
                  onClick={() => onRemove(product.id)}
                  aria-label={t('compareRemove', { name: cleanProductName(product.name) })}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="buyer-compare-actions">
            <span className="buyer-compare-count">
              {selected.length < 2
                ? t('compareNeedTwo')
                : t('compareSelected', { count: selected.length })}
            </span>
            <Button
              variant="primary"
              size="compact"
              disabled={selected.length < 2}
              onClick={() => setOpen(true)}
            >
              {t('compareOpen')}
            </Button>
            <button type="button" className="buyer-compare-clear" onClick={onClear}>
              {t('compareClear')}
            </button>
          </div>
        </div>
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t('compareTitle')}
        closeLabel={t('closeDialog')}
        className="buyer-compare-dialog"
      >
        <div className="buyer-compare-ai">
          <AiMark label={loading ? t('aiCompareWorking') : t('aiCompareMark')} working={loading} />
        </div>
        <div className="buyer-compare-scroll">
          <table className="buyer-compare-table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="buyer-ui-visually-hidden">{t('compareAttribute')}</span>
                </th>
                {selected.map((product) => {
                  const destination = firstDestination(product.affiliateUrl)
                  const verdict = verdictFor(product.id)
                  return (
                    <th scope="col" key={product.id}>
                      <span
                        className="buyer-compare-column-image"
                        style={
                          product.imageUrls[0]
                            ? { backgroundImage: `url(${product.imageUrls[0]})` }
                            : undefined
                        }
                        aria-hidden="true"
                      />
                      <span className="buyer-compare-column-name">
                        {cleanProductName(product.name)}
                      </span>
                      <span className="buyer-compare-column-price">
                        {money(product.priceCents)}
                      </span>
                      {verdict && (
                        <span className="buyer-compare-verdict">
                          <SparklesIcon className="buyer-compare-verdict-icon" aria-hidden="true" />
                          {read(verdict)}
                        </span>
                      )}
                      {destination ? (
                        <Button
                          variant="primary"
                          size="compact"
                          onClick={() => {
                            recordProductClickOut(product.id, destination.marketplace)
                            window.open(destination.url, '_blank', 'noopener,noreferrer')
                          }}
                        >
                          {t('buyNow')}
                        </Button>
                      ) : (
                        <span className="buyer-compare-unavailable">{t('noPurchaseLinkYet')}</span>
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {/* The table fills in under a shimmer rather than appearing from
                  nothing, so the wait reads as work being done. */}
              {loading && !comparison
                ? [0, 1, 2, 3].map((row) => (
                    <tr key={`skeleton-${row}`}>
                      <th scope="row">
                        <span
                          className="buyer-ai-skeleton buyer-ai-skeleton--sm"
                          aria-hidden="true"
                        />
                      </th>
                      {selected.map((product) => (
                        <td key={product.id}>
                          <span
                            className="buyer-ai-skeleton buyer-ai-skeleton--md"
                            aria-hidden="true"
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                : comparison?.rows.map((row) => (
                    <tr key={row.label.en}>
                      <th scope="row">{read(row.label)}</th>
                      {row.cells.map((cell, index) => (
                        <td key={selected[index]?.id ?? index}>{read(cell)}</td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {loading && (
          <p className="buyer-ui-visually-hidden" role="status" aria-live="polite">
            {t('compareLoading')}
          </p>
        )}
        {!loading && failed && <p className="buyer-compare-status">{t('compareFailed')}</p>}
        <p className="buyer-compare-note">{t('compareNote', { max: MAX_COMPARE })}</p>
      </Dialog>
    </>
  )
}
