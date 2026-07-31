const fs = require('node:fs')
const path = require('node:path')

const envPath = path.join(process.cwd(), '.env')

if (!fs.existsSync(envPath)) {
  throw new Error('Missing .env — copy .env.example to .env and fill in real values.')
}

for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
  if (!match) continue
  process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
}
