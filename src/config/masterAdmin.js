/**
 * ===================================================================
 * AKUN ADMIN INDUK (PENGEMBANG) — JARING PENGAMAN LOGIN
 * ===================================================================
 * Akun ini SELALU bisa login, apa pun status koneksi Google Sheets —
 * tujuannya supaya aplikasi tidak pernah terkunci total (mis. saat
 * pertama kali setup di device baru, atau koneksi Sheets sedang
 * bermasalah). Dari akun ini, Admin Induk bisa:
 *   1. Mengatur koneksi Google Sheets (menu Pengaturan Koneksi)
 *   2. Menambahkan user lain (menu Manajemen User)
 *
 * ⚠️ PENTING — GANTI USERNAME & PASSWORD DI BAWAH INI sebelum aplikasi
 * dipakai sungguhan. Kredensial ini ikut ter-build ke kode JavaScript
 * yang dikirim ke browser (bisa dilihat siapa pun lewat "View Source"),
 * jadi JANGAN pakai password penting/yang dipakai ulang di tempat lain.
 * Anggap ini kunci cadangan darurat, bukan akun sehari-hari.
 * ===================================================================
 */
export const MASTER_ADMIN = {
  username: 'jundicomp',
  password: 'GANTI-PASSWORD-INI-2026',
  nama: 'Admin Induk (Pengembang)',
  role: 'Admin',
  email: 'dev@jundicomp.local',
};

/**
 * AKUN DEMO — untuk pengunjung web demo. Selalu bisa login (tidak disimpan
 * di Google Sheets). Kredensial ini sengaja dipublikasikan di halaman demo.
 *   demo      -> Admin Yayasan (bisa membuka semua unit + Dashboard Yayasan)
 *   demo-tk / demo-sd / demo-smp / demo-sma -> Admin unit, terkunci di unitnya
 */
export const DEMO_PASSWORD = '123456';
export const DEMO_USERS = [
  { username: 'demo', nama: 'Admin Yayasan (Demo)', role: 'Admin', unit: 'semua' },
  { username: 'demo-tk', nama: 'Admin TK (Demo)', role: 'Admin', unit: 'tk' },
  { username: 'demo-sd', nama: 'Admin SD (Demo)', role: 'Admin', unit: 'sd' },
  { username: 'demo-smp', nama: 'Admin SMP (Demo)', role: 'Admin', unit: 'smp' },
  { username: 'demo-sma', nama: 'Admin SMA (Demo)', role: 'Admin', unit: 'sma' },
];
