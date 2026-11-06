import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { usePerlumbaan, usePeserta, useRekod, useRumahSukan } from '../../hooks/useData.js';
import { ACARA, KATEGORI, PINGAT } from '../../lib/constants.js';
import { petaRumah } from '../../lib/format.js';
import {
  STATUS_PELUMBA, adalahRekodBaharu, bacaCubaan, binaKeputusan, formatMasa, semakKeputusan, susunKeputusan,
} from '../../lib/stats.js';
import { KategoriChip, Memuatkan, NamaRumah, StatusChip } from '../../components/Kongsi.jsx';
import { PingatDot } from '../../components/Pingat.jsx';
import { AdminTajuk, Mesej } from '../../components/AdminKongsi.jsx';
import { IconArrowLeft } from '../../components/Icons.jsx';

const MAKS_BARIS = 60;
const TIGA_KOSONG = ['', '', ''];
let kunciTerakhir = 0;
const kunciBaharu = () => {
  kunciTerakhir += 1;
  return kunciTerakhir;
};

export default function AdminKeputusan() {
  const { perlumbaanId } = useParams();
  const perlumbaan = usePerlumbaan();
  const peserta = usePeserta();
  const rumah = useRumahSukan();
  const rekod = useRekod();

  if (perlumbaan.loading || peserta.loading || rumah.loading || rekod.loading) return <Memuatkan />;

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
  return (
    <Borang
      key={p.id}
      p={p}
      peserta={peserta.data}
      rumah={rumah.data}
      rekodAcara={rekod.data.find((r) => r.id === p.id)}
    />
  );
}

const kunciEntri = (e, relay) => (relay ? e.rumahId : e.pesertaId || `${e.nama}|${e.rumahId}`);

// One form row per competitor. Saved results keep their values; start-list athletes not yet in the
// results are added with empty catatan.
function dariEntri(e, relay, lorong) {
  return {
    kunci: kunciBaharu(),
    pesertaId: relay ? '' : e.pesertaId ?? '',
    bib: relay ? '' : e.bib ?? '',
    nama: e.nama ?? '',
    rumahId: e.rumahId ?? '',
    lorong: Number.isInteger(e.lorong) ? e.lorong : lorong ?? null,
    ahli: relay ? [0, 1, 2, 3].map((i) => e.ahli?.[i] ?? '') : [],
    catatan: e.catatan ?? '',
    cubaan: [0, 1, 2].map((i) => e.cubaan?.[i] ?? ''),
    status: e.status ?? '',
    seri: Number.isInteger(e.seri) ? String(e.seri) : '',
    // A result saved from finish-line taps has a ked but no time; the ked is its tap order.
    tap: e.nilai == null && Number.isInteger(e.ked) ? e.ked : null,
  };
}

function barisAwal(p, relay) {
  const tersimpan = p.keputusan ?? [];
  const mula = p.senaraiMula ?? [];
  const lorongDari = new Map(mula.map((e) => [kunciEntri(e, relay), e.lorong]));
  const ada = new Set(tersimpan.map((e) => kunciEntri(e, relay)));
  return [
    ...tersimpan.map((e) => dariEntri(e, relay, lorongDari.get(kunciEntri(e, relay)))),
    ...mula.filter((e) => !ada.has(kunciEntri(e, relay))).map((e) => dariEntri({ ...e, catatan: '' }, relay)),
  ];
}

const adaIsi = (b) => Boolean(b.status || b.catatan.trim() || b.cubaan.some((c) => c.trim()) || Number.isInteger(b.tap));

function Borang({ p, peserta, rumah, rekodAcara }) {
  const acara = ACARA.find((a) => a.id === p.acaraId);
  const kategori = KATEGORI.find((k) => k.id === p.kategori);
  const relay = acara.jenisAcara === 'berganti-ganti';
  const padang = acara.jenis === 'padang';
  const labelLorong = padang ? 'Giliran' : 'Lorong';
  const rumahById = petaRumah(rumah);

  const [baris, setBaris] = useState(() => barisAwal(p, relay));
  const [gunaCubaan, setGunaCubaan] = useState(() => padang && (p.keputusan ?? []).some((e) => e.cubaan?.length));
  const [modPenamat, setModPenamat] = useState(false);
  const [jam, setJam] = useState({ mula: null, henti: null });
  const [, setTik] = useState(0);
  const [tambahBib, setTambahBib] = useState('');
  const [tambahRumah, setTambahRumah] = useState('');
  const [pratonton, setPratonton] = useState(false);
  const [mesej, setMesej] = useState(null);
  const [busy, setBusy] = useState(false);

  // Rows exactly as the ranking sees them (attempts are ignored when the attempt boxes are off).
  const untukKira = useMemo(
    () => (gunaCubaan ? baris : baris.map((b) => ({ ...b, cubaan: TIGA_KOSONG }))),
    [baris, gunaCubaan],
  );
  const s = useMemo(() => susunKeputusan(acara, untukKira), [acara, untukKira]);
  const byKunci = new Map(s.baris.map((r) => [r.kunci, r]));

  // The list is ranked live (every ked updates as you type) but only re-orders when you leave a field
  // or press a button, so a row never moves away from under the cursor mid-typing.
  const [urutan, setUrutan] = useState(() => s.baris.map((r) => r.kunci));
  const segarkan = () => setUrutan(s.baris.map((r) => r.kunci));
  const struktur = baris.map((b) => `${b.kunci}:${b.status}:${b.seri}:${b.tap ?? ''}:${gunaCubaan}`).join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(segarkan, [struktur]);
  const paparan = [
    ...urutan.filter((k) => byKunci.has(k)),
    ...s.baris.map((r) => r.kunci).filter((k) => !urutan.includes(k)),
  ].map((k) => byKunci.get(k));

  const berjalan = jam.mula !== null && jam.henti === null;
  useEffect(() => {
    if (!berjalan) return undefined;
    const id = setInterval(() => setTik((t) => t + 1), 50);
    return () => clearInterval(id);
  }, [berjalan]);
  const lalu = jam.mula === null ? 0 : ((jam.henti ?? performance.now()) - jam.mula) / 1000;

  const ubah = (kunci, patch) => setBaris((r) => r.map((b) => (b.kunci === kunci ? { ...b, ...patch } : b)));
  const ubahAhli = (kunci, i, nilai) =>
    setBaris((r) => r.map((b) => (b.kunci === kunci ? { ...b, ahli: b.ahli.map((n, j) => (j === i ? nilai : n)) } : b)));
  const ubahCubaan = (kunci, i, nilai) =>
    setBaris((r) => r.map((b) => (b.kunci === kunci ? { ...b, cubaan: b.cubaan.map((c, j) => (j === i ? nilai : c)) } : b)));
  const tetapStatus = (b, kod) => ubah(b.kunci, { status: b.status === kod ? '' : kod });
  const enterSegarkan = (e) => {
    if (e.key === 'Enter') segarkan();
  };

  function buang(b) {
    if (adaIsi(b) && !window.confirm(`Buang ${b.nama}? Catatan yang sudah diisi akan hilang.`)) return;
    setBaris((r) => r.filter((x) => x.kunci !== b.kunci));
  }

  function tambahPeserta(e) {
    e.preventDefault();
    const bib = tambahBib.trim();
    if (!bib) return;
    const x = peserta.find((q) => String(q.bib) === bib);
    if (!x) return setMesej({ jenis: 'ralat', teks: `Bib ${bib} tiada dalam senarai peserta.` });
    if (x.kategori !== p.kategori) return setMesej({ jenis: 'ralat', teks: `Bib ${bib} (${x.nama}) bukan peserta ${kategori.nama.toLowerCase()}.` });
    if (baris.some((b) => b.pesertaId === x.id)) return setMesej({ jenis: 'ralat', teks: `${x.nama} sudah ada dalam senarai ini.` });
    setBaris((r) => [...r, dariEntri({ pesertaId: x.id, bib: x.bib, nama: x.nama, rumahId: x.rumahId }, false)]);
    setTambahBib('');
    return setMesej({ jenis: 'ok', teks: `${x.nama} ditambah.` });
  }

  function tambahPasukan(e) {
    e.preventDefault();
    if (!tambahRumah) return;
    if (baris.some((b) => b.rumahId === tambahRumah)) return setMesej({ jenis: 'ralat', teks: 'Rumah sukan itu sudah ada.' });
    setBaris((r) => [...r, dariEntri({ rumahId: tambahRumah, nama: rumahById[tambahRumah]?.nama ?? '' }, true)]);
    setTambahRumah('');
    return setMesej(null);
  }

  // Finish-line mode: each tap gives the next place. With the stopwatch running it also records the time.
  function ketuk(kunci) {
    const masa = berjalan ? formatMasa((performance.now() - jam.mula) / 1000) : null;
    setBaris((r) => {
      const sasaran = r.find((b) => b.kunci === kunci);
      if (!sasaran || sasaran.status || sasaran.tap !== null) return r;
      const maks = Math.max(0, ...r.map((b) => b.tap ?? 0));
      return r.map((b) => (b.kunci === kunci
        ? { ...b, tap: maks + 1, tapBaharu: true, tapCatatanLama: b.catatan, ...(masa ? { catatan: masa } : {}) }
        : b));
    });
  }

  function buatAsal() {
    setBaris((r) => {
      const baharu = r.filter((b) => b.tapBaharu);
      if (!baharu.length) return r;
      const akhir = baharu.reduce((a, b) => (b.tap > a.tap ? b : a));
      return r.map((b) => (b.kunci === akhir.kunci
        ? { ...b, tap: null, tapBaharu: false, catatan: b.tapCatatanLama ?? '', tapCatatanLama: undefined }
        : b));
    });
  }

  function semak(umum) {
    const ralat = semakKeputusan(acara, untukKira, { umum });
    if (ralat) setMesej({ jenis: 'ralat', teks: ralat });
    return ralat;
  }

  function umumkan() {
    setMesej(null);
    setPratonton(!semak(true));
  }

  async function simpan(umum) {
    // An official race always needs the full check, even when only saving a draft of it.
    if (semak(umum || p.status === 'rasmi')) return;
    setBusy(true);
    try {
      const keputusan = binaKeputusan(acara, untukKira.filter(adaIsi));
      await updateDoc(doc(db, 'perlumbaan', p.id), {
        keputusan,
        ...(umum ? { status: 'rasmi' } : {}),
        dikemaskini: serverTimestamp(),
      });
      setPratonton(false);
      setMesej({ jenis: 'ok', teks: umum ? 'Keputusan rasmi diumumkan.' : 'Draf disimpan.' });
    } catch {
      setMesej({ jenis: 'ralat', teks: 'Gagal menyimpan. Pastikan akaun anda ialah admin.' });
    } finally {
      setBusy(false);
    }
  }

  const tigaTeratas = s.baris.filter((r) => Number.isInteger(r.ked) && r.ked <= 3);
  const rekodBaru = s.baris.filter((r) => Number.isInteger(r.ked) && !r.status && adalahRekodBaharu(acara.jenis, r.nilai, rekodAcara));
  const tanpaHasil = baris.filter((b) => !adaIsi(b)).length;

  return (
    <>
      <BackLink />
      <AdminTajuk
        tajuk={`${acara.nama} ${kategori.nama}`}
        huraian={`Taip ${padang ? 'jarak' : 'masa'} setiap peserta sahaja. Kedudukan dikira dan disusun secara automatik.`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ink px-2.5 py-1 text-[13px] font-semibold text-white">Acara {p.no}</span>
        <KategoriChip kategori={p.kategori} />
        <StatusChip status={p.status} />
        {p.status === 'rasmi' && (
          <span className="text-sm text-muted">Keputusan ini sudah rasmi, jadi perubahan terus dipaparkan.</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="pill" aria-pressed={modPenamat} onClick={() => setModPenamat((m) => !m)}>
          Mod garisan penamat
        </button>
        {padang && !relay && (
          <button type="button" className="pill" aria-pressed={gunaCubaan} onClick={() => setGunaCubaan((g) => !g)}>
            Guna 3 cubaan
          </button>
        )}
        <Link to={`/admin/senarai-mula/${p.id}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-hijau">
          Ubah senarai mula
        </Link>
      </div>

      {modPenamat && (
        <section aria-label="Mod garisan penamat" className="flex flex-col gap-4 rounded-2xl border-2 border-ink bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="m-0 font-display text-xl font-semibold">Mod garisan penamat</h2>
              <p className="m-0 text-sm text-muted">
                Tekan nama peserta mengikut urutan melepasi garisan.{!padang && ' Mulakan jam untuk merekod masa setiap peserta.'}
              </p>
            </div>
            {!padang && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="min-w-[8ch] font-display text-3xl font-semibold tabular-nums" aria-live="off">
                  {formatMasa(lalu)}
                </span>
                {!berjalan && jam.mula === null && (
                  <button type="button" className="btn-primary min-h-14 px-6 text-base"
                    onClick={() => setJam({ mula: performance.now(), henti: null })}>Mula</button>
                )}
                {berjalan && (
                  <button type="button" className="btn-primary min-h-14 px-6 text-base"
                    onClick={() => setJam((j) => ({ ...j, henti: performance.now() }))}>Henti</button>
                )}
                {jam.mula !== null && !berjalan && (
                  <button type="button" className="btn-secondary min-h-14 px-6 text-base"
                    onClick={() => setJam({ mula: null, henti: null })}>Set semula jam</button>
                )}
              </div>
            )}
          </div>

          <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {[...baris.filter((b) => !b.status && b.tap === null), ...baris.filter((b) => !b.status && b.tap !== null)].map((b) => {
              const r = byKunci.get(b.kunci);
              const sudah = b.tap !== null;
              return (
                <li key={b.kunci}>
                  <button
                    type="button"
                    disabled={sudah}
                    onClick={() => ketuk(b.kunci)}
                    className="flex min-h-24 w-full flex-col items-start justify-center gap-1 rounded-2xl border-2 border-line bg-white p-4 text-left hover:bg-ground disabled:cursor-not-allowed disabled:bg-perak-bg"
                  >
                    <span className="flex w-full items-center justify-between gap-3">
                      <span className="font-display text-3xl font-semibold">{relay ? '' : b.bib || '—'}</span>
                      {sudah && <span className="rounded-full bg-ink px-3 py-1 text-sm font-bold text-white">Ked {r?.ked ?? '—'}</span>}
                    </span>
                    <span className="text-lg font-semibold">{b.nama}</span>
                    <span className="text-sm"><NamaRumah rumah={rumahById[b.rumahId]} rumahId={b.rumahId} /></span>
                  </button>
                </li>
              );
            })}
          </ul>
          {baris.length === 0 && <p className="m-0 text-sm text-muted">Belum ada peserta dalam senarai ini.</p>}
          <div>
            <button type="button" className="btn-secondary min-h-14 px-6 text-base" onClick={buatAsal}
              disabled={!baris.some((b) => b.tapBaharu)}>
              Buat asal
            </button>
          </div>
        </section>
      )}

      <form onSubmit={(e) => e.preventDefault()} className="card flex flex-col gap-4 p-4 sm:p-6">
        <p className="m-0 text-sm text-muted">
          <strong>TT</strong> tidak tamat (DNF) · <strong>TH</strong> tidak hadir (DNS) · <strong>DQ</strong> dibatalkan
          kelayakan. Baris ini tiada kedudukan dan tidak mendapat pingat.
        </p>

        {paparan.length === 0 ? (
          <p className="m-0 text-muted">
            Belum ada peserta. Tambah mengikut bib di bawah, atau isi <Link to={`/admin/senarai-mula/${p.id}`}>senarai mula</Link>.
          </p>
        ) : (
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {paparan.map((r) => (
              <li key={r.kunci} className={`flex flex-col gap-3 rounded-xl border p-4 ${r.status ? 'border-line bg-ground' : 'border-line'}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <KedLencana r={r} />
                  <div className="flex min-w-[180px] flex-1 flex-col gap-0.5">
                    <span className="text-sm text-muted">
                      {r.lorong ? `${labelLorong} ${r.lorong}` : ''}{r.lorong && r.bib ? ' · ' : ''}{r.bib ? `Bib ${r.bib}` : ''}
                    </span>
                    <span className="font-semibold">{r.nama}</span>
                    <span className="text-sm"><NamaRumah rumah={rumahById[r.rumahId]} rumahId={r.rumahId} /></span>
                  </div>

                  {!r.status && (padang && gunaCubaan ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex gap-2">
                        {r.cubaan.map((c, i) => (
                          <input
                            key={i}
                            className={`field w-24 ${bacaCubaan(c).jenis === 'tidakSah' ? SALAH : ''}`}
                            aria-label={`Cubaan ${i + 1} untuk ${r.nama}`}
                            aria-invalid={bacaCubaan(c).jenis === 'tidakSah'}
                            placeholder={`Cubaan ${i + 1}`}
                            value={c}
                            onChange={(e) => ubahCubaan(r.kunci, i, e.target.value)}
                            onBlur={segarkan}
                            onKeyDown={enterSegarkan}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted">
                        {r.nilai !== null ? `Terbaik: ${r.nilai} m` : 'X atau - untuk cubaan gagal'}
                      </span>
                    </div>
                  ) : (
                    <label className="flex w-40 flex-col gap-1.5">
                      <span className="label">{padang ? 'Jarak' : 'Masa'}</span>
                      <input
                        className={`field ${r.tidakSah ? SALAH : ''}`}
                        aria-label={`${padang ? 'Jarak' : 'Masa'} untuk ${r.nama}`}
                        aria-invalid={r.tidakSah}
                        placeholder={padang ? '3.62 m' : '13.50 atau 1:05.3'}
                        value={r.catatan}
                        onChange={(e) => ubah(r.kunci, { catatan: e.target.value })}
                        onBlur={segarkan}
                        onKeyDown={enterSegarkan}
                      />
                    </label>
                  ))}

                  <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Status ${r.nama}`}>
                    {Object.entries(STATUS_PELUMBA).map(([kod, st]) => (
                      <button key={kod} type="button" className="pill min-w-14 px-3" aria-pressed={r.status === kod}
                        title={`${st.nama} (${st.singkatan})`} onClick={() => tetapStatus(r, kod)}>
                        {kod}
                      </button>
                    ))}
                    <button type="button" className="btn-secondary h-11 w-11 px-0 text-red-700" aria-label={`Buang ${r.nama}`}
                      onClick={() => buang(r)}>✕</button>
                  </div>
                </div>

                {(r.tidakSah) && (
                  <p role="alert" className="m-0 text-sm text-red-700">
                    {padang && gunaCubaan ? 'Cubaan tidak sah. Guna cth. 3.62 m, atau X untuk cubaan gagal.' : 'Catatan tidak sah. Guna cth. 13.5, 13.50 s atau 1:05.3.'}
                  </p>
                )}

                {r.statusSeri && (
                  <div className="flex flex-wrap items-center gap-3 rounded-lg bg-emas-bg px-3 py-2 text-sm text-emas-fg">
                    <strong>Seri</strong>
                    <span>
                      {r.statusSeri === 'belum'
                        ? `${r.saizSeri} peserta sama. Pilih susunan seri untuk memutuskan kedudukan.`
                        : 'Seri telah diselesaikan.'}
                    </span>
                    <label className="flex items-center gap-2">
                      <span className="sr-only">Susunan seri untuk {r.nama}</span>
                      <select className="field min-h-11 w-28" value={r.seri} onChange={(e) => ubah(r.kunci, { seri: e.target.value })}>
                        <option value="">Seri…</option>
                        {Array.from({ length: r.saizSeri }, (_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1}</option>)}
                      </select>
                    </label>
                  </div>
                )}

                {relay && (
                  <fieldset className="m-0 grid gap-3 border-0 p-0 sm:grid-cols-2 lg:grid-cols-4">
                    <legend className="label mb-1.5 p-0">Pelari</legend>
                    {r.ahli.map((nama, j) => (
                      <input key={j} className="field" aria-label={`Pelari ${j + 1} untuk ${r.nama}`} placeholder={`Pelari ${j + 1}`}
                        value={nama} onChange={(e) => ubahAhli(r.kunci, j, e.target.value)} />
                    ))}
                  </fieldset>
                )}
              </li>
            ))}
          </ol>
        )}

        {relay ? (
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-[200px] flex-col gap-1.5">
              <span className="label">Tambah pasukan</span>
              <select className="field" value={tambahRumah} onChange={(e) => setTambahRumah(e.target.value)}>
                <option value="">Pilih rumah</option>
                {rumah.filter((r) => !baris.some((b) => b.rumahId === r.id)).map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
              </select>
            </label>
            <button type="button" className="btn-secondary" disabled={!tambahRumah || baris.length >= MAKS_BARIS} onClick={tambahPasukan}>Tambah</button>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="label">Tambah peserta mengikut bib</span>
              <input className="field w-40" inputMode="numeric" value={tambahBib} onChange={(e) => setTambahBib(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') tambahPeserta(e); }} />
            </label>
            <button type="button" className="btn-secondary" disabled={!tambahBib.trim() || baris.length >= MAKS_BARIS} onClick={tambahPeserta}>
              Tambah
            </button>
          </div>
        )}

        <Mesej mesej={mesej} />

        {pratonton && (
          <section aria-label="Ringkasan sebelum umum" className="flex flex-col gap-3 rounded-xl border-2 border-hijau bg-[#F3F9F4] p-4">
            <h2 className="m-0 font-display text-xl font-semibold">Semak sebelum diumumkan</h2>
            <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
              {tigaTeratas.map((r, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <PingatDot jenis={PINGAT[r.ked].id} />
                  <strong>{PINGAT[r.ked].nama}</strong>
                  <span>{r.nama}</span>
                  <span className="text-muted">({rumahById[r.rumahId]?.nama ?? r.rumahId})</span>
                  <span className="font-semibold">{r.catatan || (r.nilai !== null ? r.nilai : '')}</span>
                </li>
              ))}
            </ol>
            {rekodBaru.length > 0 ? (
              <ul className="m-0 list-none p-0 text-sm font-semibold text-hijau">
                {rekodBaru.map((r) => (
                  <li key={r.kunci}>Rekod baharu: {r.nama}, {r.catatan || r.nilai} (rekod lama {rekodAcara.catatan}).</li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-sm text-muted">Tiada rekod baharu.</p>
            )}
            {tanpaHasil > 0 && (
              <p className="m-0 text-sm text-amber-900">
                {tanpaHasil} peserta belum ada catatan atau status. Mereka tidak akan disimpan dalam keputusan.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn-primary" disabled={busy} onClick={() => simpan(true)}>
                {busy ? 'Menyimpan…' : 'Sahkan dan umumkan'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setPratonton(false)}>Kembali menyunting</button>
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-3 border-t border-line-soft pt-4">
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => simpan(false)}>Simpan draf</button>
          <button type="button" className="btn-primary" disabled={busy} onClick={umumkan}>Umumkan keputusan rasmi</button>
        </div>
      </form>
    </>
  );
}

const SALAH = 'border-red-600! bg-red-50 ring-2 ring-red-200';

/** Computed place (or TT/TH/DQ) shown in a circle; an unresolved tie shows "=" and an amber ring. */
function KedLencana({ r }) {
  if (r.status) {
    return (
      <span className="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-perak-bg px-2 font-display text-sm font-bold text-perak-fg"
        title={STATUS_PELUMBA[r.status].nama}>
        {r.status}
      </span>
    );
  }
  if (!Number.isInteger(r.ked)) {
    return <span className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-line text-muted" aria-label="Belum ada kedudukan">—</span>;
  }
  return (
    <span
      className={`inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-ink px-2 font-display text-lg font-bold text-white ${
        r.statusSeri === 'belum' ? 'ring-4 ring-emas-dot' : ''
      }`}
      aria-label={`Kedudukan ${r.ked}${r.statusSeri === 'belum' ? ' (seri)' : ''}`}
    >
      {r.ked}{r.statusSeri === 'belum' ? '=' : ''}
    </span>
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
