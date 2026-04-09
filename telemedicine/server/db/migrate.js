// server/db/migrate.js
// Run this to add new columns needed for accept/reject + refund features
// Command: node server/db/migrate.js

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔗 Connected to Neon DB...');

    // 1. Change appointments status to include 'pending_approval' and 'rejected'
    await client.query(`
      ALTER TABLE appointments
        DROP CONSTRAINT IF EXISTS appointments_status_check;
    `);
    await client.query(`
      ALTER TABLE appointments
        ADD CONSTRAINT appointments_status_check
        CHECK (status IN ('pending_approval','confirmed','completed','cancelled','rejected','refund_requested','refunded'));
    `);
    console.log('✅ appointments status constraint updated');

    // 2. Add payment columns to appointments
    await client.query(`
      ALTER TABLE appointments
        ADD COLUMN IF NOT EXISTS payment_id       VARCHAR(255),
        ADD COLUMN IF NOT EXISTS payment_amount   DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS payment_status   VARCHAR(30) DEFAULT 'unpaid',
        ADD COLUMN IF NOT EXISTS refund_id        VARCHAR(255),
        ADD COLUMN IF NOT EXISTS refund_reason    TEXT,
        ADD COLUMN IF NOT EXISTS refund_status    VARCHAR(20),
        ADD COLUMN IF NOT EXISTS doctor_note      TEXT;
    `);
    console.log('✅ payment + refund columns added to appointments');

    // 3. Update existing 'confirmed' appointments to 'confirmed' (keep as is)
    // Update existing 'pending' to 'pending_approval'
    await client.query(`
      UPDATE appointments SET status = 'pending_approval' WHERE status = 'pending';
    `);
    console.log('✅ existing pending appointments migrated to pending_approval');

    console.log('\n🎉 Migration complete! Restart your server.\n');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
