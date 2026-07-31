export function LoadingIndicator({ label }: { label: string }) {
  return (
    <span className="buyer-ui-loading" role="status">
      <span className="buyer-ui-spinner" aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}

export function Spinner() {
  return <span className="buyer-ui-spinner" aria-hidden="true" />
}
