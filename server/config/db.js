const sql = require('mssql');

// ─────────────────────────────────────────────────────────────
// Environment-agnostic SQL Server pool configuration
//
// Local  (SQLEXPRESS):  omit DB_USER + DB_PASSWORD  → Windows Auth
// Cloud  (Azure/AWS):   set  DB_USER + DB_PASSWORD  → SQL Auth
//                       set  DB_ENCRYPT=true
//                       set  DB_TRUST_CERT=false
// ─────────────────────────────────────────────────────────────

const useWindowsAuth = !process.env.DB_USER;

const poolConfig = {
  server:   process.env.DB_SERVER,
  port:     parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_DATABASE || 'Grub',

  // SQL Auth (cloud) — only included when credentials are provided
  ...(useWindowsAuth ? {} : {
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  }),

  options: {
    encrypt:              process.env.DB_ENCRYPT    === 'true',   // true  for Azure SQL
    trustServerCertificate: process.env.DB_TRUST_CERT !== 'false', // false for prod with valid cert
    trustedConnection:    useWindowsAuth,                          // Windows Auth for local dev
  },

  pool: {
    max:              parseInt(process.env.DB_POOL_MAX  || '10',    10),
    min:              0,
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE || '30000', 10),
  },

  connectionTimeout: parseInt(process.env.DB_CONN_TIMEOUT    || '15000', 10),
  requestTimeout:    parseInt(process.env.DB_REQUEST_TIMEOUT || '15000', 10),
};

let pool = null;

async function getPool() {
  if (pool) return pool;
  try {
    pool = await sql.connect(poolConfig);
    console.log(`[DB] Connected to ${poolConfig.server} / ${poolConfig.database}`);
    return pool;
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    throw err;
  }
}

module.exports = { getPool, sql };
