import { Link, useSearchParams } from 'react-router-dom';
import { usePeserta, useRumahSukan } from '../hooks/useData.js';
import { KATEGORI } from '../lib/constants.js';
import { bandingNo, petaRumah } from '../lib/format.js';
import { KategoriChip, Memuatkan, NamaRumah, RalatMuat } from '../components/Kongsi.jsx';

export default function Peserta() {
  const rumah = useRumahSukan();
  const peserta = usePeserta();
  const [params, setParams] = useSearchParams();
  const cari = params.get('q') ?? '';
  const rumahId = params.get('rumah') ?? '';
  const kategori = params.get('kategori') ?? '';

  // Keeps the filters in the URL so a filtered list can be shared or linked to.
  const set = (key) => (e) => {
    const next = new URLSearchParams(params);
    if (e.target.value) next.set(key, e.target.value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  if (rumah.loading || peserta.loading) return <Memuatkan />;

  const rumahById = petaRumah(rumah.data);
  const q = cari.trim().toLowerCase();
  const senarai = peserta.data
    .filter(
      (p) =>
        (!q || p.nama.toLowerCase().includes(q) || String(p.bib).toLowerCase() === q) &&
        (!rumahId || p.rumahId === rumahId) &&
        (!kategori || p.kategori === kategori),
    )
    .sort((a, b) => bandingNo(a.bib, b.bib));

  return (
    <>
      {(rumah.error || peserta.error) && <RalatMuat />}

      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-3xl font-semibold sm:text-4xl">Peserta</h1>
        <p className="m-0 text-muted">Cari atlet mengikut nama atau nombor bib.</p>
      </div>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="card grid gap-4 p-5 sm:grid-cols-[2fr_1fr_1fr]">
        <label className="flex flex-col gap-1.5">
          <span className="label">Nama atau bib</span>
          <input className="field" type="search" value={cari} onChange={set('q')} placeholder="cth. Aiman atau 12" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Rumah sukan</span>
          <select className="field" value={rumahId} onChange={set('rumah')}>
            <option value="">Semua rumah</option>
            {rumah.data.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label">Kategori</span>
          <select className="field" value={kategori} onChange={set('kategori')}>
            <option value="">Semua kategori</option>
            {KATEGORI.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
        </label>
      </form>

      {peserta.data.length === 0 ? (
        <div className="card p-6 text-muted">Senarai peserta belum dimasukkan.</div>
      ) : (
        <section className="flex flex-col gap-3">
          <div className="card tabel-kad overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[15px]">
              <thead>
                <tr className="bg-[#F0F4EC] text-left">
                  {['Bib', 'Nama', 'Rumah sukan', 'Kategori'].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3.5 text-[13px] font-semibold text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {senarai.map((p) => (
                  <tr key={p.id} className="border-t border-line-soft">
                    <td data-label="Bib" className="px-4 py-3.5 font-semibold">{p.bib}</td>
                    <td data-label="Nama" className="px-4 py-1.5">
                      <Link to={`/peserta/${p.id}`} className="inline-flex min-h-11 items-center font-semibold text-ink">
                        {p.nama}
                      </Link>
                    </td>
                    <td data-label="Rumah sukan" className="px-4 py-3.5"><NamaRumah rumah={rumahById[p.rumahId]} rumahId={p.rumahId} /></td>
                    <td data-label="Kategori" className="px-4 py-3.5"><KategoriChip kategori={p.kategori} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {senarai.length === 0 && <p className="m-0 px-4 py-6 text-muted">Tiada peserta sepadan.</p>}
          </div>
          <p className="m-0 text-sm text-muted">
            Memaparkan {senarai.length} daripada {peserta.data.length} peserta.
          </p>
        </section>
      )}
    </>
  );
}
