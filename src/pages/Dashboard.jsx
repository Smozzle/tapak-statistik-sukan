import { Link } from 'react-router-dom';
import { useKeputusan, useRumahSukan } from '../hooks/useData.js';
import { susunKedudukan } from '../lib/stats.js';
import { ACARA, SEMUA_PERLUMBAAN } from '../lib/constants.js';
import { PingatBox } from '../components/Pingat.jsx';
import { IconArrowRight } from '../components/Icons.jsx';
import { onColor, tintOf } from '../lib/colour.js';

export default function Dashboard() {
  const rumah = useRumahSukan();
  const keputusan = useKeputusan();
  const loading = rumah.loading || keputusan.loading;
  const kedudukan = susunKedudukan(rumah.data, keputusan.data);
  const jumlahPerlumbaan = SEMUA_PERLUMBAAN.length;
  const selesai = keputusan.data.length;

  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex max-w-xl flex-col gap-2">
          <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-hijau">
            Kejohanan Olahraga Tahunan
          </span>
          <h1 className="m-0 font-display text-4xl font-semibold leading-tight">Kedudukan rumah sukan</h1>
          <p className="m-0 leading-relaxed text-muted">
            Klik pada rumah sukan untuk melihat senarai acara dan pingat yang dimenangi.
          </p>
        </div>
        <div className="grid min-w-[300px] grid-cols-3 gap-3">
          <Stat value={ACARA.length} label="Acara" />
          <Stat value={jumlahPerlumbaan * 3} label="Pingat" />
          <Stat value={`${selesai}/${jumlahPerlumbaan}`} label="Keputusan" />
        </div>
      </section>

      {(rumah.error || keputusan.error) && (
        <p role="alert" className="text-red-700">Tidak dapat memuatkan data. Sila cuba lagi.</p>
      )}

      {loading ? (
        <p className="text-muted">Memuatkan…</p>
      ) : kedudukan.length === 0 ? (
        <div className="card p-6 text-muted">
          Belum ada rumah sukan. Admin boleh menyediakannya di halaman <strong>Rumah sukan</strong>.
        </div>
      ) : (
        <section className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
          {kedudukan.map((r) => (
            <RumahCard key={r.id} rumah={r} />
          ))}
        </section>
      )}

      <p className="m-0 text-sm leading-relaxed text-muted">
        Kedudukan ditentukan oleh bilangan pingat Emas, diikuti Perak dan Gangsa. Setiap acara dipertandingkan
        dalam kategori Lelaki dan Perempuan.
      </p>
    </>
  );
}

function Stat({ value, label }) {
  return (
    <div className="card flex flex-col gap-0.5 px-[18px] py-3.5">
      <span className="font-display text-[28px] font-semibold">{value}</span>
      <span className="text-[13px] text-muted">{label}</span>
    </div>
  );
}

function RumahCard({ rumah }) {
  const { pingat } = rumah;
  return (
    <Link
      to={`/rumah/${rumah.id}`}
      className="flex flex-col overflow-hidden rounded-[18px] border border-line bg-white text-ink no-underline transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hijau"
    >
      <div className="h-3" style={{ background: rumah.warna }} />
      <div className="flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-2">
            <span
              className="self-start rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ background: tintOf(rumah.warna), color: '#14213D' }}
            >
              Tempat {rumah.kedudukan}
            </span>
            <span className="font-display text-[26px] font-semibold">{rumah.nama}</span>
          </div>
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full font-display text-2xl font-bold"
            style={{ background: rumah.warna, color: onColor(rumah.warna) }}
            aria-hidden="true"
          >
            {rumah.kedudukan}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <PingatBox jenis="emas" jumlah={pingat.emas} />
          <PingatBox jenis="perak" jumlah={pingat.perak} />
          <PingatBox jenis="gangsa" jumlah={pingat.gangsa} />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-4">
          <span className="text-sm text-muted">{pingat.jumlah} pingat keseluruhan</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-hijau">
            Lihat statistik <IconArrowRight />
          </span>
        </div>
      </div>
    </Link>
  );
}
