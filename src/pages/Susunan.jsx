import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePerlumbaan, useRumahSukan } from '../hooks/useData.js';
import { susunKedudukan, tigaTerbaik } from '../lib/stats.js';
import { ACARA, KATEGORI, PERINGKAT } from '../lib/constants.js';
import { bandingNo, masaPapar, petaRumah, tarikhPendek } from '../lib/format.js';
import { Memuatkan, KategoriChip, NamaRumah, RalatMuat, RankCircle, StatusChip } from '../components/Kongsi.jsx';
import { PingatDot } from '../components/Pingat.jsx';
import { IconArrowRight } from '../components/Icons.jsx';

const PENAPIS_KATEGORI = [{ id: 'semua', nama: 'Semua' }, ...KATEGORI];

export default function Susunan() {
  const rumah = useRumahSukan();
  const perlumbaan = usePerlumbaan();
  const [kategori, setKategori] = useState('semua');
  const [hariPilih, setHariPilih] = useState(null);

  if (rumah.loading || perlumbaan.loading) return <Memuatkan />;

  const senarai = perlumbaan.data;
  const hariList = [...new Set(senarai.map((p) => p.hari))].sort();
  const hari = hariPilih ?? senarai.find((p) => p.status === 'berlangsung')?.hari ?? hariList[0];
  const rumahById = petaRumah(rumah.data);
  const kedudukan = susunKedudukan(rumah.data, senarai);
  const baris = senarai
    .filter((p) => p.hari === hari && (kategori === 'semua' || p.kategori === kategori))
    .sort((a, b) => bandingNo(a.no, b.no));

  return (
    <>
      {(rumah.error || perlumbaan.error) && <RalatMuat />}

      {kedudukan.length > 0 && (
        <section aria-label="Kedudukan semasa" className="flex flex-wrap items-center gap-3">
          <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-hijau">Kedudukan semasa</span>
          <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
            {kedudukan.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/rumah/${r.id}`}
                  className="card flex min-h-11 items-center gap-3 py-1.5 pl-2 pr-4 text-ink no-underline hover:shadow-sm"
                >
                  <RankCircle n={r.kedudukan} warna={r.warna} />
                  <span className="text-sm font-semibold">{r.nama}</span>
                  <span className="flex items-center gap-3 text-sm">
                    {['emas', 'perak', 'gangsa'].map((p) => (
                      <span key={p} className="inline-flex items-center gap-1" title={p[0].toUpperCase() + p.slice(1)}>
                        <PingatDot jenis={p} className="h-2.5 w-2.5" />
                        <span className="sr-only">{p}</span>
                        {r.pingat[p]}
                      </span>
                    ))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/pingat" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-hijau">
            Jadual pingat <IconArrowRight />
          </Link>
        </section>
      )}

      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-3xl font-semibold sm:text-4xl">Susunan acara</h1>
        <p className="m-0 text-muted">
          {senarai.length} perlumbaan{hariList.length > 0 && ` dalam ${hariList.length} hari`}. Keputusan dikemas kini
          sebaik sahaja diumumkan.
        </p>
      </div>

      {senarai.length === 0 ? (
        <div className="card p-6 text-muted">Susunan acara belum disediakan.</div>
      ) : (
        <section className="flex flex-col gap-4">
          <div role="group" aria-label="Kategori" className="flex flex-wrap items-center gap-2">
            <span className="label mr-1" aria-hidden="true">Kategori</span>
            {PENAPIS_KATEGORI.map((k) => (
              <button key={k.id} type="button" className="pill" aria-pressed={kategori === k.id} onClick={() => setKategori(k.id)}>
                {k.nama}
              </button>
            ))}
          </div>

          <div>
            <HariTab hariList={hariList} aktif={hari} senarai={senarai} onPilih={setHariPilih} />
            <div
              role="tabpanel"
              id="panel-hari"
              aria-labelledby={`tab-hari-${hari}`}
              className="card tabel-kad overflow-x-auto rounded-t-none max-md:pt-3"
            >
              <table className="w-full min-w-[880px] border-collapse text-[15px]">
                <thead>
                  <tr className="bg-[#F0F4EC] text-left">
                    {['No', 'Masa', 'Kategori', 'Acara', 'Peringkat', 'Status', 'Emas', ''].map((h, i) => (
                      <th key={h || i} scope="col" className="px-4 py-3.5 text-[13px] font-semibold text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {baris.map((p) => (
                    <BarisPerlumbaan key={p.id} p={p} rumahById={rumahById} />
                  ))}
                </tbody>
              </table>
              {baris.length === 0 && <p className="m-0 px-4 py-6 text-muted">Tiada perlumbaan untuk pilihan ini.</p>}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function HariTab({ hariList, aktif, senarai, onPilih }) {
  function kekunci(e, i) {
    const arah = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!arah) return;
    e.preventDefault();
    const seterusnya = hariList[(i + arah + hariList.length) % hariList.length];
    onPilih(seterusnya);
    document.getElementById(`tab-hari-${seterusnya}`)?.focus();
  }

  return (
    <div role="tablist" aria-label="Hari" className="flex gap-1 overflow-x-auto rounded-t-2xl bg-ink px-2 pt-2">
      {hariList.map((h, i) => {
        const dipilih = h === aktif;
        const tarikh = tarikhPendek(senarai.find((p) => p.hari === h && p.tarikh)?.tarikh);
        return (
          <button
            key={h}
            id={`tab-hari-${h}`}
            type="button"
            role="tab"
            aria-selected={dipilih}
            aria-controls="panel-hari"
            tabIndex={dipilih ? 0 : -1}
            onClick={() => onPilih(h)}
            onKeyDown={(e) => kekunci(e, i)}
            className={`min-h-11 shrink-0 rounded-t-xl px-5 text-sm font-semibold ${
              dipilih ? 'bg-white text-ink' : 'text-white hover:bg-white/10'
            }`}
          >
            Hari {h}
            {tarikh && <span className={`ml-2 font-normal ${dipilih ? 'text-muted' : 'text-white/80'}`}>{tarikh}</span>}
          </button>
        );
      })}
    </div>
  );
}

function BarisPerlumbaan({ p, rumahById }) {
  const acara = ACARA.find((a) => a.id === p.acaraId);
  const juara = p.status === 'rasmi' ? tigaTerbaik(p)[0] : null;
  const rasmi = p.status === 'rasmi';
  return (
    <tr className={`border-t border-line-soft ${p.status === 'berlangsung' ? 'bg-emas-bg/60' : ''}`}>
      <td data-label="No" className="px-4 py-3.5 font-semibold">{p.no}</td>
      <td data-label="Masa" className="px-4 py-3.5">{masaPapar(p.masa)}</td>
      <td data-label="Kategori" className="px-4 py-3.5"><KategoriChip kategori={p.kategori} /></td>
      <td data-label="Acara" className="px-4 py-3.5 font-semibold">{acara?.nama ?? p.acaraId}</td>
      <td data-label="Peringkat" className="px-4 py-3.5">{PERINGKAT[p.peringkat] ?? p.peringkat}</td>
      <td data-label="Status" className="px-4 py-3.5"><StatusChip status={p.status} /></td>
      <td data-label="Emas" className="px-4 py-3.5">
        {juara ? <NamaRumah rumah={rumahById[juara.rumahId]} rumahId={juara.rumahId} /> : <span className="text-muted">—</span>}
      </td>
      <td data-label="" className="px-4 py-3.5">
        <div className="flex justify-end gap-2">
          {p.senaraiMula?.length ? (
            <Link to={`/senarai-mula/${p.id}`} className="btn-secondary no-underline">Peserta</Link>
          ) : (
            <button type="button" disabled className="btn-secondary cursor-not-allowed bg-perak-bg! text-perak-fg!">Peserta</button>
          )}
          {rasmi ? (
            <Link to={`/keputusan/${p.id}`} className="btn-primary no-underline">Keputusan</Link>
          ) : (
            <button type="button" disabled className="btn-primary bg-perak-bg! text-perak-fg! opacity-100!">Keputusan</button>
          )}
        </div>
      </td>
    </tr>
  );
}
