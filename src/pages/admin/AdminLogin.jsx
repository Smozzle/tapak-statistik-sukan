import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, firebaseReady } from '../../firebase.js';
import { useAdmin } from '../../hooks/useData.js';

export default function AdminLogin() {
  const { user, loading } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [daftar, setDaftar] = useState(false);
  const [nama, setNama] = useState('');
  const [ulang, setUlang] = useState('');

  // While signing up, wait until the request is saved before leaving this page.
  if (!loading && user && !busy) return <Navigate to="/admin" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (daftar) {
      if (password.length < 6) return setError('Kata laluan sekurang-kurangnya 6 aksara.');
      if (password !== ulang) return setError('Kata laluan tidak sama.');
    }
    setBusy(true);
    try {
      if (daftar) {
        const { user: baharu } = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await setDoc(doc(db, 'permohonanAdmin', baharu.uid), {
          nama: nama.trim(),
          email: baharu.email,
          dibuat: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      const mesej = {
        'auth/email-already-in-use': 'E-mel ini sudah didaftarkan. Sila log masuk.',
        'auth/weak-password': 'Kata laluan terlalu lemah (sekurang-kurangnya 6 aksara).',
        'auth/invalid-email': 'Alamat e-mel tidak sah.',
        'auth/invalid-credential': 'E-mel atau kata laluan tidak sah.',
        'auth/user-not-found': 'Akaun ini tiada dalam Firebase Authentication.',
        'auth/wrong-password': 'Kata laluan salah.',
        'auth/operation-not-allowed': 'Log masuk E-mel/Kata laluan belum dihidupkan di Firebase.',
        'auth/configuration-not-found': 'Log masuk E-mel/Kata laluan belum dihidupkan di Firebase.',
        'auth/invalid-api-key': 'API key dalam fail .env tidak sah.',
        'auth/network-request-failed': 'Tiada sambungan internet.',
        'auth/too-many-requests': 'Terlalu banyak cubaan. Cuba lagi sebentar.',
      };
      setError(`${mesej[err.code] ?? (daftar ? 'Pendaftaran gagal.' : 'Log masuk gagal.')} (${err.code})`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card mx-auto w-full max-w-md p-8">
      <h1 className="m-0 font-display text-2xl font-semibold">{daftar ? 'Daftar akaun admin' : 'Log masuk admin'}</h1>
      <p className="mt-2 text-sm text-muted">
        {daftar ? 'Akaun baharu perlu diluluskan oleh admin sedia ada.' : 'Untuk urus setia kejohanan sahaja.'}
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {daftar && (
          <label className="flex flex-col gap-1.5">
            <span className="label">Nama penuh</span>
            <input required maxLength={80} autoComplete="name" className="field" value={nama}
              onChange={(e) => setNama(e.target.value)} />
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="label">E-mel</span>
          <input type="email" required autoComplete="username" className="field" value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Kata laluan</span>
          <input type="password" required autoComplete={daftar ? 'new-password' : 'current-password'} minLength={daftar ? 6 : undefined}
            className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {daftar && (
          <label className="flex flex-col gap-1.5">
            <span className="label">Ulang kata laluan</span>
            <input type="password" required autoComplete="new-password" className="field" value={ulang}
              onChange={(e) => setUlang(e.target.value)} />
          </label>
        )}
        {error && <p role="alert" className="m-0 text-sm text-red-700">{error}</p>}
        <button type="submit" className="btn-primary" disabled={busy || !firebaseReady}>
          {daftar ? (busy ? 'Sedang mendaftar…' : 'Daftar') : (busy ? 'Sedang log masuk…' : 'Log masuk')}
        </button>
      </form>
      <button type="button" className="mt-4 text-sm font-semibold text-hijau underline"
        onClick={() => { setDaftar(!daftar); setError(''); }}>
        {daftar ? 'Sudah ada akaun? Log masuk' : 'Daftar akaun admin'}
      </button>
    </section>
  );
}
