import { joinClassNames } from './utils'

export type StatusTone = 'success' | 'error' | 'warning' | 'info'

export function StatusToast({ message, tone = 'info' }: { message: string; tone?: StatusTone }) {
  if (!message) return null
  return (
    <div
      className={joinClassNames('buyer-ui-toast', `buyer-ui-toast--${tone}`)}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      {message}
    </div>
  )
}
