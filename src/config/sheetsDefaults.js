/**
 * ===================================================================
 * KONEKSI GOOGLE SHEETS — DITANAM PERMANEN DI KODE (Cara 1)
 * ===================================================================
 * Sesuai keputusan: aplikasi ini SATU sekolah, jadi URL & sandi Apps
 * Script ditanam langsung di sini -- browser mana pun otomatis
 * langsung terhubung, tidak perlu isi Pengaturan Koneksi manual lagi.
 *
 * ⚠️ INGAT (sudah didiskusikan panjang sebelumnya): nilai di file ini
 * IKUT TER-BUILD ke file JavaScript yang dikirim ke SETIAP pengunjung
 * website -- bukan rahasia yang benar-benar tersembunyi. Siapa pun yang
 * buka DevTools browser (atau repo GitHub kalau statusnya Publik) bisa
 * menemukan nilai ini. Amannya cuma sebatas: orang itu MAKSIMAL bisa
 * baca/tulis ke 2 Google Sheets ini -- tidak lebih dari itu.
 *
 * Mau ganti URL/sandi? Edit nilai di bawah ini, lalu build ulang &
 * upload ulang. TIDAK ADA cara mengubahnya dari dalam aplikasi lagi
 * (Pengaturan Koneksi sudah dinonaktifkan, sesuai permintaan).
 * ===================================================================
 */
// VERSI YAYASAN: isi dengan URL Web App dari Apps Script versi multi-unit
// (google-apps-script/Code.gs & Code-Keuangan.gs di project ini).
export const DEFAULT_SHEETS_CONFIG = {
  master: {
    url: '',
    secret: '123456',
  },
  keuangan: {
    url: '',
    secret: '123456',
  },
};
