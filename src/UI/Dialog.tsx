'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { IconButton } from './IconButton'
import { joinClassNames } from './utils'

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Dialog({
  open,
  onClose,
  title,
  closeLabel,
  description,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  closeLabel: string
  description?: string
  children: ReactNode
  className?: string
}) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement as HTMLElement
    const dialog = dialogRef.current
    const first = dialog?.querySelector<HTMLElement>(focusableSelector)
    first?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
      if (!focusable.length) return
      const firstElement = focusable[0]
      const lastElement = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocus.current?.focus()
    }
  }, [onClose, open])

  if (!open) return null
  return (
    <div
      className="buyer-ui-dialog__backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        className={joinClassNames('buyer-ui-dialog', className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div className="buyer-ui-dialog__header">
          <h2 className="buyer-ui-dialog__title" id={titleId}>
            {title}
          </h2>
          <IconButton label={closeLabel} onClick={onClose}>
            <XMarkIcon className="buyer-ui-dialog__close-icon" aria-hidden="true" />
          </IconButton>
        </div>
        {description && (
          <p className="buyer-ui-dialog__description" id={descriptionId}>
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}
