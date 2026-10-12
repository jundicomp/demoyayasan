import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAppData } from './AppContext';
import { isConfigured, fetchUsersFromSheet, updateUserInSheet } from '../services/googleSheets';
import { MASTER_ADMIN, DEMO_USERS, DEMO_PASSWORD } from '../config/masterAdmin';
import { SEMUA_UNIT, isUnitSekolah } from '../config/units';
import { getUnitAktif, isModeYayasan, pindahUnit } from '../services/unitAktif';

// Halaman tingkat YAYASAN -- hanya untuk akun ber-unit "semua" dan hanya dibuka di
// tampilan "Semua Unit". Halaman lain adalah halaman unit (butuh unit aktif).
export const HALAMAN_YAYASAN = ['dashboard-yayasan', 'profil-yayasan', 'manajemen-user', 'hakakses', 'log-histori', 'koneksi-sheets'];
const HALAMAN_UMUM = ['profil-saya', 'changelog'];

// Setelah login: akun unit dikunci ke unitnya; akun yayasan mulai dari "Semua Unit".
// Kalau unit aktif berubah, aplikasi dimuat ulang supaya data unit yg benar yg dipakai.
function arahkanUnitSetelahLogin(user) {
  const target = isUnitSekolah(user.unit) ? user.unit : SEMUA_UNIT;
  if (getUnitAktif() !== target) {
    // Simpan sesi LANGSUNG sebelum reload (state React belum tentu sempat tersimpan).
    try { localStorage.setItem('currentUser_v1', JSON.stringify(user)); } catch { /* abaikan */ }
    pindahUnit(target);
    return true;
  }
  return false;
}

const AuthContext = createContext(null);
const SESSION_KEY = 'currentUser_v1';

function bacaSesiTersimpan() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeSheetUser(u, idx) {
  return {
    id: 'USER-' + (u['No'] ?? idx),
    no: u['No'],
    nama: String(u['Nama'] ?? '').trim(),
    role: String(u['Role'] ?? '').trim(),
    // String(...) sengaja dipakai -- Google Sheets bisa mengembalikan username/password
    // sebagai NUMBER kalau isinya cuma digit (mis. password "123456"), padahal form
    // login selalu mengirim STRING. Tanpa ini, "123456" (teks) !== 123456 (angka) -> gagal login.
    username: String(u['Username'] ?? '').trim(),
    password: String(u['Password'] ?? '').trim(),
    email: String(u['Email'] ?? '').trim(),
    // Baris lama (sebelum kolom ini ada) otomatis dianggap "Aktif" -- perilaku lama
    // (semua user yg sudah ada tetap bisa login) tetap jalan persis sama.
    status: String(u['Status'] ?? '').trim() || 'Aktif',
    // Multi-unit: kosong/"semua" = akun tingkat yayasan; tk/sd/smp/sma = admin unit.
    unit: (() => { const v = String(u['Unit'] ?? '').trim().toLowerCase(); return isUnitSekolah(v) ? v : SEMUA_UNIT; })(),
  };
}

export function AuthProvider({ children }) {
  const { permissions } = useAppData();
  // Baca sesi tersimpan SEKALI saat pertama kali komponen dimuat -- supaya refresh
  // halaman (F5) tidak otomatis logout. Sesi dianggap valid selama tersimpan di
  // localStorage; logout eksplisit (tombol keluar) yang menghapusnya.
  const [currentUser, setCurrentUserState] = useState(() => bacaSesiTersimpan());
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const setCurrentUser = useCallback((userOrUpdater) => {
    setCurrentUserState(prev => {
      const next = typeof userOrUpdater === 'function' ? userOrUpdater(prev) : userOrUpdater;
      try {
        if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
        else localStorage.removeItem(SESSION_KEY);
      } catch { /* localStorage penuh/diblokir browser -- sesi tetap jalan di memori */ }
      return next;
    });
  }, []);

  const login = useCallback(async (username, password) => {
    setLoggingIn(true);
    setLoginError('');

    const uname = String(username).trim();
    const pass = String(password).trim();

    // ---- Akun Admin Induk: SELALU bisa login, tak peduli status Google Sheets ----
    if (uname === MASTER_ADMIN.username && pass === MASTER_ADMIN.password) {
      setLoggingIn(false);
      const u = { id: 'MASTER-ADMIN', no: null, isMasterAdmin: true, unit: SEMUA_UNIT, nama: MASTER_ADMIN.nama, role: MASTER_ADMIN.role, username: MASTER_ADMIN.username, email: MASTER_ADMIN.email, password: MASTER_ADMIN.password };
      setCurrentUser(u);
      arahkanUnitSetelahLogin(u);
      return true;
    }

    // ---- Akun Demo (yayasan & per unit): selalu bisa login, akses setara Admin ----
    const demo = DEMO_USERS.find(d => d.username === uname);
    if (demo && pass === DEMO_PASSWORD) {
      setLoggingIn(false);
      const u = { id: 'DEMO-' + demo.username, no: null, isMasterAdmin: true, isDemo: true, unit: demo.unit, nama: demo.nama, role: demo.role, username: demo.username, email: demo.username + '@yayasan-demo.sch.id', password: DEMO_PASSWORD };
      setCurrentUser(u);
      arahkanUnitSetelahLogin(u);
      return true;
    }

    if (!isConfigured()) {
      setLoggingIn(false);
      setLoginError('Aplikasi belum tersambung ke Google Sheets. Hubungi Admin untuk mengatur koneksi.');
      return false;
    }

    let sheetUsers = [];
    try {
      const rows = await fetchUsersFromSheet();
      sheetUsers = rows.map(normalizeSheetUser);
    } catch (err) {
      setLoggingIn(false);
      setLoginError('Gagal menghubungi Google Sheets: ' + err.message);
      return false;
    }

    const user = sheetUsers.find(u => u.username === uname && u.password === pass);
    setLoggingIn(false);
    if (!user) {
      setLoginError('Username atau password salah. Coba lagi.');
      return false;
    }
    if (user.status === 'Nonaktif') {
      setLoginError('Akun ini sudah dinonaktifkan. Hubungi Admin kalau ini seharusnya masih aktif.');
      return false;
    }
    setCurrentUser(user);
    arahkanUnitSetelahLogin(user);
    return true;
  }, []);

  // Sesi tersimpan milik admin unit selalu dikunci ke unitnya (mis. kalau unit aktif
  // di browser sempat diubah manual).
  useEffect(() => {
    if (currentUser && isUnitSekolah(currentUser.unit) && getUnitAktif() !== currentUser.unit) pindahUnit(currentUser.unit);
  }, [currentUser]);

  const logout = useCallback(() => setCurrentUser(null), []);

  const verifyPassword = useCallback((password) => {
    if (!currentUser) return false;
    return String(password).trim() === String(currentUser.password).trim();
  }, [currentUser]);

  // Ganti password akun sendiri. TIDAK berlaku utk Admin Induk (kredensialnya
  // hardcode di kode sumber, bukan di Sheets -- lihat src/config/masterAdmin.js).
  const changeOwnPassword = useCallback(async (newPassword) => {
    if (!currentUser || currentUser.isMasterAdmin) throw new Error('Akun Admin Induk tidak bisa ganti password lewat sini.');
    await updateUserInSheet({
      No: currentUser.no,
      Nama: currentUser.nama,
      Role: currentUser.role,
      Username: currentUser.username,
      Password: newPassword,
      Email: currentUser.email,
      // WAJIB disertakan -- updateRow_ di backend menulis ULANG SELURUH baris dari
      // objek ini; field yg tidak disebut di sini akan tertimpa KOSONG (termasuk
      // Status, yg kalau kosong dianggap "Aktif" -- bisa diam2 "menghidupkan lagi"
      // akun yg baru saja dinonaktifkan Admin kalau field ini terlewat).
      Status: currentUser.status || 'Aktif',
      Unit: currentUser.unit === SEMUA_UNIT ? 'Semua (Yayasan)' : String(currentUser.unit || '').toUpperCase(),
    });
    setCurrentUser(u => ({ ...u, password: newPassword }));
  }, [currentUser]);

  // pageId = ID halaman (mis. "tagihan"). tabId OPSIONAL = ID tab di dalam halaman itu
  // (mis. "penerbitan") -- kalau diisi, dicek DUA lapis: halamannya sendiri harus boleh
  // DULU, baru dicek izin spesifik tab-nya (key gabungan "tagihan.penerbitan"). Kalau
  // izin tab itu belum pernah diatur (undefined), default-nya TETAP boleh (kompatibel
  // mundur -- role lama yg belum pernah atur level tab tidak tiba2 kehilangan akses).
  const canAccess = useCallback((pageId, tabId) => {
    if (!currentUser) return false;
    // ---- Lapisan unit (multi-unit yayasan) ----
    const akunYayasan = !isUnitSekolah(currentUser.unit);
    if (HALAMAN_UMUM.includes(pageId)) return true;
    if (HALAMAN_YAYASAN.includes(pageId)) {
      if (!akunYayasan || !isModeYayasan()) return false;
    } else if (isModeYayasan()) {
      return false; // halaman unit tidak bisa dibuka di tampilan "Semua Unit"
    }
    const roleperm = permissions[currentUser.role];
    if (!roleperm) return true;
    if (roleperm[pageId] === false) return false;
    if (tabId) return roleperm[`${pageId}.${tabId}`] !== false;
    return true;
  }, [currentUser, permissions]);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loginError, loggingIn, canAccess, verifyPassword, changeOwnPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}
