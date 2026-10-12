# Menyambungkan Aplikasi ke Google Sheets

Mulai modul Keuangan, arsitekturnya jadi **DUA file Google Sheets terpisah**:

| File | Isinya | Kode Apps Script |
|---|---|---|
| **Data Induk** | Siswa, Kelas, Guru, Profil Sekolah, Tahun Ajaran, User, Log Aktivitas | `Code.gs` |
| **Keuangan** | Tarif, Tagihan SPP, Tagihan Lain, Pembayaran (menyusul) | `Code-Keuangan.gs` |

**Kenapa dipisah?** Data Induk jumlahnya relatif tetap (paling nambah beberapa siswa/tahun).
Data Keuangan terus bertambah tiap bulan (tagihan SPP tiap siswa tiap bulan) — dipisah supaya
file Data Induk tetap ringan dalam jangka panjang.

## Setup File Data Induk (kalau belum)

1. Buka/buat Google Sheet untuk Data Induk.
2. Extensions → Apps Script → tempel isi `Code.gs`.
3. Ganti `SECRET` dengan kata sandi pilihan Anda.
4. Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
5. Salin URL → aplikasi React → Pengaturan Koneksi (khusus Admin) → bagian **"Koneksi Data Induk"**.

## Setup File Keuangan (BARU)

1. Buat Google Sheet **BARU, TERPISAH** dari Sheet Data Induk.
2. Extensions → Apps Script → tempel isi `Code-Keuangan.gs`.
3. Ganti `SECRET` dengan kata sandi pilihan Anda (**boleh beda** dari SECRET Data Induk — lebih aman).
4. Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
5. Salin URL → aplikasi React → Pengaturan Koneksi → bagian **"Koneksi Data Keuangan"**.

Kedua sheet akan otomatis dibuatkan tab-tab yang sesuai begitu ada data pertama dikirim dari
aplikasi — tidak perlu bikin tab atau header kolom manual.

## Catatan Umum

- **Setiap kali mengubah kode `.gs`**, wajib **Deploy → Manage deployments → ikon pensil →
  Version: New version → Deploy** supaya perubahan aktif. Sekadar menyimpan file saja tidak cukup.
- Kata sandi (`SECRET`) dikirim di setiap permintaan tulis (tambah/ubah/hapus data) — proteksi
  ringan yang cocok untuk skala sekolah, bukan enkripsi tingkat bank.
- Kalau redeploy menghasilkan URL baru, ingat update lagi di Pengaturan Koneksi React.
