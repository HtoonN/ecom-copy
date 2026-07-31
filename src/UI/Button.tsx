import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './LoadingIndicator'
import { joinClassNames } from './utils'

export type ButtonVariant = 'primary' | 'secondary' | 'neutral' | 'outline' | 'danger'

export function buttonClassName({
  variant = 'neutral',
  size = 'default',
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant
  size?: 'default' | 'compact'
  fullWidth?: boolean
  className?: string
} = {}) {
  return joinClassNames(
    'buyer-ui-button',
    `buyer-ui-button--${variant}`,
    size === 'compact' && 'buyer-ui-button--compact',
    fullWidth && 'buyer-ui-button--full',
    className,
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
  size?: 'default' | 'compact'
  loading?: boolean
  loadingLabel?: string
  fullWidth?: boolean
}

export function Button({
  children,
  variant = 'neutral',
  size = 'default',
  loading = false,
  loadingLabel,
  fullWidth = false,
  className,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={buttonClassName({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <Spinner />}
      {loading ? loadingLabel || children : children}
    </button>
  )
}

export function ButtonLink({
  href,
  children,
  variant = 'neutral',
  size = 'default',
  className,
}: {
  href: string
  children: ReactNode
  variant?: ButtonVariant
  size?: 'default' | 'compact'
  className?: string
}) {
  return (
    <Link className={buttonClassName({ variant, size, className })} href={href}>
      {children}
    </Link>
  )
}
