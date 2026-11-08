import './cetak.css';
import './sijil.css';
import { KEJOHANAN_LALAI } from './CetakKeputusan.jsx';
import { isiMedan, medanPenuh, MEDAN, pilihTemplat, tarikhPanjang } from '../lib/sijil.js';

/*
 * Printable certificates, one A4 page each. Hidden on screen; when printing it replaces
 * the page (see the `.cetak` rule in cetak.css).
 * With an uploaded template (templatSijil) the text is placed over the template image at the saved
 * positions; otherwise the built-in design is used.
 *
 * Props
 *   senarai          result of senaraiSijil()
 *   rumahById        { [rumahId]: { nama } }
 *   perlumbaanById   { [id]: { tarikh } }   (for the date and the year)
 *   templat          { [id]: template doc }   (optional)
 *   kejohanan        { nama, tahun, tempat, logoKiri }   (optional, defaults from CetakKeputusan)
 */

function SijilTemplat({ t, s, rumahById, kejohanan }) {
  const isi = isiMedan(s, rumahById, kejohanan);
  const medan = medanPenuh(t.medan);
  return (
    <section className={`sijil-templat ${t.orientasi === 'portrait' ? 'sijil-templat-p' : 'sijil-templat-l'}`}>
      {t.cetakLatar !== false && <img src={t.gambar} alt="" className="sijil-latar" />}
      {MEDAN.map(({ kunci }) => {
        const m = medan[kunci];
        if (!m.papar || !isi[kunci]) return null;
        return (
          <p
            key={kunci}
            className="sijil-medan"
            style={{
              left: `${m.x}%`,
              top: `${m.y}%`,
              width: `${m.lebar}%`,
              fontSize: `${m.saiz}pt`,
              color: m.warna,
              fontWeight: m.tebal ? 700 : 400,
              textAlign: m.jajar,
            }}
          >
            {isi[kunci]}
          </p>
        );
      })}
    </section>
  );
}

export default function CetakSijil({ senarai, rumahById = {}, perlumbaanById = {}, templat = {}, kejohanan = {} }) {
  const k = { ...KEJOHANAN_LALAI, ...kejohanan };

  return (
    <div className="cetak cetak-sijil" aria-hidden="true">
      {senarai.map((s) => {
        const t = pilihTemplat(templat, s);
        if (t) return <SijilTemplat key={s.kunci} t={t} s={s} rumahById={rumahById} kejohanan={k} />;

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
