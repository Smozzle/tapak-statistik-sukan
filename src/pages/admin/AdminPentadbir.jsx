import { useState } from 'react';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { useAdmin, usePermohonanAdmin, useSenaraiAdmin } from '../../hooks/useData.js';
import { Memuatkan } from '../../components/Kongsi.jsx';
import { AdminTajuk, Mesej } from '../../components/AdminKongsi.jsx';

const tarikhPapar = (t) => {
  const d = t?.toDate?.();
  return d ? d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
};

export default function AdminPentadbir() {
  const { user } = useAdmin();
  const permohonan = usePermohonanAdmin();
  const admin = useSenaraiAdmin();
  const [mesej, setMesej] = useState(null);
  const [busy, setBusy] = useState('');

  async function jalankan(id, kerja, berjaya, gagal) {
    setBusy(id);
    setMesej(null);
    try {
      await kerja();
      setMesej({ jenis: 'ok', teks: berjaya });
    } catch {
      setMesej({ jenis: 'ralat', teks: gagal });
    } finally {
      setBusy('');
    }
  }

  const luluskan = (p) =>
    jalankan(p.id, async () => {
      const batch = writeBatch(db);
      batch.set(doc(db, 'admins', p.id), {
        nama: p.nama,
        email: p.email,
        ditambah: serverTimestamp(),
        ditambahOleh: user.uid,
      });
      batch.delete(doc(db, 'permohonanAdmin', p.id));
      await batch.commit();
    }, `${p.nama} telah dijadikan admin.`, 'Gagal meluluskan permohonan.');

  const tolak = (p) => {
    if (!window.confirm(`Tolak permohonan ${p.nama}?`)) return;
    jalankan(p.id, () => writeBatch(db).delete(doc(db, 'permohonanAdmin', p.id)).commit(),
      `Permohonan ${p.nama} ditolak.`, 'Gagal menolak permohonan.');
  };

  const buang = (a) => {
    if (!window.confirm(`Buang ${a.nama || a.email || a.id} daripada admin?`)) return;
    jalankan(a.id, () => writeBatch(db).delete(doc(db, 'admins', a.id)).commit(),
      'Admin telah dibuang.', 'Gagal membuang admin.');
  };

  return (
    <>
      <AdminTajuk tajuk="Pentadbir" huraian="Luluskan permohonan akses admin dan urus senarai admin." />
      <Mesej mesej={mesej} />

      <section className="flex flex-col gap-3">
        <h2 className="m-0 font-display text-xl font-semibold">Permohonan menunggu</h2>
        {permohonan.loading ? <Memuatkan /> : permohonan.data.length === 0 ? (
          <p className="m-0 text-muted">Tiada permohonan.</p>
        ) : (
          <ul className="card m-0 flex list-none flex-col divide-y divide-line-soft p-0">
            {permohonan.data.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="font-semibold">{p.nama}</div>
                  <div className="text-sm text-muted">{p.email} · {tarikhPapar(p.dibuat)}</div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-primary" disabled={busy === p.id} onClick={() => luluskan(p)}>Luluskan</button>
                  <button type="button" className="btn-secondary" disabled={busy === p.id} onClick={() => tolak(p)}>Tolak</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="m-0 font-display text-xl font-semibold">Admin sedia ada</h2>
        {admin.loading ? <Memuatkan /> : admin.data.length === 0 ? (
          <p className="m-0 text-muted">Tiada admin.</p>
        ) : (
          <ul className="card m-0 flex list-none flex-col divide-y divide-line-soft p-0">
            {admin.data.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="font-semibold">{a.nama || '(tanpa nama)'}{a.id === user?.uid && ' (anda)'}</div>
                  <div className="text-sm text-muted">{a.email || a.id}</div>
                </div>
                {a.id !== user?.uid && (
                  <button type="button" className="btn-secondary" disabled={busy === a.id} onClick={() => buang(a)}>Buang</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
