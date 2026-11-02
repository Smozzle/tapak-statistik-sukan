// Sample data shown when VITE_DEMO=true and Firebase is not configured.
import { RUMAH_AWAL, keputusanId } from './constants.js';

export const DEMO_RUMAH = RUMAH_AWAL;

const k = (acaraId, kategori, t1, t2, t3, c1 = '') => ({
  id: keputusanId(acaraId, kategori), acaraId, kategori, tempat1: t1, tempat2: t2, tempat3: t3, catatan1: c1,
});

export const DEMO_KEPUTUSAN = [
  k('50m', 'lelaki', 'merah', 'biru', 'kuning', '7.8s'),
  k('100m', 'lelaki', 'biru', 'merah', 'kuning', '14.1s'),
  k('200m', 'lelaki', 'merah', 'kuning', 'biru'),
  k('4x100m', 'lelaki', 'merah', 'kuning', 'biru'),
  k('lompat-jauh', 'lelaki', 'biru', 'merah', 'kuning', '3.62m'),
  k('lontar-peluru', 'lelaki', 'biru', 'kuning', 'merah'),
  k('50m', 'perempuan', 'kuning', 'biru', 'merah', '8.3s'),
  k('100m', 'perempuan', 'biru', 'kuning', 'merah'),
  k('200m', 'perempuan', 'kuning', 'merah', 'biru'),
  k('lompat-tinggi', 'perempuan', 'merah', 'biru', 'kuning', '1.05m'),
];
