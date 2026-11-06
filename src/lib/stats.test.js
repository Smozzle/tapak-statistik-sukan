import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCatatan, kiraPingat, susunKedudukan, barisRumah, adalahRekodBaharu, senaraiPemecahRekod,
  rekodPeserta, perlumbaanTerkini, pingatMengikutJenis, binaSenaraiMula, semakSenaraiMula, acaraPeserta, jiranPerlumbaan, binaKeputusan, semakKeputusan, tukarKeputusanLama,
  bacaCubaan, formatMasa, susunKeputusan, susunEntri,
} from './stats.js';
import { ACARA, SUSUNAN_AWAL, SEMUA_PERLUMBAAN } from './constants.js';

const rumah = [
  { id: 'merah', nama: 'Rumah Merah', urutan: 1 },
  { id: 'biru', nama: 'Rumah Biru', urutan: 2 },
  { id: 'kuning', nama: 'Rumah Kuning', urutan: 3 },
];

// A perlumbaan with finishers given as [rumahId, extra?] in finishing order.
const p = (acaraId, kategori, no, status, finishers = [], extra = {}) => ({
  id: `${acaraId}_${kategori}`, no, acaraId, kategori, hari: 1, status,
  keputusan: finishers.map(([rumahId, e = {}], i) => ({
    ked: i + 1, pesertaId: e.pesertaId ?? null, bib: '', nama: e.nama ?? rumahId, rumahId,
    catatan: e.catatan ?? '', nilai: e.nilai ?? null, ...(e.ahli ? { ahli: e.ahli } : {}),
  })),
  ...extra,
});

const senarai = [
  p('50m', 'lelaki', '101', 'rasmi', [['merah'], ['biru'], ['kuning']]),
  p('100m', 'lelaki', '103', 'rasmi', [['biru', { pesertaId: 'p1', nama: 'Ali', catatan: '13.2 s', nilai: 13.2 }], ['merah'], ['kuning']]),
  p('200m', 'perempuan', '106', 'rasmi', [['merah'], ['kuning'], ['biru']]),
  p('lompat-jauh', 'perempuan', '108', 'rasmi', [['biru'], ['merah'], ['kuning']]),
  p('200m', 'lelaki', '105', 'berlangsung', [['kuning'], ['kuning'], ['kuning']]),
];

test('SUSUNAN_AWAL numbers 16 races: Hari 1 is 101-108, Hari 2 is 201-208', () => {
  assert.equal(SUSUNAN_AWAL.length, 16);
  assert.deepEqual(SUSUNAN_AWAL.filter((x) => x.hari === 1).map((x) => x.no), ['101', '102', '103', '104', '105', '106', '107', '108']);
  assert.deepEqual(SUSUNAN_AWAL.filter((x) => x.hari === 2).map((x) => x.no), ['201', '202', '203', '204', '205', '206', '207', '208']);
  assert.equal(SUSUNAN_AWAL.find((x) => x.id === '100m_lelaki').no, '103');
  assert.equal(SUSUNAN_AWAL.find((x) => x.id === 'lompat-jauh_perempuan').no, '108');
  assert.equal(SUSUNAN_AWAL.find((x) => x.id === 'lompat-tinggi_lelaki').no, '201');
  assert.equal(SUSUNAN_AWAL.find((x) => x.id === '4x200m_perempuan').no, '208');
});

test('parseCatatan reads times and distances', () => {
  assert.equal(parseCatatan('13.85 s'), 13.85);
  assert.equal(parseCatatan('7,8s'), 7.8);
  assert.equal(parseCatatan('3.62 m'), 3.62);
  assert.equal(parseCatatan('1:02.3'), 62.3);
  assert.equal(parseCatatan('  14 '), 14);
  assert.equal(parseCatatan(''), null);
  assert.equal(parseCatatan('DNS'), null);
  assert.equal(parseCatatan(undefined), null);
});

test('counts pingat from rasmi races only', () => {
  const t = kiraPingat(rumah, senarai);
  assert.deepEqual(t.merah, { emas: 2, perak: 2, gangsa: 0, jumlah: 4 });
  assert.deepEqual(t.biru, { emas: 2, perak: 1, gangsa: 1, jumlah: 4 });
  assert.deepEqual(t.kuning, { emas: 0, perak: 1, gangsa: 3, jumlah: 4 });
});

test('pingat can be filtered by kategori', () => {
  const lelaki = kiraPingat(rumah, senarai, 'lelaki');
  assert.deepEqual(lelaki.merah, { emas: 1, perak: 1, gangsa: 0, jumlah: 2 });
  const perempuan = kiraPingat(rumah, senarai, 'perempuan');
  assert.deepEqual(perempuan.biru, { emas: 1, perak: 0, gangsa: 1, jumlah: 2 });
});

test('a rumah with two medals in one race gets both', () => {
  const dua = [p('100m', 'lelaki', '103', 'rasmi', [['merah', { nama: 'A' }], ['merah', { nama: 'B' }], ['biru']])];
  const t = kiraPingat(rumah, dua);
  assert.deepEqual(t.merah, { emas: 1, perak: 1, gangsa: 0, jumlah: 2 });
  assert.deepEqual(t.biru, { emas: 0, perak: 0, gangsa: 1, jumlah: 1 });
});

test('only entries with ked 1-3 earn a pingat', () => {
  const enam = [p('100m', 'lelaki', '103', 'rasmi', [['merah'], ['biru'], ['kuning'], ['merah'], ['merah'], ['merah']])];
  assert.equal(kiraPingat(rumah, enam).merah.jumlah, 1);
});

test('ranks by Emas, then Perak, then Gangsa', () => {
  const s = susunKedudukan(rumah, senarai);
  assert.deepEqual(s.map((x) => [x.id, x.kedudukan]), [['merah', 1], ['biru', 2], ['kuning', 3]]);
});

test('identical medal counts share a rank', () => {
  const s = susunKedudukan(rumah, [
    p('50m', 'lelaki', '101', 'rasmi', [['merah'], ['biru'], ['kuning']]),
    p('100m', 'lelaki', '103', 'rasmi', [['biru'], ['merah'], ['kuning']]),
  ]);
  assert.deepEqual(s.map((x) => x.kedudukan), [1, 1, 3]);
});

test('no official results yet: everyone shares first place', () => {
  assert.deepEqual(susunKedudukan(rumah, []).map((x) => x.kedudukan), [1, 1, 1]);
  assert.deepEqual(susunKedudukan(rumah, [p('50m', 'lelaki', '101', 'berlangsung', [['merah'], ['biru'], ['kuning']])]).map((x) => x.kedudukan), [1, 1, 1]);
});

test('barisRumah covers all 16 races with status, athletes and catatan', () => {
  const rows = barisRumah('biru', senarai);
  assert.equal(rows.length, 16);
  const r100 = rows.find((x) => x.id === '100m_lelaki');
  assert.equal(r100.status, 'pingat');
  assert.equal(r100.pingat.nama, 'Emas');
  assert.deepEqual(r100.atlet, ['Ali']);
  assert.equal(r100.catatan, '13.2 s');
  assert.equal(rows.find((x) => x.id === '200m_perempuan').pingat.nama, 'Gangsa');
  assert.equal(rows.find((x) => x.id === '50m_perempuan').status, 'belum');
  assert.equal(rows.find((x) => x.id === '200m_lelaki').status, 'belum'); // berlangsung is not official
});

test('barisRumah uses the best ked and lists relay runners', () => {
  const lain = [
    p('100m', 'lelaki', '103', 'rasmi', [['merah'], ['biru', { nama: 'Siti' }], ['kuning'], ['biru', { nama: 'Abu' }]]),
    p('4x100m', 'lelaki', '205', 'rasmi', [['biru', { ahli: ['A', 'B', 'C', 'D'] }], ['merah'], ['kuning']]),
    p('50m', 'lelaki', '101', 'rasmi', [['merah'], ['kuning'], ['merah'], ['merah'], ['biru', { nama: 'Zed' }]]),
  ];
  const rows = barisRumah('biru', lain);
  assert.equal(rows.find((x) => x.id === '100m_lelaki').kedudukan, 2);
  assert.deepEqual(rows.find((x) => x.id === '100m_lelaki').atlet, ['Siti']);
  assert.deepEqual(rows.find((x) => x.id === '4x100m_lelaki').atlet, ['A', 'B', 'C', 'D']);
  const r50 = rows.find((x) => x.id === '50m_lelaki');
  assert.equal(r50.status, 'tiada');
  assert.equal(r50.kedudukan, 5);
});

test('pingatMengikutJenis splits medals by balapan and padang', () => {
  const j = pingatMengikutJenis('biru', senarai);
  assert.deepEqual(j.balapan, { emas: 1, perak: 1, gangsa: 1 });
  assert.deepEqual(j.padang, { emas: 1, perak: 0, gangsa: 0 });
});

test('record breaking: lower is better for balapan, higher for padang', () => {
  assert.equal(adalahRekodBaharu('balapan', 13.1, { nilai: 13.2 }), true);
  assert.equal(adalahRekodBaharu('balapan', 13.2, { nilai: 13.2 }), false);
  assert.equal(adalahRekodBaharu('balapan', 13.5, { nilai: 13.2 }), false);
  assert.equal(adalahRekodBaharu('padang', 3.7, { nilai: 3.62 }), true);
  assert.equal(adalahRekodBaharu('padang', 3.5, { nilai: 3.62 }), false);
  assert.equal(adalahRekodBaharu('padang', 3.62, { nilai: 3.62 }), false);
  assert.equal(adalahRekodBaharu('balapan', null, { nilai: 13.2 }), false);
  assert.equal(adalahRekodBaharu('balapan', 12, undefined), false);
});

test('senaraiPemecahRekod lists broken records in rasmi races only', () => {
  const rekod = [
    { id: '100m_lelaki', nilai: 13.5 },
    { id: 'lompat-jauh_perempuan', nilai: 3.9 },
    { id: '200m_lelaki', nilai: 30 },
  ];
  const hasil = [
    p('100m', 'lelaki', '103', 'rasmi', [['biru', { nilai: 13.2 }], ['merah', { nilai: 14 }], ['kuning', { nilai: 14.5 }]]),
    p('lompat-jauh', 'perempuan', '108', 'rasmi', [['biru', { nilai: 3.6 }], ['merah'], ['kuning']]),
    p('200m', 'lelaki', '105', 'berlangsung', [['kuning', { nilai: 25 }], ['biru'], ['merah']]),
  ];
  const pecah = senaraiPemecahRekod(hasil, rekod);
  assert.equal(pecah.length, 1);
  assert.equal(pecah[0].perlumbaan.id, '100m_lelaki');
  assert.equal(pecah[0].entri.nilai, 13.2);
});

test('rekodPeserta collects an athlete\'s races and medals', () => {
  const lain = [
    p('100m', 'lelaki', '103', 'rasmi', [['biru', { pesertaId: 'p1' }], ['merah'], ['kuning']]),
    p('50m', 'lelaki', '101', 'rasmi', [['merah'], ['kuning'], ['merah'], ['biru', { pesertaId: 'p1' }]]),
    p('200m', 'lelaki', '105', 'berlangsung', [['biru', { pesertaId: 'p1' }], ['merah'], ['kuning']]),
  ];
  const r = rekodPeserta('p1', lain);
  assert.deepEqual(r.perlumbaan.map((x) => x.perlumbaan.no), ['101', '103']);
  assert.deepEqual(r.pingat, { emas: 1, perak: 0, gangsa: 0, jumlah: 1 });
  assert.equal(r.perlumbaan[0].pingat, null);
});

test('perlumbaanTerkini returns the newest rasmi races', () => {
  const t = (no, ms) => p('50m', 'lelaki', no, 'rasmi', [], { id: `x${no}`, dikemaskini: ms });
  const list = [t('101', 100), t('102', 300), t('103', 200), t('104', 50), p('50m', 'perempuan', '105', 'berlangsung', [], { dikemaskini: 999 })];
  assert.deepEqual(perlumbaanTerkini(list).map((x) => x.no), ['102', '103', '101']);
});

test('jiranPerlumbaan finds previous and next by no', () => {
  const list = [p('50m', 'lelaki', '101', 'belum'), p('50m', 'perempuan', '102', 'belum'), p('100m', 'lelaki', '103', 'belum')];
  const j = jiranPerlumbaan(list, '50m_perempuan');
  assert.equal(j.sebelum.no, '101');
  assert.equal(j.seterusnya.no, '103');
  assert.equal(jiranPerlumbaan(list, '50m_lelaki').sebelum, null);
  assert.equal(jiranPerlumbaan(list, '100m_lelaki').seterusnya, null);
});

const acara = (id) => ACARA.find((a) => a.id === id);
const peserta = [
  { id: 'p1', bib: '12', nama: 'Ali', rumahId: 'biru', kategori: 'lelaki' },
  { id: 'p2', bib: '7', nama: 'Abu', rumahId: 'merah', kategori: 'lelaki' },
];

// A form row as the admin page builds it. Individual rows carry the athlete's own bib and nama.
const baris = (kunci, nama, tambah = {}) => ({
  kunci, pesertaId: `id-${kunci}`, bib: String(kunci), nama, rumahId: 'merah', lorong: kunci,
  ahli: [], catatan: '', cubaan: ['', '', ''], status: '', seri: '', tap: null, ...tambah,
});
const urutan = (s) => s.baris.map((b) => [b.nama, b.ked]);

test('parseCatatan accepts typed formats and rejects everything else', () => {
  assert.equal(parseCatatan('13.5'), 13.5);
  assert.equal(parseCatatan('13.50'), 13.5);
  assert.equal(parseCatatan('1:05.3'), 65.3);
  assert.equal(parseCatatan('3.62m'), 3.62);
  assert.equal(parseCatatan('3,62 m'), 3.62);
  for (const buruk of ['13abc', '1:75', 'abc', '', '  ', '1:2:3', '-3', '1.2.3']) assert.equal(parseCatatan(buruk), null, buruk);
});

test('bacaCubaan reads blank, foul, distance and invalid attempts', () => {
  assert.deepEqual(bacaCubaan(''), { jenis: 'kosong' });
  assert.deepEqual(bacaCubaan(' x '), { jenis: 'foul' });
  assert.deepEqual(bacaCubaan('-'), { jenis: 'foul' });
  assert.deepEqual(bacaCubaan('3.62m'), { jenis: 'nilai', nilai: 3.62 });
  assert.deepEqual(bacaCubaan('abc'), { jenis: 'tidakSah' });
});

test('formatMasa gives seconds under a minute and m:ss.cc above', () => {
  assert.equal(formatMasa(13.5), '13.50 s');
  assert.equal(formatMasa(65.3), '1:05.30');
  assert.equal(formatMasa(59.996), '1:00.00');
  assert.equal(parseCatatan(formatMasa(65.3)), 65.3);
});

test('balapan ranks the lowest time first', () => {
  const s = susunKeputusan(acara('100m'), [baris(1, 'A', { catatan: '14.20' }), baris(2, 'B', { catatan: '13.5' }), baris(3, 'C', { catatan: '13.85 s' })]);
  assert.deepEqual(urutan(s), [['B', 1], ['C', 2], ['A', 3]]);
  assert.equal(s.bilSah, 3);
  assert.equal(s.baris[0].nilai, 13.5);
});

test('padang ranks the longest distance first', () => {
  const s = susunKeputusan(acara('lompat-jauh'), [baris(1, 'A', { catatan: '3.2' }), baris(2, 'B', { catatan: '3.62m' }), baris(3, 'C', { catatan: '3.4 m' })]);
  assert.deepEqual(urutan(s), [['B', 1], ['C', 2], ['A', 3]]);
});

test('equal results share a ked, and the next place is skipped', () => {
  const s = susunKeputusan(acara('100m'), [baris(1, 'A', { catatan: '13.5' }), baris(2, 'B', { catatan: '13.50' }), baris(3, 'C', { catatan: '14' })]);
  assert.deepEqual(s.baris.map((b) => b.ked), [1, 1, 3]);
  assert.deepEqual(s.baris.map((b) => b.statusSeri), ['belum', 'belum', null]);
  assert.deepEqual(s.seriBelum, [[1, 2]]);
  assert.equal(s.seriPingat, true);
});

test('a tie outside the medal places is flagged but does not block', () => {
  const rows = [['A', '13'], ['B', '13.1'], ['C', '13.2'], ['D', '14'], ['E', '14.0']].map(([n, c], i) => baris(i + 1, n, { catatan: c }));
  const s = susunKeputusan(acara('100m'), rows);
  assert.deepEqual(s.baris.map((b) => b.ked), [1, 2, 3, 4, 4]);
  assert.equal(s.seriBelum.length, 1);
  assert.equal(s.seriPingat, false);
});

test('a seri order breaks a tie into separate ked', () => {
  const rows = (a, b) => [baris(1, 'A', { catatan: '13.5', seri: a }), baris(2, 'B', { catatan: '13.5', seri: b }), baris(3, 'C', { catatan: '14' })];
  const selesai = susunKeputusan(acara('100m'), rows('2', '1'));
  assert.deepEqual(urutan(selesai), [['B', 1], ['A', 2], ['C', 3]]);
  assert.deepEqual(selesai.baris.map((b) => b.statusSeri), ['selesai', 'selesai', null]);
  assert.equal(selesai.seriPingat, false);
  for (const [a, b] of [['1', ''], ['1', '1'], ['1', '3']]) {
    const belum = susunKeputusan(acara('100m'), rows(a, b));
    assert.deepEqual(belum.baris.map((x) => x.ked), [1, 1, 3], `${a}/${b}`);
    assert.equal(belum.seriPingat, true);
  }
});

test('padang ties are broken by the next best attempt', () => {
  const a = baris(1, 'A', { cubaan: ['3.60', '3.40', 'X'] });
  const b = baris(2, 'B', { cubaan: ['3.50', '3.60', '-'] });
  const s = susunKeputusan(acara('lompat-jauh'), [a, b]);
  assert.deepEqual(urutan(s), [['B', 1], ['A', 2]]);
  assert.equal(s.baris[0].nilai, 3.6);
  const sama = susunKeputusan(acara('lompat-jauh'), [a, baris(3, 'C', { cubaan: ['3.40', '3.60', 'X'] })]);
  assert.deepEqual(sama.baris.map((x) => x.ked), [1, 1]);
});

test('attempts: all fouls give no mark, and a bad attempt is flagged invalid', () => {
  const s = susunKeputusan(acara('lompat-jauh'), [baris(1, 'A', { cubaan: ['X', 'X', '-'] }), baris(2, 'B', { cubaan: ['3.5', 'abc', ''] })]);
  const a = s.baris.find((b) => b.nama === 'A');
  const b = s.baris.find((x) => x.nama === 'B');
  assert.equal(a.ked, null);
  assert.equal(a.tidakSah, false);
  assert.equal(b.tidakSah, true);
  assert.equal(s.bilSah, 0);
});

test('TT, TH and DQ rows get no ked and sort to the bottom, in that order', () => {
  const s = susunKeputusan(acara('100m'), [
    baris(1, 'Dq', { catatan: '12.0', status: 'DQ' }),
    baris(2, 'Th', { status: 'TH' }),
    baris(3, 'Ok', { catatan: '14' }),
    baris(4, 'Tt', { catatan: '13', status: 'TT' }),
    baris(5, 'Kosong'),
  ]);
  assert.deepEqual(urutan(s), [['Ok', 1], ['Kosong', null], ['Tt', null], ['Th', null], ['Dq', null]]);
  assert.equal(s.bilSah, 1);
});

test('invalid catatan is flagged and left unranked', () => {
  const s = susunKeputusan(acara('100m'), [baris(1, 'A', { catatan: '13abc' }), baris(2, 'B', { catatan: '13' })]);
  assert.deepEqual(urutan(s), [['B', 1], ['A', null]]);
  assert.equal(s.baris[1].tidakSah, true);
});

test('finish-line taps rank rows without a time, after rows that have one', () => {
  const s = susunKeputusan(acara('100m'), [baris(1, 'A', { tap: 2 }), baris(2, 'B', { tap: 1 }), baris(3, 'C', { catatan: '15' }), baris(4, 'D')]);
  assert.deepEqual(urutan(s), [['C', 1], ['B', 2], ['A', 3], ['D', null]]);
  const semua = susunKeputusan(acara('100m'), [baris(1, 'A', { tap: 3 }), baris(2, 'B', { tap: 1 }), baris(3, 'C', { tap: 2 })]);
  assert.deepEqual(urutan(semua), [['B', 1], ['C', 2], ['A', 3]]);
});

test('binaKeputusan writes ranked entries, with status rows last and ked null', () => {
  const k = binaKeputusan(acara('100m'), [
    baris(1, 'Dq', { catatan: '12.0', status: 'DQ' }),
    baris(2, 'Abu', { catatan: ' 13.85 s ', lorong: 4, rumahId: 'merah' }),
    baris(3, 'Ali', { catatan: '14.1', rumahId: 'biru' }),
  ]);
  assert.deepEqual(k[0], { ked: 1, pesertaId: 'id-2', bib: '2', nama: 'Abu', rumahId: 'merah', catatan: '13.85 s', nilai: 13.85, lorong: 4 });
  assert.equal(k[1].ked, 2);
  assert.deepEqual([k[2].ked, k[2].status, k[2].nilai, k[2].catatan], [null, 'DQ', null, '']);
});

test('binaKeputusan stores attempts with the best as catatan, and the seri order', () => {
  const k = binaKeputusan(acara('lompat-jauh'), [
    baris(1, 'A', { cubaan: ['3.4', 'X', '3.6'], seri: '2' }),
    baris(2, 'B', { cubaan: ['3.6', '3.4', ''], seri: '1' }),
  ]);
  assert.equal(k[0].nama, 'B');
  assert.deepEqual([k[0].ked, k[1].ked], [1, 2]);
  assert.equal(k[0].catatan, '3.6 m');
  assert.deepEqual(k[1].cubaan, ['3.4', 'X', '3.6']);
  assert.deepEqual([k[0].seri, k[1].seri], [1, 2]);
});

test('binaKeputusan builds relay entries per rumah with four runners', () => {
  const k = binaKeputusan(acara('4x100m'), [{
    kunci: 1, rumahId: 'biru', nama: 'Rumah Biru', ahli: [' A', 'B', 'C', 'D '], catatan: '55.1 s', cubaan: [], status: '', seri: '',
  }]);
  assert.equal(k[0].nama, 'Rumah Biru');
  assert.deepEqual(k[0].ahli, ['A', 'B', 'C', 'D']);
  assert.equal(k[0].pesertaId, null);
  assert.equal(k[0].bib, '');
});

test('semakKeputusan: a draft only needs sensible input', () => {
  const a = acara('100m');
  assert.equal(semakKeputusan(a, []), null);
  assert.equal(semakKeputusan(a, [baris(1, 'A', { catatan: '13' })]), null);
  assert.match(semakKeputusan(a, [baris(1, 'A', { pesertaId: 'x' }), baris(2, 'B', { pesertaId: 'x' })]), /dua kali/);
  assert.match(semakKeputusan(a, [baris(1, 'A', { catatan: 'laju' })]), /tidak sah/);
  assert.match(semakKeputusan(a, [baris(1, 'A', { pesertaId: '', nama: '' })]), /pilih peserta/);
  assert.match(semakKeputusan(acara('lompat-jauh'), [baris(1, 'A', { cubaan: ['abc', '', ''] })]), /cubaan/);
});

test('semakKeputusan umum: needs 3 ranked finishers and no unresolved medal tie', () => {
  const a = acara('100m');
  const tiga = [baris(1, 'A', { catatan: '13' }), baris(2, 'B', { catatan: '14' }), baris(3, 'C', { catatan: '15' })];
  assert.equal(semakKeputusan(a, tiga, { umum: true }), null);
  assert.match(semakKeputusan(a, tiga.slice(0, 2), { umum: true }), /3 peserta/);
  assert.match(semakKeputusan(a, [...tiga.slice(0, 2), baris(3, 'C', { status: 'DQ', catatan: '12' })], { umum: true }), /3 peserta/);
  const seri = [baris(1, 'A', { catatan: '13' }), baris(2, 'B', { catatan: '13' }), baris(3, 'C', { catatan: '15' })];
  assert.match(semakKeputusan(a, seri, { umum: true }), /seri/);
  seri[0].seri = '1';
  seri[1].seri = '2';
  assert.equal(semakKeputusan(a, seri, { umum: true }), null);
});

test('semakKeputusan: relays need unique rumah, and 4 runners to announce', () => {
  const a = acara('4x100m');
  const pasukan = (rumahId, ahli, catatan) => ({ kunci: rumahId, rumahId, nama: rumahId, ahli, catatan, cubaan: [], status: '', seri: '' });
  const penuh = ['A', 'B', 'C', 'D'];
  assert.match(semakKeputusan(a, [pasukan('merah', penuh, '55'), pasukan('merah', penuh, '56')]), /sekali/);
  assert.match(semakKeputusan(a, [pasukan('merah', ['A', 'B', '', ''], '55')]), /4 pelari/);
  const tiga = [pasukan('merah', penuh, '55'), pasukan('biru', penuh, '56'), pasukan('kuning', ['', '', '', ''], '57')];
  assert.equal(semakKeputusan(a, tiga), null);
  assert.match(semakKeputusan(a, tiga, { umum: true }), /4 pelari/);
});

test('susunEntri puts placed entries first by ked, then TT, TH, DQ', () => {
  const e = (ked, status) => ({ ked, status, nama: `${ked}${status ?? ''}` });
  const s = susunEntri([e(null, 'DQ'), e(2), e(null, 'TT'), e(1), e(2), e(null, 'TH')]);
  assert.deepEqual(s.map((x) => x.nama), ['1', '2', '2', 'nullTT', 'nullTH', 'nullDQ']);
});

test('DQ and DNF entries never earn a pingat, a rumah row or a record', () => {
  const dq = { ...p('100m', 'lelaki', '103', 'rasmi', [['biru'], ['merah'], ['kuning']]) };
  dq.keputusan.push({ ked: null, status: 'DQ', pesertaId: 'z', bib: '9', nama: 'Z', rumahId: 'biru', catatan: '', nilai: 1 });
  assert.deepEqual(kiraPingat(rumah, [dq]).biru, { emas: 1, perak: 0, gangsa: 0, jumlah: 1 });
  assert.equal(barisRumah('biru', [dq]).find((x) => x.id === '100m_lelaki').kedudukan, 1);
  const hanyaDq = { ...dq, keputusan: dq.keputusan.slice(3) };
  const baris100 = barisRumah('biru', [hanyaDq]).find((x) => x.id === '100m_lelaki');
  assert.deepEqual([baris100.status, baris100.kedudukan], ['tiada', null]);
  assert.deepEqual(senaraiPemecahRekod([dq], [{ id: '100m_lelaki', nilai: 20 }]), []);
});

test('binaSenaraiMula orders by lorong and copies bib, nama and rumah', () => {
  const k = binaSenaraiMula(acara('100m'), [{ pesertaId: 'p1', lorong: '3' }, { pesertaId: 'p2', lorong: '1' }], peserta, rumah);
  assert.deepEqual(k.map((e) => [e.lorong, e.nama, e.bib, e.rumahId]), [[1, 'Abu', '7', 'merah'], [3, 'Ali', '12', 'biru']]);
});

test('binaSenaraiMula keeps rows without a lorong last, in entered order', () => {
  const k = binaSenaraiMula(acara('lompat-jauh'), [{ pesertaId: 'p1' }, { pesertaId: 'p2', lorong: '' }], peserta, rumah);
  assert.deepEqual(k.map((e) => [e.lorong, e.pesertaId]), [[null, 'p1'], [null, 'p2']]);
  const dua = binaSenaraiMula(acara('lompat-jauh'), [{ pesertaId: 'p1' }, { pesertaId: 'p2', lorong: '2' }], peserta, rumah);
  assert.equal(dua[0].pesertaId, 'p2');
});

test('binaSenaraiMula builds relay entries with optional runners', () => {
  const k = binaSenaraiMula(acara('4x100m'), [
    { rumahId: 'biru', lorong: '2', ahli: ['A', 'B', 'C', 'D'] },
    { rumahId: 'merah', lorong: '1', ahli: ['', '', '', ''] },
  ], [], rumah);
  assert.equal(k[0].nama, 'Rumah Merah');
  assert.equal('ahli' in k[0], false);
  assert.deepEqual(k[1].ahli, ['A', 'B', 'C', 'D']);
});

test('semakSenaraiMula checks peserta, duplicates and lorong', () => {
  const a = acara('100m');
  assert.match(semakSenaraiMula(a, [{ pesertaId: 'p1' }, { pesertaId: '' }]), /pilih peserta/);
  assert.match(semakSenaraiMula(a, [{ pesertaId: 'p1' }, { pesertaId: 'p1' }]), /dua kali/);
  assert.match(semakSenaraiMula(a, [{ pesertaId: 'p1', lorong: 'x' }]), /Lorong mesti/);
  assert.match(semakSenaraiMula(a, [{ pesertaId: 'p1', lorong: '0' }]), /Lorong mesti/);
  assert.match(semakSenaraiMula(a, [{ pesertaId: 'p1', lorong: '2' }, { pesertaId: 'p2', lorong: '2' }]), /sekali/);
  assert.equal(semakSenaraiMula(a, [{ pesertaId: 'p1', lorong: '1' }, { pesertaId: 'p2' }]), null);
  assert.equal(semakSenaraiMula(a, []), null);
});

test('semakSenaraiMula for relays: unique rumah, runners all or none', () => {
  const a = acara('4x100m');
  assert.match(semakSenaraiMula(a, [{ rumahId: 'merah' }, { rumahId: 'merah' }]), /sekali/);
  assert.match(semakSenaraiMula(a, [{ rumahId: 'merah', ahli: ['A', 'B', '', ''] }]), /4 pelari/);
  assert.equal(semakSenaraiMula(a, [{ rumahId: 'merah', ahli: ['', '', '', ''] }, { rumahId: 'biru', ahli: ['A', 'B', 'C', 'D'] }]), null);
});

test('acaraPeserta lists races an athlete is entered in or has finished', () => {
  const list = [
    { ...p('100m', 'lelaki', '103', 'belum'), senaraiMula: [{ lorong: 4, pesertaId: 'p1' }] },
    p('50m', 'lelaki', '101', 'rasmi', [['biru', { pesertaId: 'p1' }], ['merah'], ['kuning']]),
    { ...p('200m', 'lelaki', '105', 'belum'), senaraiMula: [{ lorong: 1, pesertaId: 'p2' }] },
  ];
  const r = acaraPeserta('p1', list);
  assert.deepEqual(r.map((x) => [x.perlumbaan.no, x.lorong]), [['101', null], ['103', 4]]);
  assert.deepEqual(acaraPeserta('nobody', list), []);
});

test('tukarKeputusanLama converts an old keputusan document', () => {
  const lama = { id: '100m_lelaki', acaraId: '100m', kategori: 'lelaki', tempat1: 'biru', tempat2: 'merah', tempat3: 'kuning', atlet1: 'Ali', catatan1: '14.1s' };
  const { keputusan, status } = tukarKeputusanLama(lama, rumah);
  assert.equal(status, 'rasmi');
  assert.deepEqual(keputusan[0], { ked: 1, pesertaId: null, bib: '', nama: 'Ali', rumahId: 'biru', catatan: '14.1s', nilai: 14.1 });
  assert.equal(keputusan[1].nama, 'Rumah Merah'); // no athlete name: falls back to the rumah
  assert.equal(keputusan[1].nilai, null);
  const relay = tukarKeputusanLama({ acaraId: '4x100m', tempat1: 'merah', tempat2: 'biru', tempat3: 'kuning', atlet1: 'A, B, C, D' }, rumah);
  assert.equal(relay.keputusan[0].nama, 'Rumah Merah');
  assert.deepEqual(relay.keputusan[0].ahli, ['A', 'B', 'C', 'D']);
});

test('SEMUA_PERLUMBAAN lists 16 races in timetable order', () => {
  assert.equal(SEMUA_PERLUMBAAN.length, 16);
  assert.equal(SEMUA_PERLUMBAAN[2].id, '100m_lelaki');
});
