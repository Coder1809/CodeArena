const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://sasankreddy@localhost:5432/cp_duel';

const pool = new Pool({
  connectionString
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection notice:', err.message);
  } else {
    console.log('Successfully connected to PostgreSQL database');
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
