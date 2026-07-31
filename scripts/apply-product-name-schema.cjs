const mariadb = require('mariadb')
const { connectionOptions } = require('./db-connection.cjs')

async function main() {
  const connection = await mariadb.createConnection(connectionOptions())

  try {
    const rows = await connection.query(
      `SELECT DATA_TYPE
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'market_products'
         AND COLUMN_NAME = 'name'`,
    )
    if (!rows.length) throw new Error('The market_products.name column does not exist.')
    if (rows[0].DATA_TYPE.toLowerCase() === 'text') {
      console.log('Product names already support imported marketplace titles.')
      return
    }

    await connection.query('ALTER TABLE market_products MODIFY COLUMN name TEXT NOT NULL')
    console.log('Expanded the product name column for imported marketplace titles.')
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
