import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useKeputusan, useRumahSukan } from '../hooks/useData.js';
import { barisStatistik, susunKedudukan } from '../lib/stats.js';
import { JENIS_SUKAN, KATEGORI } from '../lib/constants.js';
import { onColor } from '../lib/colour.js';
import { JenisChip, PingatChip, PingatDot } from '../components/Pingat.jsx';
import { IconArrowLeft } from '../components/Icons.jsx';

const PENAPIS_JENIS = [
  { id: 'semua', nama: 'Semua' },
  { id: 'balapan', nama: 'Balapan' },
  { id: 'padang', nama: 'Padang' },
];
const PENAPIS_KATEGORI = [{ id: 'semua', nama: 'Semua' }, ...KATEGORI];
const LABEL_FG = { emas: 'text-emas-fg', perak: 'text-perak-fg', gangsa: 'text-gangsa-fg' };

export default function Statistik() {
  const { rumahId } = useParams();
  const rumahList = useRumahSukan();
  const keputusan = useKeputusan();
  const [jenis, setJenis] = useState('semua');
  const [kategori, setKategori] = useState('semua');

  if (rumahList.loading || keputusan.loading) return <p className="text-muted">Memuatkan…</p>;

  const kedudukan = susunKedudukan(rumahList.data, keputusan.data);
  const rumah = kedudukan.find((r) => r.id === rumahId);
  if (!rumah) {
    return (
      <>
        <BackLink />
        <p className="text-muted">Rumah sukan tidak dijumpai.</p>
      </>
    );
  }

  const semuaBaris = barisStatistik(rumah.id, keputusan.data);
  const baris = semuaBaris.filter(
    (b) => (jenis === 'semua' || b.acara.jenis === jenis) && (kategori === 'semua' || b.kategori.id === kategori),
  );
  const fg = onColor(rumah.warna);
  const selesai = semuaBaris.filter((b) => b.status !== 'belum').length;

  return (
    <>
      <BackLink />

      <section
        className="flex flex-wrap items-center justify-between gap-6 rounded-[22px] p-8"
        style={{ background: rumah.warna, color: fg }}
      >
        <div className="flex flex-col gap-2.5">
          <span
            className="self-start rounded-full px-3 py-1.5 text-[13px] font-semibold"
            style={{ background: fg === '#FFFFFF' ? 'rgba(255,255,255,0.18)' : 'rgba(20,33,61,0.1)' }}
          >
            Tempat {rumah.kedudukan} daripada {kedudukan.length}
          </span>
          <h1 className="m-0 font-display text-[44px] font-semibold leading-tight">{rumah.nama}</h1>
          <p className="m-0">
            {selesai} daripada {semuaBaris.length} keputusan diumumkan · {rumah.pingat.jumlah} pingat dimenangi
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {['emas', 'perak', 'gangsa'].map((p) => (
            <div key={p} className="flex flex-col gap-1 rounded-2xl bg-white px-3 py-3 sm:min-w-[88px] sm:px-5 sm:py-3.5">
              <span className={`flex items-center gap-1.5 text-[13px] font-semibold ${LABEL_FG[p]}`}>
                <PingatDot jenis={p} />
                {p[0].toUpperCase() + p.slice(1)}
              </span>
              <span className="font-display text-[32px] font-semibold text-ink">{rumah.pingat[p]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="m-0 font-display text-2xl font-semibold">Statistik acara</h2>
          <div className="flex flex-wrap gap-4">
            <FilterGroup label="Jenis sukan" options={PENAPIS_JENIS} value={jenis} onChange={setJenis} />
            <FilterGroup label="Kategori" options={PENAPIS_KATEGORI} value={kategori} onChange={setKategori} />
          </div>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[15px]">
            <thead>
              <tr className="bg-[#F0F4EC] text-left">
                {['Acara', 'Kategori', 'Pingat', 'Kedudukan', 'Jenis sukan', 'Catatan'].map((h) => (
                  <th key={h} scope="col" className="px-5 py-3.5 text-[13px] font-semibold text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {baris.map((b) => (
                <tr key={b.id} className="border-t border-line-soft">
                  <td className="px-5 py-4 font-semibold">{b.acara.nama}</td>
                  <td className="px-5 py-4">{b.kategori.nama}</td>
                  <td className="px-5 py-4">
                    {b.status === 'pingat' && <PingatChip jenis={b.pingat.id} />}
                    {b.status === 'tiada' && <span className="text-muted">Tiada pingat</span>}
                    {b.status === 'belum' && <span className="text-sm text-muted">Belum ada keputusan</span>}
                  </td>
                  <td className="px-5 py-4">{b.kedudukan ? `Tempat ${b.kedudukan}` : '—'}</td>
                  <td className="px-5 py-4"><JenisChip jenis={b.acara.jenis} /></td>
                  <td className="px-5 py-4 text-muted">{b.catatan || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="m-0 text-sm text-muted">
          Memaparkan {baris.length} daripada {semuaBaris.length} perlumbaan.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="m-0 font-display text-[22px] font-semibold">Pingat mengikut jenis sukan</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {Object.keys(JENIS_SUKAN).map((j) => (
            <RingkasanJenis key={j} jenis={j} baris={semuaBaris} />
          ))}
        </div>
      </section>
    </>
  );
}

function BackLink() {
  return (
    <Link to="/" className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-hijau no-underline">
      <IconArrowLeft />
      Kembali ke papan utama
    </Link>
  );
}

function FilterGroup({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="label mr-1" aria-hidden="true">{label}</span>
      {options.map((o) => (
        <button key={o.id} type="button" className="pill" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
          {o.nama}
        </button>
      ))}
    </div>
  );
}

function RingkasanJenis({ jenis, baris }) {
  const b = baris.filter((x) => x.acara.jenis === jenis);
  const kira = (p) => b.filter((x) => x.pingat?.id === p).length;
  return (
    <div className="card flex flex-col gap-3.5 px-6 py-5">
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-semibold">{JENIS_SUKAN[jenis].nama}</span>
        <span className="text-[13px] text-muted">{b.length} perlumbaan</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-emas-bg px-3 py-1.5 text-sm font-semibold text-emas-fg">{kira('emas')} Emas</span>
        <span className="rounded-full bg-perak-bg px-3 py-1.5 text-sm font-semibold text-perak-fg">{kira('perak')} Perak</span>
        <span className="rounded-full bg-gangsa-bg px-3 py-1.5 text-sm font-semibold text-gangsa-fg">{kira('gangsa')} Gangsa</span>
      </div>
    </div>
  );
}
