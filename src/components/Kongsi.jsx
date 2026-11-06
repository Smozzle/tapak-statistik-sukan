import { STATUS } from '../lib/constants.js';
import { onColor } from '../lib/colour.js';

// Small pieces reused across the results pages.

const GAYA_STATUS = {
  rasmi: 'bg-[#E6F2E8] text-[#1E6B34]',
  berlangsung: 'bg-emas-bg text-emas-fg',
  belum: 'bg-perak-bg text-perak-fg',
};

export function StatusChip({ status }) {
  const s = STATUS[status] ? status : 'belum';
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-semibold ${GAYA_STATUS[s]}`}>
      {s === 'berlangsung' && <span className="h-2 w-2 rounded-full bg-emas-dot motion-safe:animate-pulse" aria-hidden="true" />}
      {STATUS[s].nama}
    </span>
  );
}

const GAYA_KATEGORI = {
  lelaki: { bg: '#E3EEF9', fg: '#1B4F8A', nama: 'Lelaki' },
  perempuan: { bg: '#FBE7F0', fg: '#A0245F', nama: 'Perempuan' },
};

export function KategoriChip({ kategori }) {
  const k = GAYA_KATEGORI[kategori];
  if (!k) return null;
  return (
    <span className="inline-block rounded-full px-2.5 py-1 text-[13px] font-semibold" style={{ background: k.bg, color: k.fg }}>
      {k.nama}
    </span>
  );
}

/** Round colour swatch for a rumah sukan. */
export function RumahDot({ warna, className = 'h-3 w-3' }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full border border-black/10 ${className}`}
      style={{ background: warna ?? '#C9D2C0' }}
      aria-hidden="true"
    />
  );
}

/** Rumah colour dot followed by its name. Falls back to the raw id for a rumah that no longer exists. */
export function NamaRumah({ rumah, rumahId }) {
  return (
    <span className="inline-flex items-center gap-2">
      <RumahDot warna={rumah?.warna} />
      {rumah?.nama ?? rumahId ?? '—'}
    </span>
  );
}

/** Rank number in a circle filled with the rumah colour. */
export function RankCircle({ n, warna, className = 'h-8 w-8 text-sm' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold ${className}`}
      style={{ background: warna ?? '#14213D', color: onColor(warna ?? '#14213D') }}
    >
      {n}
    </span>
  );
}

/** "Rekod kejohanan" box shown on the start list and results pages. */
export function KotakRekod({ rekod, rumahById }) {
  return (
    <div className="w-full rounded-xl bg-ground px-4 py-3 sm:w-auto sm:min-w-[240px]">
      <span className="label">Rekod kejohanan</span>
      {rekod ? (
        <div className="mt-1 flex flex-col gap-0.5">
          <span className="font-display text-2xl font-semibold">{rekod.catatan}</span>
          <span className="text-sm">{rekod.nama}</span>
          <span className="flex items-center gap-2 text-sm text-muted">
            <RumahDot warna={rumahById[rekod.rumahId]?.warna} />
            {rumahById[rekod.rumahId]?.nama ?? rekod.rumahId}
            {rekod.tahun && ` · ${rekod.tahun}`}
          </span>
        </div>
      ) : (
        <p className="m-0 mt-1 text-sm text-muted">Belum ada rekod</p>
      )}
    </div>
  );
}

export function RekodBadge() {
  return (
    <span className="inline-block whitespace-nowrap rounded-full bg-kuning px-2.5 py-0.5 text-xs font-bold text-ink">
      Rekod baharu!
    </span>
  );
}

export function Memuatkan() {
  return <p className="text-muted">Memuatkan…</p>;
}

export function RalatMuat() {
  return <p role="alert" className="text-red-700">Tidak dapat memuatkan data. Sila cuba lagi.</p>;
}
