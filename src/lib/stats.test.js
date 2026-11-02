import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kiraPingat, susunKedudukan, barisStatistik, semakKeputusan } from './stats.js';

const rumah = [
  { id: 'merah', nama: 'Rumah Merah', urutan: 1 },
  { id: 'biru', nama: 'Rumah Biru', urutan: 2 },
  { id: 'kuning', nama: 'Rumah Kuning', urutan: 3 },
];

const r = (acaraId, kategori, t1, t2, t3, extra = {}) => ({
  id: `${acaraId}_${kategori}`, acaraId, kategori, tempat1: t1, tempat2: t2, tempat3: t3, ...extra,
});

const keputusan = [
  r('50m', 'lelaki', 'merah', 'biru', 'kuning'),
  r('100m', 'lelaki', 'biru', 'merah', 'kuning', { catatan1: '13.2s' }),
  r('200m', 'perempuan', 'merah', 'kuning', 'biru'),
  r('lompat-jauh', 'perempuan', 'biru', 'merah', 'kuning'),
];

test('counts pingat per rumah', () => {
  const t = kiraPingat(rumah, keputusan);
  assert.deepEqual(t.merah, { emas: 2, perak: 2, gangsa: 0, jumlah: 4 });
  assert.deepEqual(t.biru, { emas: 2, perak: 1, gangsa: 1, jumlah: 4 });
  assert.deepEqual(t.kuning, { emas: 0, perak: 1, gangsa: 3, jumlah: 4 });
});

test('ranks by Emas, then Perak, then Gangsa', () => {
  const s = susunKedudukan(rumah, keputusan);
  assert.deepEqual(s.map((x) => [x.id, x.kedudukan]), [['merah', 1], ['biru', 2], ['kuning', 3]]);
});

test('identical medal counts share a rank', () => {
  const s = susunKedudukan(rumah, [r('50m', 'lelaki', 'merah', 'biru', 'kuning'), r('100m', 'lelaki', 'biru', 'merah', 'kuning')]);
  assert.deepEqual(s.map((x) => x.kedudukan), [1, 1, 3]);
});

test('no results yet: everyone shares first place', () => {
  const s = susunKedudukan(rumah, []);
  assert.deepEqual(s.map((x) => x.kedudukan), [1, 1, 1]);
});

test('statistik rows cover all 16 races with status', () => {
  const rows = barisStatistik('biru', keputusan);
  assert.equal(rows.length, 16);
  const row100 = rows.find((x) => x.id === '100m_lelaki');
  assert.equal(row100.pingat.nama, 'Emas');
  assert.equal(row100.catatan, '13.2s');
  assert.equal(rows.find((x) => x.id === '200m_perempuan').pingat.nama, 'Gangsa');
  assert.equal(rows.find((x) => x.id === '50m_perempuan').status, 'belum');
});

test('validation rejects missing or repeated rumah', () => {
  assert.match(semakKeputusan({ acaraId: '50m', kategori: 'lelaki', tempat1: 'merah', tempat2: 'merah', tempat3: 'biru' }), /berbeza/);
  assert.match(semakKeputusan({ acaraId: '50m', kategori: 'lelaki', tempat1: 'merah', tempat2: '', tempat3: 'biru' }), /tempat 1, 2 dan 3/);
  assert.match(semakKeputusan({ acaraId: 'x', kategori: 'lelaki', tempat1: 'a', tempat2: 'b', tempat3: 'c' }), /acara/);
  assert.equal(semakKeputusan({ acaraId: '50m', kategori: 'perempuan', tempat1: 'merah', tempat2: 'biru', tempat3: 'kuning' }), null);
});
