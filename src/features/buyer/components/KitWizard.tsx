'use client'

import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useCallback, useEffect, useRef, useState } from 'react'
import { detectAffiliateMarketplace } from '@/lib/affiliate-marketplace'
import { cleanProductName } from '@/lib/product-name'
import { Button } from '@/UI'
import { type BuyerTextKey, t, useLanguageSync } from '../locales'
import { recordProductClickOut } from '../record-product-clickout'
import AiMark from './AiMark'
import '../buyer.css'

export type WizardSport = { nameEn: string; nameTh: string }

export type KitView = {
  id: number
  slug: string
  title: string
  totalCents: number
  budgetCents: number
  items: {
    id: number
    role: string
    unitPriceCents: number
    product: {
      id: number
      name: string
      imageUrls: string[]
      affiliateUrl: string[]
      shop: { name: string }
    }
  }[]
}

const BUDGETS = [2500, 3500, 6000]

// Long enough that the work is legible, short enough that it is not a wait. A
// cached kit answers in well under this, and returning instantly reads as if
// nothing happened.
const MIN_BUILD_MS = 1800
const BUILD_STEP_MS = 700

const BUILD_STEPS: BuyerTextKey[] = [
  'kitBuildReading',
  'kitBuildMainItem',
  'kitBuildMatching',
  'kitBuildBudget',
]

const money = (cents: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(cents / 100)

// Budgets are round numbers people say out loud, not prices. "฿2,500.00" reads
// as a price tag on the budget itself.
const budgetMoney = (baht: number) =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(baht)

const firstDestination = (urls: string[]) =>
  urls
    .map((url) => ({ marketplace: detectAffiliateMarketplace(url), url }))
    .find((destination) => destination.marketplace !== null)

// The composer stores whatever slot name it settled on, in English. That string
// is never shown as-is: it is matched to a translated label here, and anything
// unrecognised falls back to a generic one. Customer-facing Thai comes from the
// locale files, not from the model.
const ROLE_LABELS: Record<string, BuyerTextKey> = {
  racket: 'bundleRoleRacket',
  racquet: 'bundleRoleRacket',
  string: 'bundleRoleString',
  strings: 'bundleRoleString',
  grip: 'bundleRoleGrip',
  overgrip: 'bundleRoleGrip',
  shuttle: 'bundleRoleShuttlecock',
  shuttlecock: 'bundleRoleShuttlecock',
  ball: 'bundleRoleBall',
  balls: 'bundleRoleBall',
  shoe: 'bundleRoleShoes',
  shoes: 'bundleRoleShoes',
  bag: 'bundleRoleBag',
  apparel: 'bundleRoleApparel',
  shirt: 'bundleRoleApparel',
  clothing: 'bundleRoleApparel',
  bottoms: 'bundleRoleBottoms',
  shorts: 'bundleRoleBottoms',
  pants: 'bundleRoleBottoms',
  skirt: 'bundleRoleSkirt',
}

const roleLabel = (role: string) => {
  const normalised = role.trim().toLowerCase()
  const key =
    ROLE_LABELS[normalised] ??
    Object.entries(ROLE_LABELS).find(([needle]) => normalised.includes(needle))?.[1]
  return t(key ?? 'bundleRoleOther')
}

type Stage = 'sport' | 'budget' | 'building' | 'kit'

export default function KitWizard({ sports }: { sports: WizardSport[] }) {
  const lang = useLanguageSync()
  const [stage, setStage] = useState<Stage>('sport')
  const [sport, setSport] = useState<WizardSport | null>(null)
  const [customBudget, setCustomBudget] = useState('')
  const [kit, setKit] = useState<KitView | null>(null)
  const [failed, setFailed] = useState(false)
  const [buildStep, setBuildStep] = useState(0)
  const headingRef = useRef<HTMLDivElement | null>(null)

  const build = useCallback(async (chosenSport: WizardSport, chosenBudget: number) => {
    setStage('building')
    setBuildStep(0)
    setFailed(false)
    setKit(null)
    const startedAt = Date.now()
    try {
      const response = await fetch('/api/kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport: chosenSport.nameEn, budget: chosenBudget }),
      })
      if (!response.ok) throw new Error('no kit')
      const payload = (await response.json()) as { kit: KitView }
      // Hold the build sequence for its full run even when the answer was
      // cached: the steps are what make the composition legible.
      const remaining = MIN_BUILD_MS - (Date.now() - startedAt)
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining))
      setKit(payload.kit)
      setStage('kit')
    } catch {
      const remaining = MIN_BUILD_MS - (Date.now() - startedAt)
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining))
      setFailed(true)
      setStage('kit')
    }
  }, [])

  useEffect(() => {
    if (stage !== 'building') return
    const id = setInterval(
      () => setBuildStep((current) => Math.min(current + 1, BUILD_STEPS.length - 1)),
      BUILD_STEP_MS,
    )
    return () => clearInterval(id)
  }, [stage])

  // Each answered question moves the page; without this the next question can
  // open below the fold and look like nothing happened.
  useEffect(() => {
    if (stage === 'sport') return
    headingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [stage])

  const chooseSport = (chosen: WizardSport) => {
    setSport(chosen)
    setStage('budget')
  }

  const chooseBudget = (chosen: number) => {
    if (sport) build(sport, chosen)
  }

  const restart = () => {
    setStage('sport')
    setSport(null)
    setCustomBudget('')
    setKit(null)
    setFailed(false)
  }

  const sportLabel = (option: WizardSport) => (lang === 'en' ? option.nameEn : option.nameTh)
  const stepNumber = stage === 'sport' ? 1 : 2

  return (
    <div className="buyer-wizard">
      <div className="buyer-wizard-head" ref={headingRef}>
        <div className="buyer-eyebrow">{t('kitEyebrow')}</div>
        <h1>{t('kitTitle')}</h1>
        <AiMark label={t('aiKitMark')} working={stage === 'building'} />
        <p>{t('kitSubtitle')}</p>
      </div>

      {stage !== 'kit' && (
        <ol className="buyer-wizard-progress" aria-label={t('kitWizardProgress')}>
          {[1, 2].map((number) => (
            <li
              key={number}
              className={
                number < stepNumber || stage === 'building'
                  ? 'is-done'
                  : number === stepNumber
                    ? 'is-current'
                    : undefined
              }
            >
              <span>{number === 1 ? t('kitWizardStepSport') : t('kitWizardStepBudget')}</span>
            </li>
          ))}
        </ol>
      )}

      {stage === 'sport' && (
        <section className="buyer-wizard-step" key="sport">
          <h2>{t('kitWizardAskSport')}</h2>
          <div className="buyer-wizard-choices">
            {sports.map((option, index) => (
              <button
                key={option.nameEn}
                type="button"
                className="buyer-wizard-choice"
                style={{ animationDelay: `${index * 45}ms` }}
                onClick={() => chooseSport(option)}
              >
                {sportLabel(option)}
              </button>
            ))}
          </div>
        </section>
      )}

      {stage === 'budget' && sport && (
        <section className="buyer-wizard-step" key="budget">
          <h2>{t('kitWizardAskBudget', { sport: sportLabel(sport) })}</h2>
          <div className="buyer-wizard-choices">
            {BUDGETS.map((amount, index) => (
              <button
                key={amount}
                type="button"
                className="buyer-wizard-choice"
                style={{ animationDelay: `${index * 45}ms` }}
                onClick={() => chooseBudget(amount)}
              >
                {budgetMoney(amount)}
              </button>
            ))}
          </div>
          <form
            className="buyer-wizard-custom"
            onSubmit={(event) => {
              event.preventDefault()
              const amount = Number(customBudget.replace(/[^\d]/g, ''))
              if (amount >= 500) chooseBudget(amount)
            }}
          >
            <label htmlFor="kit-custom-budget">{t('kitWizardCustomBudget')}</label>
            <input
              id="kit-custom-budget"
              inputMode="numeric"
              placeholder={t('kitWizardBudgetPlaceholder')}
              value={customBudget}
              onChange={(event) => setCustomBudget(event.target.value)}
            />
            <Button type="submit" variant="neutral" size="compact">
              {t('kitWizardGo')}
            </Button>
          </form>
          <button type="button" className="buyer-wizard-back" onClick={restart}>
            <ArrowLeftIcon aria-hidden="true" />
            {t('kitWizardBack')}
          </button>
        </section>
      )}

      {stage === 'building' && (
        <section className="buyer-wizard-step buyer-ai-panel buyer-wizard-building" key="building">
          <AiMark label={t('aiKitWorking')} working />
          <ol className="buyer-wizard-build-steps">
            {BUILD_STEPS.map((key, index) => (
              <li
                key={key}
                className={
                  index < buildStep ? 'is-done' : index === buildStep ? 'is-current' : undefined
                }
              >
                {t(key)}
              </li>
            ))}
          </ol>
          <div className="buyer-wizard-build-ghosts" aria-hidden="true">
            {[0, 1, 2].map((row) => (
              <span
                key={row}
                className="buyer-ai-skeleton buyer-wizard-ghost"
                style={{ animationDelay: `${row * 120}ms` }}
              />
            ))}
          </div>
          <p className="buyer-ui-visually-hidden" role="status" aria-live="polite">
            {t('aiKitWorking')}
          </p>
        </section>
      )}

      {stage === 'kit' && (
        <section className="buyer-wizard-step" key="kit">
          {failed || !kit ? (
            <div className="buyer-wizard-empty">
              <p>{t('kitWizardFailed')}</p>
              <Button variant="primary" onClick={restart}>
                {t('kitWizardRestart')}
              </Button>
            </div>
          ) : (
            <article className="buyer-bundle buyer-wizard-result">
              <header className="buyer-bundle-header">
                <h2>{kit.title}</h2>
                <span className="buyer-bundle-total">{money(kit.totalCents)}</span>
              </header>
              <ul className="buyer-bundle-items">
                {kit.items.map((item, index) => {
                  const destination = firstDestination(item.product.affiliateUrl)
                  const image = item.product.imageUrls[0]
                  return (
                    <li
                      className="buyer-bundle-item buyer-wizard-item"
                      key={item.id}
                      style={{ animationDelay: `${index * 90}ms` }}
                    >
                      <span
                        className="buyer-bundle-thumb"
                        style={image ? { backgroundImage: `url(${image})` } : undefined}
                        aria-hidden="true"
                      />
                      <span className="buyer-bundle-identity">
                        <span className="buyer-bundle-role">{roleLabel(item.role)}</span>
                        <span className="buyer-bundle-name">
                          {cleanProductName(item.product.name)}
                        </span>
                        <span className="buyer-bundle-shop">{item.product.shop.name}</span>
                      </span>
                      <span className="buyer-bundle-price">{money(item.unitPriceCents)}</span>
                      {destination ? (
                        <Button
                          variant="primary"
                          size="compact"
                          onClick={() => {
                            recordProductClickOut(item.product.id, destination.marketplace)
                            window.open(destination.url, '_blank', 'noopener,noreferrer')
                          }}
                        >
                          {t('buyNow')}
                        </Button>
                      ) : (
                        <span className="buyer-bundle-unavailable">{t('noPurchaseLinkYet')}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
              <div className="buyer-wizard-result-foot">
                <p className="buyer-bundle-note">{t('bundleSeparatePurchaseNote')}</p>
                <Button variant="neutral" size="compact" onClick={restart}>
                  {t('kitWizardRestart')}
                </Button>
              </div>
            </article>
          )}
        </section>
      )}
    </div>
  )
}
