import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pilihTemplat, idTemplat, isiMedan, medanPenuh, saizMuat, MEDAN } from './sijil.js';

const t = (n) => ({ gambar: `data:${n}`, orientasi: 'landscape', cetakLatar: true, medan: {} });
const emas = { jenis: 'pemenang', pingat: 'Emas' };
const perak = { jenis: 'pemenang', pingat: 'Perak' };
const serta = { jenis: 'penyertaan', pingat: null };

test('pilihTemplat: medal template, then pemenang, then penyertaan, else null', () => {
  const semua = { pemenang: t('p'), emas: t('e'), penyertaan: t('s') };
  assert.equal(pilihTemplat(semua, emas), semua.emas);
  assert.equal(pilihTemplat(semua, perak), semua.pemenang);
  assert.equal(pilihTemplat(semua, serta), semua.penyertaan);
  assert.equal(pilihTemplat({ emas: t('e') }, perak), null);
  assert.equal(pilihTemplat({ emas: t('e') }, serta), null);
  assert.equal(pilihTemplat({}, emas), null);
  assert.equal(pilihTemplat(undefined, emas), null);
  // A medal template never applies to participation certificates.
  assert.equal(idTemplat({ emas: t('e'), pemenang: t('p') }, serta), null);
  // A document without an image is ignored.
  assert.equal(pilihTemplat({ pemenang: { gambar: '' } }, emas), null);
});

test('isiMedan builds the text of each field', () => {
  const s = { nama: 'Ali bin Abu', rumahId: 'merah', bib: '12', tempat: 'Pertama', pingat: 'Emas', no: '101', acara: '50M', kategori: 'Lelaki', catatan: '7.80 s', tarikh: '2026-10-11' };
  const i = isiMedan(s, { merah: { nama: 'Rumah Merah' } }, { nama: 'Kejohanan SK Lodung', tahun: 2020 });
  assert.equal(i.nama, 'ALI BIN ABU');
  assert.equal(i.rumah, 'Rumah Merah');
  assert.equal(i.bib, 'No. bib 12');
  assert.equal(i.tempat, 'Tempat Pertama (Pingat Emas)');
  assert.equal(i.acara, 'Acara 101 · 50M Lelaki');
  assert.equal(i.catatan, 'Catatan: 7.80 s');
  assert.equal(i.kejohanan, 'Kejohanan SK Lodung 2026'); // year comes from the race date
  assert.match(i.tarikh, /2026/);
  assert.deepEqual(Object.keys(i).sort(), MEDAN.map((m) => m.kunci).sort());
});

test('isiMedan: empty text for missing bib, tempat, catatan and date', () => {
  const i = isiMedan({ nama: 'A', rumahId: 'x', bib: null, tempat: null, catatan: null, no: '1', acara: '4x100M', kategori: 'Lelaki' }, {}, { nama: 'K', tahun: 2025 });
  assert.equal(i.bib, '');
  assert.equal(i.tempat, '');
  assert.equal(i.catatan, '');
  assert.equal(i.tarikh, '');
  assert.equal(i.rumah, 'x');
  assert.equal(i.kejohanan, 'K 2025');
});

test('medanPenuh fills gaps with defaults', () => {
  const m = medanPenuh({ nama: { x: 5, papar: false } });
  assert.equal(m.nama.x, 5);
  assert.equal(m.nama.papar, false);
  assert.equal(m.nama.saiz, 30);
  assert.equal(m.tarikh.papar, true);
  assert.equal(Object.keys(m).length, MEDAN.length);
});

test('saizMuat fits A4 at 150 dpi without enlarging', () => {
  assert.deepEqual(saizMuat(3508, 2480), { lebar: 1754, tinggi: 1240, orientasi: 'landscape' });
  assert.deepEqual(saizMuat(2480, 3508), { lebar: 1240, tinggi: 1754, orientasi: 'portrait' });
  assert.deepEqual(saizMuat(800, 600), { lebar: 800, tinggi: 600, orientasi: 'landscape' });
  assert.equal(saizMuat(4000, 1000).lebar, 1754);
});
