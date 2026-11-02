import { useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { useKeputusan, useRumahSukan } from '../../hooks/useData.js';
import { ACARA, KATEGORI, SEMUA_PERLUMBAAN, keputusanId } from '../../lib/constants.js';
import { semakKeputusan } from '../../lib/stats.js';
import { JenisChip, PingatDot } from '../../components/Pingat.jsx';

const KOSONG = { acaraId: '', kategori: '', tempat1: '', tempat2: '', tempat3: '', catatan1: '', catatan2: '', catatan3: '' };
const PINGAT_TEMPAT = { 1: 'emas', 2: 'perak', 3: 'gangsa' };

export default function AdminKeputusan() {
  const rumah = useRumahSukan();
  const keputusan = useKeputusan();
  const [form, setForm] = useState(KOSONG);
  const [mesej, setMesej] = useState(null);
  const [busy, setBusy] = useState(false);

  const byId = Object.fromEntries(keputusan.data.map((k) => [k.id, k]));
  const namaRumah = Object.fromEntries(rumah.data.map((r) => [r.id, r.nama]));
  const sedia = form.acaraId && form.kategori ? byId[keputusanId(form.acaraId, form.kategori)] : null;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function edit(k) {
    setForm({ ...KOSONG, ...k });
    setMesej(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function simpan(e) {
    e.preventDefault();
    const ralat = semakKeputusan(form);
    if (ralat) {
      setMesej({ jenis: 'ralat', teks: ralat });
      return;
    }
    setBusy(true);
    try {
      const id = keputusanId(form.acaraId, form.kategori);
      await setDoc(doc(db, 'keputusan', id), {
        acaraId: form.acaraId,
        kategori: form.kategori,
        tempat1: form.tempat1,
        tempat2: form.tempat2,
        tempat3: form.tempat3,
        catatan1: form.catatan1.trim(),
        catatan2: form.catatan2.trim(),
        catatan3: form.catatan3.trim(),
        dikemaskini: serverTimestamp(),
      });
      const acara = ACARA.find((a) => a.id === form.acaraId);
      const kat = KATEGORI.find((k) => k.id === form.kategori);
      setMesej({ jenis: 'ok', teks: `Keputusan ${acara.nama} ${kat.nama} disimpan.` });
      setForm(KOSONG);
    } catch {
      setMesej({ jenis: 'ralat', teks: 'Gagal menyimpan. Pastikan akaun anda ialah admin.' });
    } finally {
      setBusy(false);
    }
  }

  async function padam(id, label) {
    if (!window.confirm(`Padam keputusan ${label}?`)) return;
    try {
      await deleteDoc(doc(db, 'keputusan', id));
      setMesej({ jenis: 'ok', teks: `Keputusan ${label} dipadam.` });
    } catch {
      setMesej({ jenis: 'ralat', teks: 'Gagal memadam keputusan.' });
    }
  }

  if (rumah.loading || keputusan.loading) return <p className="text-muted">Memuatkan…</p>;

  if (rumah.data.length < 3) {
    return (
      <div className="card p-6">
        <h1 className="m-0 font-display text-2xl font-semibold">Kemasukan keputusan</h1>
        <p className="mt-2 text-muted">Sediakan rumah sukan dahulu sebelum memasukkan keputusan.</p>
        <Link to="/admin/rumah" className="btn-primary mt-4 no-underline">Pergi ke Rumah sukan</Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-hijau">Admin</span>
        <h1 className="m-0 font-display text-4xl font-semibold">Kemasukan keputusan</h1>
        <p className="m-0 text-muted">
          {keputusan.data.length} daripada {SEMUA_PERLUMBAAN.length} keputusan telah dimasukkan.
        </p>
      </div>

      <form onSubmit={simpan} className="card flex flex-col gap-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="label">Acara</span>
            <select className="field" value={form.acaraId} onChange={set('acaraId')} required>
              <option value="">Pilih acara</option>
              {ACARA.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label">Kategori</span>
            <select className="field" value={form.kategori} onChange={set('kategori')} required>
              <option value="">Pilih kategori</option>
              {KATEGORI.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </label>
        </div>

        {sedia && (
          <p className="m-0 rounded-xl bg-emas-bg px-4 py-3 text-sm text-emas-fg">
            Keputusan untuk perlumbaan ini sudah ada. Menyimpan akan menggantikannya.
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <fieldset key={n} className="flex flex-col gap-3 rounded-xl border border-line p-4">
              <legend className="flex items-center gap-2 px-1 text-sm font-semibold">
                <PingatDot jenis={PINGAT_TEMPAT[n]} /> Tempat {n}
              </legend>
              <label className="flex flex-col gap-1.5">
                <span className="label">Rumah sukan</span>
                <select className="field" value={form[`tempat${n}`]} onChange={set(`tempat${n}`)} required>
                  <option value="">Pilih rumah</option>
                  {rumah.data.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="label">Catatan (pilihan)</span>
                <input className="field" placeholder="cth. 13.2s atau 3.45m" value={form[`catatan${n}`]}
                  onChange={set(`catatan${n}`)} />
              </label>
            </fieldset>
          ))}
        </div>

        {mesej && (
          <p role={mesej.jenis === 'ralat' ? 'alert' : 'status'}
            className={`m-0 text-sm ${mesej.jenis === 'ralat' ? 'text-red-700' : 'text-hijau'}`}>
            {mesej.teks}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan keputusan'}</button>
          <button type="button" className="btn-secondary" onClick={() => { setForm(KOSONG); setMesej(null); }}>
            Kosongkan
          </button>
        </div>
      </form>

      <section className="flex flex-col gap-4">
        <h2 className="m-0 font-display text-2xl font-semibold">Semua perlumbaan</h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[15px]">
            <thead>
              <tr className="bg-[#F0F4EC] text-left">
                {['Acara', 'Kategori', 'Jenis', 'Emas', 'Perak', 'Gangsa', ''].map((h, i) => (
                  <th key={h || i} scope="col" className="px-4 py-3.5 text-[13px] font-semibold text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SEMUA_PERLUMBAAN.map(({ id, acara, kategori }) => {
                const k = byId[id];
                const label = `${acara.nama} ${kategori.nama}`;
                return (
                  <tr key={id} className="border-t border-line-soft">
                    <td className="px-4 py-3.5 font-semibold">{acara.nama}</td>
                    <td className="px-4 py-3.5">{kategori.nama}</td>
                    <td className="px-4 py-3.5"><JenisChip jenis={acara.jenis} /></td>
                    {[1, 2, 3].map((n) => (
                      <td key={n} className="px-4 py-3.5">
                        {k ? namaRumah[k[`tempat${n}`]] ?? '?' : <span className="text-sm text-muted">—</span>}
                      </td>
                    ))}
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-2">
                        {k ? (
                          <>
                            <button type="button" className="btn-secondary min-h-9 px-3" onClick={() => edit(k)}>Ubah</button>
                            <button type="button" className="btn-secondary min-h-9 px-3 text-red-700" onClick={() => padam(id, label)}>Padam</button>
                          </>
                        ) : (
                          <button type="button" className="btn-secondary min-h-9 px-3"
                            onClick={() => edit({ acaraId: acara.id, kategori: kategori.id })}>
                            Masukkan
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
