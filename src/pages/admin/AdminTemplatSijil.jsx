import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { usePerlumbaan, useRumahSukan, useTemplatSijil } from '../../hooks/useData.js';
import { petaRumah } from '../../lib/format.js';
import { mampatkanGambar } from '../../lib/gambar.js';
import { ID_TEMPLAT, MEDAN, isiMedan, medanPenuh } from '../../lib/sijil.js';
import { senaraiSijil } from '../../lib/stats.js';
import { Memuatkan } from '../../components/Kongsi.jsx';
import { AdminTajuk, Mesej } from '../../components/AdminKongsi.jsx';
import { KEJOHANAN_LALAI } from '../../components/CetakKeputusan.jsx';

// Width of an A4 page in pt, used to scale font sizes on the canvas (cqw = % of canvas width).
const LEBAR_PT = { landscape: 841.9, portrait: 595.3 };
const had = (n, min, max) => Math.min(max, Math.max(min, n));

const SAMPEL = {
  kunci: 'sampel', jenis: 'pemenang', nama: 'Nama Peserta', rumahId: 'merah', bib: '12', ked: 1, tempat: 'Pertama',
  pingat: 'Emas', catatan: '7.80 s', perlumbaan: 'sampel', no: '101', tarikh: null, acara: '50M', kategori: 'Lelaki',
};

export default function AdminTemplatSijil() {
  const { templat, loading } = useTemplatSijil();
  const perlumbaan = usePerlumbaan();
  const rumah = useRumahSukan();
  const [id, setId] = useState('pemenang');
  const [draf, setDraf] = useState(null);
  const [pilih, setPilih] = useState('nama');
  const [mesej, setMesej] = useState(null);
  const [busy, setBusy] = useState(false);
  const seret = useRef(null);
  const kanvas = useRef(null);

  // Load the saved template when the picked one changes (not on every snapshot, so edits are not lost).
  useEffect(() => {
    if (loading) return;
    const t = templat[id];
    setDraf(t ? { gambar: t.gambar, orientasi: t.orientasi ?? 'landscape', cetakLatar: t.cetakLatar !== false, medan: medanPenuh(t.medan) } : null);
    setMesej(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loading]);

  const rumahById = useMemo(() => petaRumah(rumah.data), [rumah.data]);
  const jenis = id === 'penyertaan' ? 'penyertaan' : 'pemenang';
  const sampel = useMemo(() => {
    const semua = senaraiSijil(perlumbaan.data, { jenis });
    return semua.find((s) => !['emas', 'perak', 'gangsa'].includes(id) || s.pingat?.toLowerCase() === id)
      ?? { ...SAMPEL, jenis, pingat: jenis === 'pemenang' ? (['perak', 'gangsa'].includes(id) ? ID_TEMPLAT.find((x) => x.id === id).nama : 'Emas') : null, tempat: jenis === 'pemenang' ? 'Pertama' : null };
  }, [perlumbaan.data, jenis, id]);
  const isi = isiMedan(sampel, rumahById, KEJOHANAN_LALAI);

  const info = ID_TEMPLAT.find((t) => t.id === id);
  const adaTersimpan = Boolean(templat[id]);
  const gantiAda = info?.ganti && !adaTersimpan;

  const ubahMedan = (kunci, bahagian) =>
    setDraf((d) => ({ ...d, medan: { ...d.medan, [kunci]: { ...d.medan[kunci], ...bahagian } } }));

  async function muatNaik(e) {
    const fail = e.target.files?.[0];
    e.target.value = '';
    if (!fail) return;
    setBusy(true);
    setMesej(null);
    try {
      const { gambar, orientasi } = await mampatkanGambar(fail);
      setDraf((d) => ({ cetakLatar: true, medan: medanPenuh(), ...d, gambar, orientasi }));
      setMesej({ jenis: 'ok', teks: 'Gambar sedia. Susun medan, kemudian tekan Simpan.' });
    } catch (err) {
      setMesej({ jenis: 'ralat', teks: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function simpan() {
    setBusy(true);
    setMesej(null);
    try {
      await setDoc(doc(db, 'templatSijil', id), {
        gambar: draf.gambar,
        orientasi: draf.orientasi,
        cetakLatar: draf.cetakLatar,
        medan: draf.medan,
        dikemaskini: serverTimestamp(),
      });
      setMesej({ jenis: 'ok', teks: `Templat ${info.nama} disimpan.` });
    } catch {
      setMesej({ jenis: 'ralat', teks: 'Gagal menyimpan templat. Gambar mungkin terlalu besar.' });
    } finally {
      setBusy(false);
    }
  }

  async function padam() {
    if (!window.confirm(`Padam templat ${info.nama}? Sijil akan kembali menggunakan reka bentuk asal.`)) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'templatSijil', id));
      setDraf(null);
      setMesej({ jenis: 'ok', teks: 'Templat dipadam.' });
    } catch {
      setMesej({ jenis: 'ralat', teks: 'Gagal memadam templat.' });
    } finally {
      setBusy(false);
    }
  }

  // Dragging a field: pointer events, so mouse, pen and touch all work.
  function mulaSeret(e, kunci) {
    setPilih(kunci);
    e.currentTarget.setPointerCapture(e.pointerId);
    const m = draf.medan[kunci];
    seret.current = { kunci, px: e.clientX, py: e.clientY, x: m.x, y: m.y };
  }
  function seretan(e) {
    const s = seret.current;
    if (!s) return;
    const r = kanvas.current.getBoundingClientRect();
    const lebar = draf.medan[s.kunci].lebar;
    ubahMedan(s.kunci, {
      x: Math.round(had(s.x + ((e.clientX - s.px) / r.width) * 100, 0, 100 - lebar) * 10) / 10,
      y: Math.round(had(s.y + ((e.clientY - s.py) / r.height) * 100, 0, 98) * 10) / 10,
    });
  }
  function kekunci(e, kunci) {
    const langkah = e.shiftKey ? 2 : 0.5;
    const arah = { ArrowLeft: [-langkah, 0], ArrowRight: [langkah, 0], ArrowUp: [0, -langkah], ArrowDown: [0, langkah] }[e.key];
    if (!arah) return;
    e.preventDefault();
    const m = draf.medan[kunci];
    ubahMedan(kunci, {
      x: Math.round(had(m.x + arah[0], 0, 100 - m.lebar) * 10) / 10,
      y: Math.round(had(m.y + arah[1], 0, 98) * 10) / 10,
    });
  }

  if (loading) return <Memuatkan />;
  const m = draf?.medan[pilih];
  const landscape = draf?.orientasi !== 'portrait';

  return (
    <>
      <AdminTajuk tajuk="Templat sijil" huraian="Muat naik reka bentuk sijil sekolah, kemudian seret medan teks ke tempat yang betul." />
      <Link to="/admin/sijil" className="-mt-4 text-sm font-semibold text-hijau">← Kembali ke Sijil</Link>

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="label">Templat</span>
          <select className="field w-48" value={id} onChange={(e) => setId(e.target.value)}>
            {ID_TEMPLAT.map((t) => <option key={t.id} value={t.id}>{t.nama}{templat[t.id] ? ' ✓' : ''}</option>)}
          </select>
        </label>
        <label className="btn-secondary cursor-pointer">
          {draf ? 'Ganti gambar' : 'Muat naik gambar'}
          <input type="file" accept="image/*" className="sr-only" onChange={muatNaik} disabled={busy} />
        </label>
        <button type="button" className="btn-primary" disabled={!draf || busy} onClick={simpan}>
          {busy ? 'Sila tunggu…' : 'Simpan'}
        </button>
        <button type="button" className="btn-secondary" disabled={!adaTersimpan || busy} onClick={padam}>Padam templat</button>
      </div>

      {gantiAda && (
        <p className="m-0 text-sm text-muted">
          Templat {info.nama} belum ada, jadi sijil {info.nama} menggunakan templat Pemenang
          {templat.pemenang ? '' : ' (atau reka bentuk asal jika Pemenang pun belum ada)'}.
        </p>
      )}
      <Mesej mesej={mesej} />

      {!draf ? (
        <p className="card m-0 p-6 text-muted">
          Tiada templat {info.nama}; reka bentuk asal digunakan. Muat naik gambar (JPG atau PNG, A4 mendatar atau menegak)
          untuk menggantikannya. Gambar dikecilkan secara automatik.
        </p>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
          <div
            ref={kanvas}
            className="relative w-full select-none overflow-hidden rounded-xl border border-line bg-white"
            style={{ aspectRatio: landscape ? '297 / 210' : '210 / 297', containerType: 'inline-size' }}
          >
            <img src={draf.gambar} alt="" className="pointer-events-none absolute inset-0 h-full w-full" draggable={false} />
            {MEDAN.map(({ kunci }) => {
              const f = draf.medan[kunci];
              if (!f.papar) return null;
              return (
                <div
                  key={kunci}
                  tabIndex={0}
                  role="button"
                  aria-label={`Medan ${kunci}. Seret atau guna anak panah untuk alih.`}
                  onPointerDown={(e) => mulaSeret(e, kunci)}
                  onPointerMove={seretan}
                  onPointerUp={() => { seret.current = null; }}
                  onPointerCancel={() => { seret.current = null; }}
                  onFocus={() => setPilih(kunci)}
                  onKeyDown={(e) => kekunci(e, kunci)}
                  className={`absolute cursor-move touch-none whitespace-pre-wrap break-words leading-[1.15] outline-dashed outline-1 ${
                    pilih === kunci ? 'bg-hijau/20 outline-hijau' : 'outline-black/30'
                  }`}
                  style={{
                    left: `${f.x}%`, top: `${f.y}%`, width: `${f.lebar}%`,
                    fontSize: `${(f.saiz / LEBAR_PT[draf.orientasi]) * 100}cqw`,
                    color: f.warna, fontWeight: f.tebal ? 700 : 400, textAlign: f.jajar,
                    fontFamily: "Georgia, 'Times New Roman', serif",
                  }}
                >
                  {isi[kunci] || `(${kunci} kosong)`}
                </div>
              );
            })}
          </div>

          <aside className="card flex flex-col gap-4 p-5">
            <h2 className="m-0 font-display text-lg font-semibold">Medan</h2>
            <div className="flex flex-wrap gap-1.5">
              {MEDAN.map(({ kunci, nama }) => (
                <button key={kunci} type="button" aria-pressed={pilih === kunci} onClick={() => setPilih(kunci)}
                  className={`pill min-h-9 px-3 ${draf.medan[kunci].papar ? '' : 'opacity-50'}`}>{nama}</button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={m.papar} onChange={(e) => ubahMedan(pilih, { papar: e.target.checked })} />
              Papar medan ini
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="label">Saiz huruf (pt)</span>
              <input type="number" min="6" max="120" className="field" value={m.saiz}
                onChange={(e) => ubahMedan(pilih, { saiz: had(Number(e.target.value) || 12, 6, 120) })} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="label">Warna</span>
              <input type="color" className="h-11 w-20 cursor-pointer rounded-lg border border-[#C9D2C0] bg-white p-1" value={m.warna}
                onChange={(e) => ubahMedan(pilih, { warna: e.target.value })} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={m.tebal} onChange={(e) => ubahMedan(pilih, { tebal: e.target.checked })} />
              Tebal
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="label">Jajaran</span>
              <select className="field" value={m.jajar} onChange={(e) => ubahMedan(pilih, { jajar: e.target.value })}>
                <option value="left">Kiri</option>
                <option value="center">Tengah</option>
                <option value="right">Kanan</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="label">Lebar ({Math.round(m.lebar)}%)</span>
              <input type="range" min="10" max="100" value={m.lebar}
                onChange={(e) => {
                  const lebar = Number(e.target.value);
                  ubahMedan(pilih, { lebar, x: Math.min(m.x, 100 - lebar) });
                }} />
            </label>
            <hr className="m-0 border-line" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draf.cetakLatar} onChange={(e) => setDraf({ ...draf, cetakLatar: e.target.checked })} />
              Cetak gambar latar
            </label>
            <p className="m-0 text-xs text-muted">
              Matikan jika mencetak pada kertas sijil yang sudah bercetak; hanya teks akan dicetak.
              Pilih medan dan tekan anak panah untuk alih sedikit (Shift = lebih jauh).
            </p>
          </aside>
        </div>
      )}
    </>
  );
}
