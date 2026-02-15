import './globals.css';

export const metadata = {
  title: 'Alphard Educational Centre',
  description: 'Formular inscriere Cambridge'
};

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}
