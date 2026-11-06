import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePerlumbaan, useRumahSukan } from '../hooks/useData.js';
import { barisRumah, pingatMengikutJenis, susunKedudukan } from '../lib/stats.js';
import { JENIS_SUKAN, KATEGORI } from '../lib/constants.js';
import { onColor } from '../lib/colour.js';
import { KategoriChip, Memuatkan, RalatMuat } from '../components/Kongsi.jsx';
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
  const perlumbaan = usePerlumbaan();
  const [jenis, setJenis] = useState('semua');
  const [kategori, setKategori] = useState('semua');

  if (rumahList.loading || perlumbaan.loading) return <Memuatkan />;

  const kedudukan = susunKedudukan(rumahList.data, perlumbaan.data);
  const rumah = kedudukan.find((r) => r.id === rumahId);
  if (!rumah) {
    return (
      <>
        {(rumahList.error || perlumbaan.error) && <RalatMuat />}
        <BackLink />
        <p className="text-muted">Rumah sukan tidak dijumpai.</p>
      </>
    );
  }

  const semuaBaris = barisRumah(rumah.id, perlumbaan.data);
  const baris = semuaBaris.filter(
    (b) => (jenis === 'semua' || b.acara.jenis === jenis) && (kategori === 'semua' || b.kategori.id === kategori),
  );
  const mengikutJenis = pingatMengikutJenis(rumah.id, perlumbaan.data);
  const fg = onColor(rumah.warna);
  const selesai = semuaBaris.filter((b) => b.status !== 'belum').length;

  return (
    <>
      <BackLink />

      <section
        className="flex flex-wrap items-center justify-between gap-6 rounded-[22px] p-6 sm:p-8"
        style={{ background: rumah.warna, color: fg }}
      >
        <div className="flex flex-col gap-2.5">
          <span
            className="self-start rounded-full px-3 py-1.5 text-[13px] font-semibold"
            style={{ background: fg === '#FFFFFF' ? 'rgba(255,255,255,0.18)' : 'rgba(20,33,61,0.1)' }}
          >
            Tempat {rumah.kedudukan} daripada {kedudukan.length}
          </span>
          <h1 className="m-0 font-display text-[36px] font-semibold leading-tight sm:text-[44px]">{rumah.nama}</h1>
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

        <div className="card tabel-kad overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-[15px]">
            <thead>
              <tr className="bg-[#F0F4EC] text-left">
                {['No', 'Acara', 'Kategori', 'Pingat', 'Kedudukan', 'Atlet', 'Jenis sukan', 'Catatan'].map((h) => (
                  <th key={h} scope="col" className="px-5 py-3.5 text-[13px] font-semibold text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {baris.map((b) => (
                <tr key={b.id} className="border-t border-line-soft">
                  <td data-label="No" className="px-5 py-4">{b.no}</td>
                  <td data-label="Acara" className="px-5 py-4 font-semibold">
                    {b.status === 'belum' ? (
                      b.acara.nama
                    ) : (
                      <Link to={`/keputusan/${b.id}`} className="text-ink">{b.acara.nama}</Link>
                    )}
                  </td>
                  <td data-label="Kategori" className="px-5 py-4"><KategoriChip kategori={b.kategori.id} /></td>
                  <td data-label="Pingat" className="px-5 py-4">
                    {b.status === 'pingat' && <PingatChip jenis={b.pingat.id} />}
                    {b.status === 'tiada' && <span className="text-muted">Tiada pingat</span>}
                    {b.status === 'belum' && <span className="text-sm text-muted">Belum ada keputusan</span>}
                  </td>
                  <td data-label="Kedudukan" className="px-5 py-4">{b.kedudukan ? `Tempat ${b.kedudukan}` : '—'}</td>
                  <td data-label="Atlet" className="px-5 py-4">{b.atlet.length ? b.atlet.join(', ') : '—'}</td>
                  <td data-label="Jenis sukan" className="px-5 py-4"><JenisChip jenis={b.acara.jenis} /></td>
                  <td data-label="Catatan" className="px-5 py-4 text-muted">{b.catatan || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="m-0 text-sm text-muted">
          Memaparkan {baris.length} daripada {semuaBaris.length} perlumbaan. Jika rumah ini menang lebih daripada satu
          pingat dalam satu perlumbaan, kedudukan terbaik dipaparkan.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="m-0 font-display text-[22px] font-semibold">Pingat mengikut jenis sukan</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4">
          {Object.keys(JENIS_SUKAN).map((j) => (
            <RingkasanJenis
              key={j}
              jenis={j}
              pingat={mengikutJenis[j]}
              bilPerlumbaan={semuaBaris.filter((x) => x.acara.jenis === j).length}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function BackLink() {
  return (
    <Link to="/pingat" className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-hijau no-underline">
      <IconArrowLeft />
      Kembali ke jadual pingat
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

function RingkasanJenis({ jenis, pingat, bilPerlumbaan }) {
  return (
    <div className="card flex flex-col gap-3.5 px-6 py-5">
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-semibold">{JENIS_SUKAN[jenis].nama}</span>
        <span className="text-[13px] text-muted">{bilPerlumbaan} perlumbaan</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-emas-bg px-3 py-1.5 text-sm font-semibold text-emas-fg">{pingat.emas} Emas</span>
        <span className="rounded-full bg-perak-bg px-3 py-1.5 text-sm font-semibold text-perak-fg">{pingat.perak} Perak</span>
        <span className="rounded-full bg-gangsa-bg px-3 py-1.5 text-sm font-semibold text-gangsa-fg">{pingat.gangsa} Gangsa</span>
      </div>
    </div>
  );
}
