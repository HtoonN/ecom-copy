'use client'

import { ChevronDownIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Checkbox, Dialog, EmptyState, Select } from '@/UI'
import { detectAffiliateMarketplace } from '@/lib/affiliate-marketplace'
import { MAX_COMPARE } from '@/lib/compare'
import { cleanProductName } from '@/lib/product-name'
import { t, useLanguageSync } from '../locales'
import { recordProductClickOut } from '../record-product-clickout'
import { recordProductView } from '../record-product-view'
import AiMark from './AiMark'
import CompareBar, { type CompareCandidate } from './CompareBar'
import '../buyer.css'

type Product = {
  id: number
  name: string
  category: string
  productType: string | null
  description: string
  sku: string | null
  brand: string | null
  sport: string | null
  gender: string | null
  imageUrls: string[]
  priceCents: number
  listingMode: 'NATIVE' | 'AFFILIATE'
  affiliateUrl: string[]
  shop: { name: string; slug: string; logoUrl: string | null }
  _count: { views: number }
}

const ALL_SENTINEL = '__ALL__'
// Catches products whose productType is empty or doesn't match any registered
// type — e.g. a stray value left over from before the taxonomy was cleaned up.
// Without this bucket those products are invisible under every specific tab.
const OTHER_SENTINEL = '__OTHER__'

type InterpretedSearch = {
  productType?: string | null
  sport?: string | null
  brand?: string | null
  genders?: string[]
  minPrice?: number | null
  maxPrice?: number | null
  text?: string | null
}

function displayLabel(option: { nameEn: string; nameTh: string }, lang: string): string {
  return lang === 'en' ? option.nameEn : option.nameTh
}

const GENDER_OPTIONS: { nameEn: string; nameTh: string }[] = [
  { nameEn: 'Men', nameTh: 'ผู้ชาย' },
  { nameEn: 'Women', nameTh: 'ผู้หญิง' },
  { nameEn: 'Unisex', nameTh: 'ยูนิเซกส์' },
  { nameEn: 'Kids', nameTh: 'เด็ก' },
  { nameEn: 'Boys', nameTh: 'เด็กผู้ชาย' },
  { nameEn: 'Girls', nameTh: 'เด็กผู้หญิง' },
]
const money = (cents: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(cents / 100)
// Prices in the reading chips are bounds the customer typed, not exact amounts —
// "≤ ฿3,000.00" reads as false precision for a number they said as "สามพัน".
const moneyRounded = (cents: number) =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(cents / 100)
const productImages = (product: Product) => product.imageUrls.slice(0, 4)
const affiliateDestinations = (product: Product) =>
  product.affiliateUrl
    .map((url) => ({ marketplace: detectAffiliateMarketplace(url), url }))
    .filter(
      (destination): destination is { marketplace: 'Shopee' | 'Lazada'; url: string } =>
        destination.marketplace !== null,
    )
const productSku = (product: Product) => product.sku || `NS-${String(product.id).padStart(5, '0')}`
const readSearchParam = (key: string): string => {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get(key) || ''
}
// Joined with "|" rather than "," because some values contain a literal comma
// (e.g. sport name "Yoga, Pilates") — "|" never appears in any facet label.
const parseCsvParam = (value: string): string[] =>
  value
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean)
const encodeCsvParam = (values: string[]): string => values.join('|')
const readSearchParamList = (key: string): string[] => parseCsvParam(readSearchParam(key))
function toggleBilingualFacet(
  label: string,
  setCurrent: (updater: (current: string[]) => string[]) => void,
  options: { nameEn: string; nameTh: string }[],
) {
  const match = options.find((option) => option.nameEn === label || option.nameTh === label)
  const pair = match ? [...new Set([match.nameEn, match.nameTh])] : [label]
  setCurrent((existing) =>
    existing.includes(label)
      ? existing.filter((value) => !pair.includes(value))
      : [...existing, ...pair.filter((value) => !existing.includes(value))],
  )
}
// A selected label (e.g. "เสื้อ") may match a product's productType stored in
// either language — vendor-created products store the English nameEn, seeded
// demo/category products store the Thai nameTh.
function bilingualPair(label: string, options: { nameEn: string; nameTh: string }[]): string[] {
  const match = options.find((option) => option.nameEn === label || option.nameTh === label)
  return match ? [...new Set([match.nameEn, match.nameTh])] : [label]
}
function matchesBilingual(
  value: string | null,
  label: string,
  options: { nameEn: string; nameTh: string }[],
): boolean {
  if (!value) return false
  return bilingualPair(label, options).includes(value)
}
function isOtherProductType(
  value: string | null,
  options: { nameEn: string; nameTh: string }[],
): boolean {
  if (!value) return true
  return !options.some((option) => option.nameEn === value || option.nameTh === value)
}
// How many products each scroll step reveals. The grid renders a growing
// prefix of the filtered list; the API already returns the full match set.
const BATCH_SIZE = 20

export default function Storefront({
  initialProducts,
  merchants = [],
  sports = [],
  productTypes = [],
  shopSlug,
  title = t('featuredProducts'),
  subtitle = t('featuredProductsSubtitle'),
  eyebrow = t('marketplaceEyebrow'),
  showHeader = true,
  initialQuery = '',
}: {
  initialProducts: Product[]
  merchants?: { name: string; slug: string }[]
  sports?: { nameEn: string; nameTh: string }[]
  productTypes?: { nameEn: string; nameTh: string }[]
  shopSlug?: string
  title?: string
  subtitle?: string
  eyebrow?: string
  showHeader?: boolean
  initialQuery?: string
}) {
  const lang = useLanguageSync()
  const productTypeButtons = [
    { key: ALL_SENTINEL, display: t('allProductType') },
    ...productTypes.map((option) => ({ key: option.nameEn, display: displayLabel(option, lang) })),
    { key: OTHER_SENTINEL, display: t('otherProductType') },
  ]
  const [productType, setProductType] = useState(() => {
    const raw = readSearchParam('productType').split('|')[0]?.trim()
    if (!raw) return ALL_SENTINEL
    const match = productTypes.find((option) => option.nameEn === raw || option.nameTh === raw)
    return match?.nameEn || raw
  })
  // Site-wide counts, independent of the currently selected category, so every
  // button keeps showing what's actually in that category rather than collapsing
  // to the count of whichever one is active.
  const productTypeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    counts.set(ALL_SENTINEL, initialProducts.length)
    for (const option of productTypes) {
      counts.set(
        option.nameEn,
        initialProducts.filter((product) =>
          matchesBilingual(product.productType, option.nameEn, productTypes),
        ).length,
      )
    }
    counts.set(
      OTHER_SENTINEL,
      initialProducts.filter((product) => isOtherProductType(product.productType, productTypes))
        .length,
    )
    return counts
  }, [initialProducts, productTypes])
  const selectedProductTypeOption = productTypes.find((option) => option.nameEn === productType)
  const productTypeDisplay =
    productType === OTHER_SENTINEL
      ? t('otherProductType')
      : selectedProductTypeOption
        ? displayLabel(selectedProductTypeOption, lang)
        : productType
  const [query, setQuery] = useState(initialQuery)
  const [genders, setGenders] = useState<string[]>(() => readSearchParamList('gender'))
  const [sportsSelected, setSportsSelected] = useState<string[]>(() => readSearchParamList('sport'))
  const [merchantsSelected, setMerchantsSelected] = useState<string[]>(() =>
    readSearchParamList('merchant'),
  )
  const [minPriceInput, setMinPriceInput] = useState(() => readSearchParam('minPrice'))
  const [maxPriceInput, setMaxPriceInput] = useState(() => readSearchParam('maxPrice'))
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | null>(() => {
    const raw = readSearchParam('minPrice')
    return raw ? Number(raw) : null
  })
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | null>(() => {
    const raw = readSearchParam('maxPrice')
    return raw ? Number(raw) : null
  })
  function applyPriceFilter() {
    const min = minPriceInput.trim() ? Number(minPriceInput) : null
    const max = maxPriceInput.trim() ? Number(maxPriceInput) : null
    setAppliedMinPrice(min != null && Number.isFinite(min) ? min : null)
    setAppliedMaxPrice(max != null && Number.isFinite(max) ? max : null)
  }
  const [fetchedProducts, setFetchedProducts] = useState<Product[] | null>(null)
  const [fetchedFacetBase, setFetchedFacetBase] = useState<Product[] | null>(null)
  const [productsLoading, setProductsLoading] = useState(false)
  const [facetLoading, setFacetLoading] = useState(false)
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)
  const [sortOrder, setSortOrder] = useState<'price-asc' | 'price-desc' | 'most-viewed'>(
    'price-asc',
  )
  useEffect(() => setQuery(initialQuery), [initialQuery])
  useEffect(() => {
    function handleSearch(event: Event) {
      setQuery((event as CustomEvent<string>).detail ?? '')
    }
    window.addEventListener('northstar-search', handleSearch)
    return () => window.removeEventListener('northstar-search', handleSearch)
  }, [])
  // Any change to the result set restarts the scroll from the first batch,
  // otherwise a narrowed filter would keep rendering a stale deep prefix.
  useEffect(
    () => setVisibleCount(BATCH_SIZE),
    [
      productType,
      query,
      genders,
      sportsSelected,
      merchantsSelected,
      appliedMinPrice,
      appliedMaxPrice,
      sortOrder,
    ],
  )
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [galleryIndex, setGalleryIndex] = useState(0)
  // What the search phrase was understood to mean, and the residue of it that
  // still has to be matched against product names.
  const [interpreted, setInterpreted] = useState<InterpretedSearch | null>(null)
  const [searchText, setSearchText] = useState(initialQuery)
  const [interpreting, setInterpreting] = useState(false)
  const [comparing, setComparing] = useState<CompareCandidate[]>([])
  const isFiltered =
    productType !== ALL_SENTINEL ||
    query.trim() !== '' ||
    appliedMinPrice != null ||
    appliedMaxPrice != null
  const hasSiblingFilters =
    genders.length > 0 || sportsSelected.length > 0 || merchantsSelected.length > 0
  const listAbortRef = useRef<AbortController | null>(null)
  const facetAbortRef = useRef<AbortController | null>(null)
  const loadMoreRef = useRef<HTMLButtonElement | null>(null)

  function revealMore() {
    setVisibleCount((current) => current + BATCH_SIZE)
  }

  // Read the search phrase into filters. Runs only when the phrase itself
  // changes — adjusting a filter by hand must not re-interpret and overwrite the
  // adjustment the customer just made.
  useEffect(() => {
    const phrase = query.trim()
    if (!phrase) {
      setInterpreted(null)
      setSearchText('')
      setInterpreting(false)
      return
    }
    let cancelled = false
    setInterpreting(true)
    const handle = window.setTimeout(() => {
      fetch('/api/search/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: phrase }),
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((payload: { filters?: InterpretedSearch } | null) => {
          if (cancelled) return
          const filters = payload?.filters
          if (!filters) {
            // Endpoint unreachable: search the phrase as written, which is what
            // the box did before any of this existed.
            setInterpreted(null)
            setSearchText(phrase)
            return
          }
          setInterpreted(filters)
          setSearchText(filters.text ?? '')
          setProductType(filters.productType ?? ALL_SENTINEL)
          setSportsSelected(filters.sport ? [filters.sport] : [])
          setGenders(filters.genders ?? [])
          setAppliedMinPrice(filters.minPrice ?? null)
          setAppliedMaxPrice(filters.maxPrice ?? null)
          setMinPriceInput(filters.minPrice ? String(filters.minPrice) : '')
          setMaxPriceInput(filters.maxPrice ? String(filters.maxPrice) : '')
        })
        .catch(() => {
          if (!cancelled) setSearchText(phrase)
        })
        .finally(() => {
          if (!cancelled) setInterpreting(false)
        })
    }, 300)
    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [query])

  // Full filtered list (used for the product grid) + URL sync — reacts to every filter.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams()
      if (searchText.trim()) params.set('q', searchText.trim())
      // "Other" has no server-side representation (it's "doesn't match any known
      // type"), so it's left off the request and applied as a client-side filter
      // on the response instead.
      if (productType !== ALL_SENTINEL && productType !== OTHER_SENTINEL) {
        params.set('productType', encodeCsvParam(bilingualPair(productType, productTypes)))
      }
      if (genders.length) params.set('gender', encodeCsvParam(genders))
      if (sportsSelected.length) params.set('sport', encodeCsvParam(sportsSelected))
      if (merchantsSelected.length) params.set('merchant', encodeCsvParam(merchantsSelected))
      if (appliedMinPrice != null) params.set('minPrice', String(appliedMinPrice))
      if (appliedMaxPrice != null) params.set('maxPrice', String(appliedMaxPrice))

      const search = params.toString()
      const newUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`
      window.history.replaceState(null, '', newUrl)

      listAbortRef.current?.abort()
      if (!hasSiblingFilters) {
        // No gender/sport/merchant narrowing active — the facet-base fetch below already
        // has the exact same result set, so skip this redundant network round trip.
        setFetchedProducts(null)
        setProductsLoading(false)
        return
      }
      if (shopSlug) params.set('shop', shopSlug)
      const controller = new AbortController()
      listAbortRef.current = controller
      setProductsLoading(true)
      fetch(`/api/products?${params.toString()}`, { signal: controller.signal })
        .then((response) =>
          response.ok ? response.json() : Promise.reject(new Error('Failed to load products.')),
        )
        .then((data: Product[]) =>
          setFetchedProducts(
            productType === OTHER_SENTINEL
              ? data.filter((product) => isOtherProductType(product.productType, productTypes))
              : data,
          ),
        )
        .catch((error) => {
          if ((error as Error).name !== 'AbortError') console.error(error)
        })
        .finally(() => setProductsLoading(false))
    }, 300)
    return () => {
      window.clearTimeout(handle)
      listAbortRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    productType,
    searchText,
    genders,
    sportsSelected,
    merchantsSelected,
    appliedMinPrice,
    appliedMaxPrice,
    shopSlug,
  ])

  // Facet-base list (product type + search only, ignoring gender/sport/merchant) — this is what
  // facet counts must be computed from so they never drift from what's actually in the DB
  // (initialProducts is a one-time page-load snapshot and goes stale as products change).
  useEffect(() => {
    if (!isFiltered) {
      setFetchedFacetBase(null)
      setFacetLoading(false)
      return
    }
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams()
      if (searchText.trim()) params.set('q', searchText.trim())
      if (productType !== ALL_SENTINEL && productType !== OTHER_SENTINEL) {
        params.set('productType', encodeCsvParam(bilingualPair(productType, productTypes)))
      }
      if (appliedMinPrice != null) params.set('minPrice', String(appliedMinPrice))
      if (appliedMaxPrice != null) params.set('maxPrice', String(appliedMaxPrice))
      if (shopSlug) params.set('shop', shopSlug)

      facetAbortRef.current?.abort()
      const controller = new AbortController()
      facetAbortRef.current = controller
      setFacetLoading(true)
      fetch(`/api/products?${params.toString()}`, { signal: controller.signal })
        .then((response) =>
          response.ok ? response.json() : Promise.reject(new Error('Failed to load products.')),
        )
        .then((data: Product[]) =>
          setFetchedFacetBase(
            productType === OTHER_SENTINEL
              ? data.filter((product) => isOtherProductType(product.productType, productTypes))
              : data,
          ),
        )
        .catch((error) => {
          if ((error as Error).name !== 'AbortError') console.error(error)
        })
        .finally(() => setFacetLoading(false))
    }, 300)
    return () => {
      window.clearTimeout(handle)
      facetAbortRef.current?.abort()
    }
  }, [
    productType,
    productTypes,
    searchText,
    appliedMinPrice,
    appliedMaxPrice,
    shopSlug,
    isFiltered,
  ])

  const clientFacetBase = useMemo(
    () =>
      initialProducts.filter(
        (product) =>
          (productType === ALL_SENTINEL ||
            (productType === OTHER_SENTINEL
              ? isOtherProductType(product.productType, productTypes)
              : matchesBilingual(product.productType, productType, productTypes))) &&
          product.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()) &&
          (appliedMinPrice == null || product.priceCents >= appliedMinPrice * 100) &&
          (appliedMaxPrice == null || product.priceCents <= appliedMaxPrice * 100),
      ),
    [initialProducts, productType, productTypes, query, appliedMinPrice, appliedMaxPrice],
  )
  const facetBaseProducts = fetchedFacetBase ?? clientFacetBase
  const products = useMemo(() => {
    const source =
      fetchedProducts ??
      facetBaseProducts.filter(
        (product) =>
          (!genders.length || genders.some((value) => product.gender === value)) &&
          (!sportsSelected.length || sportsSelected.some((value) => product.sport === value)) &&
          (!merchantsSelected.length ||
            merchantsSelected.some((value) => product.shop.slug === value)),
      )
    const sorted = [...source]
    if (sortOrder === 'price-asc') sorted.sort((a, b) => a.priceCents - b.priceCents)
    else if (sortOrder === 'price-desc') sorted.sort((a, b) => b.priceCents - a.priceCents)
    else if (sortOrder === 'most-viewed') sorted.sort((a, b) => b._count.views - a._count.views)
    return sorted
  }, [fetchedProducts, facetBaseProducts, genders, sportsSelected, merchantsSelected, sortOrder])
  const visibleProducts = products.slice(0, visibleCount)
  const hasMore = products.length > visibleProducts.length
  // The "load more" button doubles as the scroll sentinel: the observer reveals
  // the next batch as it comes into view, and the button itself stays clickable
  // for keyboard users and for browsers without IntersectionObserver.
  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) revealMore()
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [visibleCount, hasMore])
  const genderFacets = useMemo(
    () =>
      GENDER_OPTIONS.map((option) => ({
        label: displayLabel(option, lang),
        count: facetBaseProducts.filter(
          (p) => p.gender === option.nameEn || p.gender === option.nameTh,
        ).length,
      })),
    [facetBaseProducts, lang],
  )
  // Every merchant stays listed, including at zero, so the roster reads as the full
  // set of shops on the marketplace rather than shifting with each filter change.
  const merchantFacets = useMemo(
    () =>
      merchants.map((option) => ({
        label: option.name,
        value: option.slug,
        count: facetBaseProducts.filter((p) => p.shop.slug === option.slug).length,
      })),
    [merchants, facetBaseProducts],
  )
  const sportFacets = useMemo(
    () =>
      sports.map((option) => ({
        label: displayLabel(option, lang),
        count: facetBaseProducts.filter(
          (p) => p.sport === option.nameEn || p.sport === option.nameTh,
        ).length,
      })),
    [sports, facetBaseProducts, lang],
  )

  function openProductDetails(product: Product) {
    setSelectedProduct(product)
    setGalleryIndex(0)
    recordProductView(product.id)
      .then(() => fetch(`/api/products/${product.id}`))
      .then((response) => (response && response.ok ? response.json() : null))
      .then((fresh: Product | null) => {
        if (fresh) setSelectedProduct((current) => (current?.id === fresh.id ? fresh : current))
      })
      .catch(() => undefined)
  }

  const comparingIds = comparing.map((product) => product.id)
  const compareFull = comparing.length >= MAX_COMPARE

  const toggleCompare = (product: Product) =>
    setComparing((current) => {
      if (current.some((entry) => entry.id === product.id))
        return current.filter((entry) => entry.id !== product.id)
      if (current.length >= MAX_COMPARE) return current
      const { id, name, imageUrls, priceCents, affiliateUrl } = product
      return [...current, { id, name, imageUrls, priceCents, affiliateUrl }]
    })

  const productGrid = (
    <div className="buyer-product-grid buyer-product-grid--results">
      {visibleProducts.map((product) => {
        const primaryImage = productImages(product)[0]
        return (
          <article key={product.id}>
            <Card
              className="buyer-product-card"
              interactive
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('a, button, label, input')) return
                openProductDetails(product)
              }}
            >
              <div
                className="buyer-product-image"
                style={{
                  backgroundImage: primaryImage ? `url(${primaryImage})` : undefined,
                }}
              >
                <button
                  type="button"
                  className="buyer-product-detail-trigger"
                  aria-label={t('viewProductDetails', { name: cleanProductName(product.name) })}
                  onClick={() => openProductDetails(product)}
                />
                {!primaryImage && (
                  <img
                    className="buyer-product-placeholder-icon"
                    src="/product-placeholder.png"
                    alt=""
                  />
                )}
              </div>
              <div className="buyer-product-content">
                <h2>
                  <button
                    type="button"
                    className="buyer-product-title-button"
                    onClick={() => openProductDetails(product)}
                  >
                    {cleanProductName(product.name)}
                  </button>
                </h2>
                {product.description && (
                  <p className="buyer-product-description">
                    {cleanProductName(product.description)}
                  </p>
                )}
                <div className="buyer-product-footer">
                  <div className="buyer-price">
                    <span>{money(product.priceCents)}</span>
                  </div>
                  <button
                    type="button"
                    className="buyer-view-button"
                    aria-label={t('viewProductDetails', { name: cleanProductName(product.name) })}
                    onClick={() => openProductDetails(product)}
                  >
                    {t('viewDetails')}
                  </button>
                </div>
                <div className="buyer-product-compare">
                  <Checkbox
                    label={t('compareAdd')}
                    checked={comparingIds.includes(product.id)}
                    disabled={compareFull && !comparingIds.includes(product.id)}
                    onChange={() => toggleCompare(product)}
                  />
                </div>
              </div>
            </Card>
          </article>
        )
      })}
    </div>
  )

  const loadMore = products.length > 0 && (
    <div className="buyer-load-more">
      <p className="buyer-load-more-status" role="status" aria-live="polite">
        {t('showingCount', {
          shown: visibleProducts.length.toLocaleString('en-US'),
          total: products.length.toLocaleString('en-US'),
        })}
      </p>
      {hasMore && (
        <button
          type="button"
          ref={loadMoreRef}
          className="buyer-load-more-button"
          onClick={revealMore}
        >
          {t('loadMore')}
        </button>
      )}
    </div>
  )

  // Show the reading back, and let each part of it be undone. An interpretation
  // the customer cannot see or correct is indistinguishable from "you have none
  // of these" when it gets the phrase wrong.
  const readingChips = (() => {
    // The moment the machine is working is the moment worth showing. Without
    // this the whole feature happens invisibly between two renders.
    if (interpreting)
      return (
        <div className="buyer-reading buyer-ai-panel">
          <AiMark label={t('aiSearchWorking')} working />
          <span className="buyer-ai-skeleton buyer-ai-skeleton--sm" aria-hidden="true" />
          <span className="buyer-ai-skeleton buyer-ai-skeleton--md" aria-hidden="true" />
        </div>
      )
    if (!interpreted) return null
    const chips: { key: string; label: string; clear: () => void }[] = []
    if (interpreted.productType) {
      const option = productTypes.find((entry) => entry.nameEn === interpreted.productType)
      chips.push({
        key: 'type',
        label: option ? displayLabel(option, lang) : interpreted.productType,
        clear: () => setProductType(ALL_SENTINEL),
      })
    }
    if (interpreted.sport) {
      const option = sports.find((entry) => entry.nameEn === interpreted.sport)
      chips.push({
        key: 'sport',
        label: option ? displayLabel(option, lang) : interpreted.sport,
        clear: () => setSportsSelected([]),
      })
    }
    for (const gender of interpreted.genders ?? []) {
      const option = GENDER_OPTIONS.find((entry) => entry.nameEn === gender)
      chips.push({
        key: `gender-${gender}`,
        label: option ? displayLabel(option, lang) : gender,
        clear: () => setGenders((current) => current.filter((entry) => entry !== gender)),
      })
    }
    if (interpreted.minPrice || interpreted.maxPrice) {
      const from = interpreted.minPrice ? moneyRounded(interpreted.minPrice * 100) : null
      const to = interpreted.maxPrice ? moneyRounded(interpreted.maxPrice * 100) : null
      chips.push({
        key: 'price',
        label: from && to ? `${from} – ${to}` : to ? `≤ ${to}` : `≥ ${from}`,
        clear: () => {
          setAppliedMinPrice(null)
          setAppliedMaxPrice(null)
          setMinPriceInput('')
          setMaxPriceInput('')
        },
      })
    }
    if (!chips.length) return null
    return (
      <div className="buyer-reading buyer-ai-panel">
        <AiMark label={t('aiSearchMark')} />
        <span className="buyer-reading-label">{t('searchUnderstoodAs')}</span>
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className="buyer-reading-chip"
            onClick={chip.clear}
            aria-label={t('removeFilter', { name: chip.label })}
          >
            {chip.label}
            <span aria-hidden="true">×</span>
          </button>
        ))}
      </div>
    )
  })()

  // "Nothing found" is a claim about the catalogue, and it is not true yet while
  // the phrase is still being read or the results are still in flight. Showing
  // it early makes every sentence search flash an empty shop first.
  const emptyState = !products.length && !interpreting && !productsLoading && (
    <EmptyState title={t('noProductsTitle')} description={t('noProductsDescription')} />
  )

  return (
    <section
      className={`buyer-scope buyer-catalog${selectedProduct ? ' buyer-catalog--details-open' : ''}`}
      id="shop"
    >
      <div className="buyer-container">
        {showHeader && (
          <div className="buyer-catalog-header">
            <div>
              <div className="buyer-eyebrow">{eyebrow}</div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>
        )}
        <div className="buyer-filters-title-row">
          <h2 className="buyer-filters-title">{t('chooseShopHeading')}</h2>
        </div>
        <div className="buyer-filters" aria-label={t('allCategories')}>
          {productTypeButtons.map(({ key, display }) => (
            <Button
              key={key}
              size="compact"
              variant={key === productType ? 'primary' : 'neutral'}
              aria-pressed={key === productType}
              onClick={() => setProductType(key)}
            >
              {display}
              <span className="buyer-type-badge">
                {(productTypeCounts.get(key) ?? 0).toLocaleString('en-US')}
              </span>
            </Button>
          ))}
        </div>
        <div className="buyer-results-layout">
          <aside className="buyer-filter-sidebar">
            <FilterGroup
              title={t('filterGender')}
              items={genderFacets}
              selected={genders}
              onToggle={(label) => toggleBilingualFacet(label, setGenders, GENDER_OPTIONS)}
            />
            <FilterGroup
              title={t('filterSport')}
              items={sportFacets}
              selected={sportsSelected}
              onToggle={(label) => toggleBilingualFacet(label, setSportsSelected, sports)}
            />
            {merchantFacets.length > 0 && (
              <FilterGroup
                title={t('filterMerchant')}
                items={merchantFacets}
                selected={merchantsSelected}
                onToggle={(slug) =>
                  setMerchantsSelected((current) =>
                    current.includes(slug)
                      ? current.filter((entry) => entry !== slug)
                      : [...current, slug],
                  )
                }
              />
            )}
            <PriceFilterGroup
              minValue={minPriceInput}
              maxValue={maxPriceInput}
              onMinChange={setMinPriceInput}
              onMaxChange={setMaxPriceInput}
              onApply={applyPriceFilter}
            />
          </aside>
          <div className="buyer-results-main">
            {readingChips}
            <div className="buyer-results-header">
              <h2>
                {productType !== ALL_SENTINEL ? productTypeDisplay : query || t('allProductType')}
                <span>
                  {' '}
                  ({products.length.toLocaleString('en-US')} {t('productsCountSuffix')})
                  {(interpreting || productsLoading || facetLoading) && (
                    <span className="buyer-results-loading">{t('loadingResults')}</span>
                  )}
                </span>
              </h2>
              <div className="buyer-results-sort">
                <span>{t('sortBy')}</span>
                <Select
                  label=""
                  aria-label={t('sortBy')}
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)}
                  options={[
                    { value: 'price-asc', label: t('sortPriceAsc') },
                    { value: 'price-desc', label: t('sortPriceDesc') },
                    { value: 'most-viewed', label: t('sortMostViewed') },
                  ]}
                />
              </div>
            </div>
            {productGrid}
            {loadMore}
            {emptyState}
          </div>
        </div>
      </div>
      <CompareBar
        selected={comparing}
        onRemove={(productId) =>
          setComparing((current) => current.filter((entry) => entry.id !== productId))
        }
        onClear={() => setComparing([])}
      />
      <Dialog
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title={
          (selectedProduct?.productType &&
            displayLabel(
              productTypes.find(
                (option) =>
                  option.nameEn === selectedProduct.productType ||
                  option.nameTh === selectedProduct.productType,
              ) || { nameEn: selectedProduct.productType, nameTh: selectedProduct.productType },
              lang,
            )) ||
          t('productDetails')
        }
        closeLabel={t('closeDialog')}
        className="buyer-product-detail-dialog"
      >
        {selectedProduct && (
          <div className="buyer-product-dialog">
            <div className="buyer-product-dialog-gallery">
              <div
                className="buyer-product-image buyer-product-dialog-image"
                role="img"
                aria-label={`${t('productImageAlt', { name: selectedProduct.name })} ${galleryIndex + 1}`}
                style={{
                  backgroundImage: productImages(selectedProduct)[galleryIndex]
                    ? `url(${productImages(selectedProduct)[galleryIndex]})`
                    : undefined,
                }}
              >
                {!productImages(selectedProduct).length && (
                  <img
                    className="buyer-product-placeholder-icon"
                    src="/product-placeholder.png"
                    alt=""
                  />
                )}
              </div>
              {productImages(selectedProduct).length > 1 && (
                <div className="buyer-product-dialog-thumbnails">
                  {productImages(selectedProduct).map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      aria-pressed={index === galleryIndex}
                      aria-label={`${t('productImageAlt', { name: selectedProduct.name })} ${index + 1}`}
                      className={`buyer-product-dialog-thumbnail${
                        index === galleryIndex ? ' buyer-product-dialog-thumbnail--active' : ''
                      }`}
                      style={{ backgroundImage: `url(${image})` }}
                      onClick={() => setGalleryIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="buyer-product-dialog-content">
              <div className="buyer-product-dialog-identity">
                <Link
                  className="buyer-product-dialog-merchant"
                  href={`/shop/${selectedProduct.shop.slug}`}
                >
                  {selectedProduct.shop.name}
                </Link>
                <span className="buyer-product-dialog-sku">
                  {t('skuLabel')} {productSku(selectedProduct)}
                </span>
              </div>
              <h3 className="buyer-product-dialog-title">
                {cleanProductName(selectedProduct.name)}
              </h3>
              <p className="buyer-product-dialog-views">
                {t('viewCountLabel', {
                  count: selectedProduct._count.views.toLocaleString('en-US'),
                })}
              </p>
              <div className="buyer-price buyer-product-dialog-price">
                <strong>{money(selectedProduct.priceCents)}</strong>
              </div>
              {affiliateDestinations(selectedProduct).length > 0 ? (
                <div className="buyer-product-marketplace-list">
                  {affiliateDestinations(selectedProduct).map((destination) => (
                    <div className="buyer-product-marketplace-row" key={destination.url}>
                      <span className="buyer-product-marketplace-identity">
                        <img
                          className="buyer-marketplace-icon"
                          src={`/${destination.marketplace.toLowerCase()}.png`}
                          alt=""
                          aria-hidden="true"
                        />
                        {destination.marketplace}
                      </span>
                      <Button
                        variant="primary"
                        size="compact"
                        className="buyer-product-marketplace-buy"
                        onClick={() => {
                          recordProductClickOut(selectedProduct.id, destination.marketplace)
                          window.open(destination.url, '_blank', 'noopener,noreferrer')
                        }}
                      >
                        {t('buyNow')}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="buyer-product-marketplace-empty">{t('noPurchaseLinkYet')}</p>
              )}
              <div className="buyer-product-dialog-tabs">
                <span className="buyer-product-dialog-tab buyer-product-dialog-tab--active">
                  {t('productDetails')}
                </span>
              </div>
              <p className="buyer-product-dialog-description">
                {cleanProductName(selectedProduct.description)}
              </p>
            </div>
          </div>
        )}
      </Dialog>
    </section>
  )
}

function FilterGroup({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string
  // `value` is what selection is keyed on when it differs from the label — merchants
  // are selected by slug but shown by name.
  items: { label: string; count: number; value?: string }[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <details className="buyer-filter-group">
      <summary className="buyer-filter-group-header">
        {title}
        <ChevronDownIcon className="buyer-filter-chevron" aria-hidden="true" />
      </summary>
      <div className="buyer-filter-group-body">
        {items.map((item) => (
          <label className="buyer-filter-row" key={item.value ?? item.label}>
            <span className="buyer-filter-row-main">
              <input
                type="checkbox"
                checked={selected.includes(item.value ?? item.label)}
                onChange={() => onToggle(item.value ?? item.label)}
              />
              {item.label}
            </span>
            <span className="buyer-filter-count">{item.count.toLocaleString('en-US')}</span>
          </label>
        ))}
      </div>
    </details>
  )
}

function PriceFilterGroup({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  onApply,
}: {
  minValue: string
  maxValue: string
  onMinChange: (value: string) => void
  onMaxChange: (value: string) => void
  onApply: () => void
}) {
  return (
    <details className="buyer-filter-group">
      <summary className="buyer-filter-group-header">
        {t('filterPrice')}
        <ChevronDownIcon className="buyer-filter-chevron" aria-hidden="true" />
      </summary>
      <div className="buyer-filter-group-body">
        <div className="buyer-filter-price-row">
          <label className="buyer-filter-price-field">
            <span>฿</span>
            <input
              type="number"
              min={0}
              value={minValue}
              onChange={(event) => onMinChange(event.target.value)}
            />
          </label>
          <span className="buyer-filter-price-sep">{t('priceRangeTo')}</span>
          <label className="buyer-filter-price-field">
            <span>฿</span>
            <input
              type="number"
              min={0}
              value={maxValue}
              onChange={(event) => onMaxChange(event.target.value)}
            />
          </label>
        </div>
        <button type="button" className="buyer-filter-apply" onClick={onApply}>
          {t('applyFilter')}
        </button>
      </div>
    </details>
  )
}
