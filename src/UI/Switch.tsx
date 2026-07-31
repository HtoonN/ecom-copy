import { useId, type InputHTMLAttributes } from 'react'

export function Switch({
  label,
  id,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> & { label: string }) {
  const generatedId = useId()
  const inputId = id || generatedId
  return (
    <label className="buyer-ui-switch" htmlFor={inputId}>
      <input
        {...props}
        className="buyer-ui-switch__control"
        id={inputId}
        type="checkbox"
        role="switch"
      />
      <span className="buyer-ui-switch__track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  )
}
