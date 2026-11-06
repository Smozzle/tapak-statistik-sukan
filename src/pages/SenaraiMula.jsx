import { Link, useParams } from 'react-router-dom';
import { usePerlumbaan, useRekod, useRumahSukan } from '../hooks/useData.js';
import { namaPelumba } from '../lib/stats.js';
import { ACARA, KATEGORI, PERINGKAT } from '../lib/constants.js';
import { masaPapar, petaRumah } from '../lib/format.js';
import { KategoriChip, KotakRekod, Memuatkan, NamaRumah, RalatMuat, StatusChip } from '../components/Kongsi.jsx';
import { JenisChip } from '../components/Pingat.jsx';
import { IconArrowLeft } from '../components/Icons.jsx';

export default function SenaraiMula() {
  const { perlumbaanId } = useParams();
  const rumah = useRumahSukan();
  const perlumbaan = usePerlumbaan();
  const rekod = useRekod();

  if (rumah.loading || perlumbaan.loading || rekod.loading) return <Memuatkan />;

  const p = perlumbaan.data.find((x) => x.id === perlumbaanId);
  if (!p) {
    return (
      <>
        {(rumah.error || perlumbaan.error) && <RalatMuat />}
        <BackLink />
        <p className="text-muted">Perlumbaan tidak dijumpai.</p>
      </>
    );
  }

  const acara = ACARA.find((a) => a.id === p.acaraId);
  const kategori = KATEGORI.find((k) => k.id === p.kategori);
  const rumahById = petaRumah(rumah.data);
  const rekodAcara = rekod.data.find((r) => r.id === p.id);
  const mula = p.senaraiMula ?? [];
  const relay = acara.jenisAcara === 'berganti-ganti';
  const labelLorong = acara.jenis === 'balapan' ? 'Lorong' : 'Giliran';

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <BackLink />
        <div className="flex flex-wrap gap-3">
          {p.status === 'rasmi' && (
            <Link to={`/keputusan/${p.id}`} className="btn-primary no-underline">Lihat keputusan</Link>
          )}
          <button type="button" className="btn-secondary" onClick={() => window.print()}>Cetak / PDF</button>
        </div>
      </div>

      <section className="card flex flex-wrap items-start justify-between gap-4 p-4 sm:gap-6 sm:p-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-ink px-2.5 py-1 text-[13px] font-semibold text-white">Acara {p.no}</span>
            <KategoriChip kategori={p.kategori} />
            <JenisChip jenis={acara.jenis} />
            <StatusChip status={p.status} />
          </div>
          <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-hijau">Senarai mula</span>
          <h1 className="m-0 font-display text-3xl font-semibold sm:text-4xl">{acara.nama} {kategori.nama}</h1>
          <p className="m-0 text-muted">
            {PERINGKAT[p.peringkat] ?? p.peringkat} · Hari {p.hari}, {masaPapar(p.masa)}
            {mula.length > 0 && ` · ${mula.length} ${relay ? 'pasukan' : 'peserta'}`}
          </p>
        </div>
        <KotakRekod rekod={rekodAcara} rumahById={rumahById} />
      </section>

      {mula.length === 0 ? (
        <div className="card p-6">
          <h2 className="m-0 font-display text-xl font-semibold">Senarai mula belum disediakan</h2>
          <p className="mb-0 mt-2 text-muted">Nama peserta akan dipaparkan di sini sebaik sahaja urus setia memasukkannya.</p>
        </div>
      ) : (
        <div className="card tabel-kad overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[15px]">
            <thead>
              <tr className="bg-[#F0F4EC] text-left">
                {[labelLorong, 'Bib', relay ? 'Pasukan' : 'Nama', 'Rumah sukan'].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3.5 text-[13px] font-semibold text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mula.map((e, i) => (
                <tr key={e.pesertaId ?? e.rumahId ?? i} className="border-t border-line-soft">
                  <td data-label={labelLorong} className="px-4 py-3.5 font-semibold">{e.lorong ?? '—'}</td>
                  <td data-label="Bib" className="px-4 py-3.5">{e.bib || '—'}</td>
                  <td data-label={relay ? 'Pasukan' : 'Nama'} className="px-4 py-3.5">
                    <div>
                      {e.pesertaId ? (
                        <Link to={`/peserta/${e.pesertaId}`} className="font-semibold text-ink">{e.nama}</Link>
                      ) : (
                        <span className="font-semibold">{e.nama}</span>
                      )}
                      {relay && e.ahli?.length > 0 && (
                        <span className="block text-sm text-muted">{namaPelumba(e).join(', ')}</span>
                      )}
                    </div>
                  </td>
                  <td data-label="Rumah sukan" className="px-4 py-3.5"><NamaRumah rumah={rumahById[e.rumahId]} rumahId={e.rumahId} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function BackLink() {
  return (
    <Link to="/" className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-hijau no-underline">
      <IconArrowLeft />
      Susunan acara
    </Link>
  );
}
