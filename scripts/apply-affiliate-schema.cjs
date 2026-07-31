const mariadb = require('mariadb')
const { connectionOptions } = require('./db-connection.cjs')

async function main() {
  const connection = await mariadb.createConnection(connectionOptions())

  try {
    const rows = await connection.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'market_products'`,
    )
    const columns = new Set(rows.map((row) => row.COLUMN_NAME))
    const additions = [
      [
        'currency',
        "ALTER TABLE market_products ADD COLUMN currency VARCHAR(191) NOT NULL DEFAULT 'USD'",
      ],
      [
        'listing_mode',
        "ALTER TABLE market_products ADD COLUMN listing_mode ENUM('NATIVE', 'AFFILIATE') NOT NULL DEFAULT 'NATIVE'",
      ],
      ['affiliate_url', 'ALTER TABLE market_products ADD COLUMN affiliate_url TEXT NULL'],
      [
        'shopee_affiliate_url',
        'ALTER TABLE market_products ADD COLUMN shopee_affiliate_url TEXT NULL',
      ],
      [
        'lazada_affiliate_url',
        'ALTER TABLE market_products ADD COLUMN lazada_affiliate_url TEXT NULL',
      ],
    ]

    for (const [column, sql] of additions) {
      if (columns.has(column)) {
        console.log(`Column ${column} already exists.`)
        continue
      }
      await connection.query(sql)
      console.log(`Added column ${column}.`)
    }

    await connection.query(
      `UPDATE market_products
       SET shopee_affiliate_url = affiliate_url
       WHERE listing_mode = 'AFFILIATE'
         AND affiliate_url IS NOT NULL
         AND shopee_affiliate_url IS NULL`,
    )
    await connection.query(
      `UPDATE market_products
       SET lazada_affiliate_url = affiliate_url
       WHERE listing_mode = 'LAZADA_AFFILIATE'
         AND affiliate_url IS NOT NULL
         AND lazada_affiliate_url IS NULL`,
    )
    console.log('Backfilled existing marketplace affiliate links.')
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
