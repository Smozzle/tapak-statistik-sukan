import { ACARA, KATEGORI, PINGAT, SEMUA_PERLUMBAAN } from './constants.js';

// A perlumbaan document looks like:
// { no, acaraId, kategori, hari, tarikh, masa, peringkat, status,
//   keputusan: [ { ked, pesertaId|null, bib, nama, rumahId, catatan, nilai, ahli? } ] }
// Only races with status 'rasmi' count towards pingat, rankings and records.

const rasmi = (p) => p.status === 'rasmi';
const entri = (p) => p.keputusan ?? [];
const padaKategori = (p, kategori) => !kategori || kategori === 'semua' || p.kategori === kategori;

/**
 * Turns a catatan such as "13.5", "13.50 s", "7,8s", "3.62m" or "1:05.3" (= 65.3) into a number
 * (seconds or metres). Returns null for anything else, including empty text, "13abc" and "1:75".
 */
export function parseCatatan(teks) {
  if (typeof teks !== 'string') return null;
  const t = teks.trim().replace(',', '.');
  const minit = t.match(/^(\d+):([0-5]?\d(?:\.\d+)?)\s*(?:s|saat)?$/i);
  if (minit) return Number(minit[1]) * 60 + Number(minit[2]);
  const nombor = t.match(/^(\d+(?:\.\d+)?)\s*(?:s|m|saat|meter)?$/i);
  return nombor ? Number(nombor[1]) : null;
}

/**
 * Reads one field attempt. Returns { jenis: 'kosong' } for blank, { jenis: 'foul' } for X or -,
 * { jenis: 'nilai', nilai } for a distance, and { jenis: 'tidakSah' } otherwise.
 */
export function bacaCubaan(teks) {
  const t = (teks ?? '').trim();
  if (!t) return { jenis: 'kosong' };
  if (/^(x|-)$/i.test(t)) return { jenis: 'foul' };
  const nilai = parseCatatan(t);
  return nilai === null ? { jenis: 'tidakSah' } : { jenis: 'nilai', nilai };
}

/** Seconds -> "13.52 s" (under a minute) or "1:05.30", rounded to hundredths. */
export function formatMasa(saat) {
  const cs = Math.round(saat * 100);
  if (cs < 6000) return `${(cs / 100).toFixed(2)} s`;
  const minit = Math.floor(cs / 6000);
  return `${minit}:${((cs % 6000) / 100).toFixed(2).padStart(5, '0')}`;
}

/** Emas/Perak/Gangsa totals for each rumah sukan, optionally for one kategori. */
export function kiraPingat(rumahList, perlumbaanList, kategori = 'semua') {
  const totals = Object.fromEntries(
    rumahList.map((r) => [r.id, { emas: 0, perak: 0, gangsa: 0, jumlah: 0 }]),
  );
  for (const p of perlumbaanList) {
    if (!rasmi(p) || !padaKategori(p, kategori)) continue;
    for (const e of entri(p)) {
      const t = totals[e.rumahId];
      if (!PINGAT[e.ked] || !t) continue;
      t[PINGAT[e.ked].id] += 1;
      t.jumlah += 1;
    }
  }
  return totals;
}

/**
 * Rumah sukan sorted by medal count: most Emas first, then Perak, then Gangsa.
 * Rumah with identical counts share the same kedudukan.
 */
export function susunKedudukan(rumahList, perlumbaanList, kategori = 'semua') {
  const totals = kiraPingat(rumahList, perlumbaanList, kategori);
  const list = rumahList
    .map((r) => ({ ...r, pingat: totals[r.id] }))
    .sort(
      (a, b) =>
        b.pingat.emas - a.pingat.emas ||
        b.pingat.perak - a.pingat.perak ||
        b.pingat.gangsa - a.pingat.gangsa ||
        (a.urutan ?? 0) - (b.urutan ?? 0),
    );
  let kedudukan = 0;
  return list.map((r, i) => {
    const prev = list[i - 1];
    const sama =
      prev &&
      prev.pingat.emas === r.pingat.emas &&
      prev.pingat.perak === r.pingat.perak &&
      prev.pingat.gangsa === r.pingat.gangsa;
    if (!sama) kedudukan = i + 1;
    return { ...r, kedudukan };
  });
}

/** Names shown for a finisher: the four runners for a relay, otherwise the athlete's name. */
export const namaPelumba = (e) => (e.ahli?.length ? e.ahli : [e.nama]);

/**
 * One row per race for a rumah's statistik page, in timetable order.
 * status: 'pingat' (placed 1-3), 'tiada' (result in, no medal), 'belum' (not official yet).
 * kedudukan is the rumah's best ked in the race (it can hold several entries).
 */
export function barisRumah(rumahId, perlumbaanList) {
  const byId = Object.fromEntries(perlumbaanList.map((p) => [p.id, p]));
  return SEMUA_PERLUMBAAN.map(({ id, no, acara, kategori }) => {
    const asas = { id, no, acara, kategori, kedudukan: null, pingat: null, atlet: [], catatan: '' };
    const p = byId[id];
    if (!p || !rasmi(p)) return { ...asas, status: 'belum' };
    const terbaik = entri(p)
      .filter((e) => e.rumahId === rumahId && Number.isInteger(e.ked))
      .sort((a, b) => a.ked - b.ked)[0];
    if (!terbaik) return { ...asas, status: 'tiada' };
    const pingat = PINGAT[terbaik.ked] ?? null;
    return {
      ...asas,
      status: pingat ? 'pingat' : 'tiada',
      kedudukan: terbaik.ked,
      pingat,
      atlet: namaPelumba(terbaik),
      catatan: terbaik.catatan || '',
    };
  });
}

/** A rumah's pingat split by jenis sukan (balapan / padang), counting every medal entry. */
export function pingatMengikutJenis(rumahId, perlumbaanList) {
  const hasil = {
    balapan: { emas: 0, perak: 0, gangsa: 0 },
    padang: { emas: 0, perak: 0, gangsa: 0 },
  };
  for (const p of perlumbaanList) {
    const acara = ACARA.find((a) => a.id === p.acaraId);
    if (!rasmi(p) || !acara) continue;
    for (const e of entri(p)) {
      if (e.rumahId === rumahId && PINGAT[e.ked]) hasil[acara.jenis][PINGAT[e.ked].id] += 1;
    }
  }
  return hasil;
}

/** True when nilai beats the record: lower for balapan (time), higher for padang (distance). */
export function adalahRekodBaharu(jenis, nilai, rekod) {
  if (typeof nilai !== 'number' || typeof rekod?.nilai !== 'number') return false;
  return jenis === 'balapan' ? nilai < rekod.nilai : nilai > rekod.nilai;
}

/** Every official result in this carnival that beat the stored record for its race. */
export function senaraiPemecahRekod(perlumbaanList, rekodList) {
  const rekodById = Object.fromEntries(rekodList.map((r) => [r.id, r]));
  const hasil = [];
  for (const p of perlumbaanList) {
    const rekod = rekodById[p.id];
    const acara = ACARA.find((a) => a.id === p.acaraId);
    if (!rasmi(p) || !rekod || !acara) continue;
    for (const e of entri(p)) {
      if (!e.status && adalahRekodBaharu(acara.jenis, e.nilai, rekod)) {
        hasil.push({
          perlumbaan: p,
          acara,
          kategori: KATEGORI.find((k) => k.id === p.kategori),
          entri: e,
          rekod,
        });
      }
    }
  }
  return hasil;
}

/** An athlete's official races, in timetable order, with the medals won. */
export function rekodPeserta(pesertaId, perlumbaanList) {
  const perlumbaan = perlumbaanList
    .filter(rasmi)
    .flatMap((p) => {
      const e = entri(p).find((x) => x.pesertaId === pesertaId);
      return e
        ? [{
            perlumbaan: p,
            acara: ACARA.find((a) => a.id === p.acaraId),
            kategori: KATEGORI.find((k) => k.id === p.kategori),
            entri: e,
            pingat: PINGAT[e.ked] ?? null,
          }]
        : [];
    })
    .sort((a, b) => String(a.perlumbaan.no).localeCompare(String(b.perlumbaan.no)));
  const pingat = { emas: 0, perak: 0, gangsa: 0, jumlah: 0 };
  for (const r of perlumbaan) {
    if (!r.pingat) continue;
    pingat[r.pingat.id] += 1;
    pingat.jumlah += 1;
  }
  return { perlumbaan, pingat };
}

/** The races an athlete is entered in (start list) or has finished, in timetable order. */
export function acaraPeserta(pesertaId, perlumbaanList) {
  return perlumbaanList
    .flatMap((p) => {
      const mula = (p.senaraiMula ?? []).find((e) => e.pesertaId === pesertaId);
      if (!mula && !entri(p).some((e) => e.pesertaId === pesertaId)) return [];
      return [{
        perlumbaan: p,
        acara: ACARA.find((a) => a.id === p.acaraId),
        kategori: KATEGORI.find((k) => k.id === p.kategori),
        lorong: mula?.lorong ?? null,
      }];
    })
    .sort((a, b) => String(a.perlumbaan.no).localeCompare(String(b.perlumbaan.no), undefined, { numeric: true }));
}

const masaKemaskini =(p) => p.dikemaskini?.toMillis?.() ?? (typeof p.dikemaskini === 'number' ? p.dikemaskini : 0);

/** The most recently updated official races (newest first), for "Keputusan terkini". */
export function perlumbaanTerkini(perlumbaanList, n = 3) {
  return perlumbaanList
    .filter(rasmi)
    .sort((a, b) => masaKemaskini(b) - masaKemaskini(a) || String(b.no).localeCompare(String(a.no)))
    .slice(0, n);
}

/** Medal entries (ked 1-3) of a race, in order. */
export const tigaTerbaik = (p) => susunEntri(entri(p).filter((e) => PINGAT[e.ked]));

/** Previous and next race by `no`, for the links at the bottom of a results page. */
export function jiranPerlumbaan(perlumbaanList, id) {
  const susun = [...perlumbaanList].sort((a, b) => String(a.no).localeCompare(String(b.no), undefined, { numeric: true }));
  const i = susun.findIndex((p) => p.id === id);
  return { sebelum: i > 0 ? susun[i - 1] : null, seterusnya: i >= 0 ? (susun[i + 1] ?? null) : null };
}

// Why a competitor has no placing: Tidak Tamat (DNF), Tidak Hadir (DNS), Dibatalkan kelayakan (DQ).
export const STATUS_PELUMBA = {
  TT: { nama: 'Tidak tamat', singkatan: 'DNF' },
  TH: { nama: 'Tidak hadir', singkatan: 'DNS' },
  DQ: { nama: 'Dibatalkan kelayakan', singkatan: 'DQ' },
};
const URUTAN_STATUS = Object.keys(STATUS_PELUMBA);

/** Entries in display order: placed by ked (ties together), then TT, TH and DQ at the bottom. */
export const susunEntri = (senarai) =>
  [...senarai].sort((a, b) => {
    const ka = Number.isInteger(a.ked) ? a.ked : Infinity;
    const kb = Number.isInteger(b.ked) ? b.ked : Infinity;
    return ka - kb || URUTAN_STATUS.indexOf(a.status) - URUTAN_STATUS.indexOf(b.status);
  });

/** Reads what the admin typed for one row: nilai, whether it is invalid, and the attempts (best first). */
function analisisBaris(acara, b) {
  const padang = acara.jenis === 'padang';
  const cubaan = padang ? (b.cubaan ?? []).map(bacaCubaan) : [];
  if (cubaan.some((c) => c.jenis !== 'kosong')) {
    const nilai = cubaan.filter((c) => c.jenis === 'nilai').map((c) => c.nilai).sort((x, y) => y - x);
    return {
      nilai: nilai[0] ?? null,
      cubaanTerbaik: nilai,
      tidakSah: cubaan.some((c) => c.jenis === 'tidakSah'),
      kosong: false,
    };
  }
  const catatan = (b.catatan ?? '').trim();
  const nilai = catatan ? parseCatatan(catatan) : null;
  return { nilai, cubaanTerbaik: nilai === null ? [] : [nilai], tidakSah: Boolean(catatan) && nilai === null, kosong: !catatan };
}

/**
 * Ranks the admin form rows and returns { baris, bilSah, seriBelum, seriPingat }.
 * Row fields used: catatan, cubaan[3] (field events), status ('TT' | 'TH' | 'DQ' | ''), seri, tap.
 *  - balapan: lowest nilai first; padang: highest first, ties broken by the next best attempt.
 *  - A row with only `tap` (finish-line order, no time) ranks by tap order after rows that have a nilai.
 *  - Equal results share a ked and are marked statusSeri 'belum' until the admin gives each a distinct
 *    `seri` number 1..n, which orders the group and separates the ked ('selesai').
 *  - Rows with a status get no ked and sort last (TT, TH, DQ); empty or invalid rows sit above them.
 * Each returned row adds: nilai, tidakSah, ked, statusSeri, saizSeri.
 */
export function susunKeputusan(acara, baris) {
  const arah = acara.jenis === 'balapan' ? 1 : -1;
  const analisis = baris.map((b, i) => ({ ...b, ...analisisBaris(acara, b), indeks: i, ked: null, statusSeri: null, saizSeri: 1 }));
  const tap = (r) => (Number.isInteger(r.tap) ? r.tap : null);
  const layak = analisis.filter((r) => !r.status && !r.tidakSah && (r.nilai !== null || tap(r) !== null));

  const banding = (a, b) => {
    if (a.nilai !== null && b.nilai !== null) {
      const d = (a.nilai - b.nilai) * arah;
      if (d !== 0) return d;
      for (let i = 1; i < 3; i += 1) {
        const x = a.cubaanTerbaik[i] ?? -Infinity;
        const y = b.cubaanTerbaik[i] ?? -Infinity;
        if (acara.jenis === 'padang' && x !== y) return y - x;
      }
      return 0;
    }
    if (a.nilai !== null) return -1;
    if (b.nilai !== null) return 1;
    return tap(a) - tap(b);
  };

  layak.sort((a, b) => banding(a, b) || a.indeks - b.indeks);
  const seriBelum = [];
  let seriPingat = false;
  let pos = 1;
  for (let i = 0; i < layak.length; ) {
    let j = i + 1;
    while (j < layak.length && banding(layak[i], layak[j]) === 0) j += 1;
    const kumpulan = layak.slice(i, j);
    const n = kumpulan.length;
    kumpulan.forEach((r) => { r.ked = pos; r.saizSeri = n; });
    if (n > 1) {
      const seri = kumpulan.map((r) => Number.parseInt(r.seri, 10));
      const selesai = seri.every((v) => Number.isInteger(v) && v >= 1 && v <= n) && new Set(seri).size === n;
      if (selesai) {
        kumpulan.sort((a, b) => Number.parseInt(a.seri, 10) - Number.parseInt(b.seri, 10));
        kumpulan.forEach((r, k) => { r.ked = pos + k; r.statusSeri = 'selesai'; });
        layak.splice(i, n, ...kumpulan);
      } else {
        kumpulan.forEach((r) => { r.statusSeri = 'belum'; });
        seriBelum.push(kumpulan.map((r) => r.kunci));
        if (pos <= 3) seriPingat = true;
      }
    }
    pos += n;
    i = j;
  }

  const tanpaKed = analisis.filter((r) => !layak.includes(r));
  const belumAda = tanpaKed.filter((r) => !r.status);
  const berstatus = tanpaKed
    .filter((r) => r.status)
    .sort((a, b) => URUTAN_STATUS.indexOf(a.status) - URUTAN_STATUS.indexOf(b.status) || a.indeks - b.indeks);
  return { baris: [...layak, ...belumAda, ...berstatus], bilSah: layak.length, seriBelum, seriPingat };
}

/**
 * Builds the keputusan array from the admin form rows. Rows are ranked automatically, so ked is never typed.
 * Row fields: pesertaId, bib, nama, rumahId, lorong, ahli (relay), catatan, cubaan, status, seri, tap.
 */
export function binaKeputusan(acara, baris) {
  const relay = acara.jenisAcara === 'berganti-ganti';
  return susunKeputusan(acara, baris).baris.map((b) => {
    const catatan = b.status ? '' : b.cubaanTerbaik.length && acara.jenis === 'padang' && b.cubaan?.some((c) => c.trim())
      ? `${b.nilai} m`
      : (b.catatan ?? '').trim();
    const entriBaru = {
      ked: b.ked,
      pesertaId: relay ? null : b.pesertaId || null,
      bib: relay ? '' : b.bib ?? '',
      nama: b.nama ?? '',
      rumahId: b.rumahId ?? '',
      catatan,
      nilai: b.status ? null : b.nilai,
    };
    if (Number.isInteger(b.lorong)) entriBaru.lorong = b.lorong;
    if (b.status) entriBaru.status = b.status;
    if (relay) entriBaru.ahli = (b.ahli ?? []).map((n) => n.trim());
    if (acara.jenis === 'padang' && b.cubaan?.some((c) => c.trim())) entriBaru.cubaan = b.cubaan.map((c) => c.trim());
    const seri = Number.parseInt(b.seri, 10);
    if (b.saizSeri > 1 && Number.isInteger(seri)) entriBaru.seri = seri;
    return entriBaru;
  });
}

/**
 * Checks the admin form rows. Returns an error message, or null when valid.
 * A draft only needs sensible input; with { umum: true } (announcing) it also needs 3 ranked finishers,
 * runner names for every relay finisher, and no unresolved tie for a medal place.
 */
export function semakKeputusan(acara, baris, { umum = false } = {}) {
  const relay = acara.jenisAcara === 'berganti-ganti';
  const kunci = baris.map((b) => (relay ? b.rumahId : b.pesertaId || `${b.nama}|${b.rumahId}`));
  if (baris.some((b) => (relay ? !b.rumahId : !b.pesertaId && !b.nama))) {
    return relay ? 'Sila pilih rumah sukan untuk setiap baris.' : 'Sila pilih peserta untuk setiap baris.';
  }
  if (new Set(kunci).size !== kunci.length) {
    return relay ? 'Setiap rumah sukan hanya boleh disenaraikan sekali.' : 'Seorang peserta tidak boleh disenaraikan dua kali.';
  }
  const s = susunKeputusan(acara, baris);
  if (s.baris.some((b) => b.tidakSah)) {
    return acara.jenis === 'padang'
      ? 'Ada catatan atau cubaan yang tidak sah (ditandakan merah). Guna cth. 3.62 m, atau X untuk cubaan gagal.'
      : 'Ada catatan yang tidak sah (ditandakan merah). Guna cth. 13.85, 13.85 s atau 1:05.3.';
  }
  if (relay) {
    const nama = (b) => (b.ahli ?? []).filter((n) => n.trim()).length;
    if (s.baris.some((b) => nama(b) !== 0 && nama(b) !== 4)) return 'Isi nama kesemua 4 pelari, atau biarkan kosong.';
    if (umum && s.baris.some((b) => b.ked !== null && nama(b) !== 4)) return 'Sila isi nama 4 pelari untuk setiap pasukan yang tamat.';
  }
  if (umum) {
    if (s.bilSah < 3) return 'Keputusan rasmi memerlukan sekurang-kurangnya 3 peserta yang tamat dengan catatan sah.';
    if (s.seriPingat) return 'Ada seri bagi tempat pingat yang belum diselesaikan. Tetapkan susunan seri dahulu.';
  }
  return null;
}

const nomborLorong = (teks) => {
  const n = Number.parseInt(String(teks ?? '').trim(), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
};

/**
 * Builds the senaraiMula array from the admin form rows, ordered by lorong (rows without one last).
 * Individual rows: { pesertaId, lorong }. Relay rows: { rumahId, ahli: [4 names] or blanks, lorong }.
 */
export function binaSenaraiMula(acara, baris, pesertaList, rumahList) {
  const peserta = Object.fromEntries(pesertaList.map((p) => [p.id, p]));
  const rumah = Object.fromEntries(rumahList.map((r) => [r.id, r]));
  const entriMula = baris.map((b) => {
    const lorong = nomborLorong(b.lorong);
    if (acara.jenisAcara === 'berganti-ganti') {
      const ahli = (b.ahli ?? []).map((n) => n.trim());
      return {
        lorong, pesertaId: null, bib: '', nama: rumah[b.rumahId]?.nama ?? '', rumahId: b.rumahId,
        ...(ahli.some(Boolean) ? { ahli } : {}),
      };
    }
    const p = peserta[b.pesertaId];
    return { lorong, pesertaId: b.pesertaId, bib: p?.bib ?? '', nama: p?.nama ?? '', rumahId: p?.rumahId ?? '' };
  });
  return entriMula
    .map((e, i) => [e, i])
    .sort(([a, i], [b, j]) => (a.lorong ?? Infinity) - (b.lorong ?? Infinity) || i - j)
    .map(([e]) => e);
}

/** Checks the start list rows before saving. Returns an error message, or null when valid. */
export function semakSenaraiMula(acara, baris) {
  const relay = acara.jenisAcara === 'berganti-ganti';
  const kunci = baris.map((b) => (relay ? b.rumahId : b.pesertaId));
  if (kunci.some((k) => !k)) return relay ? 'Sila pilih rumah sukan untuk setiap baris.' : 'Sila pilih peserta untuk setiap baris.';
  if (new Set(kunci).size !== kunci.length) {
    return relay ? 'Setiap rumah sukan hanya boleh disenaraikan sekali.' : 'Seorang peserta tidak boleh disenaraikan dua kali.';
  }
  if (relay) {
    const bilNama = baris.map((b) => (b.ahli ?? []).filter((n) => n.trim()).length);
    if (bilNama.some((n) => n !== 0 && n !== 4)) return 'Isi nama kesemua 4 pelari, atau biarkan kosong.';
  }
  const lorong = baris.map((b) => String(b.lorong ?? '').trim()).filter(Boolean);
  if (lorong.some((l) => !/^\d{1,2}$/.test(l) || Number(l) < 1)) return 'Lorong mesti nombor 1 hingga 99.';
  if (new Set(lorong).size !== lorong.length) return 'Setiap lorong hanya boleh digunakan sekali.';
  return null;
}

/**
 * Converts an old `keputusan` document (tempat1-3, atlet1-3, catatan1-3) into the fields
 * of a perlumbaan document: { keputusan, status: 'rasmi' }.
 */
export function tukarKeputusanLama(lama, rumahList) {
  const acara = ACARA.find((a) => a.id === lama.acaraId);
  const rumah = Object.fromEntries(rumahList.map((r) => [r.id, r]));
  const keputusan = [1, 2, 3]
    .filter((n) => lama[`tempat${n}`])
    .map((n) => {
      const rumahId = lama[`tempat${n}`];
      const atlet = (lama[`atlet${n}`] ?? '').trim();
      const catatan = (lama[`catatan${n}`] ?? '').trim();
      const relay = acara?.jenisAcara === 'berganti-ganti';
      const namaRumah = rumah[rumahId]?.nama ?? rumahId;
      return {
        ked: n,
        pesertaId: null,
        bib: '',
        nama: relay ? namaRumah : atlet || namaRumah,
        rumahId,
        catatan,
        nilai: parseCatatan(catatan),
        ...(relay && atlet ? { ahli: atlet.split(',').map((s) => s.trim()).filter(Boolean) } : {}),
      };
    });
  return { keputusan, status: 'rasmi' };
}
