const mariadb = require('mariadb')
const { connectionOptions } = require('./db-connection.cjs')

async function main() {
  const connection = await mariadb.createConnection(connectionOptions())
  try {
    const columns = await connection.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'market_products'
         AND COLUMN_NAME = 'product_type'`,
    )
    if (columns.length) {
      console.log('Column market_products.product_type already exists.')
      return
    }

    await connection.query(
      `ALTER TABLE market_products
       ADD COLUMN product_type VARCHAR(191) NOT NULL DEFAULT 'Other' AFTER category`,
    )
    console.log('Added market_products.product_type.')
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
