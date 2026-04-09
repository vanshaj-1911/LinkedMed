// server/db/setup.js
// Run this ONCE to create all tables in Neon DB
// Command: node server/db/setup.js

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔗 Connected to Neon PostgreSQL...');

    // Drop tables if exist (for fresh setup)
    await client.query(`
      DROP TABLE IF EXISTS prescriptions CASCADE;
      DROP TABLE IF EXISTS appointments CASCADE;
      DROP TABLE IF EXISTS medical_records CASCADE;
      DROP TABLE IF EXISTS doctors CASCADE;
      DROP TABLE IF EXISTS patients CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // USERS table
    await client.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ users table created');

    // PATIENTS table
    await client.query(`
      CREATE TABLE patients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        age INTEGER,
        gender VARCHAR(10),
        blood_group VARCHAR(5),
        address TEXT,
        emergency_contact VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ patients table created');

    // DOCTORS table
    await client.query(`
      CREATE TABLE doctors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        specialization VARCHAR(100) NOT NULL,
        qualification VARCHAR(255),
        experience_years INTEGER DEFAULT 0,
        consultation_fee DECIMAL(10,2) DEFAULT 500.00,
        available_slots TEXT DEFAULT '["09:00","10:00","11:00","14:00","15:00","16:00"]',
        rating DECIMAL(3,2) DEFAULT 4.5,
        total_consultations INTEGER DEFAULT 0,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ doctors table created');

    // APPOINTMENTS table
    await client.query(`
      CREATE TABLE appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES users(id),
        doctor_id UUID REFERENCES users(id),
        appointment_date DATE NOT NULL,
        appointment_time VARCHAR(10) NOT NULL,
        consultation_type VARCHAR(20) DEFAULT 'video' CHECK (consultation_type IN ('video', 'audio', 'chat')),
        status VARCHAR(30) DEFAULT 'pending_approval' CHECK (status IN ('pending_approval','confirmed','completed','cancelled','rejected','refund_requested','refunded')),
        symptoms TEXT,
        notes TEXT,
        payment_id VARCHAR(255),
        payment_amount DECIMAL(10,2),
        payment_status VARCHAR(20) DEFAULT 'unpaid',
        refund_id VARCHAR(255),
        refund_reason TEXT,
        refund_status VARCHAR(20),
        doctor_note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ appointments table created');

    // PRESCRIPTIONS table
    await client.query(`
      CREATE TABLE prescriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID REFERENCES appointments(id),
        doctor_id UUID REFERENCES users(id),
        patient_id UUID REFERENCES users(id),
        medicines TEXT NOT NULL,
        instructions TEXT,
        diagnosis TEXT,
        follow_up_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ prescriptions table created');

    // MEDICAL RECORDS table
    await client.query(`
      CREATE TABLE medical_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES users(id),
        record_type VARCHAR(50),
        description TEXT,
        file_url TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ medical_records table created');

    // =====================
    // SEED DATA
    // =====================
    const salt = await bcrypt.genSalt(10);

    // Admin user
    const adminHash = await bcrypt.hash('Pfl@82732', salt);
    await client.query(`
      INSERT INTO users (email, password, role, full_name, phone)
      VALUES ('vanshaj7770@gmail.com', $1, 'admin', 'Vanshaj Goel (Admin)', '9876543210')
    `, [adminHash]);
    console.log('✅ Admin user seeded: vanshaj7770@gmail.com / Pfl@82732');

    // Doctor 1
    const doc1Hash = await bcrypt.hash('Doctor@1234', salt);
    const doc1 = await client.query(`
      INSERT INTO users (email, password, role, full_name, phone)
      VALUES ('dr.sharma@telemedicine.com', $1, 'doctor', 'Dr. Rajesh Sharma', '9811111111')
      RETURNING id
    `, [doc1Hash]);
    await client.query(`
      INSERT INTO doctors (user_id, specialization, qualification, experience_years, consultation_fee, rating, total_consultations)
      VALUES ($1, 'General Physician', 'MBBS, MD', 12, 500.00, 4.8, 245)
    `, [doc1.rows[0].id]);

    // Doctor 2
    const doc2Hash = await bcrypt.hash('Doctor@1234', salt);
    const doc2 = await client.query(`
      INSERT INTO users (email, password, role, full_name, phone)
      VALUES ('dr.priya@telemedicine.com', $1, 'doctor', 'Dr. Priya Verma', '9822222222')
      RETURNING id
    `, [doc2Hash]);
    await client.query(`
      INSERT INTO doctors (user_id, specialization, qualification, experience_years, consultation_fee, rating, total_consultations)
      VALUES ($1, 'Cardiologist', 'MBBS, MD, DM Cardiology', 18, 1200.00, 4.9, 502)
    `, [doc2.rows[0].id]);

    // Doctor 3
    const doc3Hash = await bcrypt.hash('Doctor@1234', salt);
    const doc3 = await client.query(`
      INSERT INTO users (email, password, role, full_name, phone)
      VALUES ('dr.anil@telemedicine.com', $1, 'doctor', 'Dr. Anil Kumar', '9833333333')
      RETURNING id
    `, [doc3Hash]);
    await client.query(`
      INSERT INTO doctors (user_id, specialization, qualification, experience_years, consultation_fee, rating, total_consultations)
      VALUES ($1, 'Dermatologist', 'MBBS, DVD', 8, 700.00, 4.6, 189)
    `, [doc3.rows[0].id]);

    // Doctor 4
    const doc4Hash = await bcrypt.hash('Doctor@1234', salt);
    const doc4 = await client.query(`
      INSERT INTO users (email, password, role, full_name, phone)
      VALUES ('dr.meena@telemedicine.com', $1, 'doctor', 'Dr. Meena Patel', '9844444444')
      RETURNING id
    `, [doc4Hash]);
    await client.query(`
      INSERT INTO doctors (user_id, specialization, qualification, experience_years, consultation_fee, rating, total_consultations)
      VALUES ($1, 'Pediatrician', 'MBBS, DCH, MD', 10, 600.00, 4.7, 320)
    `, [doc4.rows[0].id]);

    // Sample patient
    const patHash = await bcrypt.hash('Patient@1234', salt);
    const pat1 = await client.query(`
      INSERT INTO users (email, password, role, full_name, phone)
      VALUES ('patient@demo.com', $1, 'patient', 'Ravi Kumar', '9855555555')
      RETURNING id
    `, [patHash]);
    await client.query(`
      INSERT INTO patients (user_id, age, gender, blood_group, address)
      VALUES ($1, 28, 'Male', 'O+', 'Bareilly, UP')
    `, [pat1.rows[0].id]);

    console.log('\n🎉 DATABASE SETUP COMPLETE!');
    console.log('============================');
    console.log('📧 Admin Login:  vanshaj7770@gmail.com');
    console.log('🔑 Password:     Pfl@82732');
    console.log('---');
    console.log('📧 Patient Demo: patient@demo.com');
    console.log('🔑 Password:     Patient@1234');
    console.log('---');
    console.log('📧 Doctor Demo:  dr.sharma@telemedicine.com');
    console.log('🔑 Password:     Doctor@1234');
    console.log('============================\n');

  } catch (err) {
    console.error('❌ Error setting up database:', err.message);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
}

setupDatabase();
