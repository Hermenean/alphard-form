export default function Header({ title }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo-stack">
          <img src="/img/alphard.png" alt="Alphard" />
          <img src="/img/advantage.png" alt="British Council" />
          <img src="/img/alphard-white.png" alt="Alphard Logo" />
        </div>
        <div className="brand-title">{title}</div>
      </div>
    </header>
  );
}
