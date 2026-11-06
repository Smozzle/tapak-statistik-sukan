import './cetak.css';

/*
 * Official result sheet, printed with the "Cetak / PDF" button (window.print()).
 * Hidden on screen; on paper it replaces the whole page.
 *
 * Props
 *   perlumbaan  { no, acaraId, kategori, tarikh, masa, peringkat, status,
 *                 keputusan: [{ ked, bib, nama, rumahId, catatan, nilai, ahli?, status? }] }
 *   acara       { nama, jenis: 'balapan' | 'padang' }
 *   rumahById   { [rumahId]: { nama } }
 *   rekod       { catatan, nama, rumahId, tahun } | null
 *   kejohanan   { nama, tahun, tempat, logoKanan? }   (optional, defaults below)
 */

export const KEJOHANAN_LALAI = {
  nama: 'Kejohanan Olahraga Tahunan SK Lodung',
  tahun: new Date().getFullYear(),
  tempat: 'Padang SK Lodung, Kudat',
  logoKiri: '/logo.jpg',
  logoKanan: null, // e.g. '/logo-kejohanan.png' for a carnival logo
};

const KATEGORI = { lelaki: 'Lelaki', perempuan: 'Perempuan' };
const PERINGKAT = { akhir: 'Akhir', saringan: 'Saringan', separuh: 'Separuh Akhir' };
// Row status codes shown in the CATATAN column instead of a placing.
const STATUS_BARIS = { TT: 'DNF', DNF: 'DNF', TH: 'DNS', DNS: 'DNS', DQ: 'DQ' };

/** 13.85 -> "13.85 s", 94.87 -> "1 : 34.87 s", padang 3.62 -> "3.62 m". */
export function formatKeputusan(nilai, jenis, catatan = '') {
  if (typeof nilai !== 'number' || Number.isNaN(nilai)) return catatan || '';
  if (jenis === 'padang') return `${nilai.toFixed(2)} m`;
  if (nilai < 60) return `${nilai.toFixed(2)} s`;
  const minit = Math.floor(nilai / 60);
  const saat = (nilai - minit * 60).toFixed(2).padStart(5, '0');
  return `${minit} : ${saat} s`;
}

function formatTarikh(tarikh) {
  if (!tarikh) return { hari: '', tarikh: '' };
  const d = new Date(`${tarikh}T00:00:00`);
  return {
    hari: d.toLocaleDateString('ms-MY', { weekday: 'long' }),
    tarikh: d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }),
  };
}

function formatMasa(masa) {
  if (!masa) return '';
  const m = String(masa).replace(':', '').padStart(4, '0');
  return `${m.slice(0, 2)}:${m.slice(2)}`;
}

function pecahRekod(baris, rekod, jenis) {
  if (!rekod || typeof rekod.nilai !== 'number' || typeof baris.nilai !== 'number') return false;
  return jenis === 'padang' ? baris.nilai > rekod.nilai : baris.nilai < rekod.nilai;
}

export default function CetakKeputusan({ perlumbaan, acara, rumahById = {}, rekod = null, kejohanan = {} }) {
  const k = { ...KEJOHANAN_LALAI, ...kejohanan };
  const { hari, tarikh } = formatTarikh(perlumbaan.tarikh);
  const rasmi = perlumbaan.status === 'rasmi';
  const tajukAcara = `${acara.nama} ${KATEGORI[perlumbaan.kategori] ?? ''}`.trim();

  // Placed rows first by ked; DNF/DNS/DQ rows last.
  const baris = [...(perlumbaan.keputusan ?? [])].sort((a, b) => {
    const ax = a.ked ?? Infinity;
    const bx = b.ked ?? Infinity;
    return ax - bx;
  });
  // Only the best performance that beats the record is marked "RB" (Rekod Baharu).
  const pemecah = baris.find((b) => !STATUS_BARIS[b.status] && pecahRekod(b, rekod, acara.jenis));

  return (
    <article className="cetak" aria-hidden="true">
      <header className="cetak-kepala">
        <div className="cetak-kiri">
          {k.logoKiri && <img src={k.logoKiri} alt="" className="cetak-logo" />}
          {hari && <div>{hari}</div>}
          {tarikh && <div>{tarikh}</div>}
          {perlumbaan.masa && <div>Masa mula {formatMasa(perlumbaan.masa)}</div>}
        </div>
        <div className="cetak-tengah">
          <div className="cetak-kejohanan">{k.nama} {k.tahun}</div>
          <div className="cetak-no">Acara {perlumbaan.no}</div>
          <div className="cetak-acara">{tajukAcara}</div>
          <div className="cetak-peringkat">{PERINGKAT[perlumbaan.peringkat] ?? perlumbaan.peringkat ?? 'Akhir'}</div>
        </div>
        <div className="cetak-kanan">
          {k.logoKanan ? <img src={k.logoKanan} alt="" className="cetak-logo" /> : <span />}
          <div>{k.tempat}</div>
        </div>
      </header>

      <h1 className="cetak-tajuk">{rasmi ? 'Keputusan Rasmi' : 'Keputusan Tidak Rasmi'}</h1>

      <table className="cetak-rekod">
        <tbody>
          <tr>
            <th scope="row">Rekod Kejohanan</th>
            {rekod ? (
              <>
                <td className="cetak-rekod-nilai">{formatKeputusan(rekod.nilai, acara.jenis, rekod.catatan)}</td>
                <td>
                  {rekod.nama}&nbsp;&nbsp;{rumahById[rekod.rumahId]?.nama ?? ''}&nbsp;&nbsp;{rekod.tahun}
                </td>
              </>
            ) : (
              <td colSpan={2}>Belum ada rekod</td>
            )}
          </tr>
        </tbody>
      </table>

      <table className="cetak-senarai">
        <thead>
          <tr>
            <th className="c-ked">Ked</th>
            <th className="c-bib">Bib</th>
            <th>Nama Peserta</th>
            <th className="c-rumah">Rumah</th>
            <th className="c-keputusan">Keputusan</th>
            <th className="c-catatan">Catatan</th>
          </tr>
        </thead>
        <tbody>
          {baris.map((b, i) => {
            const kod = STATUS_BARIS[b.status];
            return (
              <tr key={`${b.bib ?? ''}-${i}`}>
                <td className="c-ked">{kod ? '-' : b.ked}</td>
                <td className="c-bib">{b.bib ?? ''}</td>
                <td>
                  {/* Relays: list the 4 runners; the RUMAH column already names the team. */}
                  {Array.isArray(b.ahli) && b.ahli.length > 0
                    ? b.ahli.map((n, j) => <span key={j} className="cetak-ahli">{n}</span>)
                    : b.nama}
                </td>
                <td className="c-rumah">{rumahById[b.rumahId]?.nama ?? ''}</td>
                <td className="c-keputusan">{kod ? '' : formatKeputusan(b.nilai, acara.jenis, b.catatan)}</td>
                <td className="c-catatan">{kod ?? (b === pemecah ? 'RB' : '')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <footer className="cetak-kaki">
        <p className="cetak-petunjuk">
          RB = Rekod Baharu&nbsp;&nbsp;·&nbsp;&nbsp;DNF = Tidak Tamat&nbsp;&nbsp;·&nbsp;&nbsp;DNS = Tidak Mula&nbsp;&nbsp;·&nbsp;&nbsp;DQ = Batal
        </p>
        <div className="cetak-tandatangan">
          <div>
            <div className="garis" />
            Ketua Hakim
          </div>
          <div>
            <div className="garis" />
            Setiausaha Kejohanan
          </div>
        </div>
        <p className="cetak-dicetak">
          Dicetak: {new Date().toLocaleString('ms-MY', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      </footer>
    </article>
  );
}
