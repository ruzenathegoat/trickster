import { Outlet, Link } from 'react-router-dom';

export default function UserLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] font-['Inter'] text-[var(--color-secondary)]">
      <header className="p-4 border-b-[3px] border-[var(--color-secondary)] bg-[var(--color-surface)] flex justify-between items-center">
        <h1 className="text-2xl font-['Archivo_Black'] uppercase tracking-tight">Trickster</h1>
        <nav>
          <Link to="/" className="font-bold hover:underline">Leaderboard</Link>
          <Link to="/admin/login" className="ml-4 px-3 py-1 neo-border bg-[var(--color-primary)] neo-shadow-hover text-sm font-bold">Admin</Link>
        </nav>
      </header>
      <main className="p-8 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
