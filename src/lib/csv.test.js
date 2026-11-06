import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bahagiCsv, parseCsvPeserta } from './csv.js';

const rumah = [
  { id: 'merah', nama: 'Rumah Merah' },
  { id: 'biru', nama: 'Rumah Biru' },
];

test('bahagiCsv handles quotes and different separators', () => {
  assert.deepEqual(bahagiCsv('1,"Ali, Jr",merah,L\n2,Siti,biru,P\n'), [['1', 'Ali, Jr', 'merah', 'L'], ['2', 'Siti', 'biru', 'P']]);
  assert.deepEqual(bahagiCsv('1;Ali;merah;L\r\n\r\n2;Siti;biru;P'), [['1', 'Ali', 'merah', 'L'], ['2', 'Siti', 'biru', 'P']]);
  assert.deepEqual(bahagiCsv('1\tAli\tmerah\tL'), [['1', 'Ali', 'merah', 'L']]);
});

test('parseCsvPeserta maps rumah and kategori, skipping a header row', () => {
  const { baris, ralat } = parseCsvPeserta('bib,nama,rumah,kategori\n12,Ali,Rumah Merah,Lelaki\n7,Siti,biru,p', rumah);
  assert.deepEqual(ralat, []);
  assert.deepEqual(baris, [
    { bib: '12', nama: 'Ali', rumahId: 'merah', kategori: 'lelaki' },
    { bib: '7', nama: 'Siti', rumahId: 'biru', kategori: 'perempuan' },
  ]);
});

test('parseCsvPeserta reports bad rows with their line number', () => {
  const { baris, ralat } = parseCsvPeserta('bib,nama,rumah,kategori\n1,Ali,merah,L\n2,Abu,hijau,L\n3,,biru,P\n4,Eve,biru,X\n1,Dup,biru,P', rumah);
  assert.equal(baris.length, 1);
  assert.equal(ralat.length, 4);
  assert.match(ralat[0], /^Baris 3: rumah "hijau"/);
  assert.match(ralat[1], /^Baris 4: nama kosong/);
  assert.match(ralat[2], /^Baris 5: kategori "X"/);
  assert.match(ralat[3], /^Baris 6: bib 1 berulang/);
});
