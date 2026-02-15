const path = require('path');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      birth_date DATE NOT NULL,
      cnp TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      exam TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
};

const seedAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@alphard.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const existing = await pool.query('SELECT id FROM admins WHERE email = $1', [adminEmail]);
  if (existing.rowCount === 0) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    await pool.query(
      'INSERT INTO admins (email, password_hash, created_at) VALUES ($1, $2, NOW())',
      [adminEmail, hash]
    );
    console.log(`Seeded admin: ${adminEmail}`);
  }
};

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

const EXAMS = [
  'Pre-A1 Starters',
  'A1 Movers',
  'A2 Flyers',
  'A2 Key',
  'B1 Preliminary',
  'B2 First',
  'C1 Advanced',
  'C2 Proficiency',
  'IELTS'
];

const requireAdmin = (req, res, next) => {
  if (req.session && req.session.adminId) return next();
  return res.redirect('/admin/login');
};

app.get('/', (req, res) => {
  res.render('form', { exams: EXAMS, success: req.query.success === '1' });
});

app.post('/submit', async (req, res) => {
  const { first_name, last_name, birth_date, cnp, phone, email, exam } = req.body;

  if (!first_name || !last_name || !birth_date || !cnp || !phone || !email || !exam) {
    return res.status(400).render('form', { exams: EXAMS, success: false, error: 'Toate campurile sunt obligatorii.' });
  }

  if (!/^[0-9]{13}$/.test(cnp.trim())) {
    return res.status(400).render('form', { exams: EXAMS, success: false, error: 'CNP-ul trebuie sa aiba 13 cifre.' });
  }

  try {
    await pool.query(
      `
        INSERT INTO submissions (first_name, last_name, birth_date, cnp, phone, email, exam)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [first_name.trim(), last_name.trim(), birth_date, cnp.trim(), phone.trim(), email.trim(), exam]
    );
  } catch (err) {
    console.error(err);
    return res.status(500).render('form', { exams: EXAMS, success: false, error: 'Eroare la salvare. Incearca din nou.' });
  }

  return res.redirect('/?success=1');
});

app.get('/admin/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const adminRes = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
  const admin = adminRes.rows[0];
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).render('login', { error: 'Email sau parola invalide.' });
  }
  req.session.adminId = admin.id;
  req.session.adminEmail = admin.email;
  return res.redirect('/admin');
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

app.get('/admin', requireAdmin, async (req, res) => {
  const { q, exam, date_from, date_to } = req.query;
  const conditions = [];
  const params = [];

  if (q) {
    conditions.push('(first_name ILIKE $1 OR last_name ILIKE $2 OR email ILIKE $3 OR phone ILIKE $4 OR cnp ILIKE $5)');
    const like = `%${q}%`;
    params.push(like, like, like, like, like);
  }

  if (exam) {
    conditions.push(`exam = $${params.length + 1}`);
    params.push(exam);
  }

  if (date_from) {
    conditions.push(`DATE(created_at) >= $${params.length + 1}`);
    params.push(date_from);
  }

  if (date_to) {
    conditions.push(`DATE(created_at) <= $${params.length + 1}`);
    params.push(date_to);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rowsRes = await pool.query(`SELECT * FROM submissions ${where} ORDER BY created_at DESC`, params);
  const rows = rowsRes.rows;

  res.render('admin', {
    exams: EXAMS,
    rows,
    filters: { q: q || '', exam: exam || '', date_from: date_from || '', date_to: date_to || '' },
    adminEmail: req.session.adminEmail
  });
});

const start = async () => {
  await initDb();
  await seedAdmin();
  app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
  });
};

start().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});
