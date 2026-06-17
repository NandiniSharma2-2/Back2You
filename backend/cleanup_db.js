const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Root@12345',
    database: 'back2you',
    multipleStatements: true,
  });

  await conn.execute('SET FOREIGN_KEY_CHECKS=0');
  const [tables] = await conn.execute('SHOW TABLES');
  for (const row of tables) {
    const t = Object.values(row)[0];
    await conn.execute(`DROP TABLE IF EXISTS \`${t}\``);
    console.log('dropped:', t);
  }
  await conn.execute('SET FOREIGN_KEY_CHECKS=1');
  console.log('✅ All tables dropped, ready for fresh migration');
  await conn.end();
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
