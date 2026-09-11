'use client'

import { SparklesIcon } from '@heroicons/react/24/solid'

// The one mark that says a machine read something for you. Deliberately shared
// by search, compare and kits: three features that feel like one capability
// only if they carry the same signal in the same place.
export default function AiMark({ label, working = false }: { label: string; working?: boolean }) {
  return (
    <span className={`buyer-ai-mark${working ? ' buyer-ai-mark--working' : ''}`}>
      <SparklesIcon className="buyer-ai-mark-icon" aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}
