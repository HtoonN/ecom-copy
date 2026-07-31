'use client'

import { PhotoIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'
import { Dialog } from '@/UI'
import { t, useLanguageSync } from '../locales'
import ShopIdentity from './ShopIdentity'

export type ProductDetailsProduct = {
  id: number
  name: string
  category: string
  description: string
  imageUrls: string[]
  priceCents: number
  shop: { name: string; slug: string; logoUrl: string | null }
}

const money = (cents: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(cents / 100)

export default function ProductDetailsDialog({
  product,
  onClose,
  actions,
}: {
  product: ProductDetailsProduct | null
  onClose: () => void
  actions?: ReactNode
}) {
  useLanguageSync()
  const primaryImage = product?.imageUrls[0]

  return (
    <Dialog
      open={Boolean(product)}
      onClose={onClose}
      title={product?.name || t('productDetails')}
      closeLabel={t('closeDialog')}
    >
      {product && (
        <div className="buyer-product-dialog">
          <div
            className="buyer-product-image buyer-product-dialog-image"
            role="img"
            aria-label={t('productImageAlt', { name: product.name })}
            style={{
              backgroundImage: primaryImage ? `url(${primaryImage})` : undefined,
            }}
          >
            {!primaryImage && (
              <PhotoIcon className="buyer-product-placeholder-icon" aria-hidden="true" />
            )}
          </div>
          <div className="buyer-product-dialog-content">
            <div className="buyer-product-kicker">
              <span>{product.category}</span>
              <span aria-hidden="true">·</span>
              <ShopIdentity shop={product.shop} href={`/shop/${product.shop.slug}`} />
            </div>
            <p>{product.description}</p>
            <div className="buyer-price buyer-product-dialog-price">
              <strong>{money(product.priceCents)}</strong>
            </div>
            {actions && <div className="buyer-product-dialog-actions">{actions}</div>}
          </div>
        </div>
      )}
    </Dialog>
  )
}
