import { useEffect, useState } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { useRumahSukan } from '../../hooks/useData.js';
import { RUMAH_AWAL } from '../../lib/constants.js';

export default function AdminRumah() {
  const rumah = useRumahSukan();
  const [draf, setDraf] = useState([]);
  const [mesej, setMesej] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraf(rumah.data.map((r) => ({ ...r })));
  }, [rumah.data]);

  async function sediakan() {
    setBusy(true);
    try {
      const batch = writeBatch(db);
      RUMAH_AWAL.forEach(({ id, ...data }) => batch.set(doc(db, 'rumahSukan', id), data));
      await batch.commit();
      setMesej({ jenis: 'ok', teks: '3 rumah sukan telah disediakan.' });
    } catch {
      setMesej({ jenis: 'ralat', teks: 'Gagal menyediakan rumah sukan.' });
    } finally {
      setBusy(false);
    }
  }

  async function simpan(e) {
    e.preventDefault();
    if (draf.some((r) => !r.nama.trim())) {
      setMesej({ jenis: 'ralat', teks: 'Nama rumah sukan tidak boleh kosong.' });
      return;
    }
    setBusy(true);
    try {
      const batch = writeBatch(db);
      draf.forEach((r) => batch.update(doc(db, 'rumahSukan', r.id), { nama: r.nama.trim(), warna: r.warna }));
      await batch.commit();
      setMesej({ jenis: 'ok', teks: 'Perubahan disimpan.' });
    } catch {
      setMesej({ jenis: 'ralat', teks: 'Gagal menyimpan perubahan.' });
    } finally {
      setBusy(false);
    }
  }

  const ubah = (i, key) => (e) =>
    setDraf((d) => d.map((r, j) => (j === i ? { ...r, [key]: e.target.value } : r)));

  if (rumah.loading) return <p className="text-muted">Memuatkan…</p>;

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-hijau">Admin</span>
        <h1 className="m-0 font-display text-4xl font-semibold">Rumah sukan</h1>
        <p className="m-0 text-muted">Tukar nama dan warna setiap rumah sukan.</p>
      </div>

      {rumah.data.length === 0 ? (
        <div className="card flex flex-col items-start gap-4 p-6">
          <p className="m-0 text-muted">
            Belum ada rumah sukan. Sediakan 3 rumah sukan contoh (Merah, Biru, Kuning), kemudian tukar nama mengikut sekolah.
          </p>
          <button type="button" className="btn-primary" onClick={sediakan} disabled={busy}>Sediakan rumah sukan</button>
        </div>
      ) : (
        <form onSubmit={simpan} className="card flex flex-col gap-5 p-6">
          {draf.map((r, i) => (
            <div key={r.id} className="grid items-end gap-4 sm:grid-cols-[1fr_auto]">
              <label className="flex flex-col gap-1.5">
                <span className="label">Nama rumah sukan {i + 1}</span>
                <input className="field" value={r.nama} onChange={ubah(i, 'nama')} required />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="label">Warna</span>
                <input type="color" className="h-11 w-24 cursor-pointer rounded-xl border border-[#C9D2C0] bg-white p-1"
                  value={r.warna} onChange={ubah(i, 'warna')} />
              </label>
            </div>
          ))}
          <button type="submit" className="btn-primary self-start" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan perubahan'}
          </button>
        </form>
      )}

      {mesej && (
        <p role={mesej.jenis === 'ralat' ? 'alert' : 'status'}
          className={`m-0 text-sm ${mesej.jenis === 'ralat' ? 'text-red-700' : 'text-hijau'}`}>
          {mesej.teks}
        </p>
      )}
    </>
  );
}
