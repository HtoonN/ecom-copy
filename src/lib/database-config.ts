import fs from 'node:fs'

const ENCRYPTED_SSL_MODES = new Set(['required', 'require'])
const VERIFIED_SSL_MODES = new Set(['verify_ca', 'verify_identity'])

type DatabaseConfig = {
  host: string
  port: number
  user: string
  password: string
  database: string
  connectionLimit: number
  ssl?: boolean | { rejectUnauthorized: boolean; ca?: string }
}

export function databaseConfig(): DatabaseConfig {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set. Set it in .env for local dev, or in the environment when hosted ' +
        '(see .env.example).',
    )
  }

  const url = new URL(databaseUrl)
  if (!['mysql:', 'mariadb:'].includes(url.protocol))
    throw new Error('DATABASE_URL must use the mysql:// or mariadb:// protocol.')

  const sslMode = (
    url.searchParams.get('ssl-mode') ||
    url.searchParams.get('sslmode') ||
    ''
  ).toLowerCase()

  // DATABASE_SSL_CA (inline PEM content) takes priority — it's the only option
  // that works on serverless hosts like Vercel, where .gitignored files (e.g.
  // a path under DATABASE_SSL_CA_PATH) never make it into the deployment.
  // DATABASE_SSL_CA_PATH remains supported for local dev convenience.
  // Accept literal "\n" sequences too, since some hosts' env var UIs (or a
  // single-line .env entry) can't hold real newlines.
  const inlineCa = process.env.DATABASE_SSL_CA?.replace(/\\n/g, '\n')
  const caPath = process.env.DATABASE_SSL_CA_PATH
  const ca =
    inlineCa || (caPath && fs.existsSync(caPath) ? fs.readFileSync(caPath, 'utf8') : undefined)
  if (VERIFIED_SSL_MODES.has(sslMode) && !ca) {
    throw new Error(
      `DATABASE_URL requests ssl-mode=${sslMode}, but no CA certificate was found. Set DATABASE_SSL_CA ` +
        "(the certificate contents — required on hosts where you can't mount a file) or " +
        "DATABASE_SSL_CA_PATH (a local file path — dev only) to your database provider's CA certificate.",
    )
  }

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\/+/, '')),
    connectionLimit: Number(process.env.DATABASE_CONNECTION_LIMIT || 2),
    ssl: VERIFIED_SSL_MODES.has(sslMode)
      ? { rejectUnauthorized: true, ca }
      : ENCRYPTED_SSL_MODES.has(sslMode)
        ? { rejectUnauthorized: false }
        : undefined,
  }
}
