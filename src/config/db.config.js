const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  console.error("FATAL ERROR: Database environment variables are not set. Check your .env file.");
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    ca: fs.readFileSync(path.join(__dirname, '..', '..', process.env.DB_SSL_CA_PATH)),
    rejectUnauthorized: true
  }
});

pool.getConnection()
  .then(connection => {
    console.log('✅ Successfully connected to Aiven database via SSL!');
    connection.release();
  })
  .catch(err => {
    console.error("❌ FAILED to connect to Aiven database.");
    console.error("Error Details:", err.message);
    console.error("[TIP] Common issues: 1. Is 'ca.pem' in the root folder? 2. Are .env variables correct? 3. Is Aiven IP whitelisted for your location?");
  });

module.exports = pool;