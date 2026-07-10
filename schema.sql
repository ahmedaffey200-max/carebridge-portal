-- Carebridge Portal Database Schema
-- PostgreSQL with Neon

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  condition TEXT,
  specialty TEXT,
  dest TEXT,
  hospital TEXT,
  stage TEXT,
  status TEXT,
  coordinator TEXT,
  estimate NUMERIC,
  paid NUMERIC,
  progress INTEGER,
  updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  initials TEXT,
  priority TEXT,
  visa TEXT,
  flight TEXT,
  started TEXT,
  phone TEXT,
  email TEXT,
  destOther TEXT,
  emergencyName TEXT,
  emergencyPhone TEXT,
  emergencyCountry TEXT,
  emergencyRelation TEXT,
  pkg TEXT,
  pkgTotal NUMERIC,
  pkgPaid NUMERIC,
  pkgUnpaid NUMERIC,
  paymentStatus TEXT,
  isNew BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  code TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  departments JSONB DEFAULT '[]',
  specialists JSONB DEFAULT '[]',
  services JSONB DEFAULT '[]',
  improvements JSONB DEFAULT '[]',
  specialties JSONB DEFAULT '[]',
  accreditation TEXT,
  rating NUMERIC,
  cases INTEGER,
  active BOOLEAN DEFAULT true,
  partner BOOLEAN DEFAULT false,
  dateActive TIMESTAMP,
  dateInactive TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  patient TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  amount NUMERIC NOT NULL,
  status TEXT,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  category TEXT,
  vendor TEXT,
  amount NUMERIC NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT,
  currency TEXT DEFAULT 'USD',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL,
  sender TEXT,
  text TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE IF NOT EXISTS auditLog (
  id TEXT PRIMARY KEY,
  entityType TEXT,
  entityId TEXT,
  action TEXT,
  user TEXT,
  prevValue JSONB,
  newValue JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_stage ON patients(stage);
CREATE INDEX IF NOT EXISTS idx_hospitals_country ON hospitals(country);
CREATE INDEX IF NOT EXISTS idx_messages_patient ON messages(patientId);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON auditLog(entityType, entityId);
