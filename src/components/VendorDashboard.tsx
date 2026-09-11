'use client'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  ConfirmationDialog,
  Dialog,
  InputField,
  LoadingIndicator,
  Select,
  StatusToast,
  type StatusTone,
} from '@/UI'
import DashboardShell from './DashboardShell'
import { detectAffiliateMarketplace } from '@/lib/affiliate-marketplace'
import { t, useLanguageSync, type VendorTextKey } from '@/features/vendor/locales'
import '@/features/vendor/vendor.css'
type VendorStats = {
  totalProducts: number
  activeProducts: number
}
type VendorData = {
  shop: any
  items: any[]
  stats: VendorStats
  analytics: {
    dailyViews: { label: string; views: number }[]
    topProducts: {
      id: number
      name: string
      imageUrl: string | null
      views: number
    }[]
  }
  catalogOptions: {
    productTypes: { nameEn: string; nameTh: string }[]
    brands: { nameEn: string; nameTh: string }[]
    categories: { nameEn: string; nameTh: string }[]
    sports: { nameEn: string; nameTh: string }[]
  }
}
const money = (c: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(c / 100)

function catalogSelectOptions(
  items: { nameEn: string; nameTh: string }[],
  lang: string,
  currentValue?: string,
  extras: string[] = [],
) {
  const options = new Map<string, { value: string; label: string; disabled?: boolean }>()
  if (currentValue) options.set(currentValue, { value: currentValue, label: currentValue })
  else options.set('', { value: '', label: t('selectPlaceholder'), disabled: true })
  for (const item of items) {
    const value = lang === 'en' ? item.nameEn : item.nameTh
    options.set(value, { value, label: value })
  }
  for (const extra of extras) {
    if (!options.has(extra)) options.set(extra, { value: extra, label: extra })
  }
  return [...options.values()]
}

const GENDER_OPTIONS = ['Unisex', 'Men', 'Women', 'Boys', 'Girls', 'Other']
const GENDER_OPTION_LABEL_TH: Record<string, string> = {
  Unisex: 'ยูนิเซกส์',
  Men: 'ผู้ชาย',
  Women: 'ผู้หญิง',
  Boys: 'เด็กผู้ชาย',
  Girls: 'เด็กผู้หญิง',
  Other: 'อื่นๆ',
}

const ORDER_STATUS_OPTIONS = [
  'PENDING',
  'ACCEPTED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const

function orderStatusLabel(value: string) {
  const keys: Record<string, VendorTextKey> = {
    PENDING: 'orderStatusPending',
    ACCEPTED: 'orderStatusAccepted',
    PROCESSING: 'orderStatusProcessing',
    SHIPPED: 'orderStatusShipped',
    DELIVERED: 'orderStatusDelivered',
    CANCELLED: 'orderStatusCancelled',
  }
  return keys[value] ? t(keys[value]) : value
}

function paymentStatusLabel(value: string) {
  const keys: Record<string, VendorTextKey> = {
    PENDING: 'paymentStatusPending',
    PAID: 'paymentStatusPaid',
    FAILED: 'paymentStatusFailed',
    REFUNDED: 'paymentStatusRefunded',
  }
  return keys[value] ? t(keys[value]) : value
}

function couponTypeLabel(value: string) {
  return value === 'PERCENT' ? t('percentageOption') : t('fixedAmountOption')
}

export default function VendorDashboard({
  name,
  initialTab,
}: {
  name: string
  initialTab: string
}) {
  const [tab, setTab] = useState(initialTab),
    [data, setData] = useState<VendorData | null>(null),
    [addOpen, setAddOpen] = useState(false),
    [editingProduct, setEditingProduct] = useState<any | null>(null),
    [toast, setToast] = useState<{ message: string; tone: StatusTone } | null>(null),
    [loadError, setLoadError] = useState(''),
    [selectedDay, setSelectedDay] = useState(''),
    [currentDay, setCurrentDay] = useState('')
  useLanguageSync()
  const actionInFlight = useRef(false)
  const load = useCallback(async () => {
    if (!selectedDay) return
    try {
      const response = await fetch(`/api/vendor?date=${encodeURIComponent(selectedDay)}`)
      if (!response.ok) throw new Error(t('loadShopError'))
      setData(await response.json())
      setLoadError('')
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t('loadShopError'))
    }
  }, [selectedDay])
  useEffect(() => {
    const now = new Date()
    const localDate = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-')
    setCurrentDay(localDate)
    setSelectedDay(localDate)
  }, [])
  useEffect(() => {
    load()
  }, [load])
  async function action(body: any) {
    if (actionInFlight.current) return false
    actionInFlight.current = true
    try {
      const r = await fetch('/api/vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await r.json()
      setToast({
        message: r.ok ? j.message || t('changesSaved') : j.error || t('changeSaveFailed'),
        tone: r.ok ? 'success' : 'error',
      })
      if (r.ok) await load()
      window.setTimeout(() => setToast(null), 3200)
      return r.ok
    } catch {
      setToast({ message: t('changeSaveFailedRetry'), tone: 'error' })
      return false
    } finally {
      actionInFlight.current = false
    }
  }
  if (!data)
    return (
      <div className="vendor-loading">
        {loadError ? (
          <>
            <p role="alert">{loadError}</p>
            <Button variant="primary" onClick={load}>
              {t('tryAgain')}
            </Button>
          </>
        ) : (
          <LoadingIndicator label={t('loadingShop')} />
        )}
      </div>
    )
  const summarySections = [
    {
      title: t('productsSectionTitle'),
      metrics: [
        [t('totalProducts'), data.stats.totalProducts],
        [t('activeProducts'), data.stats.activeProducts],
      ],
    },
  ] as const
  const selectedDayLabel = new Date(`${selectedDay}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const currentDayLabel = new Date(`${currentDay}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  return (
    <DashboardShell
      role="Vendor"
      name={name}
      shop={{ name: data.shop.name, logoUrl: data.shop.logoUrl }}
      tabs={['Dashboard', 'Products', 'Shop profile']}
      active={tab}
      onTab={setTab}
    >
      <div className="dash-head vendor-page-head">
        <div>
          <h1>{tab === 'Dashboard' ? t('sellersDashboard') : tab}</h1>
          <div className="muted">
            {data.shop.name} · {t('vendorWorkspace')}
          </div>
        </div>
        {tab === 'Products' && (
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <span aria-hidden="true">＋</span> {t('addProduct')}
          </Button>
        )}
      </div>
      {tab === 'Dashboard' && (
        <div className="vendor-day-filter">
          <InputField
            label=""
            type="date"
            value={selectedDay}
            max={currentDay}
            required
            onChange={(event) => {
              if (event.target.value) setSelectedDay(event.target.value)
            }}
          />
          <div className="vendor-current-day" onClick={() => setSelectedDay(currentDay)}>
            <strong>{currentDayLabel}</strong>
          </div>
        </div>
      )}
      {tab === 'Dashboard' && (
        <>
          <DashboardAnalytics analytics={data.analytics} selectedDayLabel={selectedDayLabel} />
          <div className="summary-sections">
            {summarySections.map((section) => (
              <SummarySection key={section.title} title={section.title} metrics={section.metrics} />
            ))}
          </div>
        </>
      )}
      {tab === 'Products' && (
        <div className="panel">
          <ProductTable products={data.shop.products} action={action} onEdit={setEditingProduct} />
        </div>
      )}
      {tab === 'Orders' && <OrderTable items={data.items} action={action} />}{' '}
      {tab === 'Promotions' && <CouponPanel coupons={data.shop.coupons} action={action} />}{' '}
      {tab === 'Shop profile' && <ShopPanel shop={data.shop} action={action} />}{' '}
      {addOpen && (
        <ProductModal
          productTypes={data.catalogOptions.productTypes}
          brands={data.catalogOptions.brands}
          categories={data.catalogOptions.categories}
          sports={data.catalogOptions.sports}
          close={() => setAddOpen(false)}
          save={action}
        />
      )}{' '}
      {editingProduct && (
        <ProductModal
          productTypes={data.catalogOptions.productTypes}
          brands={data.catalogOptions.brands}
          categories={data.catalogOptions.categories}
          sports={data.catalogOptions.sports}
          product={editingProduct}
          close={() => setEditingProduct(null)}
          save={action}
        />
      )}{' '}
      {toast && <StatusToast message={toast.message} tone={toast.tone} />}
    </DashboardShell>
  )
}
function SummarySection({
  title,
  metrics,
}: {
  title: string
  metrics: readonly (readonly [string, string | number])[]
}) {
  return (
    <section className="summary-group">
      <div className="summary-title">
        <h2>{title}</h2>
        <span>{t('metricsCount', { count: metrics.length })}</span>
      </div>
      <div className="summary-grid">
        {metrics.map(([label, value]) => (
          <div className="stat" key={label}>
            <span className="muted">{label}</span>
            <div className="value">{value}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
function DashboardAnalytics({
  analytics,
  selectedDayLabel,
}: {
  analytics: VendorData['analytics']
  selectedDayLabel: string
}) {
  const maxViews = Math.max(...analytics.dailyViews.map((day) => day.views), 1)
  return (
    <div className="analytics-grid">
      <div className="panel chart-panel">
        <div className="panel-head">
          <div>
            <h2>{t('viewPerformance')}</h2>
            <span className="muted">{t('last7DaysEnding', { day: selectedDayLabel })}</span>
          </div>
          <span className="badge good">{t('liveData')}</span>
        </div>
        <div className="bar-chart">
          {analytics.dailyViews.map((day) => (
            <div className="bar-column" key={day.label}>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    height: `${Math.max((day.views / maxViews) * 100, day.views ? 8 : 2)}%`,
                  }}
                />
              </div>
              <b>{day.label}</b>
              <small>{t('viewsCount', { count: day.views })}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="panel top-products-panel">
        <div className="panel-head">
          <div>
            <h2>{t('topViewingItems')}</h2>
            <span className="muted">{t('rankedByDetailViews', { day: selectedDayLabel })}</span>
          </div>
        </div>
        {analytics.topProducts.length ? (
          <div className="top-product-list">
            {analytics.topProducts.map((product, index) => (
              <div className="top-product" key={product.id}>
                <span className="rank">{index + 1}</span>
                <div
                  className="table-product-image"
                  style={{
                    backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : undefined,
                  }}
                >
                  {!product.imageUrl && <span>{product.name.charAt(0)}</span>}
                </div>
                <div className="top-product-name">
                  <b>{product.name}</b>
                  <small>{t('viewsCount', { count: product.views })}</small>
                </div>
                <strong>{product.views}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">{t('noProductViewsRecorded')}</div>
        )}
      </div>
    </div>
  )
}
function ProductTable({
  products,
  action,
  onEdit,
}: {
  products: any[]
  action: (b: any) => Promise<boolean>
  onEdit: (product: any) => void
}) {
  const [pendingDelete, setPendingDelete] = useState<any | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [productFilter, setProductFilter] = useState<'all' | 'active' | 'hidden'>('all')
  const visibleProducts = products.filter((product) =>
    productFilter === 'all' ? true : productFilter === 'active' ? product.active : !product.active,
  )
  const filterOptions = [
    { value: 'all' as const, label: t('filterAll'), count: products.length },
    {
      value: 'active' as const,
      label: t('filterActive'),
      count: products.filter((product) => product.active).length,
    },
    {
      value: 'hidden' as const,
      label: t('filterHidden'),
      count: products.filter((product) => !product.active).length,
    },
  ]

  async function remove(product: any) {
    setBusyAction(`delete-${product.id}`)
    await action({ action: 'deleteProduct', id: product.id })
    setBusyAction(null)
    setPendingDelete(null)
  }
  async function toggleVisibility(product: any) {
    setBusyAction(`visibility-${product.id}`)
    await action({
      action: 'updateProduct',
      id: product.id,
      name: product.name,
      sku: product.sku || `NS-${String(product.id).padStart(5, '0')}`,
      category: product.category,
      productType: product.productType || 'Other',
      sport: product.sport || 'General',
      gender: product.gender || 'Unisex',
      brand: product.brand || 'Unbranded',
      description: product.description,
      imageUrl1: product.imageUrls?.[0] || '',
      imageUrl2: product.imageUrls?.[1] || '',
      imageUrl3: product.imageUrls?.[2] || '',
      imageUrl4: product.imageUrls?.[3] || '',
      price: product.priceCents / 100,
      active: !product.active,
    })
    setBusyAction(null)
  }
  return (
    <>
      <div className="vendor-product-tabs" role="tablist" aria-label={t('filterProductsAriaLabel')}>
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            size="compact"
            variant={productFilter === option.value ? 'primary' : 'neutral'}
            role="tab"
            aria-selected={productFilter === option.value}
            onClick={() => setProductFilter(option.value)}
          >
            {option.label} <span aria-hidden="true">({option.count})</span>
          </Button>
        ))}
      </div>
      {visibleProducts.length ? (
        <div
          className="product-list-wrap"
          role="region"
          aria-label={t('productsRegionLabel', {
            status: filterOptions.find((option) => option.value === productFilter)?.label || '',
          })}
          tabIndex={0}
        >
          <table className="product-list vendor-product-list">
            <thead>
              <tr>
                <th>{t('colImage')}</th>
                <th>{t('colProduct')}</th>
                <th>{t('colCategory')}</th>
                <th>{t('colProductType')}</th>
                <th>{t('colPrice')}</th>
                <th>{t('colStatus')}</th>
                <th>{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div
                      className="table-product-image"
                      style={{
                        backgroundImage: p.imageUrls?.[0] ? `url(${p.imageUrls[0]})` : undefined,
                      }}
                    >
                      {!p.imageUrls?.[0] && <span>{p.name.charAt(0)}</span>}
                    </div>
                  </td>
                  <td>
                    <b>{p.name}</b>
                    <div className="product-description">
                      {t('productSkuViews', {
                        sku: p.sku || `NS-${String(p.id).padStart(5, '0')}`,
                        count: p._count?.views || 0,
                      })}
                    </div>
                    <div className="product-description">
                      {t('productClickOuts', { count: p._count?.clickOuts || 0 })}
                    </div>
                    {p.listingMode !== 'NATIVE' && (
                      <span className="badge warn">
                        {((p.affiliateUrl as string[]) || [])
                          .map((url) => detectAffiliateMarketplace(url))
                          .filter((marketplace): marketplace is 'Shopee' | 'Lazada' =>
                            Boolean(marketplace),
                          )
                          .join(' · ')}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="badge">{p.category}</span>
                  </td>
                  <td>
                    <span className="badge">{p.productType || 'Other'}</span>
                  </td>
                  <td>
                    <div className="table-price">{money(p.priceCents)}</div>
                  </td>
                  <td>
                    <span className={`badge ${p.active ? 'good' : 'bad'}`}>
                      {p.active ? t('filterActive') : t('filterHidden')}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Button size="compact" variant="secondary" onClick={() => onEdit(p)}>
                        {t('edit')}
                      </Button>
                      <Button
                        size="compact"
                        variant="outline"
                        loading={busyAction === `visibility-${p.id}`}
                        loadingLabel={t('savingLabel')}
                        disabled={busyAction !== null}
                        onClick={() => toggleVisibility(p)}
                      >
                        {p.active ? t('hide') : t('publish')}
                      </Button>
                      <Button
                        size="compact"
                        variant="danger"
                        disabled={busyAction !== null}
                        onClick={() => setPendingDelete(p)}
                      >
                        {t('delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          {products.length
            ? t(productFilter === 'active' ? 'noActiveProducts' : 'noHiddenProducts')
            : t('addFirstProduct')}
        </div>
      )}
      <ConfirmationDialog
        open={Boolean(pendingDelete)}
        title={t('deleteProductTitle')}
        description={
          pendingDelete ? t('deleteProductDescription', { name: pendingDelete.name }) : ''
        }
        confirmLabel={t('deleteProductConfirm')}
        cancelLabel={t('keepProduct')}
        closeLabel={t('closeConfirmation')}
        destructive
        loading={Boolean(pendingDelete && busyAction === `delete-${pendingDelete.id}`)}
        loadingLabel={t('deletingLabel')}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove(pendingDelete)}
      />
    </>
  )
}
function OrderTable({ items, action }: { items: any[]; action: (b: any) => Promise<boolean> }) {
  const [updatingItem, setUpdatingItem] = useState<number | null>(null)

  async function updateStatus(itemId: number, status: string) {
    setUpdatingItem(itemId)
    await action({ action: 'orderStatus', itemId, status })
    setUpdatingItem(null)
  }
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>{t('orderFulfillment')}</h2>
        <span className="badge">{t('itemsCount', { count: items.length })}</span>
      </div>
      {items.length ? (
        <div className="table-wrap" role="region" aria-label={t('orderFulfillment')} tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th>{t('colOrder')}</th>
                <th>{t('colCustomer')}</th>
                <th>{t('colProduct')}</th>
                <th>{t('qtyLabel')}</th>
                <th>{t('colPayment')}</th>
                <th>{t('colFulfillment')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td>
                    <b>{i.order.reference}</b>
                    <br />
                    <span className="muted">
                      {new Date(i.order.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>{i.order.customer.name}</td>
                  <td>{i.product.name}</td>
                  <td>{i.quantity}</td>
                  <td>
                    <span className={`badge ${i.order.paymentStatus === 'PAID' ? 'good' : 'warn'}`}>
                      {paymentStatusLabel(i.order.paymentStatus)}
                    </span>
                  </td>
                  <td>
                    <select
                      className="buyer-ui-select vendor-order-select"
                      aria-label={t('fulfillmentStatusAria', { reference: i.order.reference })}
                      value={i.status}
                      disabled={updatingItem !== null}
                      onChange={(e) => updateStatus(i.id, e.target.value)}
                    >
                      {ORDER_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {orderStatusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">{t('newOrdersAppearHere')}</div>
      )}
    </div>
  )
}
function ProductModal({
  close,
  save,
  product,
  productTypes,
  brands,
  categories,
  sports,
}: {
  close: () => void
  save: (b: any) => Promise<boolean>
  product?: any
  productTypes: { nameEn: string; nameTh: string }[]
  brands: { nameEn: string; nameTh: string }[]
  categories: { nameEn: string; nameTh: string }[]
  sports: { nameEn: string; nameTh: string }[]
}) {
  const lang = useLanguageSync()
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [savedImages, setSavedImages] = useState<string[]>(() =>
    Array.isArray(product?.imageUrls)
      ? product.imageUrls.filter((image: unknown) => typeof image === 'string').slice(0, 4)
      : [],
  )
  const [externalImages, setExternalImages] = useState<string[]>([])
  const [imageError, setImageError] = useState('')
  const [listingMode, setListingMode] = useState<'NATIVE' | 'AFFILIATE'>(
    product?.listingMode && product.listingMode !== 'NATIVE'
      ? 'AFFILIATE'
      : product
        ? 'NATIVE'
        : 'AFFILIATE',
  )
  const existingAffiliateUrls: string[] = Array.isArray(product?.affiliateUrl)
    ? product.affiliateUrl.filter((url: unknown): url is string => typeof url === 'string')
    : []
  const existingShopeeUrl =
    existingAffiliateUrls.find((url) => detectAffiliateMarketplace(url) === 'Shopee') || ''
  const existingLazadaUrl =
    existingAffiliateUrls.find((url) => detectAffiliateMarketplace(url) === 'Lazada') || ''
  const [affiliateMarketplaces, setAffiliateMarketplaces] = useState<Array<'shopee' | 'lazada'>>(
    () => {
      const marketplaces: Array<'shopee' | 'lazada'> = []
      if (existingShopeeUrl) marketplaces.push('shopee')
      if (existingLazadaUrl) marketplaces.push('lazada')
      return marketplaces
    },
  )
  const [affiliatePicker, setAffiliatePicker] = useState('')
  const [category, setCategory] = useState(product?.category || '')
  const [productType, setProductType] = useState(product?.productType || '')
  const [sport, setSport] = useState(product?.sport || '')
  const [brand, setBrand] = useState(product?.brand || '')
  const [gender, setGender] = useState(product?.gender || '')
  const [importStatus, setImportStatus] = useState<{
    message: string
    tone: 'success' | 'warning' | 'error'
  } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const isEdit = !!product
  const imagePreviews = useMemo(
    () => imageFiles.map((file) => URL.createObjectURL(file)),
    [imageFiles],
  )
  const displayedImages = [
    ...savedImages.map((url, index) => ({ url, kind: 'saved' as const, index })),
    ...externalImages.map((url, index) => ({ url, kind: 'external' as const, index })),
    ...imagePreviews.map((url, index) => ({ url, kind: 'file' as const, index })),
  ].slice(0, 4)
  useEffect(
    () => () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview))
    },
    [imagePreviews],
  )

  function selectImages(files: FileList | null) {
    const selected = [...imageFiles, ...Array.from(files || [])].filter(
      (file, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.name === file.name &&
            candidate.size === file.size &&
            candidate.lastModified === file.lastModified,
        ) === index,
    )
    if (savedImages.length + externalImages.length + selected.length > 4) {
      setImageError(t('selectMaxImages'))
      return
    }
    const invalid = selected.find(
      (file) =>
        !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) ||
        file.size > 5 * 1024 * 1024,
    )
    if (invalid) {
      setImageFiles([])
      setImageError(t('imageFormatError'))
      return
    }
    setImageFiles(selected)
    setImageError('')
  }

  function removeSelectedImage(index: number) {
    setImageFiles((files) => files.filter((_, fileIndex) => fileIndex !== index))
    setImageError('')
  }

  function removeSavedImage(index: number) {
    setSavedImages((images) => images.filter((_, imageIndex) => imageIndex !== index))
    setImageError('')
  }

  function removeExternalImage(index: number) {
    setExternalImages((images) => images.filter((_, imageIndex) => imageIndex !== index))
    setImageError('')
  }

  async function imagePayload(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error(t('couldNotReadFile', { name: file.name })))
      reader.readAsDataURL(file)
    })
    return { name: file.name, type: file.type, data: dataUrl.split(',', 2)[1] || '' }
  }

  function setField(name: string, value: string) {
    const field = formRef.current?.elements.namedItem(name)
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)
      field.value = value
  }

  async function importAffiliateDetails(marketplace: 'Shopee' | 'Lazada') {
    if (importing) return
    const fieldName = marketplace === 'Shopee' ? 'shopeeAffiliateUrl' : 'lazadaAffiliateUrl'
    const affiliateUrl = formRef.current?.elements.namedItem(fieldName)
    const url = affiliateUrl instanceof HTMLInputElement ? affiliateUrl.value : ''
    if (!url.trim()) {
      setImportStatus({ message: t('pasteAffiliateLinkFirst', { marketplace }), tone: 'error' })
      return
    }
    setImporting(true)
    setImportStatus(null)
    try {
      const response = await fetch('/api/vendor/affiliate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          marketplace: marketplace === 'Lazada' ? 'lazada' : 'shopee',
        }),
      })
      const preview = await response.json()
      if (!response.ok)
        throw new Error(preview.error || t('couldNotImportProduct', { marketplace }))
      for (const field of ['name', 'description', 'price'] as const) {
        setField(field, preview[field] == null ? '' : String(preview[field]))
      }
      const importedImages = [
        ...(Array.isArray(preview.imageUrls) ? preview.imageUrls : []),
        preview.imageUrl,
      ]
        .filter((image): image is string => typeof image === 'string' && Boolean(image.trim()))
        .filter((image, index, all) => all.indexOf(image) === index)
        .slice(0, 4)
      setExternalImages(importedImages)
      if (importedImages.length) {
        setSavedImages([])
        setImageFiles([])
      }
      const importedOption = (value: unknown) =>
        typeof value === 'string' && value.trim() ? value.trim() : 'Other'
      setProductType(importedOption(preview.productType))
      setSport(importedOption(preview.sport))
      setBrand(importedOption(preview.brand))
      setGender(importedOption(preview.gender))
      setCategory(importedOption(preview.category))
      setField(fieldName, preview.affiliateUrl || url)
      setImportStatus(null)
    } catch (error) {
      setImportStatus({
        message:
          error instanceof Error
            ? t('importErrorWithFallback', { message: error.message })
            : t('couldNotImportGeneric'),
        tone: 'error',
      })
    } finally {
      setImporting(false)
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (imageError) return
    const formValues = Object.fromEntries(new FormData(e.currentTarget))
    if (
      listingMode === 'AFFILIATE' &&
      !String(formValues.shopeeAffiliateUrl || '').trim() &&
      !String(formValues.lazadaAffiliateUrl || '').trim()
    ) {
      setImportStatus({
        message: t('addAffiliateLinkRequired'),
        tone: 'error',
      })
      return
    }
    if (isEdit && savedImages.length + externalImages.length + imageFiles.length === 0) {
      setImageError(t('keepAddProductImage'))
      return
    }
    setLoading(true)
    try {
      const uploadedImages = await Promise.all(imageFiles.map(imagePayload))
      const ok = await save({
        action: isEdit ? 'updateProduct' : 'product',
        id: product?.id,
        active: product?.active,
        ...formValues,
        uploadedImages,
        retainedImages: savedImages,
      })
      if (ok) close()
    } catch (error) {
      setImageError(error instanceof Error ? error.message : t('couldNotReadImages'))
    } finally {
      setLoading(false)
    }
  }
  return (
    <Dialog
      open
      onClose={loading || importing ? () => undefined : close}
      title={isEdit ? t('editProductTitle') : t('addProduct')}
      description={isEdit ? t('editProductDescription') : t('addProductDescription')}
      closeLabel={t('closeProductEditor')}
      className="vendor-product-dialog"
    >
      <form ref={formRef} className="vendor-form" onSubmit={submit}>
        <div className="vendor-listing-mode-row">
          <Select
            label={t('listingModeLabel')}
            name="listingMode"
            value={listingMode}
            onChange={(event) => {
              const mode = event.target.value === 'AFFILIATE' ? 'AFFILIATE' : 'NATIVE'
              setListingMode(mode)
              setImportStatus(null)
            }}
            options={[{ value: 'AFFILIATE', label: t('affiliateListingOption') }]}
          />
          {listingMode === 'AFFILIATE' && (
            <Select
              label={t('affiliateShopsLabel')}
              value={affiliatePicker}
              onChange={(event) => {
                const marketplace = event.target.value
                if (marketplace === 'shopee' || marketplace === 'lazada')
                  setAffiliateMarketplaces((current) =>
                    current.includes(marketplace) ? current : [...current, marketplace],
                  )
                setAffiliatePicker('')
                setImportStatus(null)
              }}
              options={[
                { value: '', label: t('addAffiliateLinkOption') },
                {
                  value: 'shopee',
                  label: t('addShopeeAffiliateOption'),
                  disabled: affiliateMarketplaces.includes('shopee'),
                },
                {
                  value: 'lazada',
                  label: t('addLazadaAffiliateOption'),
                  disabled: affiliateMarketplaces.includes('lazada'),
                },
              ]}
            />
          )}
        </div>
        {listingMode !== 'NATIVE' && (
          <div className="vendor-affiliate-links">
            {affiliateMarketplaces.includes('shopee') && (
              <div className="vendor-affiliate-import">
                <InputField
                  className="vendor-affiliate-url"
                  label={t('shopeeAffiliateLinkLabel')}
                  name="shopeeAffiliateUrl"
                  type="url"
                  required
                  placeholder="https://s.shopee.co.th/…"
                  helperText={t('shopeeHelperText')}
                  defaultValue={existingShopeeUrl}
                />
                <Button
                  type="button"
                  variant="secondary"
                  loading={importing}
                  loadingLabel={t('importingLabel')}
                  onClick={() => importAffiliateDetails('Shopee')}
                >
                  {t('importShopee')}
                </Button>
              </div>
            )}
            {affiliateMarketplaces.includes('lazada') && (
              <div className="vendor-affiliate-import">
                <InputField
                  className="vendor-affiliate-url"
                  label={t('lazadaAffiliateLinkLabel')}
                  name="lazadaAffiliateUrl"
                  type="url"
                  required
                  placeholder="https://s.lazada.co.th/…"
                  helperText={t('lazadaHelperText')}
                  defaultValue={existingLazadaUrl}
                />
                <Button
                  type="button"
                  variant="secondary"
                  loading={importing}
                  loadingLabel={t('importingLabel')}
                  onClick={() => importAffiliateDetails('Lazada')}
                >
                  {t('importLazada')}
                </Button>
              </div>
            )}
          </div>
        )}
        {importStatus && (
          <p
            className={`vendor-import-status vendor-import-status--${importStatus.tone}`}
            role={importStatus.tone === 'error' ? 'alert' : 'status'}
          >
            {importStatus.message}
          </p>
        )}
        <InputField
          label={t('productNameLabel')}
          name="name"
          required
          maxLength={500}
          placeholder={t('productNamePlaceholder')}
          defaultValue={product?.name}
        />
        <div className="form-grid">
          <InputField
            label={t('skuLabel')}
            name="sku"
            required
            placeholder={t('skuPlaceholder')}
            defaultValue={
              product?.sku || (product ? `NS-${String(product.id).padStart(5, '0')}` : '')
            }
          />
          <Select
            label={t('productTypeLabel')}
            name="productType"
            value={productType}
            onChange={(event) => setProductType(event.target.value)}
            options={catalogSelectOptions(productTypes, lang, productType)}
          />
          <Select
            label={t('sportLabel')}
            name="sport"
            value={sport}
            onChange={(event) => setSport(event.target.value)}
            options={catalogSelectOptions(sports, lang, sport)}
          />
          <Select
            label={t('brandLabel')}
            name="brand"
            value={brand}
            onChange={(event) => setBrand(event.target.value)}
            options={catalogSelectOptions(brands, lang, brand, ['Other'])}
          />
          <Select
            label={t('genderLabel')}
            name="gender"
            value={gender}
            onChange={(event) => setGender(event.target.value)}
            options={[
              ...(gender ? [] : [{ value: '', label: t('selectPlaceholder'), disabled: true }]),
              ...GENDER_OPTIONS.map((enValue) => {
                const value = lang === 'en' ? enValue : GENDER_OPTION_LABEL_TH[enValue] || enValue
                return { value, label: value }
              }),
            ]}
          />
          <Select
            label={t('categoryLabel')}
            name="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            options={catalogSelectOptions(categories, lang, category)}
          />
          <InputField
            label={t('priceLabel')}
            name="price"
            type="number"
            min="0"
            step="any"
            required
            defaultValue={product ? product.priceCents / 100 : undefined}
          />
        </div>
        <div className="field">
          <label>{t('descriptionLabel')}</label>
          <textarea
            className="input"
            name="description"
            required
            placeholder={t('descriptionPlaceholder')}
            defaultValue={product?.description}
          />
        </div>
        <div className="vendor-product-images">
          <div>
            <strong>{t('productImagesLabel')}</strong>
            <span className="muted">{t('productImagesHelp')}</span>
          </div>
          <div className="vendor-image-preview-grid">
            {displayedImages.map((image, index) => (
              <div
                className="vendor-image-preview"
                key={`${image.kind}-${image.index}-${image.url}`}
              >
                <div
                  className="vendor-image-preview__image"
                  role="img"
                  aria-label={t('productImageAria', { index: index + 1 })}
                  style={{ backgroundImage: `url(${image.url})` }}
                />
                {index === 0 && <span className="vendor-image-primary">{t('primaryBadge')}</span>}
                <button
                  type="button"
                  className="vendor-image-remove"
                  aria-label={t('removeProductImageAria', { index: index + 1 })}
                  onClick={() => {
                    if (image.kind === 'saved') removeSavedImage(image.index)
                    if (image.kind === 'external') removeExternalImage(image.index)
                    if (image.kind === 'file') removeSelectedImage(image.index)
                  }}
                >
                  <XMarkIcon aria-hidden="true" />
                </button>
              </div>
            ))}
            {displayedImages.length < 4 && (
              <label
                className="vendor-image-add"
                htmlFor="vendor-product-images"
                aria-label={t('addProductImagesAria')}
              >
                <PlusIcon aria-hidden="true" />
                <span>{t('addImage')}</span>
              </label>
            )}
          </div>
          <input
            id="vendor-product-images"
            className="vendor-image-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={loading || importing || displayedImages.length >= 4}
            aria-invalid={Boolean(imageError) || undefined}
            onChange={(event) => {
              selectImages(event.target.files)
              event.target.value = ''
            }}
          />
          {imageError && (
            <p className="buyer-ui-field__error" role="alert">
              {imageError}
            </p>
          )}
          {[0, 1, 2, 3].map((index) => (
            <input
              key={`external-image-${index}`}
              type="hidden"
              name={`imageUrl${index + 1}`}
              value={externalImages[index] || ''}
              readOnly
            />
          ))}
        </div>
        <div className="vendor-form-actions">
          <Button type="button" variant="neutral" onClick={close} disabled={loading || importing}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            loadingLabel={t('savingLabel')}
            disabled={importing}
          >
            {isEdit ? t('saveChanges') : t('publishProduct')}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
function CouponPanel({
  coupons,
  action,
}: {
  coupons: any[]
  action: (b: any) => Promise<boolean>
}) {
  const [loading, setLoading] = useState(false)
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const ok = await action({ action: 'coupon', ...Object.fromEntries(new FormData(form)) })
    setLoading(false)
    if (ok) form.reset()
  }
  return (
    <div className="panel">
      <h2>{t('promotionsAndCoupons')}</h2>
      <div className="table-wrap" style={{ margin: '18px 0' }}>
        <table>
          <thead>
            <tr>
              <th>{t('colCode')}</th>
              <th>{t('colType')}</th>
              <th>{t('valueLabel')}</th>
              <th>{t('colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id}>
                <td>
                  <b>{c.code}</b>
                </td>
                <td>{couponTypeLabel(c.type)}</td>
                <td>{c.type === 'PERCENT' ? `${c.value}%` : money(c.value)}</td>
                <td>
                  <span className="badge good">{t('filterActive')}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="vendor-form" onSubmit={submit}>
        <div className="form-grid">
          <InputField label={t('couponCodeLabel')} name="code" required />
          <Select
            label={t('discountTypeLabel')}
            name="type"
            options={[
              { value: 'PERCENT', label: t('percentageOption') },
              { value: 'FIXED', label: t('fixedAmountOption') },
            ]}
          />
          <InputField label={t('valueLabel')} name="value" type="number" min="0" required />
          <InputField
            label={t('minimumOrderLabel')}
            name="minimum"
            type="number"
            min="0"
            defaultValue="0"
          />
        </div>
        <Button type="submit" variant="primary" loading={loading} loadingLabel={t('creatingLabel')}>
          {t('createCoupon')}
        </Button>
      </form>
    </div>
  )
}
function ShopPanel({ shop, action }: { shop: any; action: (b: any) => Promise<boolean> }) {
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoError, setLogoError] = useState('')
  const logoPreview = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : shop.logoUrl || ''),
    [logoFile, shop.logoUrl],
  )
  useEffect(
    () => () => {
      if (logoFile && logoPreview) URL.revokeObjectURL(logoPreview)
    },
    [logoFile, logoPreview],
  )

  function selectLogo(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (
      !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setLogoFile(null)
      setLogoError(t('logoFormatError'))
      return
    }
    setLogoFile(file)
    setLogoError('')
  }

  async function logoPayload(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error(t('couldNotReadFile', { name: file.name })))
      reader.readAsDataURL(file)
    })
    return { name: file.name, type: file.type, data: dataUrl.split(',', 2)[1] || '' }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (logoError) return
    const formValues = Object.fromEntries(new FormData(e.currentTarget))
    setLoading(true)
    try {
      const logoImage = logoFile ? await logoPayload(logoFile) : undefined
      const ok = await action({ action: 'shop', ...formValues, logoImage })
      if (ok) setLogoFile(null)
    } catch (error) {
      setLogoError(error instanceof Error ? error.message : t('couldNotReadLogo'))
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="panel">
      <form className="vendor-form vendor-profile-form" onSubmit={submit}>
        <div className="vendor-shop-logo">
          <label
            className={`vendor-shop-logo__preview${logoPreview ? '' : ' vendor-shop-logo__preview--empty'}`}
            htmlFor="vendor-shop-logo"
            aria-label={t(logoPreview ? 'changeShopLogo' : 'selectShopLogo')}
            style={logoPreview ? { backgroundImage: `url(${logoPreview})` } : undefined}
          >
            {!logoPreview && (
              <span>
                {String(shop.name || 'S')
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}
            <input
              id="vendor-shop-logo"
              className="vendor-image-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={loading}
              aria-invalid={Boolean(logoError) || undefined}
              onChange={(event) => {
                selectLogo(event.target.files)
                event.target.value = ''
              }}
            />
          </label>
          <div className="vendor-shop-logo__content">
            {/* <div>
              <strong>Shop logo</strong>
              <span className="muted">
                Click the image to select a JPEG, PNG, WebP or GIF. Maximum 5 MB.
              </span>
            </div> */}
            {logoFile && (
              <button
                type="button"
                className="vendor-shop-logo__cancel"
                onClick={() => {
                  setLogoFile(null)
                  setLogoError('')
                }}
              >
                {t('cancel')}
              </button>
            )}
            {logoError && (
              <p className="buyer-ui-field__error" role="alert">
                {logoError}
              </p>
            )}
          </div>
        </div>
        <InputField label={t('shopNameLabel')} name="name" defaultValue={shop.name} required />
        <div className="field">
          <label>{t('descriptionLabel')}</label>
          <textarea className="input" name="description" defaultValue={shop.description} />
        </div>
        <InputField
          label={t('shopAddressLabel')}
          name="address"
          defaultValue={shop.address || ''}
          placeholder={t('shopAddressPlaceholder')}
        />
        <Button type="submit" variant="primary" loading={loading} loadingLabel={t('savingLabel')}>
          {t('saveProfile')}
        </Button>
      </form>
    </div>
  )
}
