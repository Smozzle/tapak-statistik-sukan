import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { usePerlumbaan, usePeserta, useRumahSukan } from '../../hooks/useData.js';
import { ACARA, KATEGORI } from '../../lib/constants.js';
import { bandingNo } from '../../lib/format.js';
import { binaSenaraiMula, semakSenaraiMula } from '../../lib/stats.js';
import { KategoriChip, Memuatkan, StatusChip } from '../../components/Kongsi.jsx';
import { AdminTajuk, Mesej } from '../../components/AdminKongsi.jsx';
import { IconArrowLeft } from '../../components/Icons.jsx';

const MAKS_BARIS = 60;
let kunciTerakhir = 0;
const kunciBaharu = () => {
  kunciTerakhir += 1;
  return kunciTerakhir;
};

export default function AdminSenaraiMula() {
  const { perlumbaanId } = useParams();
  const perlumbaan = usePerlumbaan();
  const peserta = usePeserta();
  const rumah = useRumahSukan();

  if (perlumbaan.loading || peserta.loading || rumah.loading) return <Memuatkan />;

  const p = perlumbaan.data.find((x) => x.id === perlumbaanId);
  if (!p) {
    return (
      <>
        <BackLink />
        <p className="text-muted">Perlumbaan tidak dijumpai. Jana susunan di halaman Susunan dahulu.</p>
      </>
    );
  }
  // key resets the form when another race is opened.
  return <Borang key={p.id} p={p} peserta={peserta.data} rumah={rumah.data} />;
}

const barisKosong = (relay) => ({
  kunci: kunciBaharu(), pesertaId: '', rumahId: '', lorong: '', ahli: relay ? ['', '', '', ''] : [],
});

function barisDariData(p, relay) {
  const baris = (p.senaraiMula ?? []).map((e) => ({
    kunci: kunciBaharu(),
    pesertaId: e.pesertaId ?? '',
    rumahId: e.rumahId ?? '',
    lorong: e.lorong ? String(e.lorong) : '',
    ahli: relay ? [0, 1, 2, 3].map((i) => e.ahli?.[i] ?? '') : [],
  }));
  return baris.length ? baris : [barisKosong(relay)];
}

function Borang({ p, peserta, rumah }) {
  const acara = ACARA.find((a) => a.id === p.acaraId);
  const kategori = KATEGORI.find((k) => k.id === p.kategori);
  const relay = acara.jenisAcara === 'berganti-ganti';
  const labelLorong = acara.jenis === 'balapan' ? 'Lorong' : 'Giliran';
  const [baris, setBaris] = useState(() => barisDariData(p, relay));
  const [mesej, setMesej] = useState(null);
  const [busy, setBusy] = useState(false);

  const rumahById = Object.fromEntries(rumah.map((r) => [r.id, r]));
  const pilihan = peserta.filter((x) => x.kategori === p.kategori).sort((a, b) => bandingNo(a.bib, b.bib));
  const dipilih = new Set(baris.map((b) => b.pesertaId).filter(Boolean));

  const ubah = (kunci, patch) => setBaris((s) => s.map((b) => (b.kunci === kunci ? { ...b, ...patch } : b)));
  const ubahAhli = (kunci, i, nilai) =>
    setBaris((s) => s.map((b) => (b.kunci === kunci ? { ...b, ahli: b.ahli.map((n, j) => (j === i ? nilai : n)) } : b)));
  const buang = (kunci) => setBaris((s) => s.filter((b) => b.kunci !== kunci));
  const kosong = (b) => (relay ? !b.rumahId : !b.pesertaId) && !b.lorong.trim() && b.ahli.every((n) => !n.trim());

  function tambahSemua() {
    const baharu = pilihan.filter((x) => !dipilih.has(x.id)).map((x) => ({ ...barisKosong(false), pesertaId: x.id }));
    setBaris((s) => [...s.filter((b) => !kosong(b)), ...baharu].slice(0, MAKS_BARIS));
  }

  async function simpan() {
    const berisi = baris.filter((b) => !kosong(b));
    const ralat = semakSenaraiMula(acara, berisi);
    if (ralat) {
      setMesej({ jenis: 'ralat', teks: ralat });
      return;
    }
    setBusy(true);
    try {
      const senaraiMula = binaSenaraiMula(acara, berisi, peserta, rumah);
      // dikemaskini is left alone: it orders "Keputusan terkini", which is about results only.
      await updateDoc(doc(db, 'perlumbaan', p.id), { senaraiMula });
      setMesej({ jenis: 'ok', teks: `Senarai mula disimpan (${senaraiMula.length} ${relay ? 'pasukan' : 'peserta'}).` });
    } catch {
      setMesej({ jenis: 'ralat', teks: 'Gagal menyimpan. Pastikan akaun anda ialah admin.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <BackLink />
      <AdminTajuk
        tajuk={`Senarai mula: ${acara.nama} ${kategori.nama}`}
        huraian={relay
          ? 'Pilih rumah sukan bagi setiap pasukan. Nama 4 pelari dan lorong adalah pilihan.'
          : `Pilih peserta ${kategori.nama.toLowerCase()} yang bertanding. Lorong adalah pilihan; jika diisi, senarai disusun mengikut lorong.`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ink px-2.5 py-1 text-[13px] font-semibold text-white">Acara {p.no}</span>
        <KategoriChip kategori={p.kategori} />
        <StatusChip status={p.status} />
        <Link to={`/senarai-mula/${p.id}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-hijau">
          Lihat halaman awam
        </Link>
      </div>

      {!relay && pilihan.length === 0 && (
        <p role="alert" className="card m-0 p-4 text-sm text-amber-900">
          Tiada peserta {kategori.nama.toLowerCase()} lagi. <Link to="/admin/peserta">Tambah peserta</Link> dahulu.
        </p>
      )}

      <form onSubmit={(e) => e.preventDefault()} className="card flex flex-col gap-4 p-4 sm:p-6">
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {baris.map((b, i) => (
            <li key={b.kunci} className="flex flex-col gap-3 rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex w-24 flex-col gap-1.5">
                  <span className="label">{labelLorong}</span>
                  <input className="field" inputMode="numeric" maxLength={2} value={b.lorong}
                    onChange={(e) => ubah(b.kunci, { lorong: e.target.value })} />
                </label>
                {relay ? (
                  <label className="flex min-w-[200px] flex-1 flex-col gap-1.5">
                    <span className="label">Rumah sukan</span>
                    <select className="field" value={b.rumahId} onChange={(e) => ubah(b.kunci, { rumahId: e.target.value })}>
                      <option value="">Pilih rumah</option>
                      {rumah.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                    </select>
                  </label>
                ) : (
                  <label className="flex min-w-[240px] flex-1 flex-col gap-1.5">
                    <span className="label">Peserta</span>
                    <select className="field" value={b.pesertaId} onChange={(e) => ubah(b.kunci, { pesertaId: e.target.value })}>
                      <option value="">Pilih peserta</option>
                      {pilihan.map((x) => (
                        <option key={x.id} value={x.id} disabled={dipilih.has(x.id) && x.id !== b.pesertaId}>
                          {x.bib} · {x.nama} ({rumahById[x.rumahId]?.nama ?? x.rumahId})
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <button type="button" className="btn-secondary h-11 w-11 px-0 text-red-700" aria-label={`Buang baris ${i + 1}`}
                  onClick={() => buang(b.kunci)}>✕</button>
              </div>

              {relay && (
                <fieldset className="m-0 grid gap-3 border-0 p-0 sm:grid-cols-2 lg:grid-cols-4">
                  <legend className="label mb-1.5 p-0">Pelari (pilihan)</legend>
                  {b.ahli.map((nama, j) => (
                    <input key={j} className="field" aria-label={`Pelari ${j + 1} untuk baris ${i + 1}`}
                      placeholder={`Pelari ${j + 1}`} value={nama} onChange={(e) => ubahAhli(b.kunci, j, e.target.value)} />
                  ))}
                </fieldset>
              )}
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" disabled={baris.length >= MAKS_BARIS}
            onClick={() => setBaris((s) => [...s, barisKosong(relay)])}>
            Tambah baris
          </button>
          {!relay && (
            <button type="button" className="btn-secondary" disabled={pilihan.length === 0} onClick={tambahSemua}>
              Tambah semua peserta {kategori.nama.toLowerCase()}
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={() => setBaris([barisKosong(relay)])}>Kosongkan</button>
        </div>

        <Mesej mesej={mesej} />

        <div className="flex flex-wrap gap-3 border-t border-line-soft pt-4">
          <button type="button" className="btn-primary" disabled={busy} onClick={simpan}>
            {busy ? 'Menyimpan…' : 'Simpan senarai mula'}
          </button>
          <Link to={`/admin/keputusan/${p.id}`} className="btn-secondary no-underline">Pergi ke keputusan</Link>
        </div>
      </form>
    </>
  );
}

function BackLink() {
  return (
    <Link to="/admin/susunan" className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-hijau no-underline">
      <IconArrowLeft />
      Susunan acara
    </Link>
  );
}
