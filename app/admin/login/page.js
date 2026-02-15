'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import { supabasePublic } from '../../../lib/supabase';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { error: signInError } = await supabasePublic.auth.signInWithPassword({
      email,
      password
    });
    if (signInError) {
      setError('Email sau parola invalide.');
      return;
    }
    router.push('/admin');
  };

  return (
    <>
      <Header title="Admin Dashboard" />
      <main className="container">
        <section className="form-card">
          <h2 style={{ textAlign: 'center', marginTop: 0 }}>Autentificare</h2>
          {error && <div className="notice error">{error}</div>}
          <form onSubmit={onSubmit} className="grid">
            <div className="full">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="full">
              <label htmlFor="password">Parola</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="full">
              <button className="btn" type="submit">Intra in admin</button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
