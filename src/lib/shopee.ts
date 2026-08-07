const ALLOWED_HOSTS = ['shopee.co.th', 's.shopee.co.th']
const MAX_REDIRECTS = 5
const MAX_HTML_LENGTH = 2_000_000
const BROWSER_HEADERS = {
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36',
}

export type ShopeeProductPreview = {
  affiliateUrl: string
  name: string
  category: string
  description: string
  imageUrl: string
  imageUrls: string[]
  price: string
  compareAt: string
  currency: string
  warning?: string
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

export function normalizeShopeeUrl(value: unknown) {
  let url: URL
  try {
    url = new URL(String(value || '').trim())
  } catch {
    throw new Error('Enter a valid Shopee Thailand URL.')
  }
  const hostname = url.hostname.toLowerCase()
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.includes(hostname)) {
    throw new Error('Use an official shopee.co.th or s.shopee.co.th affiliate link.')
  }
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

function textContent(value: string) {
  return decodeHtml(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ')
}

export function extractShopeeDomProduct(html: string) {
  const breadcrumb = html.match(
    /<div\b[^>]*class=["'][^"']*\bpage-product__breadcrumb\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  )?.[1]
  const categories = breadcrumb
    ? [...breadcrumb.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)]
        .map((match) => textContent(match[1]))
        .filter((value) => value && value.toLowerCase() !== 'shopee')
    : []
  const heading = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].find((match) =>
    /\bauau1S\b/.test(match[0]),
  )
  const livePrice = html.match(
    /<section\b[^>]*aria-live=["']polite["'][^>]*>[\s\S]*?฿\s*[\d,.]+[\s\S]*?<\/section>/i,
  )?.[0]
  const classPrice = html.match(
    /<([a-z][\w-]*)\b[^>]*class=["'][^"']*\b(?:pyzxvq|pmW3JG)\b[^"']*["'][^>]*>([\s\S]*?)<\/\1>/i,
  )?.[2]
  const priceText = classPrice || livePrice || ''

  return {
    name: heading ? textContent(heading[1]) : '',
    category: categories.at(-1) || '',
    price: priceValue(priceText.match(/฿\s*[\d,.]+/)?.[0] || priceText),
  }
}

function safeShopeeImage(value: unknown) {
  try {
    const url = new URL(decodeHtml(String(value || '')))
    const hostname = url.hostname.toLowerCase()
    return url.protocol === 'https:' && hostname.endsWith('.img.susercontent.com')
      ? url.toString()
      : ''
  } catch {
    return ''
  }
}

function srcsetCandidates(value = '') {
  return value
    .split(',')
    .map((candidate) => candidate.trim().split(/\s+/)[0])
    .filter(Boolean)
    .reverse()
}

function imageFromTags(tags: string[]) {
  for (const tag of tags) {
    const attrs = attributes(tag)
    const candidates = [
      ...srcsetCandidates(attrs.srcset),
      ...srcsetCandidates(attrs['data-srcset']),
      attrs.src,
      attrs['data-src'],
    ]
    for (const candidate of candidates) {
      const image = safeShopeeImage(candidate)
      if (image) return image
    }
  }
  return ''
}

export function extractShopeeImageFromHtml(html: string) {
  const pictures = [...html.matchAll(/<picture\b[^>]*>[\s\S]*?<\/picture>/gi)].map(
    (match) => match[0],
  )
  const preferredPictures = pictures.filter((picture) =>
    /\b(?:i9ihcT|P39yUt|lazyload|_0eG4n|ZUEJdQ|auau1S)\b/.test(picture),
  )

  for (const picture of [...preferredPictures, ...pictures]) {
    const tags = [...picture.matchAll(/<(?:source|img)\s+[^>]*>/gi)].map((match) => match[0])
    const image = imageFromTags(tags)
    if (image) return image
  }

  const tags = [...html.matchAll(/<(?:source|img)\s+[^>]*>/gi)].map((match) => match[0])
  const preferredTags = tags.filter((tag) =>
    /\b(?:i9ihcT|P39yUt|lazyload|_0eG4n|ZUEJdQ|auau1S)\b/.test(tag),
  )
  return imageFromTags([...preferredTags, ...tags])
}

function priceValue(value?: string) {
  if (!value) return ''
  const normalized = value.replace(/[^\d.,]/g, '').replace(/,/g, '')
  const amount = Number(normalized)
  return Number.isFinite(amount) && amount >= 0 ? amount.toFixed(2) : ''
}

function jsonLdProduct(html: string) {
  for (const match of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1]))
      const entries = Array.isArray(parsed) ? parsed : [parsed]
      const product = entries.find((entry) => entry?.['@type'] === 'Product')
      if (product) return product
    } catch {}
  }
  return null
}

async function fetchShopeeHtml(initialUrl: URL) {
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
      throw new Error('Shopee could not be reached. Try again or enter the details manually.')
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) throw new Error('Shopee returned an incomplete redirect.')
      current = normalizeShopeeUrl(new URL(location, current).toString())
      continue
    }
    if (!response.ok) throw new Error(`Shopee returned HTTP ${response.status}.`)
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) throw new Error('Shopee did not return a product page.')
    return { html: (await response.text()).slice(0, MAX_HTML_LENGTH), finalUrl: current }
  }
  throw new Error('The Shopee link redirected too many times.')
}

function productIds(url: URL) {
  const canonical = url.pathname.match(/^\/product\/(\d+)\/(\d+)\/?$/)
  const named = decodeURIComponent(url.pathname).match(/-i\.(\d+)\.(\d+)(?:$|[/?])/)
  const match = canonical || named
  return match ? { shopId: match[1], itemId: match[2] } : null
}

function shopeeAmount(value: unknown) {
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0 ? (amount / 100_000).toFixed(2) : ''
}

async function fetchCanonicalProduct(url: URL) {
  const ids = productIds(url)
  if (!ids) return null
  const endpoint = new URL('/api/v4/pdp/get_pc', url.origin)
  endpoint.searchParams.set('item_id', ids.itemId)
  endpoint.searchParams.set('shop_id', ids.shopId)
  try {
    const response = await fetch(endpoint, {
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
      headers: {
        ...BROWSER_HEADERS,
        Accept: 'application/json',
        Referer: url.toString(),
        'x-api-source': 'pc',
      },
    })
    if (!response.ok) return null
    const payload = await response.json()
    const item = payload?.data?.item || payload?.data
    if (!item?.name) return null
    const images = [item.image, ...(Array.isArray(item.images) ? item.images : [])]
      .map((image) =>
        image
          ? safeShopeeImage(
              String(image).startsWith('http')
                ? String(image)
                : `https://down-th.img.susercontent.com/file/${image}`,
            )
          : '',
      )
      .filter((image, index, all) => image && all.indexOf(image) === index)
      .slice(0, 4)
    return {
      name: String(item.name || ''),
      description: String(item.description || ''),
      imageUrl: images[0] || '',
      imageUrls: images,
      price: shopeeAmount(item.price || item.price_min),
      compareAt: shopeeAmount(item.price_before_discount || item.price_max_before_discount),
    }
  } catch {
    return null
  }
}

export async function scrapeShopeeProduct(value: unknown): Promise<ShopeeProductPreview> {
  const affiliateUrl = normalizeShopeeUrl(value)
  const { html } = await fetchShopeeHtml(affiliateUrl)
  const meta = metadata(html)
  // The JSON-LD Product block in <head> is the same structured data Google reads for
  // rich product cards — prefer it over the more fragile og: meta tags and hashed
  // class-name DOM scraping, which only fill in whatever JSON-LD leaves out.
  const product = jsonLdProduct(html)
  const domProduct = extractShopeeDomProduct(html)
  const offers = Array.isArray(product?.offers) ? product.offers[0] : product?.offers
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  let name = decodeHtml(
    product?.name || meta.get('og:title') || domProduct.name || (titleMatch ? titleMatch[1] : ''),
  ).replace(/\s*\|\s*Shopee Thailand\s*$/i, '')
  const category = decodeHtml(String(product?.category || domProduct.category || ''))
  let description = decodeHtml(product?.description || meta.get('og:description') || '')
  const jsonLdImages = (Array.isArray(product?.image) ? product.image : [product?.image])
    .map(safeShopeeImage)
    .filter(Boolean)
  let imageUrls = [
    ...jsonLdImages,
    safeShopeeImage(meta.get('og:image')),
    extractShopeeImageFromHtml(html),
  ]
    .filter((url, index, all) => url && all.indexOf(url) === index)
    .slice(0, 4)
  let imageUrl = imageUrls[0] || ''
  let price = priceValue(
    offers?.price ||
      offers?.lowPrice ||
      meta.get('product:price:amount') ||
      meta.get('og:price:amount') ||
      domProduct.price,
  )
  let compareAt = priceValue(offers?.highPrice || meta.get('product:original_price:amount'))
  const currency = String(
    offers?.priceCurrency || meta.get('product:price:currency') || 'THB',
  ).toUpperCase()

  if (!name || !price) {
    const canonical = await fetchCanonicalProduct(affiliateUrl)
    if (canonical) {
      name ||= canonical.name
      description ||= canonical.description
      imageUrl ||= canonical.imageUrl
      imageUrls = [...imageUrls, ...canonical.imageUrls]
        .filter((url, index, all) => url && all.indexOf(url) === index)
        .slice(0, 4)
      price ||= canonical.price
      compareAt ||= canonical.compareAt
    }
  }

  return {
    affiliateUrl: affiliateUrl.toString(),
    name,
    category,
    description,
    imageUrl,
    imageUrls,
    price,
    compareAt,
    currency,
    ...(!name || !price
      ? { warning: 'Shopee returned partial metadata. Complete the missing fields manually.' }
      : {}),
  }
}
