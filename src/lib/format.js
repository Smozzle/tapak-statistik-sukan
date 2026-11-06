// Display helpers shared by the public and admin pages.

/** "0750" -> "07:50". Anything else is shown as typed, or "—" when empty. */
export const masaPapar = (masa) => (/^\d{4}$/.test(masa ?? '') ? `${masa.slice(0, 2)}:${masa.slice(2)}` : masa || '—');

/** "2026-11-05" -> "5 Nov". Empty when there is no valid date. */
export function tarikhPendek(tarikh) {
  if (!tarikh) return '';
  const d = new Date(`${tarikh}T00:00:00`);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' });
}

/** Sorts race numbers ("101", "205") in numeric order. */
export const bandingNo = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true });

/** Column title for the result of an acara: Masa for track events, Jarak for field events. */
export const labelNilai = (acara) => (acara.unit === 'saat' ? 'Masa' : 'Jarak');

/** Looks up rumah sukan by id. */
export const petaRumah = (rumahList) => Object.fromEntries(rumahList.map((r) => [r.id, r]));
