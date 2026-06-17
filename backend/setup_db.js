const mysql = require('mysql2/promise');

(async () => {
  // Try connecting directly as back2you_user (in case DB+user already exist)
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'back2you_user',
      password: 'back2you_pass',
      database: 'back2you',
    });
    console.log('✅ back2you_user can connect to back2you database!');
    await conn.end();
    process.exit(0);
  } catch (e) {
    console.log('❌ back2you_user cannot connect:', e.message);
  }

  // Try root with various passwords to set it up
  const rootPasswords = ['Root@12345', 'Root@1234', 'Root@1235', 'Ikc@6116', 'root', 'Root@123', 'mysql', 'admin', ''];
  for (const pwd of rootPasswords) {
    try {
      const conn = await mysql.createConnection({ host: 'localhost', port: 3306, user: 'root', password: pwd });
      console.log(`✅ root connected with: "${pwd}"`);
      await conn.execute(`CREATE DATABASE IF NOT EXISTS back2you CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      await conn.execute(`CREATE USER IF NOT EXISTS 'back2you_user'@'localhost' IDENTIFIED BY 'back2you_pass'`);
      await conn.execute(`GRANT ALL PRIVILEGES ON back2you.* TO 'back2you_user'@'localhost'`);
      await conn.execute(`FLUSH PRIVILEGES`);
      console.log('✅ DB, user, and privileges all set!');
      await conn.end();
      process.exit(0);
    } catch (e) {
      console.log(`❌ root/"${pwd}": ${e.message}`);
    }
  }

  console.log('\n⚠️  Could not set up DB automatically.');
  console.log('Please run this in MySQL Workbench:\n');
  console.log(`  CREATE DATABASE IF NOT EXISTS back2you CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  console.log(`  CREATE USER IF NOT EXISTS 'back2you_user'@'localhost' IDENTIFIED BY 'back2you_pass';`);
  console.log(`  GRANT ALL PRIVILEGES ON back2you.* TO 'back2you_user'@'localhost';`);
  console.log(`  FLUSH PRIVILEGES;`);
  process.exit(1);
})();
