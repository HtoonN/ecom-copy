const ALLOWED_HOSTS = new Set([
  'lazada.co.th',
  'www.lazada.co.th',
  's.lazada.co.th',
  'c.lazada.co.th',
  's.lazada.com',
])
const MAX_REDIRECTS = 5
const MAX_HTML_LENGTH = 2_000_000
const BROWSER_HEADERS = {
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36',
}

export type LazadaProductPreview = {
  affiliateUrl: string
  name: string
  category: string
  description: string
  imageUrl: string
  imageUrls: string[]
  price: string
  compareAt: string
  currency: string
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .trim()
}

export function normalizeLazadaUrl(value: unknown) {
  let url: URL
  try {
    url = new URL(String(value || '').trim())
  } catch {
    throw new Error('Enter a valid Lazada Thailand URL.')
  }

  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname.toLowerCase()))
    throw new Error('Use an official Lazada Thailand affiliate link.')

  url.username = ''
  url.password = ''
  url.hash = ''
  return url
}

function attributes(tag: string) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map((match) => [
      match[1].toLowerCase(),
      decodeHtml(match[2] ?? match[3] ?? ''),
    ]),
  )
}

function metadata(html: string) {
  const values = new Map<string, string>()
  for (const match of html.matchAll(/<meta\s+[^>]*>/gi)) {
    const attrs = attributes(match[0])
    const key = (attrs.property || attrs.name || '').toLowerCase()
    if (key && attrs.content && !values.has(key)) values.set(key, attrs.content)
  }
  return values
}

function jsonLdEntries(html: string) {
  const entries: any[] = []
  for (const match of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1]))
      const values = Array.isArray(parsed) ? parsed : [parsed]
      for (const value of values) {
        if (Array.isArray(value?.['@graph'])) entries.push(...value['@graph'])
        else entries.push(value)
      }
    } catch {}
  }
  return entries
}

function priceValue(value: unknown) {
  const normalized = String(value ?? '')
    .replace(/[^\d.,]/g, '')
    .replace(/,/g, '')
  const amount = Number(normalized)
  return normalized && Number.isFinite(amount) && amount >= 0 ? amount.toFixed(2) : ''
}

function safeImageUrl(value: unknown) {
  try {
    const url = new URL(decodeHtml(String(value || '')))
    return url.protocol === 'https:' ? url.toString() : ''
  } catch {
    return ''
  }
}

async function fetchLazadaHtml(initialUrl: URL) {
  let current = initialUrl
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    let response: Response
    try {
      response = await fetch(current, {
        cache: 'no-store',
        redirect: 'manual',
        signal: AbortSignal.timeout(12_000),
        headers: BROWSER_HEADERS,
      })
    } catch {
      throw new Error('Lazada could not be reached. Try again or enter the details manually.')
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) throw new Error('Lazada returned an incomplete redirect.')
      current = normalizeLazadaUrl(new URL(location, current).toString())
      continue
    }
    if (!response.ok) throw new Error(`Lazada returned HTTP ${response.status}.`)
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) throw new Error('Lazada did not return a product page.')
    return (await response.text()).slice(0, MAX_HTML_LENGTH)
  }
  throw new Error('The Lazada link redirected too many times.')
}

export async function scrapeLazadaProduct(value: unknown): Promise<LazadaProductPreview> {
  const affiliateUrl = normalizeLazadaUrl(value)
  const html = await fetchLazadaHtml(affiliateUrl)
  const meta = metadata(html)
  const entries = jsonLdEntries(html)
  const product = entries.find((entry) => entry?.['@type'] === 'Product')
  const breadcrumbs = entries.find((entry) => entry?.['@type'] === 'BreadcrumbList')
  const offers = Array.isArray(product?.offers) ? product.offers[0] : product?.offers
  const image = product?.image
  const imageUrls = [meta.get('og:image'), ...(Array.isArray(image) ? image : [image])]
    .map(safeImageUrl)
    .filter((url, index, all) => url && all.indexOf(url) === index)
    .slice(0, 4)
  const breadcrumbItems = Array.isArray(breadcrumbs?.itemListElement)
    ? breadcrumbs.itemListElement
    : []
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''
  const name = decodeHtml(meta.get('og:title') || product?.name || title).replace(
    /\s*[|–-]\s*Lazada(?:\.co\.th)?\s*$/i,
    '',
  )

  return {
    affiliateUrl: affiliateUrl.toString(),
    name,
    category: decodeHtml(
      String(
        product?.category ||
          meta.get('product:category') ||
          breadcrumbItems.at(-1)?.item?.name ||
          breadcrumbItems.at(-1)?.name ||
          '',
      ),
    ),
    description: decodeHtml(meta.get('og:description') || product?.description || ''),
    imageUrl: imageUrls[0] || '',
    imageUrls,
    price: priceValue(
      meta.get('product:price:amount') || meta.get('og:price:amount') || offers?.price,
    ),
    compareAt: priceValue(meta.get('product:original_price:amount') || offers?.highPrice),
    currency: String(
      meta.get('product:price:currency') || offers?.priceCurrency || 'THB',
    ).toUpperCase(),
  }
}
