// CSV import for the peserta list: bib,nama,rumah,kategori

/** Splits CSV text into rows of cells. Handles "quoted, cells" and comma, semicolon or tab separators. */
export function bahagiCsv(teks) {
  const barisPertama = teks.split(/\r?\n/).find((b) => b.trim()) ?? '';
  const pemisah = [',', ';', '\t'].reduce(
    (terbaik, p) => (barisPertama.split(p).length > barisPertama.split(terbaik).length ? p : terbaik),
    ',',
  );
  const baris = [];
  let sel = '';
  let row = [];
  let petik = false;
  for (let i = 0; i < teks.length; i += 1) {
    const c = teks[i];
    if (petik) {
      if (c === '"' && teks[i + 1] === '"') { sel += '"'; i += 1; }
      else if (c === '"') petik = false;
      else sel += c;
    } else if (c === '"') petik = true;
    else if (c === pemisah) { row.push(sel); sel = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && teks[i + 1] === '\n') i += 1;
      row.push(sel);
      baris.push(row);
      row = [];
      sel = '';
    } else sel += c;
  }
  row.push(sel);
  baris.push(row);
  return baris.filter((r) => r.some((s) => s.trim()));
}

const KATEGORI_CSV = { lelaki: 'lelaki', l: 'lelaki', perempuan: 'perempuan', p: 'perempuan' };

/**
 * Parses pasted or uploaded CSV (bib,nama,rumah,kategori) into peserta rows.
 * Rumah may be an id ("merah") or a name ("Rumah Merah"); kategori may be L / P.
 * Returns { baris: [{ bib, nama, rumahId, kategori }], ralat: [message] }.
 */
export function parseCsvPeserta(teks, rumahList) {
  const rows = bahagiCsv(teks);
  const adaTajuk = rows[0]?.[0].trim().toLowerCase() === 'bib';
  const baris = [];
  const ralat = [];
  const dilihat = new Set();

  rows.slice(adaTajuk ? 1 : 0).forEach((cells, i) => {
    const no = i + 1 + (adaTajuk ? 1 : 0);
    const [bib = '', nama = '', rumahTeks = '', kategoriTeks = ''] = cells.map((c) => c.trim());
    const rumah = rumahList.find((r) => {
      const t = rumahTeks.toLowerCase();
      return t && (r.id.toLowerCase() === t || r.nama.toLowerCase() === t || r.nama.toLowerCase() === `rumah ${t}`);
    });
    const kategori = KATEGORI_CSV[kategoriTeks.toLowerCase()];
    const masalah = !bib ? 'bib kosong'
      : !nama ? 'nama kosong'
      : !rumah ? `rumah "${rumahTeks}" tidak dikenali`
      : !kategori ? `kategori "${kategoriTeks}" tidak sah (guna Lelaki atau Perempuan)`
      : dilihat.has(bib) ? `bib ${bib} berulang dalam fail`
      : null;
    if (masalah) ralat.push(`Baris ${no}: ${masalah}.`);
    else {
      dilihat.add(bib);
      baris.push({ bib, nama, rumahId: rumah.id, kategori });
    }
  });
  return { baris, ralat };
}
