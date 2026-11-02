import { Navigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase.js';
import { useAdmin } from '../hooks/useData.js';

export default function ProtectedRoute({ children }) {
  const { user, isAdmin, loading } = useAdmin();

  if (loading) return <p className="text-muted">Memuatkan…</p>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6">
        <h1 className="font-display text-xl font-semibold">Akaun ini bukan admin</h1>
        <p className="mt-2 text-muted">
          Minta pentadbir tambah UID anda dalam koleksi <code>admins</code> di Firebase console.
        </p>
        <p className="mt-1 text-sm text-muted">UID: <code>{user.uid}</code></p>
        <button type="button" onClick={() => signOut(auth)} className="btn-secondary mt-4">
          Log keluar
        </button>
      </div>
    );
  }
  return children;
}
