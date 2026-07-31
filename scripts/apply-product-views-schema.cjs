const mariadb = require('mariadb')
const { connectionOptions } = require('./db-connection.cjs')

async function main() {
  const connection = await mariadb.createConnection(connectionOptions())

  try {
    const rows = await connection.query(
      `SELECT TABLE_NAME
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'market_product_views'`,
    )
    if (rows.length) {
      console.log('Table market_product_views already exists.')
      return
    }

    await connection.query(
      `CREATE TABLE market_product_views (
        id INT NOT NULL AUTO_INCREMENT,
        product_id INT NOT NULL,
        viewed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX market_product_views_product_id_viewed_at_idx (product_id, viewed_at),
        CONSTRAINT market_product_views_product_id_fkey
          FOREIGN KEY (product_id) REFERENCES market_products(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    )
    console.log('Created table market_product_views.')
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
