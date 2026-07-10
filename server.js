require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

// Serve the portal HTML/CSS/JS files at the root
app.use(express.static(__dirname));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'carebridge-secret-key-change-in-production';

// ===== AUTH =====
app.post('/api/login', async (req, res) => {
  const { pin, username, password, role } = req.body;

  // PIN login (fallback for backward compatibility)
  if (pin === '1234') {
    const token = jwt.sign({ role: role || 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, role: role || 'admin' });
  }

  // Username/password login
  if (username && password) {
    try {
      const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      const admin = result.rows[0];
      
      // Simple password check (in production, use bcrypt)
      if (admin.password !== password) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const token = jwt.sign({ id: admin.id, username: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, role: 'admin', username: admin.username });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.use(verifyToken);

// ===== PATIENTS =====
app.get('/api/patients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const p = req.body;
    const result = await pool.query(
      `INSERT INTO patients (id, name, age, gender, condition, specialty, dest, hospital, stage, status, coordinator, estimate, paid, progress, updated, initials, priority, visa, flight, started, phone, email, destOther, emergencyName, emergencyPhone, emergencyCountry, emergencyRelation, pkg, pkgTotal, pkgPaid, pkgUnpaid, paymentStatus, isNew)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
       RETURNING *`,
      [p.id, p.name, p.age, p.gender, p.condition, p.specialty, p.dest, p.hospital, p.stage, p.status, p.coordinator, p.estimate, p.paid, p.progress, p.updated, p.initials, p.priority, p.visa, p.flight, p.started, p.phone, p.email, p.destOther, p.emergencyName, p.emergencyPhone, p.emergencyCountry, p.emergencyRelation, p.pkg, p.pkgTotal, p.pkgPaid, p.pkgUnpaid, p.paymentStatus, p.isNew]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/patients/:id', async (req, res) => {
  try {
    const p = req.body;
    const result = await pool.query(
      `UPDATE patients SET name=$1, age=$2, gender=$3, condition=$4, specialty=$5, dest=$6, hospital=$7, stage=$8, status=$9, coordinator=$10, estimate=$11, paid=$12, progress=$13, updated=$14, priority=$15, visa=$16, flight=$17, phone=$18, email=$19, destOther=$20, emergencyName=$21, emergencyPhone=$22, emergencyCountry=$23, emergencyRelation=$24, pkg=$25, pkgTotal=$26, pkgPaid=$27, pkgUnpaid=$28, paymentStatus=$29, isNew=$30
       WHERE id=$31 RETURNING *`,
      [p.name, p.age, p.gender, p.condition, p.specialty, p.dest, p.hospital, p.stage, p.status, p.coordinator, p.estimate, p.paid, p.progress, p.updated, p.priority, p.visa, p.flight, p.phone, p.email, p.destOther, p.emergencyName, p.emergencyPhone, p.emergencyCountry, p.emergencyRelation, p.pkg, p.pkgTotal, p.pkgPaid, p.pkgUnpaid, p.paymentStatus, p.isNew, p.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM patients WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== HOSPITALS =====
app.get('/api/hospitals', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM hospitals ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/hospitals', async (req, res) => {
  try {
    const h = req.body;
    const result = await pool.query(
      `INSERT INTO hospitals (id, name, city, country, code, address, phone, email, website, departments, specialists, services, improvements, specialties, accreditation, rating, cases, active, partner, dateActive, dateInactive)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       RETURNING *`,
      [h.id, h.name, h.city, h.country, h.code, h.address, h.phone, h.email, h.website, JSON.stringify(h.departments || []), JSON.stringify(h.specialists || []), JSON.stringify(h.services || []), JSON.stringify(h.improvements || []), JSON.stringify(h.specialties || []), h.accreditation, h.rating, h.cases, h.active, h.partner, h.dateActive, h.dateInactive]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/hospitals/:id', async (req, res) => {
  try {
    const h = req.body;
    const result = await pool.query(
      `UPDATE hospitals SET name=$1, city=$2, country=$3, code=$4, address=$5, phone=$6, email=$7, website=$8, departments=$9, specialists=$10, services=$11, improvements=$12, specialties=$13, accreditation=$14, rating=$15, cases=$16, active=$17, partner=$18, dateActive=$19, dateInactive=$20
       WHERE id=$21 RETURNING *`,
      [h.name, h.city, h.country, h.code, h.address, h.phone, h.email, h.website, JSON.stringify(h.departments || []), JSON.stringify(h.specialists || []), JSON.stringify(h.services || []), JSON.stringify(h.improvements || []), JSON.stringify(h.specialties || []), h.accreditation, h.rating, h.cases, h.active, h.partner, h.dateActive, h.dateInactive, h.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/hospitals/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM hospitals WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== INVOICES =====
app.get('/api/invoices', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invoices ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const inv = req.body;
    const result = await pool.query(
      `INSERT INTO invoices (id, patient, date, amount, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [inv.id, inv.patient, inv.date, inv.amount, inv.status, inv.notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== EXPENSES =====
app.get('/api/expenses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const ex = req.body;
    const result = await pool.query(
      `INSERT INTO expenses (id, category, vendor, amount, date, status, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [ex.id, ex.category, ex.vendor, ex.amount, ex.date, ex.status, ex.currency || 'USD']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/expenses/:id', async (req, res) => {
  try {
    const ex = req.body;
    const result = await pool.query(
      `UPDATE expenses SET category=$1, vendor=$2, amount=$3, date=$4, status=$5, currency=$6
       WHERE id=$7 RETURNING *`,
      [ex.category, ex.vendor, ex.amount, ex.date, ex.status, ex.currency || 'USD', ex.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
