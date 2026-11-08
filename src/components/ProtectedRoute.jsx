import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase.js';
import { hantarPermohonanAdmin, useAdmin } from '../hooks/useData.js';

function MohonAkses({ user }) {
  const [nama, setNama] = useState(user.displayName ?? '');
  const [busy, setBusy] = useState(false);
  const [ralat, setRalat] = useState('');

  async function hantar(e) {
    e.preventDefault();
    if (!nama.trim()) return;
    setRalat('');
    setBusy(true);
    try {
      await hantarPermohonanAdmin(user, nama);
    } catch {
      setRalat('Permohonan tidak dapat dihantar. Cuba lagi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={hantar} className="mt-4 flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="label">Nama penuh</span>
        <input required maxLength={80} className="field" value={nama} onChange={(e) => setNama(e.target.value)} />
      </label>
      {ralat && <p role="alert" className="m-0 text-sm text-red-700">{ralat}</p>}
      <button type="submit" className="btn-primary self-start" disabled={busy || !nama.trim()}>
        {busy ? 'Menghantar…' : 'Mohon akses admin'}
      </button>
    </form>
  );
}

export default function ProtectedRoute({ children }) {
  const { user, isAdmin, menunggu, loading } = useAdmin();

  if (loading) return <p className="text-muted">Memuatkan…</p>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6">
        {menunggu ? (
          <>
            <h1 className="font-display text-xl font-semibold">Menunggu kelulusan</h1>
            <p className="mt-2 text-muted">
              Permohonan anda telah dihantar. Halaman ini akan terbuka sendiri sebaik sahaja admin meluluskannya.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-xl font-semibold">Akaun ini bukan admin</h1>
            <p className="mt-2 text-muted">Hantar permohonan supaya admin yang sedia ada boleh meluluskan akses anda.</p>
            <MohonAkses user={user} />
          </>
        )}
        <p className="mt-4 text-sm text-muted">
          {user.email} · UID: <code>{user.uid}</code>
        </p>
        <button type="button" onClick={() => signOut(auth)} className="btn-secondary mt-4">
          Log keluar
        </button>
      </div>
    );
  }
  return children;
}
