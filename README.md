# Tapak Statistik Sukan — SK Lodung, Kudat

A results site for the school sports carnival (Kejohanan Olahraga). The dashboard ranks the 3 rumah sukan by pingat. Clicking a rumah sukan shows every acara in both kategori, with the pingat won. Admins enter results, and every open page updates straight away.

Built with React, Vite and Tailwind CSS on Firebase (Firestore and Authentication).

## Pages

| Address | Who | What it shows |
| --- | --- | --- |
| `/` | Everyone | Dashboard: 3 rumah sukan ranked by Emas, then Perak, then Gangsa |
| `/rumah/:id` | Everyone | Statistik for one rumah sukan, filterable by jenis sukan and kategori |
| `/admin/login` | Urus setia | Email and password login |
| `/admin` | Admins | Enter, edit or delete the 1st, 2nd and 3rd placings for each race |
| `/admin/rumah` | Admins | Set up the rumah sukan and change their names and colours |

## Run it on your computer

You need Node.js 18 or newer.

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173.

To preview with sample data before Firebase is set up, set `VITE_DEMO=true` in `.env`.

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

Only users listed in `admins` can change data. Everyone else can only read.

### First use

1. Log in at `/admin/login`.
2. Open **Rumah sukan** and click **Sediakan rumah sukan**. This creates Rumah Merah, Rumah Biru and Rumah Kuning.
3. Rename them and pick their colours.
4. Open **Keputusan** and enter results as each race finishes.

## Data in Firestore

| Collection | Document ID | Fields |
| --- | --- | --- |
| `rumahSukan` | `merah`, `biru`, `kuning` | `nama`, `warna` (hex colour), `urutan` |
| `keputusan` | `<acara>_<kategori>`, e.g. `100m_lelaki` | `acaraId`, `kategori`, `tempat1`, `tempat2`, `tempat3` (rumah IDs), `catatan1`–`catatan3` (time or distance, optional), `dikemaskini` |
| `admins` | Firebase user UID | anything |

The acara and kategori are fixed in `src/lib/constants.js`: 8 acara × Lelaki/Perempuan = 16 races, 48 pingat. Medal totals are never stored. They are counted from `keputusan`, so they can't go out of sync.

## Put it online

```bash
npm run build
firebase deploy --only hosting
```

The site is then live at `https://<your-project>.web.app`.

## Project layout

```
src/
  pages/            Dashboard, Statistik, admin pages
  components/       Layout (header/footer), pingat chips, route guard
  hooks/useData.js  Live Firestore data and admin check
  lib/constants.js  Acara, kategori, pingat, placeholder rumah sukan
  lib/stats.js      Medal counting, ranking, result validation
  lib/stats.test.js Tests for the above (npm test)
firestore.rules     Who can read and write
```
