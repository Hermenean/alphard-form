'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import { supabasePublic } from '../../lib/supabase';

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

export default function AdminClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState([]);
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filters = useMemo(() => ({
    q: searchParams.get('q') || '',
    exam: searchParams.get('exam') || '',
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || ''
  }), [searchParams]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    if (!supabasePublic) {
      setError('Configurare Supabase lipsa. Verifica variabilele de mediu.');
      setLoading(false);
      return;
    }
    const { data: sessionData } = await supabasePublic.auth.getSession();
    const session = sessionData?.session;
    if (!session) {
      router.push('/admin/login');
      return;
    }
    setAdminEmail(session.user.email || '');

    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`/api/admin/submissions?${query}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (!res.ok) {
      setError('Nu ai acces sau a aparut o eroare la incarcarea datelor.');
      setLoading(false);
      return;
    }

    const payload = await res.json();
    setRows(payload.rows || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [searchParams]);

  const updateDone = async (id, done) => {
    if (!supabasePublic) return;
    const { data: sessionData } = await supabasePublic.auth.getSession();
    const session = sessionData?.session;
    if (!session) return router.push('/admin/login');

    await fetch(`/api/admin/submissions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ done })
    });
    loadData();
  };

  const deleteRow = async (id) => {
    if (!supabasePublic) return;
    const { data: sessionData } = await supabasePublic.auth.getSession();
    const session = sessionData?.session;
    if (!session) return router.push('/admin/login');

    const ok = confirm('Stergi aceasta cerere?');
    if (!ok) return;

    await fetch(`/api/admin/submissions/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    loadData();
  };

  const logout = async () => {
    await supabasePublic.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <>
      <Header title="Admin Dashboard" />
      <main className="container">
        <section className="hero">
          <h1>Cereri primite</h1>
          <p>Conectat ca <strong>{adminEmail}</strong></p>
          <button className="btn secondary" style={{ marginTop: 12 }} onClick={logout}>Logout</button>
        </section>

        <section className="form-card">
          <div className="badge">Total cereri: {rows.length}</div>
          <form method="get" action="/admin" className="filter-bar">
            <div>
              <label htmlFor="q">Cautare</label>
              <input id="q" name="q" placeholder="Nume, email, telefon, CNP" defaultValue={filters.q} />
            </div>
            <div>
              <label htmlFor="exam">Examen</label>
              <select id="exam" name="exam" defaultValue={filters.exam}>
                <option value="">Toate</option>
                {EXAMS.map(exam => (
                  <option key={exam} value={exam}>{exam}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="date_from">De la</label>
              <input id="date_from" name="date_from" type="date" defaultValue={filters.date_from} />
            </div>
            <div>
              <label htmlFor="date_to">Pana la</label>
              <input id="date_to" name="date_to" type="date" defaultValue={filters.date_to} />
            </div>
            <div className="full">
              <button className="btn" type="submit">Filtreaza</button>
            </div>
          </form>

          {error && <div className="notice error">{error}</div>}
          {loading ? (
            <div className="notice">Se incarca...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Nume</th>
                  <th>Prenume</th>
                  <th>Data nastere</th>
                  <th>CNP</th>
                  <th>Telefon</th>
                  <th>Email</th>
                  <th>Examen</th>
                  <th>Status</th>
                  <th>Actiuni</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={10}>Nu exista cereri pentru filtrele selectate.</td>
                  </tr>
                ) : rows.map(row => (
                  <tr key={row.id}>
                    <td>{new Date(row.created_at).toLocaleDateString('ro-RO')}</td>
                    <td>{row.first_name}</td>
                    <td>{row.last_name}</td>
                    <td>{row.birth_date}</td>
                    <td>{row.cnp}</td>
                    <td>{row.phone}</td>
                    <td>{row.email}</td>
                    <td>{row.exam}</td>
                    <td>{row.done ? 'Done' : 'Nou'}</td>
                    <td>
                      <button className="btn small" type="button" onClick={() => updateDone(row.id, !row.done)}>
                        {row.done ? 'Undo' : 'Done'}
                      </button>
                      <button className="btn small danger" type="button" onClick={() => deleteRow(row.id)}>
                        Sterge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </>
  );
}
