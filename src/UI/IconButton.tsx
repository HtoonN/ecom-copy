import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './LoadingIndicator'
import { joinClassNames } from './utils'

export function IconButton({
  label,
  children,
  loading = false,
  className,
  disabled,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  children: ReactNode
  loading?: boolean
}) {
  return (
    <button
      {...props}
      type={type}
      className={joinClassNames('buyer-ui-icon-button', className)}
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}
