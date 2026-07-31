import { useId, type InputHTMLAttributes } from 'react'

export function Search({
  label,
  id,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string }) {
  const generatedId = useId()
  const inputId = id || generatedId
  return (
    <div className="buyer-ui-search">
      <label className="buyer-ui-visually-hidden" htmlFor={inputId}>
        {label}
      </label>
      <span className="buyer-ui-search__icon" aria-hidden="true">
        ⌕
      </span>
      <input {...props} className="buyer-ui-search__input" id={inputId} type="search" />
    </div>
  )
}
