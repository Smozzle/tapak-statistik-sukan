import { useState } from 'react';
import { collection, deleteDoc, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { usePeserta, useRumahSukan } from '../../hooks/useData.js';
import { KATEGORI } from '../../lib/constants.js';
import { parseCsvPeserta } from '../../lib/csv.js';
import { bandingNo, petaRumah } from '../../lib/format.js';
import { KategoriChip, Memuatkan, NamaRumah } from '../../components/Kongsi.jsx';
import { AdminTajuk, Mesej } from '../../components/AdminKongsi.jsx';

const KOSONG = { id: null, bib: '', nama: '', rumahId: '', kategori: '' };

export default function AdminPeserta() {
  const peserta = usePeserta();
  const rumah = useRumahSukan();
  const [form, setForm] = useState(KOSONG);
  const [cari, setCari] = useState('');
  const [csv, setCsv] = useState('');
  const [semakan, setSemakan] = useState(null);
  const [mesej, setMesej] = useState(null);
  const [busy, setBusy] = useState(false);
  const [namaFail, setNamaFail] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const rumahById = petaRumah(rumah.data);

  async function simpan(e) {
    e.preventDefault();
    const bib = form.bib.trim();
    const nama = form.nama.trim();
    if (!bib || !nama || !form.rumahId || !form.kategori) {
      setMesej({ jenis: 'ralat', teks: 'Sila isi bib, nama, rumah sukan dan kategori.' });
      return;
    }
    if (peserta.data.some((p) => p.id !== form.id && String(p.bib) === bib)) {
      setMesej({ jenis: 'ralat', teks: `Bib ${bib} sudah digunakan peserta lain.` });
      return;
    }
    setBusy(true);
    try {
      const ref = form.id ? doc(db, 'peserta', form.id) : doc(collection(db, 'peserta'));
      await setDoc(ref, { bib, nama, rumahId: form.rumahId, kategori: form.kategori });
      setMesej({ jenis: 'ok', teks: form.id ? `${nama} dikemas kini.` : `${nama} ditambah.` });
      setForm(KOSONG);
    } catch {
      setMesej({ jenis: 'ralat', teks: 'Gagal menyimpan. Pastikan akaun anda ialah admin.' });
    } finally {
      setBusy(false);
    }
  }

  async function padam(p) {
    if (!window.confirm(`Padam ${p.nama} (bib ${p.bib})? Keputusan yang lalu kekal, tetapi pautan ke halaman peserta ini akan terputus.`)) return;
    try {
      await deleteDoc(doc(db, 'peserta', p.id));
      setMesej({ jenis: 'ok', teks: `${p.nama} dipadam.` });
    } catch {
      setMesej({ jenis: 'ralat', teks: 'Gagal memadam peserta.' });
    }
  }

  function semakCsv() {
    const hasil = parseCsvPeserta(csv, rumah.data);
    const mengikutBib = Object.fromEntries(peserta.data.map((p) => [String(p.bib), p]));
    setSemakan({
      ...hasil,
      baharu: hasil.baris.filter((b) => !mengikutBib[b.bib]).length,
      kemaskini: hasil.baris.filter((b) => mengikutBib[b.bib]).length,
    });
    setMesej(null);
  }

  async function importCsv() {
    setBusy(true);
    try {
      const mengikutBib = Object.fromEntries(peserta.data.map((p) => [String(p.bib), p]));
      // Firestore batches hold up to 500 writes.
      for (let i = 0; i < semakan.baris.length; i += 400) {
        const batch = writeBatch(db);
        semakan.baris.slice(i, i + 400).forEach((b) => {
          const sedia = mengikutBib[b.bib];
          batch.set(sedia ? doc(db, 'peserta', sedia.id) : doc(collection(db, 'peserta')), b);
        });
        await batch.commit();
      }
      setMesej({ jenis: 'ok', teks: `${semakan.baharu} peserta ditambah, ${semakan.kemaskini} dikemas kini.` });
      setCsv('');
      setSemakan(null);
    } catch {
      setMesej({ jenis: 'ralat', teks: 'Import gagal. Pastikan akaun anda ialah admin.' });
    } finally {
      setBusy(false);
    }
  }

  async function bacaFail(e) {
    const fail = e.target.files?.[0];
    if (!fail) return;
    setCsv(await fail.text());
    setSemakan(null);
    e.target.value = '';
  }

  if (peserta.loading || rumah.loading) return <Memuatkan />;

  if (rumah.data.length === 0) {
    return (
      <>
        <AdminTajuk tajuk="Peserta" />
        <p className="text-muted">Sediakan rumah sukan dahulu sebelum menambah peserta.</p>
      </>
    );
  }

  const q = cari.trim().toLowerCase();
  const senarai = peserta.data
    .filter((p) => !q || p.nama.toLowerCase().includes(q) || String(p.bib).toLowerCase().includes(q))
    .sort((a, b) => bandingNo(a.bib, b.bib));

  return (
    <>
      <AdminTajuk
        tajuk="Peserta"
        huraian={`${peserta.data.length} peserta. Setiap bib mesti unik. Menukar nama atau rumah tidak mengubah keputusan yang sudah diumumkan.`}
      />

      <form onSubmit={simpan} className="card flex flex-col gap-4 p-6">
        <h2 className="m-0 font-display text-xl font-semibold">{form.id ? 'Ubah peserta' : 'Tambah peserta'}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[100px_2fr_1fr_1fr]">
          <label className="flex flex-col gap-1.5">
            <span className="label">Bib</span>
            <input className="field" value={form.bib} onChange={set('bib')} required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label">Nama</span>
            <input className="field" value={form.nama} onChange={set('nama')} required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label">Rumah sukan</span>
            <select className="field" value={form.rumahId} onChange={set('rumahId')} required>
              <option value="">Pilih rumah</option>
              {rumah.data.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
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
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary" disabled={busy}>{form.id ? 'Simpan perubahan' : 'Tambah peserta'}</button>
          {form.id && <button type="button" className="btn-secondary" onClick={() => setForm(KOSONG)}>Batal</button>}
        </div>
      </form>

      <Mesej mesej={mesej} />

      <section className="flex flex-col gap-4">
        <label className="flex max-w-sm flex-col gap-1.5">
          <span className="label">Cari nama atau bib</span>
          <input className="field" type="search" value={cari} onChange={(e) => setCari(e.target.value)} />
        </label>
        <div className="card tabel-kad overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[15px]">
            <thead>
              <tr className="bg-[#F0F4EC] text-left">
                {['Bib', 'Nama', 'Rumah sukan', 'Kategori', ''].map((h, i) => (
                  <th key={h || i} scope="col" className="px-4 py-3.5 text-[13px] font-semibold text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {senarai.map((p) => (
                <tr key={p.id} className="border-t border-line-soft">
                  <td data-label="Bib" className="px-4 py-3.5 font-semibold">{p.bib}</td>
                  <td data-label="Nama" className="px-4 py-3.5">{p.nama}</td>
                  <td data-label="Rumah sukan" className="px-4 py-3.5"><NamaRumah rumah={rumahById[p.rumahId]} rumahId={p.rumahId} /></td>
                  <td data-label="Kategori" className="px-4 py-3.5"><KategoriChip kategori={p.kategori} /></td>
                  <td data-label="" className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <button type="button" className="btn-secondary min-h-11 px-3"
                        onClick={() => { setForm({ id: p.id, bib: String(p.bib), nama: p.nama, rumahId: p.rumahId, kategori: p.kategori }); setMesej(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                        Ubah
                      </button>
                      <button type="button" className="btn-secondary min-h-11 px-3 text-red-700" onClick={() => padam(p)}>Padam</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {senarai.length === 0 && <p className="m-0 px-4 py-6 text-muted">Tiada peserta sepadan.</p>}
        </div>
      </section>

      <section className="card flex flex-col gap-4 p-6">
        <h2 className="m-0 font-display text-xl font-semibold">Import CSV</h2>
        <p className="m-0 text-sm text-muted">
          Satu peserta setiap baris: <code>bib,nama,rumah,kategori</code>. Rumah ialah nama atau ID rumah sukan;
          kategori ialah Lelaki / Perempuan (atau L / P). Bib yang sudah wujud akan dikemas kini, bukan digandakan.
        </p>
        <label className="flex w-full cursor-pointer flex-wrap items-center gap-3 rounded-xl border-2 border-dashed border-[#C9D2C0] bg-white p-3 text-sm text-ink focus-within:border-hijau hover:border-hijau sm:max-w-md">
          <span className="btn-primary pointer-events-none min-h-9 px-4">Pilih fail</span>
          <span className="text-muted">{namaFail || 'Tiada fail dipilih'}</span>
          <input type="file" accept=".csv,.txt,text/csv" className="sr-only"
            onChange={(e) => { setNamaFail(e.target.files?.[0]?.name ?? ''); bacaFail(e); }} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Atau tampal di sini</span>
          <textarea className="field min-h-32 py-2 font-mono text-sm" value={csv}
            onChange={(e) => { setCsv(e.target.value); setSemakan(null); }}
            placeholder={'bib,nama,rumah,kategori\n12,Aiman bin Rahim,Rumah Merah,Lelaki'} />
        </label>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={semakCsv} disabled={!csv.trim()}>Semak</button>
          {semakan && semakan.baris.length > 0 && (
            <button type="button" className="btn-primary" onClick={importCsv} disabled={busy}>
              Import {semakan.baris.length} peserta
            </button>
          )}
        </div>
        {semakan && (
          <div className="flex flex-col gap-2 text-sm">
            <p className="m-0">
              {semakan.baharu} baharu, {semakan.kemaskini} akan dikemas kini, {semakan.ralat.length} ralat.
            </p>
            {semakan.ralat.length > 0 && (
              <ul role="alert" className="m-0 list-disc pl-5 text-red-700">
                {semakan.ralat.map((r) => <li key={r}>{r}</li>)}
              </ul>
            )}
            {semakan.ralat.length > 0 && semakan.baris.length > 0 && (
              <p className="m-0 text-muted">Baris yang ada ralat akan dilangkau jika anda teruskan.</p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
