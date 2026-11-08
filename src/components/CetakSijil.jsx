import './cetak.css';
import './sijil.css';
import { KEJOHANAN_LALAI } from './CetakKeputusan.jsx';

/*
 * Printable certificates, one A4 landscape page each. Hidden on screen; when printing it replaces
 * the page (see the `.cetak` rule in cetak.css).
 *
 * Props
 *   senarai          result of senaraiSijil()
 *   rumahById        { [rumahId]: { nama } }
 *   perlumbaanById   { [id]: { tarikh } }   (for the date and the year)
 *   kejohanan        { nama, tahun, tempat, logoKiri }   (optional, defaults from CetakKeputusan)
 */

const tarikhPanjang = (tarikh) => {
  if (!tarikh) return '';
  const d = new Date(`${tarikh}T00:00:00`);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function CetakSijil({ senarai, rumahById = {}, perlumbaanById = {}, kejohanan = {} }) {
  const k = { ...KEJOHANAN_LALAI, ...kejohanan };

  return (
    <div className="cetak cetak-sijil" aria-hidden="true">
      {senarai.map((s) => {
        const tarikh = perlumbaanById[s.perlumbaan]?.tarikh;
        const tahun = tarikh ? tarikh.slice(0, 4) : k.tahun;
        const menang = s.jenis === 'pemenang';
        const rumah = rumahById[s.rumahId]?.nama ?? s.rumahId ?? '';
        const lokasi = [k.tempat, tarikhPanjang(tarikh)].filter(Boolean).join(', ');
        return (
          <section key={s.kunci} className={`sijil ${menang ? `sijil-${s.pingat.toLowerCase()}` : ''}`}>
            {k.logoKiri && <img src={k.logoKiri} alt="" className="sijil-logo" />}
            <p className="sijil-kejohanan">{k.nama} {tahun}</p>
            <h1 className="sijil-tajuk">{menang ? 'SIJIL PENGHARGAAN' : 'SIJIL PENYERTAAN'}</h1>
            <p className="sijil-kecil">Dengan ini disahkan bahawa</p>
            <p className="sijil-nama">{s.nama}</p>
            <p className="sijil-rumah">
              {rumah}{s.bib ? ` · No. bib ${s.bib}` : ''}
            </p>
            <p className="sijil-kecil">
              {menang ? `telah memenangi tempat ${s.tempat} (Pingat ${s.pingat}) dalam acara` : 'telah menyertai acara'}
            </p>
            <p className="sijil-acara">Acara {s.no} · {s.acara} {s.kategori}</p>
            {s.catatan && <p className="sijil-catatan">Catatan: {s.catatan}</p>}
            {lokasi && <p className="sijil-tempat">{lokasi}</p>}
            <div className="sijil-tandatangan">
              <div><div className="garis" />Guru Besar</div>
              <div><div className="garis" />Setiausaha Kejohanan</div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
