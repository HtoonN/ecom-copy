const SHOPEE_HOSTS = new Set(['shopee.co.th', 's.shopee.co.th'])
const LAZADA_HOSTS = new Set([
  'lazada.co.th',
  'www.lazada.co.th',
  's.lazada.co.th',
  'c.lazada.co.th',
  's.lazada.com',
])

export type AffiliateMarketplace = 'Shopee' | 'Lazada'

export function detectAffiliateMarketplace(url: string): AffiliateMarketplace | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    if (SHOPEE_HOSTS.has(hostname)) return 'Shopee'
    if (LAZADA_HOSTS.has(hostname)) return 'Lazada'
    return null
  } catch {
    return null
  }
}
