'use client'
import {
  ArrowLeftStartOnRectangleIcon,
  ArrowUturnLeftIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  HomeIcon,
  Squares2X2Icon,
  TagIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { ConfirmationDialog } from '@/UI'
import { tabSlug } from '@/lib/dashboard-tabs'
import LanguageSwitch from '@/components/LanguageSwitch'
import { t, useLanguageSync, type VendorTextKey } from '@/features/vendor/locales'

const tabIcons = {
  Dashboard: HomeIcon,
  Overview: Squares2X2Icon,
  Products: CubeIcon,
  Orders: ClipboardDocumentListIcon,
  Promotions: TagIcon,
  'Shop profile': BuildingStorefrontIcon,
  Users: UsersIcon,
  Refunds: ArrowUturnLeftIcon,
}

const tabLabelKeys: Record<string, VendorTextKey> = {
  Dashboard: 'tabDashboard',
  Overview: 'tabOverview',
  Products: 'tabProducts',
  Orders: 'tabOrders',
  Promotions: 'tabPromotions',
  'Shop profile': 'tabShopProfile',
  Users: 'tabUsers',
  Refunds: 'tabRefunds',
}

export default function DashboardShell({
  role,
  name,
  shop,
  tabs,
  active,
  onTab,
  children,
}: {
  role: string
  name: string
  shop?: { name: string; logoUrl?: string | null } | null
  tabs: string[]
  active: string
  onTab: (tab: string) => void
  children: ReactNode
}) {
  useLanguageSync()
  const roleLabel = role === 'Vendor' ? t('roleVendor') : role === 'Admin' ? t('roleAdmin') : role
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)
  function selectTab(tab: string) {
    onTab(tab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tabSlug(tab))
    window.history.pushState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }
  async function leave(destination: string) {
    if (leaving) return
    setLeaving(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push(destination)
      router.refresh()
    } finally {
      setLeaving(false)
    }
  }
  return (
    <div className={`dashboard ${role === 'Vendor' ? 'seller-dashboard' : ''}`}>
      <aside className="sidebar">
        {shop ? (
          <div className="sidebar-brand-hero">
            <span
              className="sidebar-brand-hero__logo"
              style={
                shop.logoUrl
                  ? {
                      backgroundImage: `url(${shop.logoUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
              aria-hidden="true"
            >
              {!shop.logoUrl && shop.name.charAt(0).toUpperCase()}
            </span>
            <span className="sidebar-brand-hero__text">{shop.name}</span>
          </div>
        ) : (
          <Link href="/" className="brand">
            <span className="brand-mark">✦</span>
            {t('platformBrandName')}
          </Link>
        )}
        <nav className="side-nav" aria-label={t('workspaceNavAria', { role: roleLabel })}>
          {tabs.map((tab) => {
            const TabIcon = tabIcons[tab as keyof typeof tabIcons] || Squares2X2Icon
            return (
              <button
                key={tab}
                type="button"
                className={`side-link ${active === tab ? 'active' : ''}`}
                aria-current={active === tab ? 'page' : undefined}
                onClick={() => selectTab(tab)}
              >
                <TabIcon className="side-link-icon" aria-hidden="true" />
                <span>{tabLabelKeys[tab] ? t(tabLabelKeys[tab]) : tab}</span>
              </button>
            )
          })}
        </nav>
        <div className="sidebar-bottom">
          {role === 'Vendor' && <LanguageSwitch />}
          <div className="sidebar-account-row">
            <div className="sidebar-account-info">
              <b>{name}</b>
              <div className="sidebar-account-role">
                {t('accountRoleLabel', { role: roleLabel })}
              </div>
            </div>
            <button
              type="button"
              className="sidebar-signout-button"
              disabled={leaving}
              aria-busy={leaving || undefined}
              aria-label={t(leaving ? 'signingOut' : 'signOut')}
              title={t(leaving ? 'signingOut' : 'signOut')}
              onClick={() => setConfirmingSignOut(true)}
            >
              <ArrowLeftStartOnRectangleIcon aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
      <main className="dash-main">{children}</main>
      <ConfirmationDialog
        open={confirmingSignOut}
        title={t('confirmSignOutTitle')}
        description={t('confirmSignOutDescription')}
        confirmLabel={t('signOut')}
        cancelLabel={t('cancel')}
        closeLabel={t('closeConfirmation')}
        destructive
        loading={leaving}
        loadingLabel={t('signingOut')}
        onClose={() => setConfirmingSignOut(false)}
        onConfirm={() => leave('/login')}
      />
    </div>
  )
}
