'use client'

import { ShoppingBagIcon } from '@heroicons/react/24/solid'
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import BuyerShell from './BuyerShell'
import BuyerOrders, { type BuyerOrder } from './BuyerOrders'
import ShopIdentity from './ShopIdentity'
import { BUYER_TABS, PAYMENT_OPTIONS } from '../constants/options'
import { t, useLanguageSync, type BuyerTextKey } from '../locales'
import {
  Button,
  ButtonLink,
  Card,
  Checkbox,
  DataTable,
  EmptyState,
  InputField,
  LoadingIndicator,
  Radio,
  StatusToast,
  type StatusTone,
} from '@/UI'
import '../buyer.css'

type Address = {
  id: number
  label: string
  recipient: string
  line1: string
  city: string
  postalCode: string
  isDefault: boolean
}

type Order = BuyerOrder

type Product = {
  id: number
  name: string
  category: string
  color: string
  imageUrl: string
  priceCents: number
  shop: { name: string; logoUrl: string | null }
}

type Data = { name: string; email: string; addresses: Address[]; orders: Order[] }
type ToastState = { message: string; tone: StatusTone }
type BuyerAction = Record<string, unknown> & { action: string }

const money = (cents: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(cents / 100)

export default function BuyerDashboard({
  name,
  userId,
  initialTab,
}: {
  name: string
  userId: number
  initialTab: string
}) {
  useLanguageSync()
  const [tab, setTab] = useState(initialTab)
  const [data, setData] = useState<Data | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loadFailed, setLoadFailed] = useState(false)
  const [toast, setToast] = useState<ToastState>({ message: '', tone: 'info' })
  const [cart, setCart] = useState<number[]>([])
  const [selectedCart, setSelectedCart] = useState<number[]>([])
  const [pendingAction, setPendingAction] = useState('')
  const pendingRef = useRef(false)
  const toastTimer = useRef<number | undefined>(undefined)
  const router = useRouter()
  const cartKey = `northstar_cart_customer_${userId}`

  const showToast = useCallback((message: string, tone: StatusTone) => {
    window.clearTimeout(toastTimer.current)
    setToast({ message, tone })
    toastTimer.current = window.setTimeout(() => setToast({ message: '', tone: 'info' }), 2600)
  }, [])

  const load = useCallback(async () => {
    try {
      const [accountResponse, productsResponse] = await Promise.all([
        fetch('/api/customer'),
        fetch('/api/products'),
      ])
      if (!accountResponse.ok || !productsResponse.ok) throw new Error('load failed')
      const [accountData, productData] = await Promise.all([
        accountResponse.json(),
        productsResponse.json(),
      ])
      setData(accountData)
      setProducts(productData)
      setLoadFailed(false)
    } catch {
      setLoadFailed(true)
    }
  }, [])

  useEffect(() => {
    void load()
    try {
      const account = JSON.parse(localStorage.getItem(cartKey) || '[]')
      const transferable = ['northstar_cart_guest', 'northstar_cart'].flatMap((key) => {
        const value = JSON.parse(localStorage.getItem(key) || '[]')
        return Array.isArray(value) ? value : []
      })
      const merged = [...(Array.isArray(account) ? account : []), ...transferable]
      if (transferable.length) {
        localStorage.setItem(cartKey, JSON.stringify(merged))
        localStorage.removeItem('northstar_cart_guest')
        localStorage.removeItem('northstar_cart')
        window.dispatchEvent(new Event('northstar-cart-updated'))
      }
      setCart(merged)
      setSelectedCart(Array.from(new Set<number>(merged)))
    } catch {}
    return () => window.clearTimeout(toastTimer.current)
  }, [cartKey, load])

  useEffect(() => {
    if (tab !== 'Orders') return
    const timer = window.setInterval(() => void load(), 10000)
    return () => window.clearInterval(timer)
  }, [tab, load])

  async function action(body: BuyerAction, pendingKey: string, successKey: BuyerTextKey) {
    if (pendingRef.current) return false
    pendingRef.current = true
    setPendingAction(pendingKey)
    try {
      const response = await fetch('/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        showToast(typeof result.error === 'string' ? result.error : t('actionFailed'), 'error')
        return false
      }
      await load()
      showToast(t(successKey), 'success')
      return true
    } catch {
      showToast(t('actionFailed'), 'error')
      return false
    } finally {
      pendingRef.current = false
      setPendingAction('')
    }
  }

  async function checkout(details: { addressId: number; paymentMethod: string }) {
    if (!selectedCart.length) {
      showToast(t('selectProductsError'), 'warning')
      return false
    }
    const address = data?.addresses.find((value) => value.id === details.addressId)
    if (!address) {
      showToast(t('selectAddressError'), 'warning')
      return false
    }
    const selectedItems = cart.filter((id) => selectedCart.includes(id))
    const itemCounts = selectedItems.reduce<Record<number, number>>(
      (counts, id) => ({ ...counts, [id]: (counts[id] || 0) + 1 }),
      {},
    )
    const items = Object.entries(itemCounts).map(([id, quantity]) => ({
      productId: Number(id),
      quantity,
    }))
    const success = await action(
      {
        action: 'checkout',
        items,
        paymentMethod: details.paymentMethod,
        shippingAddress: `${address.recipient}, ${address.line1}, ${address.city} ${address.postalCode}`,
      },
      'checkout',
      'orderPlaced',
    )
    if (!success) return false
    const remaining = cart.filter((id) => !selectedCart.includes(id))
    setCart(remaining)
    setSelectedCart(Array.from(new Set(remaining)))
    if (remaining.length) localStorage.setItem(cartKey, JSON.stringify(remaining))
    else localStorage.removeItem(cartKey)
    window.dispatchEvent(new Event('northstar-cart-updated'))
    setTab('Orders')
    router.push('/account?tab=orders', { scroll: false })
    return true
  }

  if (!data) {
    return (
      <div className="buyer-scope buyer-main">
        {loadFailed ? (
          <EmptyState
            title={t('actionFailed')}
            action={
              <Button variant="primary" onClick={() => void load()}>
                {t('confirm')}
              </Button>
            }
          />
        ) : (
          <LoadingIndicator label={t('loadingAccount')} />
        )}
      </div>
    )
  }

  const pendingOrders = data.orders.filter(
    (order) => !['DELIVERED', 'CANCELLED'].includes(order.status),
  ).length
  const totalToPay = data.orders
    .filter((order) => order.status !== 'CANCELLED')
    .reduce((sum, order) => {
      const paidAmount = order.payments
        .filter((payment) => payment.status === 'PAID')
        .reduce((paymentSum, payment) => paymentSum + payment.amountCents, 0)
      return sum + Math.max(0, order.totalCents - paidAmount)
    }, 0)
  const activeLabel = BUYER_TABS.find((item) => item.value === tab)

  return (
    <BuyerShell name={name} active={tab} onTab={setTab}>
      {tab !== 'Orders' && (
        <div className="buyer-page-header">
          <div>
            <h1>{activeLabel ? t(activeLabel.labelKey) : tab}</h1>
          </div>
          <ButtonLink href="/" variant="primary">
            <ShoppingBagIcon className="buyer-button-icon" aria-hidden="true" />
            <span>{t('continueShopping')}</span>
          </ButtonLink>
        </div>
      )}
      {tab === 'Overview' && (
        <>
          <div className="buyer-stat-grid">
            <Stat
              label={t('totalOrders')}
              value={data.orders.length}
              description={t('totalOrdersHelp')}
            />
            <Stat label={t('inProgress')} value={pendingOrders} description={t('inProgressHelp')} />
            <Stat
              label={t('totalToPay')}
              value={money(totalToPay)}
              description={t('totalToPayHelp')}
            />
            <Stat
              label={t('savedAddresses')}
              value={data.addresses.length}
              description={t('savedAddressesHelp')}
            />
          </div>
          <Orders orders={data.orders} action={action} pendingAction={pendingAction} compact />
        </>
      )}
      {tab === 'Orders' && (
        <Orders orders={data.orders} action={action} pendingAction={pendingAction} />
      )}
      {tab === 'Addresses' && (
        <AddressPanel
          addresses={data.addresses}
          action={action}
          pending={pendingAction === 'address'}
        />
      )}
      {tab === 'Checkout' && (
        <CheckoutCart
          products={products}
          addresses={data.addresses}
          cart={cart}
          selected={selectedCart}
          setSelected={setSelectedCart}
          checkout={checkout}
          submitting={pendingAction === 'checkout'}
        />
      )}
      {tab === 'Profile' && (
        <Card className="buyer-panel">
          <h2 className="buyer-card-title">{t('profile')}</h2>
          <div className="buyer-form-grid">
            <InputField label={t('name')} value={data.name} readOnly />
            <InputField label={t('email')} value={data.email} readOnly />
          </div>
          <p className="buyer-help">{t('profileHelp')}</p>
        </Card>
      )}
      <StatusToast message={toast.message} tone={toast.tone} />
    </BuyerShell>
  )
}

function Stat({
  label,
  value,
  description,
}: {
  label: string
  value: string | number
  description: string
}) {
  return (
    <Card>
      <span className="buyer-stat-label">{label}</span>
      <p className="buyer-stat-help">{description}</p>
      <div className="buyer-stat-value">{value}</div>
    </Card>
  )
}

function Orders({
  orders,
  action,
  pendingAction,
  compact = false,
}: {
  orders: Order[]
  action: (body: BuyerAction, pendingKey: string, successKey: BuyerTextKey) => Promise<boolean>
  pendingAction: string
  compact?: boolean
}) {
  return (
    <BuyerOrders orders={orders} action={action} pendingAction={pendingAction} compact={compact} />
  )
}

function AddressPanel({
  addresses,
  action,
  pending,
}: {
  addresses: Address[]
  action: (body: BuyerAction, pendingKey: string, successKey: BuyerTextKey) => Promise<boolean>
  pending: boolean
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const success = await action(
      { action: 'address', ...Object.fromEntries(new FormData(form)), isDefault: true },
      'address',
      'addressAdded',
    )
    if (success) form.reset()
  }

  return (
    <Card className="buyer-panel">
      <h2 className="buyer-card-title">{t('deliveryAddresses')}</h2>
      <div className="buyer-address-list">
        {addresses.map((address) => (
          <Card key={address.id}>
            <b>
              {address.label}
              {address.isDefault ? ` · ${t('defaultAddress')}` : ''}
            </b>
            <div className="buyer-address-line">
              {address.recipient} — {address.line1}, {address.city} {address.postalCode}
            </div>
          </Card>
        ))}
      </div>
      <form onSubmit={submit}>
        <div className="buyer-form-grid">
          <InputField
            label={t('label')}
            name="label"
            required
            placeholder={t('labelPlaceholder')}
          />
          <InputField label={t('recipient')} name="recipient" required />
          <InputField label={t('street')} name="line1" required />
          <InputField label={t('city')} name="city" required />
          <InputField label={t('postalCode')} name="postalCode" required />
          <InputField label={t('phone')} name="phone" type="tel" />
        </div>
        <div className="buyer-actions">
          <Button
            type="submit"
            variant="secondary"
            loading={pending}
            loadingLabel={t('addingAddress')}
          >
            {t('addAddress')}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function CheckoutCart({
  products,
  addresses,
  cart,
  selected,
  setSelected,
  checkout,
  submitting,
}: {
  products: Product[]
  addresses: Address[]
  cart: number[]
  selected: number[]
  setSelected: (ids: number[]) => void
  checkout: (details: { addressId: number; paymentMethod: string }) => Promise<boolean>
  submitting: boolean
}) {
  const [step, setStep] = useState(1)
  const [addressId, setAddressId] = useState(
    addresses.find((address) => address.isDefault)?.id || addresses[0]?.id || 0,
  )
  const [paymentMethod, setPaymentMethod] = useState('CARD')
  const rows = products.filter((product) => cart.includes(product.id))
  const selectedRows = rows.filter((product) => selected.includes(product.id))
  const allSelected = rows.length > 0 && rows.every((product) => selected.includes(product.id))
  const subtotal = selectedRows.reduce(
    (sum, product) => sum + product.priceCents * cart.filter((id) => id === product.id).length,
    0,
  )
  const shipping = subtotal >= 10000 ? 0 : 900
  const total = subtotal + shipping
  const chosenAddress = addresses.find((address) => address.id === addressId)
  const steps: BuyerTextKey[] = ['productsStep', 'addressStep', 'paymentStep', 'confirmStep']

  function toggle(id: number) {
    setSelected(
      selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id],
    )
  }

  return (
    <Card className="buyer-panel">
      <div className="buyer-steps" aria-label={t('checkout')}>
        {steps.map((key, index) => (
          <div
            className={`buyer-step ${step === index + 1 ? 'buyer-step--active' : ''} ${step > index + 1 ? 'buyer-step--complete' : ''}`}
            key={key}
            aria-current={step === index + 1 ? 'step' : undefined}
          >
            <span>{step > index + 1 ? '✓' : index + 1}</span>
            <b>{t(key)}</b>
          </div>
        ))}
      </div>
      {!rows.length ? (
        <EmptyState
          title={t('cartEmptyTitle')}
          description={t('cartEmptyDescription')}
          action={
            <ButtonLink href="/" variant="primary">
              {t('continueShopping')}
            </ButtonLink>
          }
        />
      ) : (
        <>
          {step === 1 && (
            <div>
              <div className="buyer-section-header">
                <div>
                  <h2>{t('chooseProducts')}</h2>
                  <p className="buyer-help">{t('chooseProductsHelp')}</p>
                </div>
                <span className="buyer-status">{t('items', { count: cart.length })}</span>
              </div>
              <DataTable
                label={t('chooseProducts')}
                rows={rows}
                rowKey={(product) => product.id}
                emptyTitle={t('cartEmptyTitle')}
                columns={[
                  {
                    key: 'select',
                    header: '',
                    render: (product) => (
                      <Checkbox
                        hideLabel
                        label={t('selectProduct', { name: product.name })}
                        checked={selected.includes(product.id)}
                        onChange={() => toggle(product.id)}
                      />
                    ),
                  },
                  {
                    key: 'product',
                    header: t('product'),
                    render: (product) => (
                      <>
                        <b>{product.name}</b>
                        <br />
                        <span className="buyer-help">{product.category}</span>
                      </>
                    ),
                  },
                  {
                    key: 'shop',
                    header: t('shop'),
                    render: (product) => <ShopIdentity shop={product.shop} />,
                  },
                  {
                    key: 'quantity',
                    header: t('quantity'),
                    render: (product) => cart.filter((id) => id === product.id).length,
                  },
                  {
                    key: 'unit',
                    header: t('unitPrice'),
                    render: (product) => money(product.priceCents),
                  },
                  {
                    key: 'total',
                    header: t('total'),
                    render: (product) => (
                      <b>
                        {money(product.priceCents * cart.filter((id) => id === product.id).length)}
                      </b>
                    ),
                  },
                ]}
              />
              <div className="buyer-actions">
                <Checkbox
                  label={t('selectAllProducts')}
                  checked={allSelected}
                  onChange={() => setSelected(allSelected ? [] : rows.map((product) => product.id))}
                />
                <Button variant="primary" onClick={() => setStep(2)} disabled={!selected.length}>
                  {t('next')}
                </Button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <div className="buyer-section-header">
                <div>
                  <h2>{t('deliveryAddress')}</h2>
                  <p className="buyer-help">{t('deliveryAddressHelp')}</p>
                </div>
                <ButtonLink href="/account?tab=addresses" variant="secondary" size="compact">
                  {t('addAddress')}
                </ButtonLink>
              </div>
              {addresses.length ? (
                <div className="buyer-option-grid">
                  {addresses.map((address) => (
                    <Card
                      key={address.id}
                      className={`buyer-option-card ${addressId === address.id ? 'buyer-option-card--selected' : ''}`}
                    >
                      <Radio
                        label={`${address.label}${address.isDefault ? ` · ${t('defaultAddress')}` : ''}`}
                        name="address"
                        checked={addressId === address.id}
                        onChange={() => setAddressId(address.id)}
                      />
                      <small>
                        {address.recipient}
                        <br />
                        {address.line1}, {address.city} {address.postalCode}
                      </small>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState title={t('noAddressTitle')} description={t('noAddressDescription')} />
              )}
              <StepActions back={() => setStep(1)} next={() => setStep(3)} disabled={!addressId} />
            </div>
          )}
          {step === 3 && (
            <div>
              <div className="buyer-section-header">
                <div>
                  <h2>{t('paymentMethod')}</h2>
                  <p className="buyer-help">{t('paymentMethodHelp')}</p>
                </div>
              </div>
              <div className="buyer-option-grid buyer-payment-grid">
                {PAYMENT_OPTIONS.map((option) => (
                  <Card
                    key={option.value}
                    className={`buyer-option-card ${paymentMethod === option.value ? 'buyer-option-card--selected' : ''}`}
                  >
                    <Radio
                      label={t(option.labelKey)}
                      name="payment"
                      checked={paymentMethod === option.value}
                      onChange={() => setPaymentMethod(option.value)}
                    />
                    <small>{t(option.descriptionKey)}</small>
                  </Card>
                ))}
              </div>
              <StepActions back={() => setStep(2)} next={() => setStep(4)} />
            </div>
          )}
          {step === 4 && (
            <div>
              <div className="buyer-section-header">
                <div>
                  <h2>{t('confirmOrder')}</h2>
                  <p className="buyer-help">{t('confirmOrderHelp')}</p>
                </div>
              </div>
              <div className="buyer-confirm-grid">
                <Card>
                  <span className="buyer-summary-label">{t('productsStep')}</span>
                  <p>
                    <b>
                      {t('selectedUnits', {
                        products: selectedRows.length,
                        units: selectedRows.reduce(
                          (sum, product) => sum + cart.filter((id) => id === product.id).length,
                          0,
                        ),
                      })}
                    </b>
                  </p>
                  {selectedRows.map((product) => (
                    <small key={product.id}>
                      {product.name} × {cart.filter((id) => id === product.id).length}
                      <br />
                    </small>
                  ))}
                </Card>
                <Card>
                  <span className="buyer-summary-label">{t('deliveryAddress')}</span>
                  <p>
                    <b>{chosenAddress?.label}</b>
                  </p>
                  <small>
                    {chosenAddress?.recipient}
                    <br />
                    {chosenAddress?.line1}, {chosenAddress?.city} {chosenAddress?.postalCode}
                  </small>
                </Card>
                <Card>
                  <span className="buyer-summary-label">{t('payment')}</span>
                  <p>
                    <b>
                      {t(
                        PAYMENT_OPTIONS.find((option) => option.value === paymentMethod)
                          ?.labelKey || 'cardPayment',
                      )}
                    </b>
                  </p>
                  <small>
                    {t(paymentMethod === 'COD' ? 'paymentPendingHelp' : 'paymentConfirmedHelp')}
                  </small>
                </Card>
                <Card>
                  <span className="buyer-summary-label">{t('orderTotal')}</span>
                  <div className="buyer-summary-row">
                    <span>{t('subtotal')}</span>
                    <b>{money(subtotal)}</b>
                  </div>
                  <div className="buyer-summary-row">
                    <span>{t('shipping')}</span>
                    <b>{shipping ? money(shipping) : t('free')}</b>
                  </div>
                  <strong className="buyer-order-total">{money(total)}</strong>
                </Card>
              </div>
              <div className="buyer-actions">
                <Button variant="neutral" onClick={() => setStep(3)} disabled={submitting}>
                  {t('back')}
                </Button>
                <Button
                  variant="primary"
                  loading={submitting}
                  loadingLabel={t('placingOrder')}
                  onClick={() => void checkout({ addressId, paymentMethod })}
                >
                  {t('placeOrder')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

function StepActions({
  back,
  next,
  disabled = false,
}: {
  back: () => void
  next: () => void
  disabled?: boolean
}) {
  return (
    <div className="buyer-actions">
      <Button variant="neutral" onClick={back}>
        {t('back')}
      </Button>
      <Button variant="primary" onClick={next} disabled={disabled}>
        {t('next')}
      </Button>
    </div>
  )
}
