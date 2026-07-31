'use client'

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Dialog, EmptyState, Select } from '@/UI'
import { detectAffiliateMarketplace } from '@/lib/affiliate-marketplace'
import { t, useLanguageSync } from '../locales'
import { recordProductView } from '../record-product-view'
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
const productImages = (product: Product) => product.imageUrls.slice(0, 4)
const affiliateDestinations = (product: Product) =>
  product.affiliateUrl
    .map((url) => ({ marketplace: detectAffiliateMarketplace(url), url }))
    .filter(
      (destination): destination is { marketplace: 'Shopee' | 'Lazada'; url: string } =>
        destination.marketplace !== null,
    )
const productSku = (product: Product) =>
  product.sku || `NS-${String(product.id).padStart(5, '0')}`
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

export default function Storefront({
  initialProducts,
  brands = [],
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
  brands?: { nameEn: string; nameTh: string }[]
  sports?: { nameEn: string; nameTh: string }[]
  productTypes?: { nameEn: string; nameTh: string }[]
  shopSlug?: string
  title?: string
  subtitle?: string
  eyebrow?: string
  showHeader?: boolean
  initialQuery?: string
}) {
  const PAGE_SIZE = 10
  const lang = useLanguageSync()
  const productTypeButtons = [
    { key: ALL_SENTINEL, display: t('allProductType') },
    ...productTypes.map((option) => ({ key: option.nameEn, display: displayLabel(option, lang) })),
  ]
  const [productType, setProductType] = useState(() => {
    const raw = readSearchParam('productType').split('|')[0]?.trim()
    if (!raw) return ALL_SENTINEL
    const match = productTypes.find((option) => option.nameEn === raw || option.nameTh === raw)
    return match?.nameEn || raw
  })
  const selectedProductTypeOption = productTypes.find((option) => option.nameEn === productType)
  const productTypeDisplay = selectedProductTypeOption
    ? displayLabel(selectedProductTypeOption, lang)
    : productType
  const [query, setQuery] = useState(initialQuery)
  const [genders, setGenders] = useState<string[]>(() => readSearchParamList('gender'))
  const [sportsSelected, setSportsSelected] = useState<string[]>(() => readSearchParamList('sport'))
  const [brandsSelected, setBrandsSelected] = useState<string[]>(() => readSearchParamList('brand'))
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
  const [page, setPage] = useState(1)
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
  useEffect(
    () => setPage(1),
    [productType, query, genders, sportsSelected, brandsSelected, appliedMinPrice, appliedMaxPrice, sortOrder],
  )
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const isFiltered =
    productType !== ALL_SENTINEL ||
    query.trim() !== '' ||
    appliedMinPrice != null ||
    appliedMaxPrice != null
  const hasSiblingFilters = genders.length > 0 || sportsSelected.length > 0 || brandsSelected.length > 0
  const listAbortRef = useRef<AbortController | null>(null)
  const facetAbortRef = useRef<AbortController | null>(null)

  // Full filtered list (used for the product grid) + URL sync — reacts to every filter.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      if (productType !== ALL_SENTINEL) {
        params.set('productType', encodeCsvParam(bilingualPair(productType, productTypes)))
      }
      if (genders.length) params.set('gender', encodeCsvParam(genders))
      if (sportsSelected.length) params.set('sport', encodeCsvParam(sportsSelected))
      if (brandsSelected.length) params.set('brand', encodeCsvParam(brandsSelected))
      if (appliedMinPrice != null) params.set('minPrice', String(appliedMinPrice))
      if (appliedMaxPrice != null) params.set('maxPrice', String(appliedMaxPrice))

      const search = params.toString()
      const newUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`
      window.history.replaceState(null, '', newUrl)

      listAbortRef.current?.abort()
      if (!hasSiblingFilters) {
        // No gender/sport/brand narrowing active — the facet-base fetch below already
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
        .then((data: Product[]) => setFetchedProducts(data))
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
    query,
    genders,
    sportsSelected,
    brandsSelected,
    appliedMinPrice,
    appliedMaxPrice,
    shopSlug,
  ])

  // Facet-base list (product type + search only, ignoring gender/sport/brand) — this is what
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
      if (query.trim()) params.set('q', query.trim())
      if (productType !== ALL_SENTINEL) {
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
        .then((data: Product[]) => setFetchedFacetBase(data))
        .catch((error) => {
          if ((error as Error).name !== 'AbortError') console.error(error)
        })
        .finally(() => setFacetLoading(false))
    }, 300)
    return () => {
      window.clearTimeout(handle)
      facetAbortRef.current?.abort()
    }
  }, [productType, productTypes, query, appliedMinPrice, appliedMaxPrice, shopSlug, isFiltered])

  const clientFacetBase = useMemo(
    () =>
      initialProducts.filter(
        (product) =>
          (productType === ALL_SENTINEL ||
            matchesBilingual(product.productType, productType, productTypes)) &&
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
          (!brandsSelected.length || brandsSelected.some((value) => product.brand === value)),
      )
    const sorted = [...source]
    if (sortOrder === 'price-asc') sorted.sort((a, b) => a.priceCents - b.priceCents)
    else if (sortOrder === 'price-desc') sorted.sort((a, b) => b.priceCents - a.priceCents)
    else if (sortOrder === 'most-viewed') sorted.sort((a, b) => b._count.views - a._count.views)
    return sorted
  }, [fetchedProducts, facetBaseProducts, genders, sportsSelected, brandsSelected, sortOrder])
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE))
  const pagedProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
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
  const brandFacets = useMemo(
    () =>
      brands.map((option) => ({
        label: option.nameEn,
        count: facetBaseProducts.filter(
          (p) => p.brand === option.nameEn || p.brand === option.nameTh,
        ).length,
      })),
    [brands, facetBaseProducts],
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

  const productGrid = (
    <div className={`buyer-product-grid${isFiltered ? ' buyer-product-grid--results' : ''}`}>
      {pagedProducts.map((product) => {
        const primaryImage = productImages(product)[0]
        return (
          <article key={product.id}>
            <Card
              className="buyer-product-card"
              interactive
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('a, button')) return
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
                  aria-label={t('viewProductDetails', { name: product.name })}
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
                    {product.name}
                  </button>
                </h2>
                {product.description && (
                  <p className="buyer-product-description">{product.description}</p>
                )}
                <div className="buyer-product-footer">
                  <div className="buyer-price">
                    <span>{money(product.priceCents)}</span>
                  </div>
                  <button
                    type="button"
                    className="buyer-view-button"
                    aria-label={t('viewProductDetails', { name: product.name })}
                    onClick={() => openProductDetails(product)}
                  >
                    {t('viewDetails')}
                  </button>
                </div>
              </div>
            </Card>
          </article>
        )
      })}
    </div>
  )

  const pagination = products.length > PAGE_SIZE && (
    <nav className="buyer-pagination" aria-label={t('paginationLabel')}>
      <button
        type="button"
        className="buyer-pagination-prev"
        aria-label={t('paginationPrev')}
        disabled={page <= 1}
        onClick={() => setPage((current) => Math.max(1, current - 1))}
      >
        <ChevronLeftIcon aria-hidden="true" />
      </button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
        <button
          key={number}
          type="button"
          className="buyer-pagination-page"
          aria-current={number === page ? 'page' : undefined}
          aria-label={t('paginationPage', { page: number })}
          onClick={() => setPage(number)}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        className="buyer-pagination-next"
        aria-label={t('paginationNext')}
        disabled={page >= totalPages}
        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
      >
        <ChevronRightIcon aria-hidden="true" />
      </button>
    </nav>
  )

  const emptyState = !products.length && (
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
        <h2 className="buyer-filters-title">{t('chooseShopHeading')}</h2>
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
            </Button>
          ))}
        </div>
        {isFiltered ? (
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
              <FilterGroup
                title={t('filterBrand')}
                items={brandFacets}
                selected={brandsSelected}
                onToggle={(label) => toggleBilingualFacet(label, setBrandsSelected, brands)}
              />
              <PriceFilterGroup
                minValue={minPriceInput}
                maxValue={maxPriceInput}
                onMinChange={setMinPriceInput}
                onMaxChange={setMaxPriceInput}
                onApply={applyPriceFilter}
              />
            </aside>
            <div className="buyer-results-main">
              <div className="buyer-results-header">
                <h2>
                  {productType !== ALL_SENTINEL ? productTypeDisplay : query}
                  <span>
                    {' '}
                    ({products.length.toLocaleString('en-US')} {t('productsCountSuffix')})
                    {(productsLoading || facetLoading) && (
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
                    onChange={(event) =>
                      setSortOrder(event.target.value as typeof sortOrder)
                    }
                    options={[
                      { value: 'price-asc', label: t('sortPriceAsc') },
                      { value: 'price-desc', label: t('sortPriceDesc') },
                      { value: 'most-viewed', label: t('sortMostViewed') },
                    ]}
                  />
                </div>
              </div>
              {productGrid}
              {pagination}
              {emptyState}
            </div>
          </div>
        ) : (
          <>
            {productGrid}
            {pagination}
            {emptyState}
          </>
        )}
      </div>
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
                <span className="buyer-product-dialog-brand">
                  {selectedProduct.brand || selectedProduct.shop.name}
                </span>
                <span className="buyer-product-dialog-sku">
                  {t('skuLabel')} {productSku(selectedProduct)}
                </span>
              </div>
              <h3 className="buyer-product-dialog-title">{selectedProduct.name}</h3>
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
                        onClick={() => window.open(destination.url, '_blank', 'noopener,noreferrer')}
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
              <p className="buyer-product-dialog-description">{selectedProduct.description}</p>
            </div>
          </div>
        )}
      </Dialog>
    </section>
  )
}

function useDefaultFiltersOpen() {
  const [open, setOpen] = useState(true)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 50rem)')
    setOpen(!mql.matches)
    const handler = (event: MediaQueryListEvent) => setOpen(!event.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return open
}

function FilterGroup({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string
  items: { label: string; count: number }[]
  selected: string[]
  onToggle: (label: string) => void
}) {
  const defaultOpen = useDefaultFiltersOpen()
  return (
    <details className="buyer-filter-group" open={defaultOpen}>
      <summary className="buyer-filter-group-header">
        {title}
        <ChevronDownIcon className="buyer-filter-chevron" aria-hidden="true" />
      </summary>
      <div className="buyer-filter-group-body">
        {items.map((item) => (
          <label className="buyer-filter-row" key={item.label}>
            <span className="buyer-filter-row-main">
              <input
                type="checkbox"
                checked={selected.includes(item.label)}
                onChange={() => onToggle(item.label)}
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
  const defaultOpen = useDefaultFiltersOpen()
  return (
    <details className="buyer-filter-group" open={defaultOpen}>
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
