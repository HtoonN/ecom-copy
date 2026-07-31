const mariadb = require('mariadb')
const { connectionOptions } = require('./db-connection.cjs')

async function main() {
  const connection = await mariadb.createConnection(connectionOptions())

  try {
    const rows = await connection.query(
      `SELECT TABLE_NAME
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'market_shop_logos'`,
    )
    if (rows.length) {
      console.log('Table market_shop_logos already exists.')
      return
    }

    await connection.query(
      `CREATE TABLE market_shop_logos (
        id INT NOT NULL AUTO_INCREMENT,
        shop_id INT NOT NULL,
        data LONGBLOB NOT NULL,
        mime_type VARCHAR(191) NOT NULL,
        updated_at DATETIME(3) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE INDEX market_shop_logos_shop_id_key (shop_id),
        CONSTRAINT market_shop_logos_shop_id_fkey
          FOREIGN KEY (shop_id) REFERENCES market_shops(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    )
    console.log('Created table market_shop_logos.')
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
