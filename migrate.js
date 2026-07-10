require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const schema = `
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  name TEXT, age INT, gender TEXT, condition TEXT, specialty TEXT,
  dest TEXT, hospital TEXT, stage INT DEFAULT 0, status TEXT,
  coordinator TEXT, estimate NUMERIC, paid NUMERIC, progress INT,
  updated TEXT, initials TEXT, priority TEXT, visa TEXT,
  flight TEXT, started TEXT, phone TEXT, email TEXT, destOther TEXT,
  emergencyName TEXT, emergencyPhone TEXT, emergencyCountry TEXT,
  emergencyRelation TEXT, pkg TEXT, pkgTotal NUMERIC, pkgPaid NUMERIC,
  pkgUnpaid NUMERIC, paymentStatus TEXT, isNew BOOLEAN
);

CREATE TABLE IF NOT EXISTS hospitals (
  id TEXT PRIMARY KEY,
  name TEXT, city TEXT, country TEXT, code TEXT, address TEXT,
  phone TEXT, email TEXT, website TEXT, departments TEXT,
  specialists TEXT, services TEXT, improvements TEXT, specialties TEXT,
  accreditation TEXT, rating NUMERIC, cases INT, active BOOLEAN,
  partner BOOLEAN, dateActive TEXT, dateInactive TEXT
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  patient TEXT, date TEXT, amount NUMERIC, status TEXT, notes TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  category TEXT, vendor TEXT, amount NUMERIC, date TEXT,
  status TEXT, currency TEXT DEFAULT 'USD'
);

CREATE TABLE IF NOT EXISTS income (
  id TEXT PRIMARY KEY,
  source TEXT, amount NUMERIC, date TEXT, notes TEXT
);

CREATE TABLE IF NOT EXISTS commissions (
  id TEXT PRIMARY KEY,
  hospital TEXT, patient TEXT, amount NUMERIC, status TEXT,
  recorded TEXT, dueDate TEXT, notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_patients_stage ON patients(stage);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
`;

(async () => {
  try {
    console.log('Running migrations...');
    await pool.query(schema);
    console.log('✓ Schema created');

    // Seed minimal data (user can import full data via UI)
    const seedPatient = `INSERT INTO patients (id, name, age, gender, condition, specialty, dest, hospital, stage, status, coordinator, estimate, paid, progress, updated, initials, priority, visa, flight, started, phone, email, destOther, emergencyName, emergencyPhone, emergencyCountry, emergencyRelation, pkg, pkgTotal, pkgPaid, pkgUnpaid, paymentStatus, isNew)
      VALUES ('CB-0001', 'Sample Patient', 35, 'Male', 'Condition', 'Orthopedic', 'TR', 'H001', 0, 'new', 'Ahmed', 0, 0, 0, NOW(), 'SP', 'normal', 'not-started', '', NOW(), '', '', '', '', '', '', '', 'essential', 0, 0, 0, 'unpaid', true)
      ON CONFLICT DO NOTHING`;
    
    await pool.query(seedPatient);
    console.log('✓ Seed data inserted');

    await pool.end();
    console.log('✓ Migrations complete');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
})();
