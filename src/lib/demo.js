// Sample data shown when VITE_DEMO=true and Firebase is not configured.
import { ACARA, RUMAH_AWAL, SUSUNAN_AWAL, perlumbaanId } from './constants.js';

export const DEMO_RUMAH = RUMAH_AWAL;

// 12 peserta per kategori, 4 per rumah (merah, biru, kuning in that order).
const NAMA = {
  lelaki: [
    'Aiman bin Rahim', 'Daniel Jinius', 'Hafiz bin Osman', 'Jeffry Lojuki',
    'Farhan bin Yusof', 'Kevin Gunsalam', 'Syafiq bin Ismail', 'Marcus Sodomon',
    'Irfan bin Ladin', 'Ronald Lidam', 'Zulkifli bin Abu', 'Steven Mojilip',
  ],
  perempuan: [
    'Nurul Aina binti Salleh', 'Cecilia Dusim', 'Siti Aisyah binti Jaafar', 'Jessica Ulou',
    'Nur Alya binti Daud', 'Maria Gontusan', 'Aminah binti Rasid', 'Rosalind Gimbang',
    'Farah binti Kassim', 'Elsie Rungkiat', 'Zarina binti Majid', 'Irene Sumbin',
  ],
};

export const DEMO_PESERTA = ['lelaki', 'perempuan'].flatMap((kategori, k) =>
  NAMA[kategori].map((nama, i) => ({
    id: `p-${kategori}-${i}`,
    bib: String(k * 12 + i + 1),
    nama,
    rumahId: RUMAH_AWAL[Math.floor(i / 4)].id,
    kategori,
  })),
);

// Finishing order per race: indexes into that kategori's 12 peserta (4 per rumah).
// Hari 1: 101-105 rasmi, 106 berlangsung, 107-108 belum. Hari 2: all belum.
// `status` lists extra competitors without a placing: [peserta index, 'TT' | 'TH' | 'DQ'].
const SUSUNAN_HASIL = {
  101: { asas: 7.8, langkah: 0.12, order: [4, 0, 8, 5, 1, 9], status: [[2, 'TH']] },
  102: { asas: 8.3, langkah: 0.14, order: [8, 5, 1, 9, 6, 2] },
  103: { asas: 13.85, langkah: 0.2, order: [5, 1, 9, 4, 0, 8] },
  104: { asas: 15.1, langkah: 0.25, order: [6, 10, 2, 7, 11, 3] },
  105: { asas: 28.4, langkah: 0.4, order: [0, 8, 4, 1, 9, 5], status: [[6, 'TT']] },
};

const bulat = (n) => Math.round(n * 100) / 100;

function keputusan(acara, hasil, kategori) {
  const peserta = (idx) => DEMO_PESERTA.find((x) => x.id === `p-${kategori}-${idx}`);
  const tamat = hasil.order.map((idx, i) => {
    const p = peserta(idx);
    const nilai = bulat(hasil.asas + hasil.langkah * i);
    return {
      ked: i + 1,
      pesertaId: p.id,
      bib: p.bib,
      nama: p.nama,
      rumahId: p.rumahId,
      lorong: i + 1,
      catatan: `${nilai.toFixed(2)} ${acara.unit === 'saat' ? 's' : 'm'}`,
      nilai,
    };
  });
  const tanpaKed = (hasil.status ?? []).map(([idx, status]) => {
    const p = peserta(idx);
    return { ked: null, pesertaId: p.id, bib: p.bib, nama: p.nama, rumahId: p.rumahId, catatan: '', nilai: null, status };
  });
  return [...tamat, ...tanpaKed];
}

// Start list per race. Official races reuse their finishers; the others enter 6 athletes
// (relays: one team per rumah). Two Hari 2 Perempuan races have none, to show the empty state.
const TANPA_SENARAI = new Set(['lontar-peluru_perempuan', '4x200m_perempuan']);

function senaraiMula(acara, kategori, hasil) {
  if (acara.jenisAcara === 'berganti-ganti') {
    const nama = NAMA[kategori];
    return RUMAH_AWAL.map((r, i) => ({
      lorong: i + 2,
      pesertaId: null,
      bib: '',
      nama: r.nama,
      rumahId: r.id,
      ahli: nama.slice(i * 4, i * 4 + 4).map((n) => n.split(' ')[0]),
    }));
  }
  const urutan = hasil ? hasil.order : [0, 4, 8, 1, 5, 9];
  return urutan
    .map((idx, i) => {
      const p = DEMO_PESERTA.find((x) => x.id === `p-${kategori}-${idx}`);
      return { lorong: i + 1, pesertaId: p.id, bib: p.bib, nama: p.nama, rumahId: p.rumahId };
    })
    .sort((a, b) => a.lorong - b.lorong);
}

const TARIKH ={ 1: '2026-11-05', 2: '2026-11-06' };
const MULA = { 1: 7 * 60 + 50, 2: 8 * 60 };

export const DEMO_PERLUMBAAN = SUSUNAN_AWAL.map((s, i) => {
  const acara = ACARA.find((a) => a.id === s.acaraId);
  const hasil = SUSUNAN_HASIL[s.no];
  const minit = MULA[s.hari] + (i % 8) * 15;
  const status = hasil ? 'rasmi' : s.no === '106' ? 'berlangsung' : 'belum';
  const { id, ...doc } = s;
  return {
    id,
    ...doc,
    tarikh: TARIKH[s.hari],
    masa: `${String(Math.floor(minit / 60)).padStart(2, '0')}${String(minit % 60).padStart(2, '0')}`,
    status,
    senaraiMula: TANPA_SENARAI.has(id) ? [] : senaraiMula(acara, s.kategori, hasil),
    keputusan: hasil ? keputusan(acara, hasil, s.kategori) : [],
    dikemaskini: 1000 + i,
  };
});

// Records per race. 100M Lelaki is beaten by the demo result; 4x200M Perempuan has no record.
const REKOD = [
  ['50m', 'lelaki', '7.70 s', 7.7, 'Ahmad Firdaus', 'biru', 2021],
  ['50m', 'perempuan', '8.20 s', 8.2, 'Nurul Huda', 'merah', 2022],
  ['100m', 'lelaki', '14.20 s', 14.2, 'Mohd Azri', 'kuning', 2019],
  ['100m', 'perempuan', '14.80 s', 14.8, 'Siti Hajar', 'biru', 2023],
  ['200m', 'lelaki', '28.00 s', 28, 'Jeffry Madin', 'merah', 2018],
  ['200m', 'perempuan', '31.50 s', 31.5, 'Alice Jimmy', 'kuning', 2022],
  ['4x100m', 'lelaki', '56.00 s', 56, 'Rumah Merah', 'merah', 2020],
  ['4x100m', 'perempuan', '1:00.00', 60, 'Rumah Biru', 'biru', 2024],
  ['4x200m', 'lelaki', '1:58.00', 118, 'Rumah Kuning', 'kuning', 2019],
  ['lompat-jauh', 'lelaki', '4.20 m', 4.2, 'Hairul Nizam', 'biru', 2021],
  ['lompat-jauh', 'perempuan', '3.60 m', 3.6, 'Dayang Nora', 'merah', 2023],
  ['lompat-tinggi', 'lelaki', '1.35 m', 1.35, 'Brandon Jaikul', 'kuning', 2022],
  ['lompat-tinggi', 'perempuan', '1.20 m', 1.2, 'Nadia Rahman', 'biru', 2024],
  ['lontar-peluru', 'lelaki', '8.50 m', 8.5, 'Raymond Tuaran', 'merah', 2020],
  ['lontar-peluru', 'perempuan', '6.80 m', 6.8, 'Linda Anak Ensi', 'kuning', 2021],
];

export const DEMO_REKOD = REKOD.map(([acaraId, kategori, catatan, nilai, nama, rumahId, tahun]) => ({
  id: perlumbaanId(acaraId, kategori), catatan, nilai, nama, rumahId, tahun,
}));
