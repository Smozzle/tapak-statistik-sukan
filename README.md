# Tapak Statistik Sukan — SK Lodung, Kudat

A results site for the school sports carnival (Kejohanan Olahraga Tahunan). The home page is the timetable of races by day. Every race has its own results page, and the 3 rumah sukan are ranked by pingat. Admins enter results, and every open page updates straight away.

Built with React, Vite and Tailwind CSS on Firebase (Firestore and Authentication).

## Pages

| Address | Who | What it shows |
| --- | --- | --- |
| `/` | Everyone | **Susunan & Keputusan**: current rumah ranking, and the timetable by day with status and the Emas winner |
| `/senarai-mula/:id` | Everyone | Start list of one race: lorong (or giliran), bib, nama and rumah of each entered athlete |
| `/keputusan/:id` | Everyone | Full results of one race: top 3, full ranking, carnival record, print / PDF |
| `/pingat` | Everyone | **Jadual pingat**: rumah ranking (all, Lelaki or Perempuan) and the latest results |
| `/rumah/:id` | Everyone | One rumah's race-by-race statistik, filterable by jenis sukan and kategori |
| `/peserta` | Everyone | Search athletes by name or bib; filter by rumah and kategori |
| `/peserta/:id` | Everyone | One athlete's races, placings, catatan and medals |
| `/rekod` | Everyone | Carnival records, and the records broken so far |
| `/admin/login` | Urus setia | Email and password login |
| `/admin/susunan` | Admins | Generate the timetable; edit no, hari, tarikh, masa and status; convert old results |
| `/admin/senarai-mula/:id` | Admins | Enter athletes (or relay teams) into a race and give them a lorong |
| `/admin/keputusan/:id` | Admins | Enter finishers in order, starting from the start list; save a draft or announce the official result |
| `/admin/peserta` | Admins | Add, edit and delete athletes; CSV import |
| `/admin/rekod` | Admins | Set the record for each acara and kategori |
| `/admin/rumah` | Admins | Set up the rumah sukan and change their names and colours |
| `/admin/sijil` | Admins | Print certificates (winners or participation) for official races, all at once or one at a time |
| `/admin/pentadbir` | Admins | Approve or reject admin sign-up requests, and remove admins |

Only races with status `rasmi` count towards pingat, rankings and record checks.

## Run it on your computer

You need Node.js 18 or newer.

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173.

To preview with sample data before Firebase is set up, set `VITE_DEMO=true` in `.env`. The demo has 5 official races, 1 in progress and the rest not started on Hari 1, plus sample athletes and records. Admin pages need a real Firebase project.

Other commands: `npm test` runs the unit tests, `npm run build` makes the production build.

## Connect Firebase

1. Create a project at https://console.firebase.google.com.
2. **Firestore Database**: create a database in production mode.
3. **Authentication > Sign-in method**: turn on **Email/Password**.
4. **Project settings > Your apps**: add a **Web app** and copy its config values into `.env`.
5. Publish the security rules from `firestore.rules`. Either paste them into **Firestore > Rules**, or use the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add          # pick your project
   firebase deploy --only firestore:rules
   ```

### Add an admin

1. **Authentication > Users > Add user**: create the urus setia account (email and password).
2. Copy that user's **User UID**.
3. **Firestore > Start collection** named `admins`. Use the UID as the **Document ID**. Add any field, for example `nama: "Cikgu Ali"`.

**Sign-up with approval:** anyone can use **Daftar akaun admin** on `/admin/login` to create an account. This only saves a request in `permohonanAdmin`, and the account sees *Menunggu kelulusan* until an admin opens **Pentadbir** and clicks **Luluskan**. The page then opens by itself. The first admin must still be added by hand as above.

Only users listed in `admins` can change data. Everyone else can only read. The admin menu in the header appears only for users listed in `admins`.

### First use

1. Log in at `/admin/login`.
2. **Rumah sukan**: click **Sediakan rumah sukan** (creates Rumah Merah, Biru and Kuning), then rename them and pick their colours.
3. **Susunan**: click **Jana susunan** to create the 16 races. Hari 1 is 101–108 (50M, 100M, 200M and Lompat Jauh, Lelaki then Perempuan) and Hari 2 is 201–208. Then set the dates and times.
4. **Peserta**: add the athletes, or import a CSV (below).
5. **Rekod**: enter the existing carnival records.
6. **Susunan > Peserta** (per race): enter the athletes who compete, with an optional lorong. "Tambah semua peserta" adds every athlete of that kategori at once. The public home table's **Peserta** button opens this start list once it has names.
7. As each race finishes, open **Susunan > Keputusan** for that race. There is one row per athlete in the start list. You only type each athlete's time or distance. Places are worked out and sorted for you (see below), then click **Umumkan keputusan rasmi**. Set a race to *Sedang berlangsung* on the Susunan page while it is running.

### Entering results

- **Catatan:** type `13.5`, `13.50`, `13.50 s`, `1:05.3` (= 65.3 s) or `3.62 m`. Anything else is marked red and blocks saving.
- **Ranking:** track events rank the lowest time first, field events the longest distance first. The ked is never typed. Ranks update as you type; the list re-orders when you leave the field, so a row never jumps while you type.
- **Seri (tie):** equal results share a ked (shown as `2=`) with an amber *Seri* warning. Give each tied athlete a different number in the *Seri* box to decide the order. In field events a tie is first broken by the next best attempt.
- **TT / TH / DQ:** tidak tamat (DNF), tidak hadir (DNS) and dibatalkan kelayakan (DQ). These rows have no ked, sit at the bottom, and never get a pingat.
- **3 cubaan:** for field events, *Guna 3 cubaan* shows three attempt boxes. The best is the result. Type `X` or `-` for a failed attempt.
- **Extra athlete:** add someone who is not in the start list by typing their bib.
- **Mod garisan penamat:** big buttons for use on a phone. Tap each athlete as they cross the line, and the places follow the tap order. For track events you can press *Mula* at the gun, and each tap records the elapsed time as that athlete's catatan. *Buat asal* undoes the last tap.
- **Announcing:** *Umumkan keputusan rasmi* first shows the top 3 and any new record. It is blocked with fewer than 3 ranked finishers, an unresolved tie for a medal place, or invalid input. A tie for 4th place or lower is allowed.

### Certificates

Open **Sijil** (or the **Sijil** button beside **Keputusan** on **Susunan**, for official races). Certificates are filled in automatically from official results only:

- **Pemenang:** ked 1–3 (gold, silver or bronze border). **Penyertaan:** everyone else, with a green border. TT is included, TH is skipped.
- A relay team gets one certificate for each runner in `ahli` (or the team name if no runners were entered).
- Filter by race and type (kept in the address, e.g. `?perlumbaan=100m_lelaki&jenis=penyertaan`) and search by name or bib.
- **Cetak N sijil** prints everything shown, one A4 landscape page each. The **Cetak** button on a row prints only that certificate. Choose *Save as PDF* in the print dialog if you want a file.
- The carnival name, venue and logo come from `KEJOHANAN_LALAI` in `src/components/CetakKeputusan.jsx`. The date comes from the race.

### Convert results from the old version

If you entered results before this version (the `keputusan` collection), open **Susunan** and click **Tukar keputusan lama** once. Each old result becomes an official result in its race. Races that already have results are skipped, and the old documents are not deleted, so you can check them and remove the `keputusan` collection (and its block in `firestore.rules`) yourself afterwards.

Converted individual results have no athlete attached, only the name that was typed. Open the race in **Keputusan** and pick the real athlete if you want it linked to their page.

### CSV import

On **Peserta**, paste or upload a file with one athlete per line:

```
bib,nama,rumah,kategori
12,Aiman bin Rahim,Rumah Merah,Lelaki
7,Nurul Aina binti Salleh,biru,P
```

Rumah is the name or ID of a rumah sukan. Kategori is Lelaki or Perempuan (or L / P). Commas, semicolons and tabs all work. Click **Semak** to preview, then **Import**. A bib that already exists is updated instead of duplicated.

## Data in Firestore

| Collection | Document ID | Fields |
| --- | --- | --- |
| `rumahSukan` | `merah`, `biru`, `kuning` | `nama`, `warna` (hex colour), `urutan` |
| `perlumbaan` | `<acara>_<kategori>`, e.g. `100m_lelaki` | `no` ("103"), `acaraId`, `kategori`, `hari` (1 or 2), `tarikh` ("YYYY-MM-DD" or null), `masa` ("0750"), `peringkat` (`akhir` or `saringan`), `status` (`belum`, `berlangsung`, `rasmi`), `senaraiMula`, `keputusan`, `dikemaskini` |
| `peserta` | auto | `bib`, `nama`, `rumahId`, `kategori` |
| `rekod` | `<acara>_<kategori>` | `catatan` ("13.85 s"), `nilai` (number), `nama`, `rumahId`, `tahun` |
| `admins` | Firebase user UID | `nama`, `email`, `ditambah`, `ditambahOleh` (set when approved; the first admin can have any fields) |
| `permohonanAdmin` | Firebase user UID | `nama`, `email`, `dibuat`. A pending admin request; deleted when approved or rejected |
| `keputusan` | old format, read-only | `acaraId`, `kategori`, `tempat1`–`3`, `catatan1`–`3`, `atlet1`–`3`. Only used by the one-time conversion |

Each entry in `perlumbaan.senaraiMula` (the start list) is `{ lorong, pesertaId, bib, nama, rumahId, ahli? }`, sorted by `lorong` (`null` when none was given). Relays have one entry per rumah, with `pesertaId` `null` and the 4 runners in `ahli` if known. Editing the start list does not change `dikemaskini`, so it never affects "Keputusan terkini".

Each entry in `perlumbaan.keputusan` is `{ ked, pesertaId, bib, nama, rumahId, catatan, nilai, lorong?, ahli?, status?, cubaan?, seri? }`:

- `ked` is the finishing position, worked out by the admin page. Entries with `ked` 1, 2 and 3 win Emas, Perak and Gangsa. A rumah can win more than one medal in a race. Equal results can share a `ked`.
- `status` is `TT`, `TH` or `DQ`. These entries have `ked: null` and `nilai: null` and never count towards pingat, rumah rows or records.
- `cubaan` holds the three attempts as typed (field events, optional). `seri` is the tie-break order.
- `catatan` is the text shown ("13.85 s", "3.62 m"). `nilai` is the same as a number (seconds or metres), used for sorting and record checks. It is worked out from `catatan` when you save.
- `bib` and `nama` are copied from the athlete when the result is saved, so a result stays correct if the athlete is later edited or deleted.
- Relays have one entry per rumah: `nama` is the rumah name and `ahli` lists the 4 runners (`pesertaId` is `null`).

A record is broken when a result in an official race has a lower `nilai` than the record (balapan) or a higher one (padang).

The acara and kategori are fixed in `src/lib/constants.js`: 8 acara × Lelaki/Perempuan = 16 races. Medal totals are never stored. They are counted from `perlumbaan`, so they can't go out of sync.

## Put it online

```bash
npm run build
firebase deploy --only hosting
```

When `firestore.rules` changed, deploy the rules too: `npm run build && firebase deploy --only hosting,firestore:rules`.

The site is then live at `https://<your-project>.web.app`.

The athlete list (`peserta`) is publicly readable, so names and bib numbers of pupils are visible to anyone with the link. Check that the school is comfortable with that before going live.

## Project layout

```
src/
  pages/            Public pages (Susunan, Keputusan, Pingat, Peserta, Rekod, Statistik)
  pages/admin/      Admin pages (Susunan, Keputusan, Peserta, Rekod, Rumah, Login)
  components/       Layout (header, menu, footer), shared chips, route guard
  hooks/useData.js  Live Firestore data and admin check
  lib/constants.js  Acara, kategori, status, default timetable, placeholder rumah sukan
  lib/stats.js      Medal counting, ranking, records, result validation, old-data conversion
  lib/csv.js        CSV import parsing
  lib/format.js     Time, date and sorting helpers
  lib/demo.js       Sample data for VITE_DEMO=true
  lib/*.test.js     Unit tests (npm test)
firestore.rules     Who can read and write
```
