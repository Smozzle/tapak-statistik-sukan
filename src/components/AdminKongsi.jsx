// Small pieces shared by the admin pages.

export function AdminTajuk({ tajuk, huraian }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-hijau">Admin</span>
      <h1 className="m-0 font-display text-4xl font-semibold">{tajuk}</h1>
      {huraian && <p className="m-0 text-muted">{huraian}</p>}
    </div>
  );
}

/** Success or error message: { jenis: 'ok' | 'ralat', teks }. */
export function Mesej({ mesej }) {
  if (!mesej) return null;
  return (
    <p
      role={mesej.jenis === 'ralat' ? 'alert' : 'status'}
      className={`m-0 text-sm ${mesej.jenis === 'ralat' ? 'text-red-700' : 'text-hijau'}`}
    >
      {mesej.teks}
    </p>
  );
}
