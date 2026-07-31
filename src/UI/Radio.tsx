import { useId, type InputHTMLAttributes } from 'react'

export function Radio({
  label,
  id,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string }) {
  const generatedId = useId()
  const inputId = id || generatedId
  return (
    <label className="buyer-ui-choice" htmlFor={inputId}>
      <input {...props} id={inputId} type="radio" />
      <span>{label}</span>
    </label>
  )
}
