import { JENIS_SUKAN } from '../lib/constants.js';

const STYLE = {
  emas: 'bg-emas-bg text-emas-fg',
  perak: 'bg-perak-bg text-perak-fg',
  gangsa: 'bg-gangsa-bg text-gangsa-fg',
};
const DOT = { emas: 'bg-emas-dot', perak: 'bg-perak-dot', gangsa: 'bg-gangsa-dot' };
const NAMA = { emas: 'Emas', perak: 'Perak', gangsa: 'Gangsa' };

/** Coloured dot used before a pingat name. */
export function PingatDot({ jenis, className = 'h-3 w-3' }) {
  return <span className={`inline-block shrink-0 rounded-full ${DOT[jenis]} ${className}`} aria-hidden="true" />;
}

/** Pill showing a pingat, e.g. "● Emas". */
export function PingatChip({ jenis }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full py-1 pl-2 pr-3 text-[13px] font-semibold ${STYLE[jenis]}`}>
      <PingatDot jenis={jenis} className="h-3.5 w-3.5" />
      {NAMA[jenis]}
    </span>
  );
}

/** Box with a pingat label and a large count. */
export function PingatBox({ jenis, jumlah, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 rounded-xl px-3.5 py-3 ${STYLE[jenis]} ${className}`}>
      <span className="flex items-center gap-1.5 text-[13px] font-semibold">
        <PingatDot jenis={jenis} />
        {NAMA[jenis]}
      </span>
      <span className="font-display text-3xl font-semibold text-ink">{jumlah}</span>
    </div>
  );
}

/** Small pill for balapan / padang. */
export function JenisChip({ jenis }) {
  const j = JENIS_SUKAN[jenis];
  return (
    <span className="inline-block rounded-full px-2.5 py-1 text-[13px] font-semibold" style={{ background: j.bg, color: j.fg }}>
      {j.nama}
    </span>
  );
}
