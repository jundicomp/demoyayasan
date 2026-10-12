import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './components/auth/LoginScreen';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import DashboardSpp from './pages/spp/DashboardSpp';
import Pembayaran from './pages/spp/Pembayaran';
import DataSiswaSheets from './pages/pengaturan/DataSiswaSheets';
import DataKelas from './pages/pengaturan/DataKelas';
import DataGuru from './pages/pengaturan/DataGuru';
import ProfilSekolahDanTahunAjaran from './pages/pengaturan/ProfilSekolahDanTahunAjaran';
import ManajemenUser from './pages/pengaturan/ManajemenUser';
import ManajemenHakAkses from './pages/pengaturan/ManajemenHakAkses';
import KoneksiSheets from './pages/pengaturan/KoneksiSheets';
import PengaturanSistem from './pages/pengaturan/PengaturanSistem';
import LogHistori from './pages/pengaturan/LogHistori';
import ProfilSaya from './pages/pengaturan/ProfilSaya';
import ChangelogPage from './pages/pengaturan/ChangelogPage';
import TagihanBiaya from './pages/keuangan/TagihanBiaya';
import CekDataSistem from './pages/keuangan/CekDataSistem';
import PemasukanPengeluaran from './pages/keuangan/PemasukanPengeluaran';
import BeasiswaPage from './pages/keuangan/BeasiswaPage';
import RekapTunggakan from './pages/keuangan/RekapTunggakan';
import LaporanKeuangan from './pages/keuangan/LaporanKeuangan';
import ComingSoon from './pages/ComingSoon';
import DashboardYayasan from './pages/yayasan/DashboardYayasan';
import ProfilYayasan from './pages/yayasan/ProfilYayasan';
import PilihUnit from './pages/yayasan/PilihUnit';
import { isModeYayasan } from './services/unitAktif';
import { BrandSync } from './components/brand/SchoolBrand';

const PLACEHOLDER_PAGES = [];

function Gate() {
  const { currentUser } = useAuth();
  if (!currentUser) return <LoginScreen />;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/dashboard-yayasan" element={<DashboardYayasan />} />
        <Route path="/profil-yayasan" element={<ProfilYayasan />} />
        <Route path="/pilih-unit/:unitId" element={<PilihUnit />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard-spp" element={<DashboardSpp />} />
        <Route path="/spp" element={<Navigate to="/pembayaran" replace />} />
        <Route path="/siswa" element={<DataSiswaSheets />} />
        <Route path="/kelas" element={<DataKelas />} />
        <Route path="/guru" element={<DataGuru />} />
        <Route path="/profil" element={<ProfilSekolahDanTahunAjaran />} />
        <Route path="/manajemen-user" element={<ManajemenUser />} />
        <Route path="/hakakses" element={<ManajemenHakAkses />} />
        <Route path="/koneksi-sheets" element={<KoneksiSheets />} />
        <Route path="/pengaturan-sistem" element={<PengaturanSistem />} />
        <Route path="/log-histori" element={<LogHistori />} />
        <Route path="/profil-saya" element={<ProfilSaya />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/tagihan" element={<TagihanBiaya />} />
        <Route path="/bersihkan-duplikat" element={<CekDataSistem />} />
        <Route path="/pembayaran" element={<Pembayaran />} />
        <Route path="/pemasukan-pengeluaran" element={<PemasukanPengeluaran />} />
        <Route path="/beasiswa" element={<BeasiswaPage />} />
        <Route path="/tunggakan" element={<RekapTunggakan />} />
        <Route path="/laporan-keuangan" element={<LaporanKeuangan />} />
        {PLACEHOLDER_PAGES.map(p => (
          <Route key={p.path} path={p.path} element={<ComingSoon pageId={p.pageId} title={p.title} path={p.menu} />} />
        ))}
        <Route path="*" element={<Navigate to={isModeYayasan() ? '/dashboard-yayasan' : '/dashboard'} replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <BrandSync />
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </AppProvider>
    </HashRouter>
  );
}
