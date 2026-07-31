'use client'

import {
  ClipboardDocumentListIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  CreditCardIcon,
  MapPinIcon,
  Squares2X2Icon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import {
  ClipboardDocumentListIcon as ClipboardDocumentListSolidIcon,
  CreditCardIcon as CreditCardSolidIcon,
  MapPinIcon as MapPinSolidIcon,
  Squares2X2Icon as Squares2X2SolidIcon,
  UserCircleIcon as UserCircleSolidIcon,
} from '@heroicons/react/24/solid'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { BUYER_TABS } from '../constants/options'
import { t, useLanguageSync } from '../locales'
import { Button, ConfirmationDialog, IconButton, StatusToast } from '@/UI'
import '../buyer.css'

const BUYER_TAB_ICONS = {
  Overview: Squares2X2Icon,
  Orders: ClipboardDocumentListIcon,
  Addresses: MapPinIcon,
  Checkout: CreditCardIcon,
  Profile: UserCircleIcon,
}

const BUYER_TAB_SOLID_ICONS = {
  Overview: Squares2X2SolidIcon,
  Orders: ClipboardDocumentListSolidIcon,
  Addresses: MapPinSolidIcon,
  Checkout: CreditCardSolidIcon,
  Profile: UserCircleSolidIcon,
}

export default function BuyerShell({
  name,
  active,
  onTab,
  children,
}: {
  name: string
  active: string
  onTab: (tab: string) => void
  children: ReactNode
}) {
  useLanguageSync()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [signOutPending, setSignOutPending] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)

  function selectTab(tab: string) {
    onTab(tab)
    router.push(`/account?tab=${encodeURIComponent(tab.toLowerCase().replaceAll(' ', '-'))}`, {
      scroll: false,
    })
  }

  async function signOut() {
    if (signOutPending) return
    setSignOutPending(true)
    setSignOutError('')
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok) throw new Error('sign out failed')
      router.push('/login')
      router.refresh()
    } catch {
      setSignOutError(t('signOutFailed'))
      setSignOutPending(false)
    }
  }

  return (
    <div
      className={`buyer-scope buyer-layout${sidebarCollapsed ? ' buyer-layout--sidebar-collapsed' : ''}`}
    >
      <aside className={`buyer-sidebar${sidebarCollapsed ? ' buyer-sidebar--collapsed' : ''}`}>
        <div className="buyer-sidebar-header">
          <Link href="/" className="buyer-brand" aria-label={t('brandName')}>
            <span className="buyer-brand-full">{t('brandName')}</span>
            <span className="buyer-brand-compact" aria-hidden="true">
              N
            </span>
          </Link>
          <IconButton
            className="buyer-sidebar-toggle"
            label={t(sidebarCollapsed ? 'expandSidebar' : 'collapseSidebar')}
            aria-expanded={!sidebarCollapsed}
            onClick={() => setSidebarCollapsed((value) => !value)}
          >
            {sidebarCollapsed ? (
              <ChevronDoubleRightIcon className="buyer-sidebar-icon" />
            ) : (
              <ChevronDoubleLeftIcon className="buyer-sidebar-icon" />
            )}
          </IconButton>
        </div>
        <nav className="buyer-sidebar-nav" aria-label={t('customerAccount')}>
          {BUYER_TABS.map((tab) => {
            const selected = active === tab.value
            const TabIcon = selected ? BUYER_TAB_SOLID_ICONS[tab.value] : BUYER_TAB_ICONS[tab.value]
            return (
              <button
                key={tab.value}
                className="buyer-sidebar-button"
                aria-current={selected ? 'page' : undefined}
                onClick={() => selectTab(tab.value)}
              >
                <TabIcon className="buyer-sidebar-icon" aria-hidden="true" />
                <span className="buyer-sidebar-label">{t(tab.labelKey)}</span>
              </button>
            )
          })}
        </nav>
        <div className="buyer-sidebar-footer">
          <div>
            <b>{name}</b>
            <br />
            {t('customerAccount')}
          </div>
          <Button
            variant="neutral"
            loading={signOutPending}
            loadingLabel={t('signingOut')}
            onClick={() => setConfirmingSignOut(true)}
          >
            {t('signOut')}
          </Button>
        </div>
      </aside>
      <main className="buyer-main">{children}</main>
      <StatusToast message={signOutError} tone="error" />
      <ConfirmationDialog
        open={confirmingSignOut}
        title={t('confirmSignOutTitle')}
        description={t('confirmSignOutDescription')}
        confirmLabel={t('signOut')}
        cancelLabel={t('cancel')}
        closeLabel={t('closeDialog')}
        destructive
        loading={signOutPending}
        loadingLabel={t('signingOut')}
        onClose={() => setConfirmingSignOut(false)}
        onConfirm={signOut}
      />
    </div>
  )
}
