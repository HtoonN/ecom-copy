import { BuildingStorefrontIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export type BuyerShopIdentity = {
  name: string
  logoUrl: string | null
}

export default function ShopIdentity({ shop, href }: { shop: BuyerShopIdentity; href?: string }) {
  const content = (
    <>
      <span
        className="buyer-shop-logo"
        style={{ backgroundImage: shop.logoUrl ? `url(${shop.logoUrl})` : undefined }}
        aria-hidden="true"
      >
        {!shop.logoUrl && <BuildingStorefrontIcon />}
      </span>
      <span>{shop.name}</span>
    </>
  )

  return href ? (
    <Link className="buyer-shop-identity" href={href}>
      {content}
    </Link>
  ) : (
    <span className="buyer-shop-identity">{content}</span>
  )
}
