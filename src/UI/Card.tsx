import type { HTMLAttributes } from 'react'
import { joinClassNames } from './utils'

export function Card({
  interactive = false,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      {...props}
      className={joinClassNames(
        'buyer-ui-card',
        interactive && 'buyer-ui-card--interactive',
        className,
      )}
    />
  )
}
