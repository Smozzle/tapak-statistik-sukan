import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import Susunan from './pages/Susunan.jsx';
import Keputusan from './pages/Keputusan.jsx';
import SenaraiMula from './pages/SenaraiMula.jsx';
import Pingat from './pages/Pingat.jsx';
import Peserta from './pages/Peserta.jsx';
import PesertaDetail from './pages/PesertaDetail.jsx';
import Rekod from './pages/Rekod.jsx';
import Statistik from './pages/Statistik.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminSusunan from './pages/admin/AdminSusunan.jsx';
import AdminKeputusan from './pages/admin/AdminKeputusan.jsx';
import AdminSenaraiMula from './pages/admin/AdminSenaraiMula.jsx';
import AdminPeserta from './pages/admin/AdminPeserta.jsx';
import AdminRekod from './pages/admin/AdminRekod.jsx';
import AdminRumah from './pages/admin/AdminRumah.jsx';
import AdminSijil from './pages/admin/AdminSijil.jsx';
import AdminPentadbir from './pages/admin/AdminPentadbir.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Susunan />} />
        <Route path="keputusan/:perlumbaanId" element={<Keputusan />} />
        <Route path="senarai-mula/:perlumbaanId" element={<SenaraiMula />} />
        <Route path="pingat" element={<Pingat />} />
        <Route path="peserta" element={<Peserta />} />
        <Route path="peserta/:pesertaId" element={<PesertaDetail />} />
        <Route path="rekod" element={<Rekod />} />
        <Route path="rumah/:rumahId" element={<Statistik />} />

        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* Admin pages have their own frame (menu, Log keluar) and are protected as a group. */}
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/susunan" replace />} />
        <Route path="susunan" element={<AdminSusunan />} />
        <Route path="senarai-mula/:perlumbaanId" element={<AdminSenaraiMula />} />
        <Route path="keputusan/:perlumbaanId" element={<AdminKeputusan />} />
        <Route path="peserta" element={<AdminPeserta />} />
        <Route path="rekod" element={<AdminRekod />} />
        <Route path="rumah" element={<AdminRumah />} />
        <Route path="sijil" element={<AdminSijil />} />
        <Route path="pentadbir" element={<AdminPentadbir />} />
      </Route>
    </Routes>
  );
}
