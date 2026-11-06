import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePerlumbaan, useRumahSukan } from '../hooks/useData.js';
import { perlumbaanTerkini, susunKedudukan, tigaTerbaik } from '../lib/stats.js';
import { ACARA, KATEGORI, PINGAT } from '../lib/constants.js';
import { petaRumah } from '../lib/format.js';
import { Memuatkan, RalatMuat, RankCircle, RumahDot } from '../components/Kongsi.jsx';
import { PingatDot } from '../components/Pingat.jsx';
import { IconChevronRight } from '../components/Icons.jsx';

const PENAPIS = [{ id: 'semua', nama: 'Keseluruhan' }, ...KATEGORI];
const SEL = { emas: 'bg-emas-bg text-emas-fg', perak: 'bg-perak-bg text-perak-fg', gangsa: 'bg-gangsa-bg text-gangsa-fg' };

export default function Pingat() {
  const rumah = useRumahSukan();
  const perlumbaan = usePerlumbaan();
  const [kategori, setKategori] = useState('semua');

  if (rumah.loading || perlumbaan.loading) return <Memuatkan />;

  const kedudukan = susunKedudukan(rumah.data, perlumbaan.data, kategori);
  const adaKongsi = new Set(kedudukan.map((r) => r.kedudukan)).size < kedudukan.length;
  const terkini = perlumbaanTerkini(perlumbaan.data, 3);
  const rumahById = petaRumah(rumah.data);

  return (
    <>
      {(rumah.error || perlumbaan.error) && <RalatMuat />}

      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-3xl font-semibold sm:text-4xl">Jadual pingat</h1>
        <p className="m-0 text-muted">
          Kedudukan ditentukan oleh bilangan Emas, diikuti Perak dan Gangsa. Hanya keputusan rasmi dikira.
        </p>
      </div>

      <div role="group" aria-label="Kategori" className="flex flex-wrap items-center gap-2">
        <span className="label mr-1" aria-hidden="true">Kategori</span>
        {PENAPIS.map((k) => (
          <button key={k.id} type="button" className="pill" aria-pressed={kategori === k.id} onClick={() => setKategori(k.id)}>
            {k.nama}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <section className="flex flex-col gap-3">
          {kedudukan.length === 0 ? (
            <div className="card p-6 text-muted">
              Belum ada rumah sukan. Admin boleh menyediakannya di halaman <strong>Rumah sukan</strong>.
            </div>
          ) : (
            <div className="card tabel-kad overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-[15px]">
                <thead>
                  <tr className="bg-[#F0F4EC] text-left">
                    <th scope="col" className="px-4 py-3.5 text-[13px] font-semibold text-muted">Ked</th>
                    <th scope="col" className="px-4 py-3.5 text-[13px] font-semibold text-muted">Rumah sukan</th>
                    {Object.values(PINGAT).map((p) => (
                      <th key={p.id} scope="col" className="px-4 py-3.5 text-center text-[13px] font-semibold text-muted">{p.nama}</th>
                    ))}
                    <th scope="col" className="px-4 py-3.5 text-center text-[13px] font-semibold text-muted">Jumlah</th>
                    <th scope="col" className="px-4 py-3.5"><span className="sr-only">Lihat rumah</span></th>
                  </tr>
                </thead>
                <tbody>
                  {kedudukan.map((r) => (
                    <tr key={r.id} className="border-t border-line-soft">
                      <td data-label="Ked" className="px-4 py-3.5"><RankCircle n={r.kedudukan} warna={r.warna} className="h-9 w-9 text-base" /></td>
                      <td data-label="Rumah sukan" className="px-4 py-3.5">
                        <Link to={`/rumah/${r.id}`} className="font-semibold text-ink">{r.nama}</Link>
                      </td>
                      {Object.values(PINGAT).map((p) => (
                        <td key={p.id} data-label={p.nama} className={`px-4 py-3.5 text-center font-display text-lg font-semibold ${SEL[p.id]}`}>
                          {r.pingat[p.id]}
                        </td>
                      ))}
                      <td data-label="Jumlah" className="px-4 py-3.5 text-center font-display text-lg font-semibold">{r.pingat.jumlah}</td>
                      <td data-label="" className="px-2 py-1.5 text-right">
                        <Link
                          to={`/rumah/${r.id}`}
                          aria-label={`Lihat statistik ${r.nama}`}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-hijau hover:bg-ground"
                        >
                          <IconChevronRight />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {adaKongsi && (
            <p className="m-0 text-sm text-muted">
              Rumah sukan dengan kedudukan yang sama mempunyai bilangan Emas, Perak dan Gangsa yang sama.
            </p>
          )}
        </section>

        <aside aria-labelledby="terkini" className="flex flex-col gap-3">
          <h2 id="terkini" className="m-0 font-display text-xl font-semibold">Keputusan terkini</h2>
          {terkini.length === 0 ? (
            <div className="card p-5 text-sm text-muted">Belum ada keputusan rasmi.</div>
          ) : (
            terkini.map((p) => <KadTerkini key={p.id} p={p} rumahById={rumahById} />)
          )}
        </aside>
      </div>
    </>
  );
}

function KadTerkini({ p, rumahById }) {
  const acara = ACARA.find((a) => a.id === p.acaraId);
  const kategori = KATEGORI.find((k) => k.id === p.kategori);
  return (
    <Link
      to={`/keputusan/${p.id}`}
      className="card flex flex-col gap-3 p-4 text-ink no-underline hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hijau"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-semibold">{acara?.nama} {kategori?.nama}</span>
        <span className="text-[13px] text-muted">Acara {p.no}</span>
      </span>
      <ol className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
        {tigaTerbaik(p).map((e, i) => (
          <li key={i} className="flex items-center gap-2">
            <PingatDot jenis={PINGAT[e.ked].id} />
            <span className="sr-only">{PINGAT[e.ked].nama}</span>
            <RumahDot warna={rumahById[e.rumahId]?.warna} />
            {rumahById[e.rumahId]?.nama ?? e.rumahId}
          </li>
        ))}
      </ol>
    </Link>
  );
}
