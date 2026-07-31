'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  Checkbox,
  ConfirmationDialog,
  DataTable,
  Divider,
  EmptyState,
  IconButton,
  InputField,
  LoadingIndicator,
  Radio,
  Search,
  Select,
  StatusToast,
  Switch,
} from '@/UI'
import { t, useLanguageSync } from '../locales'

export default function BuyerStyleGuide() {
  useLanguageSync()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toast, setToast] = useState('')
  return (
    <div className="buyer-style-grid">
      <header>
        <h1>{t('styleGuideTitle')}</h1>
        <p className="buyer-help">{t('styleGuideIntro')}</p>
      </header>

      <Card>
        <h2 className="buyer-card-title">{t('normalStates')}</h2>
        <p className="buyer-help">{t('buttonApi')}</p>
        <div className="buyer-style-row">
          <Button variant="primary">{t('primary')}</Button>
          <Button variant="secondary">{t('secondary')}</Button>
          <Button variant="neutral">{t('neutral')}</Button>
          <Button variant="danger">{t('destructive')}</Button>
          <Button disabled>{t('disabled')}</Button>
          <Button loading loadingLabel={t('loadingExample')}>
            {t('save')}
          </Button>
          <IconButton label={t('removeItem')}>
            <span aria-hidden="true">×</span>
          </IconButton>
        </div>
        <pre className="buyer-style-api">
          <code>{t('buttonUsage')}</code>
        </pre>
      </Card>

      <Card>
        <h2 className="buyer-card-title">{t('formControls')}</h2>
        <p className="buyer-help">{t('formApi')}</p>
        <div className="buyer-form-grid">
          <InputField
            label={t('inputExample')}
            helperText={t('inputHelper')}
            placeholder="buyer@example.com"
          />
          <InputField label={t('readOnlyLabel')} value={t('readOnlyExample')} readOnly />
          <InputField
            label={t('validationExample')}
            defaultValue="invalid"
            error={t('validationError')}
          />
          <Select
            label={t('selectExample')}
            options={[
              { value: 'standard', label: t('standardDelivery') },
              { value: 'express', label: t('expressDelivery') },
            ]}
          />
        </div>
        <div className="buyer-style-row">
          <Checkbox label={t('checkboxExample')} defaultChecked />
          <Radio label={t('radioExample')} name="style-address" defaultChecked />
          <Switch label={t('switchExample')} />
          <Search label={t('searchProducts')} placeholder={t('searchProducts')} />
        </div>
        <pre className="buyer-style-api">
          <code>{t('formUsage')}</code>
        </pre>
      </Card>

      <Card>
        <h2 className="buyer-card-title">{t('feedbackStates')}</h2>
        <p className="buyer-help">{t('tableResponsiveHelp')}</p>
        <LoadingIndicator label={t('loadingExample')} />
        <Divider />
        <DataTable
          label={t('styleGuideOrders')}
          rows={[{ id: 1, order: 'NS-1001', status: t('orderStatusProcessing') }]}
          rowKey={(row) => row.id}
          emptyTitle={t('noOrdersTitle')}
          columns={[
            { key: 'order', header: t('order'), render: (row) => row.order },
            {
              key: 'status',
              header: t('status'),
              render: (row) => (
                <span className="buyer-status buyer-status--warning">{row.status}</span>
              ),
            },
          ]}
        />
        <Divider />
        <EmptyState title={t('emptyExampleTitle')} description={t('emptyExampleDescription')} />
        <div className="buyer-style-row">
          <Button variant="secondary" onClick={() => setDialogOpen(true)}>
            {t('openDialog')}
          </Button>
          <Button
            variant="neutral"
            onClick={() => {
              setToast(t('savedSuccessfully'))
              window.setTimeout(() => setToast(''), 1800)
            }}
          >
            {t('showSuccessToast')}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="buyer-card-title">{t('primitiveApiTitle')}</h2>
        <p className="buyer-help">{t('primitiveApiIntro')}</p>
        <p className="buyer-help">{t('primitiveApiList')}</p>
        <p className="buyer-help">{t('responsiveCatalogHelp')}</p>
      </Card>

      <ConfirmationDialog
        open={dialogOpen}
        title={t('styleGuideDialogTitle')}
        description={t('styleGuideDialogDescription')}
        confirmLabel={t('confirm')}
        cancelLabel={t('cancel')}
        closeLabel={t('closeDialog')}
        onClose={() => setDialogOpen(false)}
        onConfirm={() => setDialogOpen(false)}
      />
      <StatusToast message={toast} tone="success" />
    </div>
  )
}
