import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppContext';
import pkg from '../../../package.json';
import { LogoBawaan, namaSekolahAtauDefault } from '../brand/SchoolBrand';
import { UNITS, isUnitSekolah } from '../../config/units';
import { isModeYayasan } from '../../services/unitAktif';

const Arrow = () => (
  <svg className="nav-group-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 6l6 6-6 6" /></svg>
);

// __BUILD_TIME__ ditanam Vite saat "npm run build" dijalankan (lihat vite.config.js) --
// bukan variabel biasa, jadi TIDAK BOLEH dihapus meski terlihat "undefined" di editor.
function formatWaktuBuild(isoString) {
  try {
    const d = new Date(isoString);
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    return formatter.format(d) + ' WIB';
  } catch {
    return '-';
  }
}

function NavGroup({ id, label, children, sub, open, onToggle }) {
  return (
    <div className={`nav-group ${sub ? 'nav-subgroup' : ''} ${open ? 'open' : ''}`} data-tour={sub ? undefined : `nav-${id}`}>
      <div className="nav-group-header" onClick={() => onToggle(id)}>
        <span>{label}</span>
        <Arrow />
      </div>
      <div className="nav-group-items">{children}</div>
    </div>
  );
}

function Item({ to, children, canAccess, tour }) {
  if (canAccess === false) return null;
  return (
    <NavLink to={to} data-tour={tour} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
      {children}
    </NavLink>
  );
}

export default function Sidebar() {
  const { canAccess, currentUser } = useAuth();
  const { profilSekolah, unitInfo } = useAppData();
  const modeYayasan = isModeYayasan();
  const akunYayasan = !isUnitSekolah(currentUser?.unit);
  const [openGroups, setOpenGroups] = useState({ spp: true, keuangan: true });
  const toggle = (id) => setOpenGroups(g => ({ ...g, [id]: !g[id] }));

  return (
    <aside className="sidebar">
      <div className="sidebar-head" data-tour="brand">
        {profilSekolah?.logo ? (
          <img src={profilSekolah.logo} alt="Logo Sekolah" width="38" height="38" style={{ objectFit: 'contain', borderRadius: 8 }} />
        ) : (
          <LogoBawaan nama={profilSekolah?.nama} size={38} />
        )}
        <div>
          <div className="brand-name">{namaSekolahAtauDefault(profilSekolah)}</div>
          <div className="brand-sub">{modeYayasan ? 'Platform SPP Yayasan' : `Unit ${unitInfo?.label || ''} · Aplikasi SPP`}</div>
        </div>
      </div>

      {modeYayasan ? (
      <nav className="sidebar-nav">
        <Item to="/dashboard-yayasan" tour="nav-dashboard" canAccess={canAccess('dashboard-yayasan')}>Dashboard Yayasan</Item>
        <NavGroup id="unit" label="🏫 UNIT SEKOLAH" open={openGroups.unit !== false} onToggle={(id) => setOpenGroups(g => ({ ...g, [id]: g[id] === false }))}>
          {UNITS.map(u => (
            <Item key={u.id} to={`/pilih-unit/${u.id}`} canAccess={canAccess('dashboard-yayasan')}>
              <span className="nav-unit"><span className="unit-dot" style={{ background: u.warna }} />Unit {u.label}</span>
            </Item>
          ))}
        </NavGroup>
        <NavGroup id="yayasan" label="⚙️ YAYASAN" open={openGroups.yayasan !== false} onToggle={(id) => setOpenGroups(g => ({ ...g, [id]: g[id] === false }))}>
          <Item to="/profil-yayasan" canAccess={canAccess('profil-yayasan')}>Profil Yayasan</Item>
          <Item to="/manajemen-user" canAccess={canAccess('manajemen-user')}>Manajemen User</Item>
          <Item to="/hakakses" canAccess={canAccess('hakakses')}>Manajemen Hak Akses</Item>
          <Item to="/log-histori" canAccess={canAccess('log-histori')}>Log Histori</Item>
          <Item to="/koneksi-sheets" canAccess={canAccess('koneksi-sheets')}>Pengaturan Koneksi</Item>
        </NavGroup>
      </nav>
      ) : (
      <nav className="sidebar-nav">
        {akunYayasan && <Item to="/pilih-unit/semua" canAccess>← Kembali ke Yayasan</Item>}
        <Item to="/dashboard" tour="nav-dashboard" canAccess={canAccess('dashboard')}>Dashboard</Item>

        <NavGroup id="spp" label="🎓 SPP" open={openGroups.spp} onToggle={toggle}>
          <Item to="/dashboard-spp" canAccess={canAccess('dashboard-spp')}>Dashboard SPP</Item>
          <Item to="/pembayaran" canAccess={canAccess('pembayaran')}>Pembayaran</Item>
        </NavGroup>

        <NavGroup id="keuangan" label="💰 KEUANGAN" open={openGroups.keuangan} onToggle={toggle}>
          <Item to="/tagihan" canAccess={canAccess('tagihan')}>Tagihan &amp; Biaya</Item>
          <Item to="/bersihkan-duplikat" canAccess={canAccess('bersihkan-duplikat')}>Cek Data dan Sistem</Item>
          <Item to="/pemasukan-pengeluaran" canAccess={canAccess('pemasukan-pengeluaran')}>Pemasukan &amp; Pengeluaran Lain</Item>
          <Item to="/tunggakan" canAccess={canAccess('tunggakan')}>Rekap Tunggakan</Item>
          <Item to="/beasiswa" canAccess={canAccess('beasiswa')}>Beasiswa</Item>
          <Item to="/laporan-keuangan" canAccess={canAccess('laporan-keuangan')}>Laporan Keuangan</Item>
        </NavGroup>

        <NavGroup id="pengaturan" label="⚙️ PENGATURAN" open={openGroups.pengaturan} onToggle={toggle}>
          <NavGroup id="pgt-modul" label="🧩 MODUL" sub open={openGroups['pgt-modul']} onToggle={toggle}>
            <Item to="/profil" canAccess={canAccess('profil')}>Profil Sekolah &amp; Tahun Ajaran</Item>
            <Item to="/kelas" canAccess={canAccess('kelas')}>Data Kelas &amp; Rombel</Item>
            <Item to="/guru" canAccess={canAccess('guru')}>Data Guru &amp; Staff</Item>
            <Item to="/siswa" canAccess={canAccess('siswa')}>Data Siswa</Item>
          </NavGroup>
          <NavGroup id="pgt-system" label="🖥️ SYSTEM" sub open={openGroups['pgt-system']} onToggle={toggle}>
            <Item to="/pengaturan-sistem" canAccess={canAccess('pengaturan-sistem')}>Pengaturan Sistem</Item>
          </NavGroup>
        </NavGroup>
      </nav>
      )}

      <div className="sidebar-foot">
        Jundicomp © 2026
        <div style={{ fontSize: 10.5, opacity: .7, marginTop: 3 }}>
          {canAccess('changelog') ? (
            <NavLink to="/changelog" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }} title="Lihat riwayat pembaruan aplikasi">
              v{pkg.version}
            </NavLink>
          ) : (
            <span>v{pkg.version}</span>
          )} · {formatWaktuBuild(typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : null)}
        </div>
      </div>
    </aside>
  );
}
