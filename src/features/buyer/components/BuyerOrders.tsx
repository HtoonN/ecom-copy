'use client'

import {
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  PhotoIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon, ShoppingBagIcon } from '@heroicons/react/24/solid'
import {
  useCallback,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { ORDER_TABS, type OrderTabValue } from '../constants/options'
import { t, useLanguageSync, type BuyerTextKey } from '../locales'
import { recordProductView } from '../record-product-view'
import ShopIdentity from './ShopIdentity'
import ProductDetailsDialog from './ProductDetailsDialog'
import { Button, ButtonLink, Card, Dialog, EmptyState, IconButton, InputField, Radio } from '@/UI'

type OrderProduct = {
  id: number
  name: string
  slug: string
  category: string
  description: string
  imageUrls: string[]
  priceCents: number
  shop: { name: string; slug: string; logoUrl: string | null }
}

type OrderItem = {
  id: number
  productId: number
  quantity: number
  unitPriceCents: number
  product: OrderProduct
}

export type BuyerOrder = {
  id: number
  reference: string
  createdAt: string
  updatedAt: string
  status: string
  paymentStatus: string
  subtotalCents: number
  discountCents: number
  shippingCents: number
  totalCents: number
  shippingAddress: string
  trackingNumber: string | null
  items: OrderItem[]
  payments: Array<{
    id: number
    reference: string
    provider: string
    amountCents: number
    status: string
    createdAt: string
  }>
  refunds: Array<{
    id: number
    status: string
    createdAt: string
    updatedAt: string
  }>
}

type BuyerAction = Record<string, unknown> & { action: string }
type PaymentMethod = 'CARD' | 'BANK'
type PaymentForm = {
  cardholder: string
  cardNumber: string
  expiry: string
  securityCode: string
  bankAccountName: string
  transferReference: string
}
type PaymentErrors = Partial<Record<keyof PaymentForm, string>>

const ORDER_PROGRESS = ['PENDING', 'ACCEPTED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const

const EMPTY_PAYMENT_FORM: PaymentForm = {
  cardholder: '',
  cardNumber: '',
  expiry: '',
  securityCode: '',
  bankAccountName: '',
  transferReference: '',
}

const money = (cents: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(cents / 100)

const dateTime = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

const dateOnly = (value: Date) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(value)

function orderStatus(value: string) {
  const keys: Record<string, BuyerTextKey> = {
    PENDING: 'orderStatusPending',
    ACCEPTED: 'orderStatusAccepted',
    PROCESSING: 'orderStatusProcessing',
    SHIPPED: 'orderStatusShipped',
    DELIVERED: 'orderStatusDelivered',
    CANCELLED: 'orderStatusCancelled',
  }
  return keys[value] ? t(keys[value]) : value
}

function paymentStatus(value: string) {
  const keys: Record<string, BuyerTextKey> = {
    PENDING: 'paymentStatusPending',
    PAID: 'paymentStatusPaid',
    FAILED: 'paymentStatusFailed',
    REFUNDED: 'paymentStatusRefunded',
  }
  return keys[value] ? t(keys[value]) : value
}

function statusTone(order: BuyerOrder) {
  if (order.paymentStatus === 'FAILED') return 'buyer-status--cancelled'
  const tones: Record<string, string> = {
    PENDING: 'buyer-status--pending',
    ACCEPTED: 'buyer-status--accepted',
    PROCESSING: 'buyer-status--processing',
    SHIPPED: 'buyer-status--shipped',
    DELIVERED: 'buyer-status--delivered',
    CANCELLED: 'buyer-status--cancelled',
  }
  return tones[order.status] || 'buyer-status--pending'
}

function matchesTab(order: BuyerOrder, tab: OrderTabValue) {
  if (tab === 'success') return order.status === 'DELIVERED'
  if (tab === 'cancelled') return order.status === 'CANCELLED' || order.paymentStatus === 'FAILED'
  if (tab === 'processing') {
    return !['DELIVERED', 'CANCELLED'].includes(order.status) && order.paymentStatus !== 'FAILED'
  }
  return true
}

function estimatedDelivery(order: BuyerOrder) {
  if (order.status === 'CANCELLED' || order.paymentStatus === 'FAILED') return t('notApplicable')
  const estimate = new Date(order.createdAt)
  estimate.setDate(estimate.getDate() + 5)
  return dateOnly(estimate)
}

function totalItems(order: BuyerOrder) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0)
}

export default function BuyerOrders({
  orders,
  action,
  pendingAction,
  compact = false,
}: {
  orders: BuyerOrder[]
  action: (body: BuyerAction, pendingKey: string, successKey: BuyerTextKey) => Promise<boolean>
  pendingAction: string
  compact?: boolean
}) {
  useLanguageSync()
  const [activeTab, setActiveTab] = useState<OrderTabValue>('processing')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [selectedOrderProduct, setSelectedOrderProduct] = useState<OrderProduct | null>(null)
  const [statusOrder, setStatusOrder] = useState<BuyerOrder | null>(null)
  const [paymentOrder, setPaymentOrder] = useState<BuyerOrder | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD')
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(EMPTY_PAYMENT_FORM)
  const [paymentErrors, setPaymentErrors] = useState<PaymentErrors>({})
  const visibleOrders = useMemo(
    () => orders.filter((order) => matchesTab(order, activeTab)),
    [activeTab, orders],
  )
  const paymentOutstanding = paymentOrder
    ? Math.max(
        0,
        paymentOrder.totalCents -
          paymentOrder.payments
            .filter((payment) => payment.status === 'PAID')
            .reduce((sum, payment) => sum + payment.amountCents, 0),
      )
    : 0

  function openProductDetails(product: OrderProduct) {
    recordProductView(product.id)
    setSelectedOrderProduct(product)
  }

  function selectOrderTab(value: OrderTabValue) {
    if (value !== activeTab) {
      setExpanded(null)
      setSelectedOrderProduct(null)
      setStatusOrder(null)
    }
    setActiveTab(value)
  }

  function moveOrderTab(event: KeyboardEvent<HTMLButtonElement>, current: number) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? ORDER_TABS.length - 1
          : (current + (event.key === 'ArrowRight' ? 1 : -1) + ORDER_TABS.length) %
            ORDER_TABS.length
    const nextTab = ORDER_TABS[nextIndex]
    selectOrderTab(nextTab.value)
    document.getElementById(`order-tab-${nextTab.value}`)?.focus()
  }

  function openPayment(order: BuyerOrder) {
    setPaymentOrder(order)
    setPaymentMethod('CARD')
    setPaymentForm(EMPTY_PAYMENT_FORM)
    setPaymentErrors({})
  }

  const closePayment = useCallback(() => {
    if (paymentOrder && pendingAction === `pay-${paymentOrder.id}`) return
    setPaymentOrder(null)
    setPaymentErrors({})
  }, [paymentOrder, pendingAction])

  function updatePaymentField(field: keyof PaymentForm, value: string) {
    setPaymentForm((current) => ({ ...current, [field]: value }))
    setPaymentErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!paymentOrder) return
    const errors: PaymentErrors = {}
    if (paymentMethod === 'CARD') {
      if (paymentForm.cardholder.trim().length < 2) errors.cardholder = t('cardholderRequired')
      if (paymentForm.cardNumber.replace(/\D/g, '').length !== 16) {
        errors.cardNumber = t('cardNumberInvalid')
      }
      if (!/^\d{2}\/\d{2}$/.test(paymentForm.expiry)) errors.expiry = t('expiryInvalid')
      if (!/^\d{3,4}$/.test(paymentForm.securityCode)) {
        errors.securityCode = t('securityCodeInvalid')
      }
    } else {
      if (paymentForm.bankAccountName.trim().length < 2) {
        errors.bankAccountName = t('bankAccountRequired')
      }
      if (paymentForm.transferReference.trim().length < 4) {
        errors.transferReference = t('transferReferenceRequired')
      }
    }
    setPaymentErrors(errors)
    if (Object.keys(errors).length) return
    const success = await action(
      { action: 'pay', orderId: paymentOrder.id, paymentMethod },
      `pay-${paymentOrder.id}`,
      'orderPaid',
    )
    if (success) setPaymentOrder(null)
  }

  return (
    <section className="buyer-orders" aria-labelledby="buyer-orders-title">
      <div className="buyer-section-header">
        <div>
          <h2 id="buyer-orders-title">{compact ? t('recentOrders') : t('myOrders')}</h2>
          {!compact && <p className="buyer-help">{t('ordersDescription')}</p>}
        </div>
        {!compact && (
          <ButtonLink href="/" variant="primary">
            <ShoppingBagIcon className="buyer-button-icon" aria-hidden="true" />
            <span>{t('continueShopping')}</span>
          </ButtonLink>
        )}
      </div>

      {!compact && (
        <div className="buyer-order-tabs" role="tablist" aria-label={t('orderTabsLabel')}>
          {ORDER_TABS.map((tab, index) => {
            const count = orders.filter((order) => matchesTab(order, tab.value)).length
            const selected = activeTab === tab.value
            return (
              <button
                key={tab.value}
                id={`order-tab-${tab.value}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="buyer-order-list"
                tabIndex={selected ? 0 : -1}
                className="buyer-order-tab"
                onClick={() => selectOrderTab(tab.value)}
                onKeyDown={(event) => moveOrderTab(event, index)}
              >
                <span>{t(tab.labelKey)}</span>
                <span className="buyer-order-tab-count" aria-label={t('orderCount', { count })}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div
        id="buyer-order-list"
        role={!compact ? 'tabpanel' : undefined}
        aria-labelledby={!compact ? `order-tab-${activeTab}` : undefined}
        className="buyer-order-list"
      >
        {visibleOrders.length ? (
          visibleOrders.slice(0, compact ? 5 : undefined).map((order) => {
            const isExpanded = expanded === order.id
            const paidAmount = order.payments
              .filter((payment) => payment.status === 'PAID')
              .reduce((sum, payment) => sum + payment.amountCents, 0)
            const isPaid = paidAmount >= order.totalCents
            const canPay = !isPaid && order.status !== 'CANCELLED'
            const wasPaid =
              ['PAID', 'REFUNDED'].includes(order.paymentStatus) ||
              order.payments.some((payment) => ['PAID', 'REFUNDED'].includes(payment.status))
            const isRefunded =
              order.paymentStatus === 'REFUNDED' ||
              order.refunds.some((refund) => refund.status === 'APPROVED')
            const showRefundStatus = order.status === 'CANCELLED' && wasPaid
            return (
              <Card className="buyer-order-card" key={order.id}>
                <div className="buyer-order-card-header">
                  <div className="buyer-order-identity">
                    <span className="buyer-order-eyebrow">{t('orderId')}</span>
                    <strong>{order.reference}</strong>
                    <button
                      type="button"
                      className="buyer-order-status-trigger"
                      aria-label={t('viewOrderProgress', { reference: order.reference })}
                      onClick={() => setStatusOrder(order)}
                    >
                      <span className={`buyer-status ${statusTone(order)}`}>
                        {orderStatus(order.status)}
                      </span>
                    </button>
                  </div>
                  <span className="buyer-order-date-cell">{dateTime(order.createdAt)}</span>
                  <span className="buyer-order-items-cell">
                    {t('items', { count: totalItems(order) })}
                  </span>
                  <strong className="buyer-order-total-cell">{money(order.totalCents)}</strong>
                  <div className="buyer-order-payment-cell">
                    {showRefundStatus ? (
                      <span className="buyer-payment-badge-static">
                        <span
                          className={`buyer-status ${
                            isRefunded ? 'buyer-status--delivered' : 'buyer-status--processing'
                          }`}
                        >
                          {t(isRefunded ? 'refunded' : 'awaitingRefund')}
                        </span>
                      </span>
                    ) : isPaid ? (
                      <span className="buyer-payment-badge-static">
                        <span className="buyer-status buyer-status--delivered">
                          {t('paymentStatusPaid')}
                        </span>
                      </span>
                    ) : (
                      canPay && (
                        <button
                          type="button"
                          className="buyer-payment-badge-button"
                          disabled={Boolean(pendingAction)}
                          onClick={() => openPayment(order)}
                        >
                          <span className="buyer-status buyer-status--processing">
                            {t('waitToPay')}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                  <div className="buyer-order-detail-cell">
                    <IconButton
                      className="buyer-order-detail-button"
                      label={t(isExpanded ? 'hideOrderDetails' : 'viewOrderDetails')}
                      aria-expanded={isExpanded}
                      onClick={() => setExpanded(isExpanded ? null : order.id)}
                    >
                      {isExpanded ? (
                        <ChevronUpIcon className="buyer-order-detail-icon" />
                      ) : (
                        <ChevronDownIcon className="buyer-order-detail-icon" />
                      )}
                    </IconButton>
                  </div>
                </div>

                {isExpanded && (
                  <OrderDetails
                    order={order}
                    onProductSelect={openProductDetails}
                    onStatusSelect={setStatusOrder}
                  />
                )}

              </Card>
            )
          })
        ) : (
          <Card>
            <EmptyState
              title={t(activeTab === 'all' ? 'noOrdersTitle' : 'noFilteredOrdersTitle')}
              description={t(
                activeTab === 'all' ? 'noOrdersDescription' : 'noFilteredOrdersDescription',
              )}
            />
          </Card>
        )}
      </div>

      <Dialog
        open={Boolean(paymentOrder)}
        onClose={closePayment}
        title={t('completePayment')}
        closeLabel={t('closeDialog')}
        description={t('mockPaymentDescription')}
      >
        {paymentOrder && (
          <form className="buyer-payment-dialog" onSubmit={(event) => void submitPayment(event)}>
            <Card className="buyer-payment-dialog-summary">
              <div>
                <span className="buyer-summary-label">{t('orderId')}</span>
                <strong>{paymentOrder.reference}</strong>
              </div>
              <div>
                <span className="buyer-summary-label">{t('amountDue')}</span>
                <strong>{money(paymentOutstanding)}</strong>
              </div>
            </Card>

            <fieldset className="buyer-payment-method-fieldset">
              <legend>{t('paymentMethod')}</legend>
              <div className="buyer-payment-method-options">
                <Card
                  className={`buyer-option-card ${paymentMethod === 'CARD' ? 'buyer-option-card--selected' : ''}`}
                >
                  <Radio
                    label={t('cardPayment')}
                    name="dialog-payment-method"
                    value="CARD"
                    checked={paymentMethod === 'CARD'}
                    onChange={() => {
                      setPaymentMethod('CARD')
                      setPaymentErrors({})
                    }}
                  />
                  <small>{t('cardPaymentHelp')}</small>
                </Card>
                <Card
                  className={`buyer-option-card ${paymentMethod === 'BANK' ? 'buyer-option-card--selected' : ''}`}
                >
                  <Radio
                    label={t('bankPayment')}
                    name="dialog-payment-method"
                    value="BANK"
                    checked={paymentMethod === 'BANK'}
                    onChange={() => {
                      setPaymentMethod('BANK')
                      setPaymentErrors({})
                    }}
                  />
                  <small>{t('bankPaymentHelp')}</small>
                </Card>
              </div>
            </fieldset>

            {paymentMethod === 'CARD' ? (
              <div className="buyer-payment-fields">
                <InputField
                  className="buyer-payment-field--wide"
                  label={t('cardholderName')}
                  autoComplete="cc-name"
                  value={paymentForm.cardholder}
                  error={paymentErrors.cardholder}
                  onChange={(event) => updatePaymentField('cardholder', event.target.value)}
                />
                <InputField
                  className="buyer-payment-field--wide"
                  label={t('cardNumber')}
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                  value={paymentForm.cardNumber}
                  error={paymentErrors.cardNumber}
                  onChange={(event) => updatePaymentField('cardNumber', event.target.value)}
                />
                <InputField
                  label={t('expiryDate')}
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  maxLength={5}
                  value={paymentForm.expiry}
                  error={paymentErrors.expiry}
                  onChange={(event) => updatePaymentField('expiry', event.target.value)}
                />
                <InputField
                  label={t('securityCode')}
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="CVV"
                  maxLength={4}
                  value={paymentForm.securityCode}
                  error={paymentErrors.securityCode}
                  onChange={(event) => updatePaymentField('securityCode', event.target.value)}
                />
              </div>
            ) : (
              <div className="buyer-payment-fields">
                <InputField
                  className="buyer-payment-field--wide"
                  label={t('bankAccountName')}
                  autoComplete="name"
                  value={paymentForm.bankAccountName}
                  error={paymentErrors.bankAccountName}
                  onChange={(event) => updatePaymentField('bankAccountName', event.target.value)}
                />
                <InputField
                  className="buyer-payment-field--wide"
                  label={t('transferReference')}
                  value={paymentForm.transferReference}
                  error={paymentErrors.transferReference}
                  onChange={(event) => updatePaymentField('transferReference', event.target.value)}
                />
              </div>
            )}

            <p className="buyer-payment-notice">{t('mockPaymentNotice')}</p>
            <div className="buyer-ui-dialog__actions">
              <Button variant="neutral" disabled={Boolean(pendingAction)} onClick={closePayment}>
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={pendingAction === `pay-${paymentOrder.id}`}
                loadingLabel={t('paying')}
                disabled={Boolean(pendingAction)}
              >
                {t('payAmount', { amount: money(paymentOutstanding) })}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      <ProductDetailsDialog
        product={selectedOrderProduct}
        onClose={() => setSelectedOrderProduct(null)}
      />

      <Dialog
        open={Boolean(statusOrder)}
        onClose={() => setStatusOrder(null)}
        title={t('orderProgress')}
        closeLabel={t('closeDialog')}
        description={
          statusOrder ? t('orderProgressDescription', { reference: statusOrder.reference }) : ''
        }
      >
        {statusOrder && <OrderProgress order={statusOrder} />}
      </Dialog>
    </section>
  )
}

function OrderProgress({ order }: { order: BuyerOrder }) {
  const steps: readonly string[] =
    order.status === 'CANCELLED' ? ['PENDING', 'CANCELLED'] : ORDER_PROGRESS
  const currentIndex = Math.max(0, steps.indexOf(order.status))

  return (
    <ol className="buyer-order-progress">
      {steps.map((step, index) => {
        const state =
          index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'upcoming'
        const timestamp =
          step === 'PENDING'
            ? dateTime(order.createdAt)
            : step === order.status
              ? dateTime(order.updatedAt)
              : t('notAvailable')
        return (
          <li
            className={`buyer-order-progress-step buyer-order-progress-step--${state}${
              step === 'CANCELLED' ? ' buyer-order-progress-step--cancelled' : ''
            }`}
            key={step}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="buyer-order-progress-icon" aria-hidden="true">
              {state === 'completed' ? (
                <CheckCircleIcon />
              ) : step === 'CANCELLED' ? (
                <XCircleIcon />
              ) : (
                <ClockIcon />
              )}
            </span>
            <div>
              <strong>{orderStatus(step)}</strong>
              <span>{timestamp}</span>
            </div>
            <span className="buyer-order-progress-state">
              {t(
                state === 'completed'
                  ? 'completedStatus'
                  : state === 'current'
                    ? 'currentStatus'
                    : 'upcomingStatus',
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function OrderDetails({
  order,
  onProductSelect,
  onStatusSelect,
}: {
  order: BuyerOrder
  onProductSelect: (product: OrderProduct) => void
  onStatusSelect: (order: BuyerOrder) => void
}) {
  const payment = order.payments[0]
  const courier = order.trackingNumber ? t('standardCourier') : t('notAssigned')

  return (
    <div className="buyer-order-details">
      <section aria-labelledby={`order-info-${order.id}`}>
        <h4 id={`order-info-${order.id}`}>{t('orderInformation')}</h4>
        <dl className="buyer-detail-grid">
          <Detail label={t('orderId')} value={order.reference} />
          <Detail label={t('orderDateTime')} value={dateTime(order.createdAt)} />
          <Detail
            label={t('orderStatus')}
            value={
              <button
                type="button"
                className="buyer-order-status-trigger"
                aria-label={t('viewOrderProgress', { reference: order.reference })}
                onClick={() => onStatusSelect(order)}
              >
                <span className={`buyer-status ${statusTone(order)}`}>
                  {orderStatus(order.status)}
                </span>
              </button>
            }
          />
          <Detail label={t('totalAmount')} value={money(order.totalCents)} />
          <Detail label={t('totalItems')} value={String(totalItems(order))} />
          <Detail label={t('estimatedDeliveryDate')} value={estimatedDelivery(order)} />
          <Detail label={t('shippingAddress')} value={order.shippingAddress} wide />
          <Detail
            label={t('courierTracking')}
            value={`${courier} · ${order.trackingNumber || t('notAvailable')}`}
            wide
          />
        </dl>
      </section>

      <section aria-labelledby={`product-info-${order.id}`}>
        <h4 id={`product-info-${order.id}`}>{t('productInformation')}</h4>
        <div className="buyer-order-products">
          {order.items.map((item) => {
            const productImage = item.product.imageUrls[0]
            return (
              <article className="buyer-order-product" key={item.id}>
                <div
                  className="buyer-product-image buyer-order-product-image"
                  role="img"
                  aria-label={t('productImageAlt', { name: item.product.name })}
                  style={{
                    backgroundImage: productImage ? `url(${productImage})` : undefined,
                  }}
                >
                  <button
                    type="button"
                    className="buyer-product-detail-trigger"
                    aria-label={t('viewProductDetails', { name: item.product.name })}
                    onClick={() => onProductSelect(item.product)}
                  />
                  {!productImage && (
                    <PhotoIcon className="buyer-product-placeholder-icon" aria-hidden="true" />
                  )}
                </div>
                <div className="buyer-order-product-main">
                  <strong>
                    <button
                      type="button"
                      className="buyer-product-title-button"
                      onClick={() => onProductSelect(item.product)}
                    >
                      {item.product.name}
                    </button>
                  </strong>
                  <ShopIdentity shop={item.product.shop} href={`/shop/${item.product.shop.slug}`} />
                  <span>
                    {t('skuVariant')}: NS-{String(item.product.id).padStart(5, '0')} ·{' '}
                    {item.product.category}
                  </span>
                </div>
                <dl className="buyer-product-price-grid">
                  <Detail label={t('quantity')} value={String(item.quantity)} />
                  <Detail label={t('unitPrice')} value={money(item.unitPriceCents)} />
                  <Detail
                    label={t('subtotal')}
                    value={money(item.unitPriceCents * item.quantity)}
                  />
                </dl>
              </article>
            )
          })}
        </div>
      </section>

      <section aria-labelledby={`payment-info-${order.id}`}>
        <h4 id={`payment-info-${order.id}`}>{t('paymentInformation')}</h4>
        <dl className="buyer-detail-grid">
          <Detail label={t('paymentStatus')} value={paymentStatus(order.paymentStatus)} />
          <Detail label={t('paymentMethod')} value={payment?.provider || t('awaitingPayment')} />
          <Detail label={t('transactionId')} value={payment?.reference || t('notAvailable')} />
          <Detail
            label={t('paymentDate')}
            value={payment ? dateTime(payment.createdAt) : t('notAvailable')}
          />
          <Detail label={t('itemsSubtotal')} value={money(order.subtotalCents)} />
          <Detail label={t('orderDiscount')} value={`−${money(order.discountCents)}`} />
          <Detail
            label={t('shippingFee')}
            value={order.shippingCents ? money(order.shippingCents) : t('free')}
          />
          <Detail label={t('amountPaid')} value={payment ? money(payment.amountCents) : money(0)} />
        </dl>
      </section>
    </div>
  )
}

function Detail({
  label,
  value,
  wide = false,
}: {
  label: string
  value: ReactNode
  wide?: boolean
}) {
  return (
    <div className={wide ? 'buyer-detail buyer-detail--wide' : 'buyer-detail'}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
