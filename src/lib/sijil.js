// Pure helpers for certificate templates (templatSijil). No Firebase or DOM here.

// A template document looks like:
// { gambar: dataURL, orientasi: 'landscape' | 'portrait', cetakLatar: true,
//   medan: { [kunci]: { x, y, saiz, warna, tebal, jajar, lebar, papar } } }
// x, y and lebar are percentages of the page (0-100); saiz is in pt.

export const ID_TEMPLAT = [
  { id: 'pemenang', nama: 'Pemenang' },
  { id: 'penyertaan', nama: 'Penyertaan' },
  { id: 'emas', nama: 'Emas', ganti: 'pemenang' },
  { id: 'perak', nama: 'Perak', ganti: 'pemenang' },
  { id: 'gangsa', nama: 'Gangsa', ganti: 'pemenang' },
];

export const MEDAN = [
  { kunci: 'kejohanan', nama: 'Kejohanan' },
  { kunci: 'nama', nama: 'Nama' },
  { kunci: 'rumah', nama: 'Rumah' },
  { kunci: 'bib', nama: 'No. bib' },
  { kunci: 'tempat', nama: 'Tempat' },
  { kunci: 'acara', nama: 'Acara' },
  { kunci: 'catatan', nama: 'Catatan' },
  { kunci: 'tarikh', nama: 'Tarikh' },
];

const asas = { warna: '#000000', tebal: false, jajar: 'center', lebar: 80, papar: true };
export const MEDAN_LALAI = {
  kejohanan: { ...asas, x: 10, y: 21, saiz: 16, tebal: true },
  nama: { ...asas, x: 10, y: 42, saiz: 30, tebal: true },
  rumah: { ...asas, x: 10, y: 53, saiz: 14 },
  bib: { ...asas, x: 10, y: 58, saiz: 12 },
  tempat: { ...asas, x: 10, y: 66, saiz: 16, tebal: true },
  acara: { ...asas, x: 10, y: 73, saiz: 18, tebal: true },
  catatan: { ...asas, x: 10, y: 80, saiz: 13 },
  tarikh: { ...asas, x: 10, y: 86, saiz: 12 },
};

/** Fills in any field a saved template lacks with its default position and style. */
export const medanPenuh = (medan = {}) =>
  Object.fromEntries(MEDAN.map(({ kunci }) => [kunci, { ...MEDAN_LALAI[kunci], ...(medan?.[kunci] ?? {}) }]));

/** Which template id applies to a certificate: the medal one, then 'pemenang' / 'penyertaan', else null. */
export function idTemplat(templat, sijil) {
  const ada = (id) => Boolean(templat?.[id]?.gambar);
  if (sijil.jenis === 'pemenang') {
    const pingat = sijil.pingat?.toLowerCase();
    if (pingat && ada(pingat)) return pingat;
    return ada('pemenang') ? 'pemenang' : null;
  }
  return ada('penyertaan') ? 'penyertaan' : null;
}

/** The template document for a certificate, or null to use the built-in design. */
export const pilihTemplat = (templat, sijil) => templat?.[idTemplat(templat, sijil)] ?? null;

export function tarikhPanjang(tarikh) {
  if (!tarikh) return '';
  const d = new Date(`${tarikh}T00:00:00`);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** The text of every field for one certificate. An empty string means the field has nothing to show. */
export function isiMedan(sijil, rumahById = {}, kejohanan = {}) {
  const tahun = sijil.tarikh ? sijil.tarikh.slice(0, 4) : kejohanan.tahun;
  return {
    kejohanan: [kejohanan.nama, tahun].filter(Boolean).join(' '),
    nama: (sijil.nama ?? '').toUpperCase(),
    rumah: rumahById[sijil.rumahId]?.nama ?? sijil.rumahId ?? '',
    bib: sijil.bib ? `No. bib ${sijil.bib}` : '',
    tempat: sijil.tempat ? `Tempat ${sijil.tempat} (Pingat ${sijil.pingat})` : '',
    acara: `Acara ${sijil.no} · ${sijil.acara} ${sijil.kategori}`,
    catatan: sijil.catatan ? `Catatan: ${sijil.catatan}` : '',
    tarikh: tarikhPanjang(sijil.tarikh),
  };
}

/** Size an image should be resized to: fits 1754x1240 (A4 at 150 dpi), never enlarged. */
export function saizMuat(lebar, tinggi, maksimum = [1754, 1240]) {
  const landscape = lebar >= tinggi;
  const [mL, mT] = landscape ? maksimum : [maksimum[1], maksimum[0]];
  const skala = Math.min(1, mL / lebar, mT / tinggi);
  return {
    lebar: Math.max(1, Math.round(lebar * skala)),
    tinggi: Math.max(1, Math.round(tinggi * skala)),
    orientasi: landscape ? 'landscape' : 'portrait',
  };
}
