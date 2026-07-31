const mariadb = require('mariadb')
const { connectionOptions } = require('./db-connection.cjs')

async function main() {
  const connection = await mariadb.createConnection(connectionOptions())

  try {
    const rows = await connection.query(
      `SELECT TABLE_NAME
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'market_product_images'`,
    )
    if (rows.length) {
      console.log('Table market_product_images already exists.')
      return
    }

    await connection.query(
      `CREATE TABLE market_product_images (
        id INT NOT NULL AUTO_INCREMENT,
        product_id INT NOT NULL,
        data LONGBLOB NOT NULL,
        mime_type VARCHAR(191) NOT NULL,
        position INT NOT NULL DEFAULT 0,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX market_product_images_product_id_position_idx (product_id, position),
        CONSTRAINT market_product_images_product_id_fkey
          FOREIGN KEY (product_id) REFERENCES market_products(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    )
    console.log('Created table market_product_images.')
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
