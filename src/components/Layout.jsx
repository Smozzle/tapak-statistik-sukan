import { Link, Outlet, useLocation } from 'react-router-dom';
import { firebaseReady } from '../firebase.js';
import { demoMode, useAdmin } from '../hooks/useData.js';
import { IconLock } from './Icons.jsx';

const MENU = [
  { to: '/', nama: 'Susunan & Keputusan', aktif: (p) => p === '/' || p.startsWith('/keputusan') || p.startsWith('/senarai-mula') },
  { to: '/pingat', nama: 'Pingat', aktif: (p) => p.startsWith('/pingat') || p.startsWith('/rumah') },
  { to: '/peserta', nama: 'Peserta', aktif: (p) => p.startsWith('/peserta') },
  { to: '/rekod', nama: 'Rekod', aktif: (p) => p.startsWith('/rekod') },
];

export default function Layout() {
  const { isAdmin } = useAdmin();
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-hijau text-white print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 pt-4 sm:px-6">
          <Link to="/" className="flex items-center gap-4 text-white no-underline">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white">
              <img src="/logo.jpg" alt="Lencana SK Lodung Kudat" className="h-[54px] w-[54px] object-contain" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[13px] font-medium">SK Lodung, Kudat · Kejohanan Olahraga Tahunan</span>
              <span className="font-display text-2xl font-semibold leading-tight">Tapak Statistik Sukan</span>
            </span>
          </Link>

          {isAdmin ? (
            <Link to="/admin/susunan" className="btn-header">Papan admin</Link>
          ) : (
            <Link to="/admin/login" className="btn-header">
              <IconLock />
              Log masuk admin
            </Link>
          )}
        </div>

        <nav aria-label="Menu utama" className="mx-auto mt-4 max-w-6xl px-4 sm:px-6">
          <ul className="m-0 flex list-none gap-1 overflow-x-auto p-0">
            {MENU.map((m) => {
              const aktif = m.aktif(pathname);
              return (
                <li key={m.to} className="shrink-0">
                  <Link
                    to={m.to}
                    aria-current={aktif ? 'page' : undefined}
                    className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-t-xl px-4 text-sm font-semibold no-underline ${
                      aktif ? 'bg-ground text-ink' : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {m.nama}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <div className="h-1.5 bg-kuning print:hidden" />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-14 pt-8 sm:px-6 sm:pt-10">
        {demoMode && (
          <div role="status" className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm text-sky-900 print:hidden">
            Mod demo: data contoh dipaparkan. Firebase belum disambungkan.
          </div>
        )}
        {!firebaseReady && !demoMode && (
          <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
            Firebase belum disambungkan. Salin <code>.env.example</code> kepada <code>.env</code> dan isi
            nilai daripada Firebase console, kemudian mulakan semula pelayan.
          </div>
        )}
        <Outlet />
      </main>

      <footer className="border-t border-line bg-white print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-6">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-hijau">
            Rajin · Usaha · Berdisiplin
          </span>
          <span className="text-[13px] text-muted">Ditubuhkan 2026</span>
        </div>
      </footer>
    </div>
  );
}
