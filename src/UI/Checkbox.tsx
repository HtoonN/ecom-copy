import { useId, type InputHTMLAttributes } from 'react'

export function Checkbox({
  label,
  hideLabel = false,
  id,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string; hideLabel?: boolean }) {
  const generatedId = useId()
  const inputId = id || generatedId
  return (
    <label className="buyer-ui-choice" htmlFor={inputId}>
      <input {...props} id={inputId} type="checkbox" />
      <span className={hideLabel ? 'buyer-ui-visually-hidden' : undefined}>{label}</span>
    </label>
  )
}
