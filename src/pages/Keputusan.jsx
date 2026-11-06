import { Link, useParams } from 'react-router-dom';
import { usePerlumbaan, useRekod, useRumahSukan } from '../hooks/useData.js';
import {
  STATUS_PELUMBA, adalahRekodBaharu, jiranPerlumbaan, namaPelumba, susunEntri, tigaTerbaik,
} from '../lib/stats.js';
import { ACARA, KATEGORI, PERINGKAT, PINGAT } from '../lib/constants.js';
import { labelNilai, masaPapar, petaRumah } from '../lib/format.js';
import {
  KategoriChip, KotakRekod, Memuatkan, NamaRumah, RalatMuat, RekodBadge, StatusChip,
} from '../components/Kongsi.jsx';
import { JenisChip, PingatChip, PingatDot } from '../components/Pingat.jsx';
import { IconArrowLeft, IconArrowRight } from '../components/Icons.jsx';
import CetakKeputusan from '../components/CetakKeputusan.jsx';

const GAYA_KAD = {
  emas: 'bg-emas-bg text-emas-fg border-emas-dot/40',
  perak: 'bg-perak-bg text-perak-fg border-perak-dot/40',
  gangsa: 'bg-gangsa-bg text-gangsa-fg border-gangsa-dot/40',
};

export default function Keputusan() {
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
  const rasmi = p.status === 'rasmi';
  const peserta = p.keputusan ?? [];
  const relay = acara.jenisAcara === 'berganti-ganti';
  const { sebelum, seterusnya } = jiranPerlumbaan(perlumbaan.data, p.id);
  const rekodBaharu = (e) => rasmi && !e.status && adalahRekodBaharu(acara.jenis, e.nilai, rekodAcara);
  // Places held by more than one entry (an unresolved tie), shown as "4=".
  const kedKongsi = new Set(peserta.map((e) => e.ked).filter((k, i, semua) => Number.isInteger(k) && semua.indexOf(k) !== i));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <BackLink />
        <button type="button" className="btn-secondary" onClick={() => window.print()}>Cetak / PDF</button>
      </div>

      <section className="card flex flex-wrap items-start justify-between gap-4 p-4 sm:gap-6 sm:p-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-ink px-2.5 py-1 text-[13px] font-semibold text-white">Acara {p.no}</span>
            <KategoriChip kategori={p.kategori} />
            <JenisChip jenis={acara.jenis} />
            <StatusChip status={p.status} />
          </div>
          <h1 className="m-0 font-display text-3xl font-semibold sm:text-4xl">{acara.nama} {kategori.nama}</h1>
          <p className="m-0 text-muted">
            {PERINGKAT[p.peringkat] ?? p.peringkat} · Hari {p.hari}, {masaPapar(p.masa)}
            {peserta.length > 0 && ` · ${peserta.length} ${relay ? 'pasukan' : 'peserta'}`}
          </p>
        </div>

        <KotakRekod rekod={rekodAcara} rumahById={rumahById} />
      </section>

      {!rasmi ? (
        <div className="card p-6">
          <h2 className="m-0 font-display text-xl font-semibold">Keputusan belum diumumkan</h2>
          <p className="mb-0 mt-2 text-muted">
            {p.status === 'berlangsung'
              ? 'Perlumbaan ini sedang berlangsung. Keputusan rasmi akan dipaparkan di sini sebaik sahaja diumumkan.'
              : 'Perlumbaan ini belum bermula. Keputusan rasmi akan dipaparkan di sini selepas perlumbaan tamat.'}
          </p>
        </div>
      ) : (
        <>
          <section aria-label="Tiga terbaik" className="grid gap-4 md:grid-cols-3">
            {tigaTerbaik(p).map((e, i) => {
              const pingat = PINGAT[e.ked];
              return (
                <article key={i} className={`flex flex-col gap-3 rounded-2xl border p-5 ${GAYA_KAD[pingat.id]}`}>
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <PingatDot jenis={pingat.id} /> {pingat.nama}
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-3xl font-semibold text-ink">{e.catatan || '—'}</span>
                    {rekodBaharu(e) && <RekodBadge />}
                  </span>
                  <span className="text-lg font-semibold text-ink">{e.nama}</span>
                  <span className="flex flex-wrap items-center gap-2 text-sm text-ink">
                    <NamaRumah rumah={rumahById[e.rumahId]} rumahId={e.rumahId} />
                    {e.bib && <span>· No. bib {e.bib}</span>}
                  </span>
                  {relay && e.ahli?.length > 0 && (
                    <ul className="m-0 list-disc pl-5 text-sm text-ink">
                      {e.ahli.map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                  )}
                </article>
              );
            })}
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="m-0 font-display text-2xl font-semibold">Kedudukan penuh</h2>
            <ul className="m-0 flex list-none flex-col gap-3 p-0 md:hidden">
              {susunEntri(peserta).map((e, i) => (
                <li key={i} className="card flex items-start gap-4 p-4">
                  <span className="min-w-8 text-center font-display text-2xl font-semibold">
                    {Number.isInteger(e.ked) ? `${e.ked}${kedKongsi.has(e.ked) ? '=' : ''}` : e.status ?? '—'}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    {e.pesertaId ? (
                      <Link to={`/peserta/${e.pesertaId}`} className="font-semibold text-ink">{e.nama}</Link>
                    ) : (
                      <span className="font-semibold">{e.nama}</span>
                    )}
                    {relay && e.ahli?.length > 0 && (
                      <span className="text-sm text-muted">{namaPelumba(e).join(', ')}</span>
                    )}
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <NamaRumah rumah={rumahById[e.rumahId]} rumahId={e.rumahId} />
                      {e.bib && <span className="text-muted">· Bib {e.bib}</span>}
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      {e.status ? (
                        <span className="text-muted">{STATUS_PELUMBA[e.status]?.nama ?? e.status}</span>
                      ) : (
                        <>
                          <span className="font-semibold">{e.catatan || '—'}</span>
                          {rekodBaharu(e) && <RekodBadge />}
                        </>
                      )}
                      {PINGAT[e.ked] && <PingatChip jenis={PINGAT[e.ked].id} />}
                    </span>
                    {e.cubaan?.length > 0 && (
                      <span className="text-sm text-muted">Cubaan: {e.cubaan.map((c) => c || '—').join(' · ')}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="card hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] border-collapse text-[15px]">
                <thead>
                  <tr className="bg-[#F0F4EC] text-left">
                    {['Ked', 'Bib', relay ? 'Pasukan' : 'Nama', 'Rumah', labelNilai(acara), 'Pingat'].map((h) => (
                      <th key={h} scope="col" className="px-4 py-3.5 text-[13px] font-semibold text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {susunEntri(peserta).map((e, i) => (
                    <tr key={i} className="border-t border-line-soft">
                      <td className="px-4 py-3.5 font-semibold">
                        {Number.isInteger(e.ked) ? `${e.ked}${kedKongsi.has(e.ked) ? '=' : ''}` : e.status ?? '—'}
                      </td>
                      <td className="px-4 py-3.5">{e.bib || '—'}</td>
                      <td className="px-4 py-3.5">
                        {e.pesertaId ? (
                          <Link to={`/peserta/${e.pesertaId}`} className="font-semibold text-ink">{e.nama}</Link>
                        ) : (
                          <span className="font-semibold">{e.nama}</span>
                        )}
                        {relay && e.ahli?.length > 0 && (
                          <span className="block text-sm text-muted">{namaPelumba(e).join(', ')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5"><NamaRumah rumah={rumahById[e.rumahId]} rumahId={e.rumahId} /></td>
                      <td className="px-4 py-3.5">
                        {e.status ? (
                          <span className="text-muted" title={STATUS_PELUMBA[e.status]?.singkatan}>{STATUS_PELUMBA[e.status]?.nama ?? e.status}</span>
                        ) : (
                          <span className="inline-flex flex-wrap items-center gap-2">
                            {e.catatan || '—'}
                            {rekodBaharu(e) && <RekodBadge />}
                          </span>
                        )}
                        {e.cubaan?.length > 0 && (
                          <span className="block text-sm text-muted">Cubaan: {e.cubaan.map((c) => c || '—').join(' · ')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {PINGAT[e.ked] ? <PingatChip jenis={PINGAT[e.ked].id} /> : <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <nav aria-label="Perlumbaan lain" className="flex flex-wrap justify-between gap-3 print:hidden">
        {sebelum ? <JiranLink p={sebelum} arah="sebelum" /> : <span />}
        {seterusnya ? <JiranLink p={seterusnya} arah="seterusnya" /> : <span />}
      </nav>

      <CetakKeputusan perlumbaan={p} acara={acara} rumahById={rumahById} rekod={rekodAcara ?? null} />
    </>
  );
}

function JiranLink({ p, arah }) {
  const acara = ACARA.find((a) => a.id === p.acaraId);
  const kategori = KATEGORI.find((k) => k.id === p.kategori);
  return (
    <Link to={`/keputusan/${p.id}`} className="btn-secondary no-underline">
      {arah === 'sebelum' && <IconArrowLeft />}
      <span>
        <span className="text-muted">{arah === 'sebelum' ? 'Sebelum' : 'Seterusnya'}: </span>
        {p.no} · {acara?.nama} {kategori?.nama}
      </span>
      {arah === 'seterusnya' && <IconArrowRight />}
    </Link>
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
