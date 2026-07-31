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
      ['sku', 'ALTER TABLE market_products ADD COLUMN sku VARCHAR(191) NULL'],
      ['sport', 'ALTER TABLE market_products ADD COLUMN sport VARCHAR(191) NULL'],
      ['gender', 'ALTER TABLE market_products ADD COLUMN gender VARCHAR(191) NULL'],
      ['brand', 'ALTER TABLE market_products ADD COLUMN brand VARCHAR(191) NULL'],
      ['image_urls', 'ALTER TABLE market_products ADD COLUMN image_urls JSON NULL'],
    ]

    for (const [column, sql] of additions) {
      if (columns.has(column)) {
        console.log(`Column ${column} already exists.`)
      } else {
        await connection.query(sql)
        console.log(`Added column ${column}.`)
      }
    }

    await connection.query(
      `ALTER TABLE market_products
       MODIFY COLUMN listing_mode
       ENUM('NATIVE', 'AFFILIATE', 'LAZADA_AFFILIATE') NOT NULL DEFAULT 'NATIVE'`,
    )
    console.log('Enabled Lazada affiliate listings.')

    const indexes = await connection.query(
      `SELECT INDEX_NAME
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'market_products'
         AND INDEX_NAME = 'market_products_sku_key'`,
    )
    if (!indexes.length) {
      await connection.query('CREATE UNIQUE INDEX market_products_sku_key ON market_products (sku)')
      console.log('Added the unique SKU index.')
    } else {
      console.log('The unique SKU index already exists.')
    }
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
