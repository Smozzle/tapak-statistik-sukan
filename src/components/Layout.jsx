import { Link, Outlet } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, firebaseReady } from '../firebase.js';
import { demoMode, useAdmin } from '../hooks/useData.js';
import { IconLock } from './Icons.jsx';

export default function Layout() {
  const { user } = useAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-hijau text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-4 text-white no-underline">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white">
              <img src="/logo.jpg" alt="Lencana SK Lodung Kudat" className="h-[54px] w-[54px] object-contain" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[13px] font-medium uppercase tracking-wider">SK Lodung, Kudat</span>
              <span className="font-display text-2xl font-semibold leading-tight">Tapak Statistik Sukan</span>
            </span>
          </Link>

          {user ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/admin" className="btn-header">Keputusan</Link>
              <Link to="/admin/rumah" className="btn-header">Rumah sukan</Link>
              <button type="button" onClick={() => signOut(auth)} className="btn-header">
                Log keluar
              </button>
            </div>
          ) : (
            <Link to="/admin/login" className="btn-header">
              <IconLock />
              Log masuk admin
            </Link>
          )}
        </div>
      </header>
      <div className="h-1.5 bg-kuning" />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 pb-14 pt-10">
        {demoMode && (
          <div role="status" className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm text-sky-900">
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

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-hijau">
            Rajin · Usaha · Berdisiplin
          </span>
          <span className="text-[13px] text-muted">SK Lodung, Kudat · Ditubuhkan 1964</span>
        </div>
      </footer>
    </div>
  );
}
