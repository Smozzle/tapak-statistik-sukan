import { Link, Outlet, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, firebaseReady } from '../firebase.js';
import { useAdmin } from '../hooks/useData.js';
import ProtectedRoute from './ProtectedRoute.jsx';

const MENU = [
  { to: '/admin/susunan', nama: 'Susunan', aktif: (p) => p.startsWith('/admin/susunan') || p.startsWith('/admin/keputusan') || p.startsWith('/admin/senarai-mula') },
  { to: '/admin/peserta', nama: 'Peserta', aktif: (p) => p.startsWith('/admin/peserta') },
  { to: '/admin/rekod', nama: 'Rekod', aktif: (p) => p.startsWith('/admin/rekod') },
  { to: '/admin/rumah', nama: 'Rumah sukan', aktif: (p) => p.startsWith('/admin/rumah') },
  { to: '/admin/sijil', nama: 'Sijil', aktif: (p) => p.startsWith('/admin/sijil') || p.startsWith('/admin/templat-sijil') },
  { to: '/admin/pentadbir', nama: 'Pentadbir', aktif: (p) => p.startsWith('/admin/pentadbir') },
];

// Frame for every /admin page except login. The admin menu and "Log keluar" live only here,
// so the public site never shows them.
export default function AdminLayout() {
  const { user, isAdmin } = useAdmin();
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-ink text-white print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="font-display text-lg font-semibold">Papan admin</span>
            {isAdmin && (
              <nav aria-label="Menu admin">
                <ul className="m-0 flex list-none flex-wrap gap-1 p-0">
                  {MENU.map((m) => {
                    const aktif = m.aktif(pathname);
                    return (
                      <li key={m.to}>
                        <Link
                          to={m.to}
                          aria-current={aktif ? 'page' : undefined}
                          className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold no-underline ${
                            aktif ? 'bg-white text-ink' : 'text-white hover:bg-white/10'
                          }`}
                        >
                          {m.nama}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/" className="btn-header">Lihat laman awam</Link>
            {user && (
              <button type="button" onClick={() => signOut(auth)} className="btn-header">Log keluar</button>
            )}
          </div>
        </div>
      </header>
      <div className="h-1.5 bg-kuning print:hidden" />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-14 pt-8 sm:px-6 sm:pt-10">
        {!firebaseReady && (
          <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
            Firebase belum disambungkan. Halaman admin memerlukan projek Firebase yang sebenar.
          </div>
        )}
        <ProtectedRoute>
          <Outlet />
        </ProtectedRoute>
      </main>
    </div>
  );
}
