import type { BuyerTextKey } from '../locales'

export const BUYER_TABS = [
  { value: 'Overview', labelKey: 'overview' },
  { value: 'Orders', labelKey: 'orders' },
  { value: 'Addresses', labelKey: 'addresses' },
  { value: 'Checkout', labelKey: 'checkout' },
  { value: 'Profile', labelKey: 'profile' },
] as const satisfies ReadonlyArray<{ value: string; labelKey: BuyerTextKey }>

export const ORDER_TABS = [
  { value: 'all', labelKey: 'allOrders' },
  { value: 'processing', labelKey: 'processingOrders' },
  { value: 'success', labelKey: 'successfulOrders' },
  { value: 'cancelled', labelKey: 'cancelledOrders' },
] as const satisfies ReadonlyArray<{ value: string; labelKey: BuyerTextKey }>

export type OrderTabValue = (typeof ORDER_TABS)[number]['value']

export const PAYMENT_OPTIONS = [
  { value: 'CARD', labelKey: 'cardPayment', descriptionKey: 'cardPaymentHelp' },
  { value: 'BANK', labelKey: 'bankPayment', descriptionKey: 'bankPaymentHelp' },
  { value: 'COD', labelKey: 'codPayment', descriptionKey: 'codPaymentHelp' },
] as const satisfies ReadonlyArray<{
  value: string
  labelKey: BuyerTextKey
  descriptionKey: BuyerTextKey
}>
