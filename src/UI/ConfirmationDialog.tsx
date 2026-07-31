'use client'

import { Button } from './Button'
import { Dialog } from './Dialog'

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  closeLabel,
  loading = false,
  loadingLabel,
  destructive = false,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  closeLabel: string
  loading?: boolean
  loadingLabel?: string
  destructive?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? () => undefined : onClose}
      title={title}
      closeLabel={closeLabel}
      description={description}
    >
      <div className="buyer-ui-dialog__actions">
        <Button variant="neutral" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? 'danger' : 'primary'}
          loading={loading}
          loadingLabel={loadingLabel}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
