import { useId, type InputHTMLAttributes } from 'react'
import { joinClassNames } from './utils'

export function InputField({
  label,
  helperText,
  error,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  helperText?: string
  error?: string
}) {
  const generatedId = useId()
  const inputId = id || generatedId
  const descriptionId = `${inputId}-description`
  return (
    <div className={joinClassNames('buyer-ui-field', className)}>
      <label className="buyer-ui-field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        {...props}
        className="buyer-ui-input"
        id={inputId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={helperText || error ? descriptionId : undefined}
      />
      {(error || helperText) && (
        <p
          id={descriptionId}
          className={error ? 'buyer-ui-field__error' : 'buyer-ui-field__helper'}
        >
          {error || helperText}
        </p>
      )}
    </div>
  )
}
