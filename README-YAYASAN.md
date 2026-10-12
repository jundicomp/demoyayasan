# Platform SPP Yayasan (TK · SD · SMP · SMA)

Versi multi-unit dari aplikasi SPP: satu aplikasi untuk seluruh unit sekolah
yayasan, data tiap unit tersimpan terpisah, dan Admin Yayasan melihat rekap
semua unit di **Dashboard Yayasan**.

## Peran & akun

| Akun | Unit | Bisa membuka |
|---|---|---|
| Admin Yayasan | Semua (Yayasan) | Dashboard Yayasan, Profil Yayasan, Manajemen User & Hak Akses, Log Histori, dan **semua unit** (lewat pemilih unit di header) |
| Admin unit | TK / SD / SMP / SMA | Hanya unitnya sendiri (pemilih unit terkunci 🔒) |

Akun demo (password `123456`): `demo` (Admin Yayasan), `demo-tk`, `demo-sd`,
`demo-smp`, `demo-sma`. Daftarnya ada di `src/config/masterAdmin.js`.

Akun sungguhan dibuat di **Yayasan › Manajemen User**, kolom **Akses Unit**.

## Setup Google Sheets (sekali saja)

1. Buat **2 Google Sheets baru**: "SPP Yayasan - Data Induk" dan "SPP Yayasan - Keuangan".
   Jangan pakai sheet demo SPP satu sekolah, supaya keduanya tidak tercampur.
2. Di masing-masing: Extensions › Apps Script, tempel isi
   `google-apps-script/Code.gs` (Data Induk) dan `google-apps-script/Code-Keuangan.gs` (Keuangan).
3. Ganti nilai `SECRET`, lalu Deploy › New deployment › Web app
   (Execute as: Me, Who has access: Anyone). Salin URL `/exec`.
4. Isi kedua URL & SECRET di `src/config/sheetsDefaults.js`, lalu push.

Tab-tab dibuat otomatis saat data pertama masuk, contoh: `SD - Data Siswa`,
`SMP - Tagihan SPP`. Sheet bersama (tanpa awalan): `Users`, `Roles`,
`Hak Akses`, `LogAktivitas`, `Profil Yayasan`.

### Opsional: spreadsheet terpisah per unit

Untuk yayasan besar, isi `spreadsheetId` unit di objek `UNITS` pada **kedua**
file Apps Script. ID diambil dari URL `docs.google.com/spreadsheets/d/<ID>/edit`.
Akun pemilik script harus punya akses edit ke spreadsheet tersebut. Unit yang
`spreadsheetId`-nya kosong tetap memakai tab berawalan di sheet utama.

Setiap kali kode `.gs` diubah: Deploy › Manage deployments › edit › New version.

## Menambah / mengurangi unit

Ubah daftar `UNITS` di `src/config/units.js` **dan** di kedua file Apps Script
(id harus sama, mis. `sd`), lalu deploy ulang Apps Script dan push aplikasi.

## Catatan

- Keuangan dikelola **per unit** (kas, buku besar, laporan masing-masing);
  Dashboard Yayasan merekap pemasukan, kepatuhan bayar SPP bulan berjalan,
  dan tunggakan (sisa tagihan yang sudah lewat jatuh tempo) dari semua unit.
- Belum termasuk (tahap berikutnya): Master Siswa Yayasan (ID siswa yayasan,
  pindah jenjang antar unit, diskon saudara), dan manajemen user oleh admin unit.
