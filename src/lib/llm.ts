// Claude client for the kit generator. Nothing in the web app calls this — only
// scripts/generate-bundles.ts does — so no API key is needed in production.
//
// Uses messages.parse() with a Zod schema: the response is validated against the
// schema by the API itself, which removes the whole class of "the model wrapped
// its JSON in prose" failures that a hand-rolled parser has to defend against.

import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type { z } from 'zod'

// Sonnet by deliberate choice: the model picks from a candidate list we supply
// and every pick is validated against that list afterwards, so this is bounded
// selection rather than open reasoning. Override for a run on a bigger model.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5'

let client: Anthropic | null = null

// The SDK resolves ANTHROPIC_API_KEY (or an `ant auth login` profile) itself.
// Constructed lazily so --offline runs need no credentials at all.
function anthropic(): Anthropic {
  if (!client) client = new Anthropic()
  return client
}

export class LlmRefusalError extends Error {}

export async function parseJson<T extends z.ZodType>(
  schema: T,
  { system, user }: { system: string; user: string },
): Promise<z.infer<T>> {
  const response = await anthropic().messages.parse({
    model: MODEL,
    max_tokens: 16000,
    // Composing a kit under a budget constraint is a reasoning task, not an
    // extraction one — it weighs what goes with what and what the money buys.
    thinking: { type: 'adaptive' },
    system,
    messages: [{ role: 'user', content: user }],
    output_config: { format: zodOutputFormat(schema) },
  })

  // Safety classifiers can decline a request with HTTP 200 — check before
  // reading content, or the failure looks like an empty reply.
  if (response.stop_reason === 'refusal') {
    throw new LlmRefusalError(
      `Claude declined the request (${response.stop_details?.category ?? 'unknown'}).`,
    )
  }

  // parsed_output is null when the model produced nothing schema-valid.
  if (!response.parsed_output) throw new Error('Claude returned no parsable output.')
  return response.parsed_output
}

export function llmModel(): string {
  return MODEL
}
