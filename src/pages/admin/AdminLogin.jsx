import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firebaseReady } from '../../firebase.js';
import { useAdmin } from '../../hooks/useData.js';

export default function AdminLogin() {
  const { user, loading } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/admin" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    }     catch (err) {
      const mesej = {
        'auth/invalid-credential': 'E-mel atau kata laluan tidak sah.',
        'auth/user-not-found': 'Akaun ini tiada dalam Firebase Authentication.',
        'auth/wrong-password': 'Kata laluan salah.',
        'auth/operation-not-allowed': 'Log masuk E-mel/Kata laluan belum dihidupkan di Firebase.',
        'auth/configuration-not-found': 'Log masuk E-mel/Kata laluan belum dihidupkan di Firebase.',
        'auth/invalid-api-key': 'API key dalam fail .env tidak sah.',
        'auth/network-request-failed': 'Tiada sambungan internet.',
        'auth/too-many-requests': 'Terlalu banyak cubaan. Cuba lagi sebentar.',
      };
      setError(`${mesej[err.code] ?? 'Log masuk gagal.'} (${err.code})`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card mx-auto w-full max-w-md p-8">
      <h1 className="m-0 font-display text-2xl font-semibold">Log masuk admin</h1>
      <p className="mt-2 text-sm text-muted">Untuk urus setia kejohanan sahaja.</p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="label">E-mel</span>
          <input type="email" required autoComplete="username" className="field" value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Kata laluan</span>
          <input type="password" required autoComplete="current-password" className="field" value={password}
            onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p role="alert" className="m-0 text-sm text-red-700">{error}</p>}
        <button type="submit" className="btn-primary" disabled={busy || !firebaseReady}>
          {busy ? 'Sedang log masuk…' : 'Log masuk'}
        </button>
      </form>
    </section>
  );
}
