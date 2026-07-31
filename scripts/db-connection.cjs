const fs = require('node:fs')

const ENCRYPTED_SSL_MODES = new Set(['required', 'require'])
const VERIFIED_SSL_MODES = new Set(['verify_ca', 'verify_identity'])

// Mirrors src/lib/database-config.ts — kept separate because these scripts
// run as plain CommonJS via `node`, not through the app's TS build.
function connectionOptions() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set. This project connects to Aiven MySQL only — set DATABASE_URL in .env ' +
        '(see .env.example).',
    )
  }

  const url = new URL(databaseUrl)
  const sslMode = (url.searchParams.get('ssl-mode') || url.searchParams.get('sslmode') || '').toLowerCase()

  const inlineCa = process.env.DATABASE_SSL_CA && process.env.DATABASE_SSL_CA.replace(/\\n/g, '\n')
  const caPath = process.env.DATABASE_SSL_CA_PATH
  const ca =
    inlineCa || (caPath && fs.existsSync(caPath) ? fs.readFileSync(caPath, 'utf8') : undefined)
  if (VERIFIED_SSL_MODES.has(sslMode) && !ca) {
    throw new Error(
      `DATABASE_URL requests ssl-mode=${sslMode}, but no CA certificate was found. Set DATABASE_SSL_CA ` +
        '(the certificate contents — required on serverless hosts like Vercel) or DATABASE_SSL_CA_PATH ' +
        '(a local file path — dev only) to the Aiven CA certificate.',
    )
  }

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\/+/, '')),
    ssl: VERIFIED_SSL_MODES.has(sslMode)
      ? { rejectUnauthorized: true, ca }
      : ENCRYPTED_SSL_MODES.has(sslMode)
        ? { rejectUnauthorized: false }
        : undefined,
  }
}

module.exports = { connectionOptions }
