import { Link, useParams } from 'react-router-dom';
import { usePerlumbaan, usePeserta, useRekod, useRumahSukan } from '../hooks/useData.js';
import { STATUS_PELUMBA, acaraPeserta, adalahRekodBaharu, rekodPeserta } from '../lib/stats.js';
import { masaPapar, petaRumah } from '../lib/format.js';
import { KategoriChip, Memuatkan, NamaRumah, RalatMuat, RekodBadge, StatusChip } from '../components/Kongsi.jsx';
import { PingatBox, PingatChip } from '../components/Pingat.jsx';
import { IconArrowLeft } from '../components/Icons.jsx';

export default function PesertaDetail() {
  const { pesertaId } = useParams();
  const rumah = useRumahSukan();
  const peserta = usePeserta();
  const perlumbaan = usePerlumbaan();
  const rekod = useRekod();

  if (rumah.loading || peserta.loading || perlumbaan.loading || rekod.loading) return <Memuatkan />;

  const p = peserta.data.find((x) => x.id === pesertaId);
  if (!p) {
    return (
      <>
        {(rumah.error || peserta.error || perlumbaan.error) && <RalatMuat />}
        <BackLink />
        <p className="text-muted">Peserta tidak dijumpai.</p>
      </>
    );
  }

  const { perlumbaan: senarai, pingat } = rekodPeserta(p.id, perlumbaan.data);
  const acara = acaraPeserta(p.id, perlumbaan.data);
  const rumahById = petaRumah(rumah.data);
  const rekodById = Object.fromEntries(rekod.data.map((r) => [r.id, r]));

  return (
    <>
      <BackLink />

      <section className="card flex flex-wrap items-center justify-between gap-4 p-4 sm:gap-6 sm:p-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-ink px-2.5 py-1 text-[13px] font-semibold text-white">Bib {p.bib}</span>
            <KategoriChip kategori={p.kategori} />
          </div>
          <h1 className="m-0 font-display text-3xl font-semibold sm:text-4xl">{p.nama}</h1>
          <NamaRumah rumah={rumahById[p.rumahId]} rumahId={p.rumahId} />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <PingatBox jenis="emas" jumlah={pingat.emas} />
          <PingatBox jenis="perak" jumlah={pingat.perak} />
          <PingatBox jenis="gangsa" jumlah={pingat.gangsa} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="m-0 font-display text-2xl font-semibold">Acara disertai</h2>
        {acara.length === 0 ? (
          <div className="card p-6 text-muted">Peserta ini belum didaftarkan dalam mana-mana acara.</div>
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
            {acara.map((a) => (
              <li key={a.perlumbaan.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <span className="flex flex-col gap-1">
                  <span className="font-semibold">{a.acara.nama} {a.kategori.nama}</span>
                  <span className="text-sm text-muted">
                    Acara {a.perlumbaan.no} · Hari {a.perlumbaan.hari}, {masaPapar(a.perlumbaan.masa)}
                    {a.lorong ? ` · ${a.acara.jenis === 'balapan' ? 'Lorong' : 'Giliran'} ${a.lorong}` : ''}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <StatusChip status={a.perlumbaan.status} />
                  <Link
                    to={a.perlumbaan.status === 'rasmi' ? `/keputusan/${a.perlumbaan.id}` : `/senarai-mula/${a.perlumbaan.id}`}
                    className="inline-flex min-h-11 items-center text-sm font-semibold text-hijau"
                  >
                    {a.perlumbaan.status === 'rasmi' ? 'Keputusan' : 'Senarai mula'}
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="m-0 font-display text-2xl font-semibold">Keputusan</h2>
        {senarai.length === 0 ? (
          <div className="card p-6 text-muted">Belum ada keputusan rasmi untuk peserta ini.</div>
        ) : (
          <div className="card tabel-kad overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-[15px]">
              <thead>
                <tr className="bg-[#F0F4EC] text-left">
                  {['No', 'Acara', 'Kedudukan', 'Pingat', 'Catatan'].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3.5 text-[13px] font-semibold text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {senarai.map((r) => (
                  <tr key={r.perlumbaan.id} className="border-t border-line-soft">
                    <td data-label="No" className="px-4 py-3.5">{r.perlumbaan.no}</td>
                    <td data-label="Acara" className="px-4 py-1.5">
                      <Link to={`/keputusan/${r.perlumbaan.id}`} className="inline-flex min-h-11 items-center font-semibold text-ink">
                        {r.acara.nama} {r.kategori.nama}
                      </Link>
                    </td>
                    <td data-label="Kedudukan" className="px-4 py-3.5">
                      {Number.isInteger(r.entri.ked) ? `Tempat ${r.entri.ked}` : STATUS_PELUMBA[r.entri.status]?.nama ?? '—'}
                    </td>
                    <td data-label="Pingat" className="px-4 py-3.5">
                      {r.pingat ? <PingatChip jenis={r.pingat.id} /> : <span className="text-muted">Tiada pingat</span>}
                    </td>
                    <td data-label="Catatan" className="px-4 py-3.5">
                      <span className="inline-flex flex-wrap items-center gap-2">
                        {r.entri.catatan || '—'}
                        {adalahRekodBaharu(r.acara.jenis, r.entri.nilai, rekodById[r.perlumbaan.id]) && <RekodBadge />}
                      </span>
                    </td>
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

function BackLink() {
  return (
    <Link to="/peserta" className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-hijau no-underline">
      <IconArrowLeft />
      Senarai peserta
    </Link>
  );
}
