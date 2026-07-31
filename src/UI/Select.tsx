'use client'

import { ChevronDownIcon } from '@heroicons/react/24/outline'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type SelectHTMLAttributes,
} from 'react'
import { joinClassNames } from './utils'

export type SelectOption = { value: string; label: string; disabled?: boolean }

export function Select({
  label,
  options,
  helperText,
  error,
  id,
  value,
  defaultValue,
  onChange,
  name,
  disabled,
  className,
  'aria-label': ariaLabel,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: SelectOption[]
  helperText?: string
  error?: string
}) {
  const generatedId = useId()
  const selectId = id || generatedId
  const descriptionId = `${selectId}-description`
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(
    () =>
      (defaultValue as string | undefined) ??
      options.find((option) => !option.disabled)?.value ??
      options[0]?.value ??
      '',
  )
  const currentValue = isControlled ? (value as string) : internalValue
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    function onDocKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDocPointerDown)
    document.addEventListener('keydown', onDocKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocPointerDown)
      document.removeEventListener('keydown', onDocKeyDown)
    }
  }, [open])

  const selectedOption = options.find((option) => option.value === currentValue)

  function choose(optionValue: string) {
    if (!isControlled) setInternalValue(optionValue)
    setOpen(false)
    triggerRef.current?.focus()
    onChange?.({ target: { value: optionValue, name } } as ChangeEvent<HTMLSelectElement>)
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      event.preventDefault()
      setOpen(true)
    }
  }

  return (
    <div className={joinClassNames('buyer-ui-field buyer-ui-select-field', className)}>
      {label && (
        <label className="buyer-ui-field__label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <div className="buyer-ui-select-combobox" ref={rootRef}>
        <select
          {...props}
          name={name}
          value={currentValue}
          disabled={disabled}
          onChange={() => {}}
          className="buyer-ui-select-native"
          tabIndex={-1}
          aria-hidden="true"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          ref={triggerRef}
          type="button"
          id={selectId}
          className="buyer-ui-select-trigger"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={helperText || error ? descriptionId : undefined}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={onTriggerKeyDown}
        >
          <span className="buyer-ui-select__value">{selectedOption?.label}</span>
          <ChevronDownIcon
            className={joinClassNames(
              'buyer-ui-select__chevron',
              open && 'buyer-ui-select__chevron--open',
            )}
            aria-hidden="true"
          />
        </button>
        {open && (
          <ul className="buyer-ui-select-menu" role="listbox" aria-labelledby={selectId}>
            {options.map((option) => (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === currentValue}
                  disabled={option.disabled}
                  className={joinClassNames(
                    'buyer-ui-select-option',
                    option.value === currentValue && 'buyer-ui-select-option--selected',
                  )}
                  onClick={() => choose(option.value)}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
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
