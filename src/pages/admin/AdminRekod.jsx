import { useState } from 'react';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { useRekod, useRumahSukan } from '../../hooks/useData.js';
import { SEMUA_PERLUMBAAN } from '../../lib/constants.js';
import { petaRumah } from '../../lib/format.js';
import { parseCatatan } from '../../lib/stats.js';
import { KategoriChip, Memuatkan, NamaRumah } from '../../components/Kongsi.jsx';
import { AdminTajuk, Mesej } from '../../components/AdminKongsi.jsx';

const KOSONG = { id: '', catatan: '', nama: '', rumahId: '', tahun: '' };

export default function AdminRekod() {
  const rekod = useRekod();
  const rumah = useRumahSukan();
  const [form, setForm] = useState(KOSONG);
  const [mesej, setMesej] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const rekodById = Object.fromEntries(rekod.data.map((r) => [r.id, r]));
  const rumahById = petaRumah(rumah.data);
  const terpilih = SEMUA_PERLUMBAAN.find((x) => x.id === form.id);

  function edit(id) {
    const r = rekodById[id];
    setForm(r ? { id, catatan: r.catatan, nama: r.nama, rumahId: r.rumahId ?? '', tahun: r.tahun ? String(r.tahun) : '' } : { ...KOSONG, id });
    setMesej(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function simpan(e) {
    e.preventDefault();
    const nilai = parseCatatan(form.catatan);
    const tahun = form.tahun.trim() ? Number(form.tahun) : null;
    if (!terpilih) return setMesej({ jenis: 'ralat', teks: 'Sila pilih acara dan kategori.' });
    if (nilai === null) return setMesej({ jenis: 'ralat', teks: 'Catatan mesti bermula dengan nombor, cth. 13.85 s atau 3.62 m.' });
    if (!form.nama.trim()) return setMesej({ jenis: 'ralat', teks: 'Sila isi nama pemegang rekod.' });
    if (tahun !== null && !(Number.isInteger(tahun) && tahun >= 1900 && tahun <= 2100)) {
      return setMesej({ jenis: 'ralat', teks: 'Tahun tidak sah.' });
    }
    setBusy(true);
    try {
      await setDoc(doc(db, 'rekod', form.id), {
        catatan: form.catatan.trim(), nilai, nama: form.nama.trim(), rumahId: form.rumahId, tahun,
      });
      setMesej({ jenis: 'ok', teks: `Rekod ${terpilih.acara.nama} ${terpilih.kategori.nama} disimpan.` });
      setForm(KOSONG);
    } catch {
      setMesej({ jenis: 'ralat', teks: 'Gagal menyimpan. Pastikan akaun anda ialah admin.' });
    } finally {
      setBusy(false);
    }
  }

  async function padam(id, label) {
    if (!window.confirm(`Padam rekod ${label}?`)) return;
    try {
      await deleteDoc(doc(db, 'rekod', id));
      setMesej({ jenis: 'ok', teks: `Rekod ${label} dipadam.` });
    } catch {
      setMesej({ jenis: 'ralat', teks: 'Gagal memadam rekod.' });
    }
  }

  if (rekod.loading || rumah.loading) return <Memuatkan />;

  return (
    <>
      <AdminTajuk tajuk="Rekod kejohanan" huraian="Rekod terbaik bagi setiap acara dan kategori. Keputusan yang lebih baik akan ditandakan sebagai rekod baharu." />

      <form onSubmit={simpan} className="card flex flex-col gap-4 p-6">
        <label className="flex flex-col gap-1.5 sm:max-w-sm">
          <span className="label">Acara dan kategori</span>
          <select className="field" value={form.id} onChange={set('id')} required>
            <option value="">Pilih perlumbaan</option>
            {SEMUA_PERLUMBAAN.map((x) => (
              <option key={x.id} value={x.id}>{x.acara.nama} {x.kategori.nama}</option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className="label">Catatan ({terpilih?.acara.unit === 'meter' ? 'cth. 3.62 m' : 'cth. 13.85 s'})</span>
            <input className="field" value={form.catatan} onChange={set('catatan')} required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label">Nama</span>
            <input className="field" value={form.nama} onChange={set('nama')} required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label">Rumah sukan</span>
            <select className="field" value={form.rumahId} onChange={set('rumahId')}>
              <option value="">Tiada / lain-lain</option>
              {rumah.data.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label">Tahun</span>
            <input className="field" inputMode="numeric" maxLength={4} value={form.tahun} onChange={set('tahun')} />
          </label>
        </div>
        <Mesej mesej={mesej} />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan rekod'}</button>
          <button type="button" className="btn-secondary" onClick={() => { setForm(KOSONG); setMesej(null); }}>Kosongkan</button>
        </div>
      </form>

      <div className="card tabel-kad overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-[15px]">
          <thead>
            <tr className="bg-[#F0F4EC] text-left">
              {['Acara', 'Kategori', 'Catatan', 'Nama', 'Rumah sukan', 'Tahun', ''].map((h, i) => (
                <th key={h || i} scope="col" className="px-4 py-3.5 text-[13px] font-semibold text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SEMUA_PERLUMBAAN.map(({ id, acara, kategori }) => {
              const r = rekodById[id];
              const label = `${acara.nama} ${kategori.nama}`;
              return (
                <tr key={id} className="border-t border-line-soft">
                  <td data-label="Acara" className="px-4 py-3.5 font-semibold">{acara.nama}</td>
                  <td data-label="Kategori" className="px-4 py-3.5"><KategoriChip kategori={kategori.id} /></td>
                  {r ? (
                    <>
                      <td data-label="Catatan" className="px-4 py-3.5 font-semibold">{r.catatan}</td>
                      <td data-label="Nama" className="px-4 py-3.5">{r.nama}</td>
                      <td data-label="Rumah sukan" className="px-4 py-3.5"><NamaRumah rumah={rumahById[r.rumahId]} rumahId={r.rumahId} /></td>
                      <td data-label="Tahun" className="px-4 py-3.5">{r.tahun || '—'}</td>
                    </>
                  ) : (
                    <td colSpan={4} className="px-4 py-3.5 text-sm text-muted">Belum ada rekod</td>
                  )}
                  <td data-label="" className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <button type="button" className="btn-secondary min-h-11 px-3" onClick={() => edit(id)}>
                        {r ? 'Ubah' : 'Masukkan'}
                      </button>
                      {r && (
                        <button type="button" className="btn-secondary min-h-11 px-3 text-red-700" onClick={() => padam(id, label)}>
                          Padam
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
    </>
  );
}
