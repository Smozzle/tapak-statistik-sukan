import { useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { usePerlumbaan, useRumahSukan } from '../../hooks/useData.js';
import { ACARA, KATEGORI, STATUS, SUSUNAN_AWAL } from '../../lib/constants.js';
import { bandingNo } from '../../lib/format.js';
import { tukarKeputusanLama } from '../../lib/stats.js';
import { KategoriChip, Memuatkan } from '../../components/Kongsi.jsx';
import { AdminTajuk, Mesej } from '../../components/AdminKongsi.jsx';

const MEDAN = ['no', 'hari', 'tarikh', 'masa', 'status'];

export default function AdminSusunan() {
  const perlumbaan = usePerlumbaan();
  const rumah = useRumahSukan();
  const [draf, setDraf] = useState({});
  const [mesej, setMesej] = useState(null);
  const [busy, setBusy] = useState(false);

  const nilai = (p, key) => draf[p.id]?.[key] ?? p[key] ?? '';
  const ubah = (p, key) => (e) => setDraf((d) => ({ ...d, [p.id]: { ...d[p.id], [key]: e.target.value } }));

  async function jana() {
    setBusy(true);
    try {
      // Re-check on the server so a stale screen can never overwrite existing races.
      const sedia = await getDocs(collection(db, 'perlumbaan'));
      if (!sedia.empty) {
        setMesej({ jenis: 'ralat', teks: 'Susunan sudah wujud. Tiada apa yang dijana.' });
        return;
      }
      const batch = writeBatch(db);
      SUSUNAN_AWAL.forEach(({ id, ...data }) =>
        batch.set(doc(db, 'perlumbaan', id), { ...data, keputusan: [], dikemaskini: serverTimestamp() }),
      );
      await batch.commit();
      setMesej({ jenis: 'ok', teks: `${SUSUNAN_AWAL.length} perlumbaan telah dijana.` });
    } catch {
      setMesej({ jenis: 'ralat', teks: 'Gagal menjana susunan. Pastikan akaun anda ialah admin.' });
    } finally {
      setBusy(false);
    }
  }

  async function simpan(e) {
    e.preventDefault();
    const gabung = perlumbaan.data.map((p) => ({ ...p, ...Object.fromEntries(MEDAN.map((k) => [k, nilai(p, k)])) }));
    const ralat = semakSusunan(gabung);
    if (ralat) {
      setMesej({ jenis: 'ralat', teks: ralat });
      return;
    }
    const diubah = perlumbaan.data.filter((p) => draf[p.id]);
    if (diubah.length === 0) {
      setMesej({ jenis: 'ok', teks: 'Tiada perubahan untuk disimpan.' });
      return;
    }
    setBusy(true);
    try {
      const batch = writeBatch(db);
      diubah.forEach((p) => {
        const g = gabung.find((x) => x.id === p.id);
        batch.update(doc(db, 'perlumbaan', p.id), {
          no: g.no.trim(),
          hari: Number(g.hari),
          tarikh: g.tarikh || null,
          masa: g.masa.trim(),
          status: g.status,
        });
      });
      await batch.commit();
      setDraf({});
      setMesej({ jenis: 'ok', teks: `${diubah.length} perlumbaan dikemas kini.` });
    } catch {
      setMesej({ jenis: 'ralat', teks: 'Gagal menyimpan. Pastikan akaun anda ialah admin.' });
    } finally {
      setBusy(false);
    }
  }

  // One-time: copies old `keputusan` documents (tempat1-3) into perlumbaan.keputusan.
  async function tukarLama() {
    if (!window.confirm('Tukar keputusan lama kepada format baharu? Perlumbaan yang sudah ada keputusan tidak akan diganti.')) return;
    setBusy(true);
    try {
      const [lama, semasa] = await Promise.all([getDocs(collection(db, 'keputusan')), getDocs(collection(db, 'perlumbaan'))]);
      if (lama.empty) {
        setMesej({ jenis: 'ok', teks: 'Tiada keputusan lama untuk ditukar.' });
        return;
      }
      const sediaAda = Object.fromEntries(semasa.docs.map((d) => [d.id, d.data()]));
      const batch = writeBatch(db);
      let ditukar = 0;
      let dilangkau = 0;
      lama.docs.forEach((d) => {
        const asas = SUSUNAN_AWAL.find((s) => s.id === d.id);
        const ada = sediaAda[d.id];
        if (!asas || ada?.keputusan?.length) {
          dilangkau += 1;
          return;
        }
        const baharu = { ...tukarKeputusanLama(d.data(), rumah.data), dikemaskini: serverTimestamp() };
        if (ada) {
          batch.update(doc(db, 'perlumbaan', d.id), baharu);
        } else {
          const { id, ...data } = asas;
          batch.set(doc(db, 'perlumbaan', d.id), { ...data, ...baharu });
        }
        ditukar += 1;
      });
      await batch.commit();
      setMesej({
        jenis: 'ok',
        teks: `${ditukar} keputusan ditukar, ${dilangkau} dilangkau. Koleksi lama dibiarkan; padamkannya di Firebase console jika sudah semak.`,
      });
    } catch {
      setMesej({ jenis: 'ralat', teks: 'Gagal menukar keputusan lama.' });
    } finally {
      setBusy(false);
    }
  }

  if (perlumbaan.loading || rumah.loading) return <Memuatkan />;

  const senarai = [...perlumbaan.data].sort((a, b) => bandingNo(a.no, b.no));

  return (
    <>
      <AdminTajuk
        tajuk="Susunan acara"
        huraian="Tetapkan nombor, hari, tarikh, masa dan status setiap perlumbaan. Masukkan keputusan melalui butang Keputusan."
      />

      {senarai.length === 0 ? (
        <div className="card flex flex-col items-start gap-4 p-6">
          <p className="m-0 text-muted">
            Belum ada susunan. Jana {SUSUNAN_AWAL.length} perlumbaan (8 acara untuk Lelaki dan Perempuan) dengan
            penomboran lalai: Hari 1 ialah 101–108 dan Hari 2 ialah 201–208. Anda boleh mengubahnya selepas itu.
          </p>
          <button type="button" className="btn-primary" onClick={jana} disabled={busy}>Jana susunan</button>
        </div>
      ) : (
        <form onSubmit={simpan} className="flex flex-col gap-4">
          <div className="card tabel-kad overflow-x-auto">
            <table className="w-full border-collapse text-[15px]">
              <thead>
                <tr className="bg-[#F0F4EC] text-left">
                  {['No', 'Acara', 'Kategori', 'Hari', 'Tarikh', 'Masa', 'Status', ''].map((h, i) => (
                    <th key={h || i} scope="col" className="px-2 py-3.5 text-[13px] font-semibold text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {senarai.map((p) => {
                  const nama = ACARA.find((a) => a.id === p.acaraId)?.nama ?? p.acaraId;
                  const kat = KATEGORI.find((k) => k.id === p.kategori)?.nama ?? p.kategori;
                  const label = `${nama} ${kat}`;
                  return (
                    <tr key={p.id} className={`border-t border-line-soft ${draf[p.id] ? 'bg-emas-bg/40' : ''}`}>
                      <td data-label="No" className="px-2 py-2">
                        <input className="field w-16 px-2" aria-label={`Nombor ${label}`} value={nilai(p, 'no')}
                          onChange={ubah(p, 'no')} inputMode="numeric" />
                      </td>
                      <td data-label="Acara" className="px-2 py-2 font-semibold">{nama}</td>
                      <td data-label="Kategori" className="px-2 py-2"><KategoriChip kategori={p.kategori} /></td>
                      <td data-label="Hari" className="px-2 py-2">
                        <select className="field w-[5.5rem] px-2" aria-label={`Hari ${label}`} value={nilai(p, 'hari')} onChange={ubah(p, 'hari')}>
                          <option value="1">Hari 1</option>
                          <option value="2">Hari 2</option>
                        </select>
                      </td>
                      <td data-label="Tarikh" className="px-2 py-2">
                        <input type="date" className="field w-40 px-2" aria-label={`Tarikh ${label}`} value={nilai(p, 'tarikh')}
                          onChange={ubah(p, 'tarikh')} />
                      </td>
                      <td data-label="Masa" className="px-2 py-2">
                        <input className="field w-[4.5rem] px-2" aria-label={`Masa ${label}`} value={nilai(p, 'masa')} onChange={ubah(p, 'masa')}
                          placeholder="0750" maxLength={4} inputMode="numeric" />
                      </td>
                      <td data-label="Status" className="px-2 py-2">
                        <select className="field w-44 px-2" aria-label={`Status ${label}`} value={nilai(p, 'status')} onChange={ubah(p, 'status')}>
                          {Object.entries(STATUS).map(([id, s]) => <option key={id} value={id}>{s.nama}</option>)}
                        </select>
                      </td>
                      <td data-label="" className="px-2 py-2">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <Link to={`/admin/senarai-mula/${p.id}`} className="btn-secondary min-h-11 px-3 text-[13px] no-underline">
                            Peserta{p.senaraiMula?.length ? ` (${p.senaraiMula.length})` : ''}
                          </Link>
                          <Link to={`/admin/keputusan/${p.id}`} className="btn-secondary min-h-11 px-3 text-[13px] no-underline">Keputusan</Link>
                          {p.status === 'rasmi' && (
                            <Link to={`/admin/sijil?perlumbaan=${p.id}`} className="btn-secondary min-h-11 px-3 text-[13px] no-underline">Sijil</Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan perubahan'}</button>
            <button type="button" className="btn-secondary" onClick={() => { setDraf({}); setMesej(null); }}>
              Batalkan perubahan
            </button>
          </div>
        </form>
      )}

      <Mesej mesej={mesej} />

      <section className="card flex flex-col items-start gap-3 p-6">
        <h2 className="m-0 font-display text-xl font-semibold">Tukar keputusan lama</h2>
        <p className="m-0 text-sm text-muted">
          Sekali sahaja: menyalin keputusan format lama (tempat 1–3, atlet, catatan) ke dalam perlumbaan dan
          menandakannya sebagai rasmi. Perlumbaan yang sudah ada keputusan dilangkau, dan data lama tidak dipadam.
        </p>
        <button type="button" className="btn-secondary" onClick={tukarLama} disabled={busy}>
          Tukar keputusan lama
        </button>
      </section>
    </>
  );
}

/** Checks the edited timetable. Returns an error message, or null when valid. */
function semakSusunan(senarai) {
  const nos = senarai.map((p) => String(p.no).trim());
  if (nos.some((n) => !/^\d{1,5}$/.test(n))) return 'Nombor acara mesti nombor sahaja, cth. 103.';
  if (new Set(nos).size !== nos.length) return 'Nombor acara mesti unik.';
  if (senarai.some((p) => ![1, 2].includes(Number(p.hari)))) return 'Hari mestilah 1 atau 2.';
  if (senarai.some((p) => p.masa && !/^([01]\d|2[0-3])[0-5]\d$/.test(String(p.masa).trim()))) {
    return 'Masa mesti 4 digit 24 jam, cth. 0750.';
  }
  const bilTamat = (p) => (p.keputusan ?? []).filter((e) => Number.isInteger(e.ked)).length;
  const awal = senarai.find((p) => p.status === 'rasmi' && bilTamat(p) < 3);
  if (awal) return `Perlumbaan ${awal.no} belum ada 3 pemenang, jadi belum boleh ditetapkan sebagai rasmi.`;
  return null;
}
