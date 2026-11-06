import { Link } from 'react-router-dom';
import { usePerlumbaan, useRekod, useRumahSukan } from '../hooks/useData.js';
import { senaraiPemecahRekod } from '../lib/stats.js';
import { SEMUA_PERLUMBAAN } from '../lib/constants.js';
import { petaRumah } from '../lib/format.js';
import { KategoriChip, Memuatkan, NamaRumah, RalatMuat } from '../components/Kongsi.jsx';

export default function Rekod() {
  const rumah = useRumahSukan();
  const perlumbaan = usePerlumbaan();
  const rekod = useRekod();

  if (rumah.loading || perlumbaan.loading || rekod.loading) return <Memuatkan />;

  const rumahById = petaRumah(rumah.data);
  const rekodById = Object.fromEntries(rekod.data.map((r) => [r.id, r]));
  const pecah = senaraiPemecahRekod(perlumbaan.data, rekod.data);

  return (
    <>
      {(rumah.error || perlumbaan.error || rekod.error) && <RalatMuat />}

      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-3xl font-semibold sm:text-4xl">Rekod kejohanan</h1>
        <p className="m-0 text-muted">Rekod terbaik bagi setiap acara dan kategori.</p>
      </div>

      <div className="card tabel-kad overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[15px]">
          <thead>
            <tr className="bg-[#F0F4EC] text-left">
              {['Acara', 'Kategori', 'Catatan', 'Nama', 'Rumah sukan', 'Tahun'].map((h) => (
                <th key={h} scope="col" className="px-4 py-3.5 text-[13px] font-semibold text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SEMUA_PERLUMBAAN.map(({ id, acara, kategori }) => {
              const r = rekodById[id];
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="m-0 font-display text-2xl font-semibold">Pemecah rekod</h2>
        {pecah.length === 0 ? (
          <div className="card p-6 text-muted">Belum ada rekod yang dipecahkan dalam kejohanan ini.</div>
        ) : (
          <div className="card tabel-kad overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[15px]">
              <thead>
                <tr className="bg-[#F0F4EC] text-left">
                  {['Acara', 'Catatan baharu', 'Nama', 'Rumah sukan', 'Rekod lama'].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3.5 text-[13px] font-semibold text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pecah.map((x, i) => (
                  <tr key={`${x.perlumbaan.id}-${i}`} className="border-t border-line-soft">
                    <td data-label="Acara" className="px-4 py-1.5">
                      <Link to={`/keputusan/${x.perlumbaan.id}`} className="inline-flex min-h-11 items-center font-semibold text-ink">
                        {x.acara.nama} {x.kategori.nama}
                      </Link>
                    </td>
                    <td data-label="Catatan baharu" className="px-4 py-3.5 font-semibold text-hijau">{x.entri.catatan}</td>
                    <td data-label="Nama" className="px-4 py-3.5">{x.entri.nama}</td>
                    <td data-label="Rumah sukan" className="px-4 py-3.5"><NamaRumah rumah={rumahById[x.entri.rumahId]} rumahId={x.entri.rumahId} /></td>
                    <td data-label="Rekod lama" className="px-4 py-3.5 text-muted">{x.rekod.catatan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
