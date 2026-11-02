// Acara are fixed for the carnival, so they live in code rather than the database.
export const ACARA = [
  { id: '50m', nama: '50M', jenis: 'balapan', jenisAcara: 'individu', unit: 'saat' },
  { id: '100m', nama: '100M', jenis: 'balapan', jenisAcara: 'individu', unit: 'saat' },
  { id: '200m', nama: '200M', jenis: 'balapan', jenisAcara: 'individu', unit: 'saat' },
  { id: '4x100m', nama: '4x100M', jenis: 'balapan', jenisAcara: 'berganti-ganti', unit: 'saat' },
  { id: '4x200m', nama: '4x200M', jenis: 'balapan', jenisAcara: 'berganti-ganti', unit: 'saat' },
  { id: 'lompat-jauh', nama: 'Lompat Jauh', jenis: 'padang', jenisAcara: 'individu', unit: 'meter' },
  { id: 'lompat-tinggi', nama: 'Lompat Tinggi', jenis: 'padang', jenisAcara: 'individu', unit: 'meter' },
  { id: 'lontar-peluru', nama: 'Lontar Peluru', jenis: 'padang', jenisAcara: 'individu', unit: 'meter' },
];

export const KATEGORI = [
  { id: 'lelaki', nama: 'Lelaki' },
  { id: 'perempuan', nama: 'Perempuan' },
];

export const JENIS_SUKAN = {
  balapan: { nama: 'Balapan', bg: '#E3F1F8', fg: '#0F5B7A' },
  padang: { nama: 'Padang', bg: '#E6F2E8', fg: '#1E6B34' },
};

// Placing -> pingat
export const PINGAT = {
  1: { id: 'emas', nama: 'Emas' },
  2: { id: 'perak', nama: 'Perak' },
  3: { id: 'gangsa', nama: 'Gangsa' },
};

// Placeholder rumah sukan created by the admin "set up" button.
export const RUMAH_AWAL = [
  { id: 'merah', nama: 'Rumah Merah', warna: '#C62828', urutan: 1 },
  { id: 'biru', nama: 'Rumah Biru', warna: '#1E5AA8', urutan: 2 },
  { id: 'kuning', nama: 'Rumah Kuning', warna: '#E0B100', urutan: 3 },
];

// One Firestore document per race: "<acaraId>_<kategoriId>".
export const keputusanId = (acaraId, kategoriId) => `${acaraId}_${kategoriId}`;

// Every race in the carnival: 8 acara x 2 kategori = 16.
export const SEMUA_PERLUMBAAN = ACARA.flatMap((acara) =>
  KATEGORI.map((kategori) => ({ acara, kategori, id: keputusanId(acara.id, kategori.id) })),
);
