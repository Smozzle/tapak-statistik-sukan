import { ACARA, KATEGORI, PINGAT, SEMUA_PERLUMBAAN } from './constants.js';

// A keputusan document looks like:
// { acaraId, kategori, tempat1: rumahId, tempat2: rumahId, tempat3: rumahId,
//   catatan1?, catatan2?, catatan3? }

/** Placing (1-3) of a rumah in one result, or null if it did not place. */
export function kedudukanRumah(keputusan, rumahId) {
  for (const n of [1, 2, 3]) {
    if (keputusan[`tempat${n}`] === rumahId) return n;
  }
  return null;
}

/** Emas/Perak/Gangsa totals for each rumah sukan. */
export function kiraPingat(rumahList, keputusanList) {
  const totals = Object.fromEntries(
    rumahList.map((r) => [r.id, { emas: 0, perak: 0, gangsa: 0, jumlah: 0 }]),
  );
  for (const k of keputusanList) {
    for (const n of [1, 2, 3]) {
      const t = totals[k[`tempat${n}`]];
      if (!t) continue;
      t[PINGAT[n].id] += 1;
      t.jumlah += 1;
    }
  }
  return totals;
}

/**
 * Rumah sukan sorted by medal count: most Emas first, then Perak, then Gangsa.
 * Rumah with identical counts share the same kedudukan.
 */
export function susunKedudukan(rumahList, keputusanList) {
  const totals = kiraPingat(rumahList, keputusanList);
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

/**
 * One row per race (acara x kategori) for a rumah's statistik page.
 * status: 'pingat' (placed 1-3), 'tiada' (result in, did not place), 'belum' (no result yet).
 */
export function barisStatistik(rumahId, keputusanList) {
  const byId = Object.fromEntries(keputusanList.map((k) => [k.id, k]));
  return SEMUA_PERLUMBAAN.map(({ acara, kategori, id }) => {
    const k = byId[id];
    if (!k) return { id, acara, kategori, status: 'belum', kedudukan: null, pingat: null, catatan: '' };
    const kedudukan = kedudukanRumah(k, rumahId);
    if (!kedudukan) return { id, acara, kategori, status: 'tiada', kedudukan: null, pingat: null, catatan: '' };
    return {
      id,
      acara,
      kategori,
      status: 'pingat',
      kedudukan,
      pingat: PINGAT[kedudukan],
      catatan: k[`catatan${kedudukan}`] || '',
    };
  });
}

/** Checks a result before saving. Returns an error message, or null when valid. */
export function semakKeputusan({ acaraId, kategori, tempat1, tempat2, tempat3 }) {
  if (!ACARA.some((a) => a.id === acaraId)) return 'Sila pilih acara.';
  if (!KATEGORI.some((k) => k.id === kategori)) return 'Sila pilih kategori.';
  const tempat = [tempat1, tempat2, tempat3];
  if (tempat.some((t) => !t)) return 'Sila pilih rumah sukan untuk tempat 1, 2 dan 3.';
  if (new Set(tempat).size !== 3) return 'Setiap tempat mesti rumah sukan yang berbeza.';
  return null;
}
