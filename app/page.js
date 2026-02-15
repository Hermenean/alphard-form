import Header from '../components/Header';

export default function Home({ searchParams }) {
  const success = searchParams?.success === '1';
  const error = searchParams?.error;

  const exams = [
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

  return (
    <>
      <Header title="Alphard Educational Centre" />
      <main className="container">
        <section className="hero">
          <h1>Vă rugăm să completați formularul pentru înscrierea la unul dintre examenele Cambridge. Vă mulțumim!</h1>
        </section>

        <section className="form-card">
          {success && <div className="notice">Cererea a fost trimisa cu succes. Multumim!</div>}
          {error && <div className="notice error">{error}</div>}

          <form action="/api/submit" method="post" className="grid">
            <div>
              <label htmlFor="first_name">Nume</label>
              <input id="first_name" name="first_name" required />
            </div>
            <div>
              <label htmlFor="last_name">Prenume</label>
              <input id="last_name" name="last_name" required />
            </div>
            <div>
              <label htmlFor="birth_date">Data de nastere</label>
              <input id="birth_date" name="birth_date" type="date" required />
            </div>
            <div>
              <label htmlFor="cnp">CNP (cod numeric personal)</label>
              <input id="cnp" name="cnp" inputMode="numeric" pattern="[0-9]{13}" maxLength={13} required />
            </div>
            <div>
              <label htmlFor="phone">Numar de telefon</label>
              <input id="phone" name="phone" type="tel" required />
            </div>
            <div>
              <label htmlFor="email">Adresa de e-mail</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="full">
              <label htmlFor="exam">Tip examen</label>
              <select id="exam" name="exam" required>
                <option value="" disabled selected>Alege examenul</option>
                {exams.map(exam => (
                  <option key={exam} value={exam}>{exam}</option>
                ))}
              </select>
            </div>
            <div className="full">
              <button className="btn" type="submit">Trimite cererea</button>
            </div>
          </form>
          <div className="footer">Pentru mai multe detalii, vă rugăm să ne contactați via WhatsApp la numărul de telefon 0740335385 sau via e-mail: alphardeducationalcentre@yahoo.com.</div>
        </section>
      </main>
    </>
  );
}
