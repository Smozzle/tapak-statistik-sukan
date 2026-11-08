import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { usePerlumbaan, useRumahSukan, useTemplatSijil } from '../../hooks/useData.js';
import { bandingNo, petaRumah } from '../../lib/format.js';
import { senaraiSijil } from '../../lib/stats.js';
import { ID_TEMPLAT, idTemplat } from '../../lib/sijil.js';
import { Memuatkan } from '../../components/Kongsi.jsx';
import { AdminTajuk } from '../../components/AdminKongsi.jsx';
import CetakSijil from '../../components/CetakSijil.jsx';

export default function AdminSijil() {
  const perlumbaan = usePerlumbaan();
  const rumah = useRumahSukan();
  const { templat } = useTemplatSijil();
  const [params, setParams] = useSearchParams();
  const [cari, setCari] = useState('');
  const [kunciCetak, setKunciCetak] = useState(null); // null = print everything shown

  const pilihan = params.get('perlumbaan') ?? 'semua';
  const jenis = params.get('jenis') === 'penyertaan' ? 'penyertaan' : 'pemenang';
  const ubahParam = (kunci, nilai) =>
    setParams((p) => { const n = new URLSearchParams(p); n.set(kunci, nilai); return n; }, { replace: true });

  const rumahById = useMemo(() => petaRumah(rumah.data), [rumah.data]);
  const perlumbaanById = useMemo(() => Object.fromEntries(perlumbaan.data.map((p) => [p.id, p])), [perlumbaan.data]);
  const rasmi = useMemo(
    () => perlumbaan.data.filter((p) => p.status === 'rasmi').sort((a, b) => bandingNo(a.no, b.no)),
    [perlumbaan.data],
  );

  const semua = useMemo(
    () => senaraiSijil(pilihan === 'semua' ? rasmi : rasmi.filter((p) => p.id === pilihan), { jenis }),
    [rasmi, pilihan, jenis],
  );
  const papar = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return q ? semua.filter((s) => s.nama.toLowerCase().includes(q) || String(s.bib ?? '').toLowerCase() === q) : semua;
  }, [semua, cari]);

  // Which templates the certificates shown will use.
  const guna = useMemo(() => {
    const nama = new Set(papar.map((s) => idTemplat(templat, s)));
    return [...nama].map((n) => ID_TEMPLAT.find((t) => t.id === n)?.nama ?? 'Reka bentuk asal');
  }, [papar, templat]);

  // After printing one certificate, go back to printing everything shown.
  useEffect(() => {
    const reset = () => setKunciCetak(null);
    window.addEventListener('afterprint', reset);
    return () => window.removeEventListener('afterprint', reset);
  }, []);

  function cetak(kunci) {
    flushSync(() => setKunciCetak(kunci));
    window.print();
  }

  if (perlumbaan.loading) return <Memuatkan />;

  const untukCetak = kunciCetak ? papar.filter((s) => s.kunci === kunciCetak) : papar;

  return (
    <>
      <div className="flex flex-col gap-8">
        <AdminTajuk tajuk="Sijil" huraian="Cetak sijil pemenang dan sijil penyertaan. Nama diisi daripada keputusan rasmi." />
        <Link to="/admin/templat-sijil" className="btn-secondary -mt-4 self-start no-underline">Ubah templat</Link>

        {rasmi.length === 0 ? (
          <p className="card m-0 p-6 text-muted">Belum ada keputusan rasmi. Sijil boleh dicetak selepas keputusan diumumkan.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="label">Perlumbaan</span>
                <select className="field w-64" value={pilihan} onChange={(e) => ubahParam('perlumbaan', e.target.value)}>
                  <option value="semua">Semua perlumbaan rasmi</option>
                  {rasmi.map((p) => <option key={p.id} value={p.id}>{p.no} · {p.acaraId} {p.kategori}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="label">Jenis sijil</span>
                <select className="field w-48" value={jenis} onChange={(e) => ubahParam('jenis', e.target.value)}>
                  <option value="pemenang">Pemenang (1–3)</option>
                  <option value="penyertaan">Penyertaan</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="label">Cari nama / bib</span>
                <input className="field w-56" value={cari} onChange={(e) => setCari(e.target.value)} />
              </label>
              <button type="button" className="btn-primary" disabled={papar.length === 0} onClick={() => cetak(null)}>
                Cetak {papar.length} sijil
              </button>
            </div>

            <div className="flex flex-col gap-1 text-sm text-muted">
              <span>Templat digunakan: <strong className="text-ink">{guna.length ? guna.join(', ') : '—'}</strong></span>
              <span>Cetak pada saiz sebenar (100%) dan tetapkan margin kepada Tiada.</span>
            </div>

            {papar.length === 0 ? (
              <p className="m-0 text-muted">Tiada sijil untuk pilihan ini.</p>
            ) : (
              <div className="card overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="text-muted">
                      <th className="px-3 py-2">Acara</th>
                      <th className="px-3 py-2">Nama</th>
                      <th className="px-3 py-2">Rumah</th>
                      <th className="px-3 py-2">Tempat / Catatan</th>
                      <th className="px-3 py-2"><span className="sr-only">Cetak</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {papar.map((s) => (
                      <tr key={s.kunci} className="border-t border-line-soft">
                        <td className="px-3 py-2">{s.no} · {s.acara} {s.kategori}</td>
                        <td className="px-3 py-2 font-semibold">
                          {s.nama}{s.bib ? <span className="font-normal text-muted"> · {s.bib}</span> : null}
                        </td>
                        <td className="px-3 py-2">{rumahById[s.rumahId]?.nama ?? s.rumahId}</td>
                        <td className="px-3 py-2">
                          {s.tempat ? `${s.tempat} (${s.pingat})` : 'Penyertaan'}{s.catatan ? ` · ${s.catatan}` : ''}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button type="button" className="btn-secondary" onClick={() => cetak(s.kunci)}>Cetak</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
      <CetakSijil senarai={untukCetak} rumahById={rumahById} perlumbaanById={perlumbaanById} templat={templat} />
    </>
  );
}
