/**
 * ===================================================================
 * KODE INI DITEMPEL DI GOOGLE APPS SCRIPT — BUKAN DI PROJECT REACT
 * ===================================================================
 * Cara pasang (lihat juga README.md di folder ini):
 * 1. Buka Google Sheet yang mau dipakai sebagai database.
 * 2. Menu Extensions -> Apps Script.
 * 3. Hapus isi default Code.gs, tempel SELURUH isi file ini.
 * 4. Ganti nilai SECRET di bawah dengan kata sandi rahasia pilihan Anda.
 * 5. Klik Deploy -> New deployment -> pilih tipe "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 6. Salin URL Web App yang muncul (diakhiri /exec) -> tempel di
 *    aplikasi React, bagian Pengaturan Koneksi (khusus Admin).
 *
 * PENTING kalau update dari versi sebelumnya: setelah tempel ulang kode ini,
 * WAJIB redeploy (Deploy -> Manage deployments -> ikon pensil -> Version:
 * New version -> Deploy) supaya action baru (update/delete/addLog) aktif.
 *
 * Script ini melayani TUJUH "tabel" sekaligus dalam satu Spreadsheet:
 *   - sheet=siswa       -> tab "Data Siswa"     (data induk siswa)
 *   - sheet=kelas       -> tab "Data Kelas"     (kelas & rombel)
 *   - sheet=guru        -> tab "Data Guru"      (guru & staf)
 *   - sheet=profil      -> tab "Profil Sekolah" (1 baris saja -- identitas sekolah)
 *   - sheet=tahunAjaran -> tab "Tahun Ajaran"   (daftar tahun ajaran, 1 yg aktif)
 *   - sheet=users       -> tab "Users"          (akun login aplikasi)
 *   - sheet=log         -> tab "LogAktivitas"   (riwayat edit/hapus data)
 * ===================================================================
 */

// GANTI dengan kata sandi rahasia Anda sendiri (bebas, jangan dibagikan ke publik).
const SECRET = 'GANTI_DENGAN_KATA_SANDI_RAHASIA_ANDA';

// ===================================================================
// MULTI-UNIT YAYASAN (TK / SD / SMP / SMA)
// ===================================================================
// Setiap permintaan dari aplikasi membawa parameter "unit" (tk/sd/smp/sma).
// Data unit disimpan TERPISAH dengan salah satu dari 2 cara:
//   1) spreadsheetId KOSONG  -> disimpan di spreadsheet INI, nama tab diberi
//      awalan unit, mis. "SD - Data Siswa". Tidak perlu setup tambahan.
//   2) spreadsheetId DIISI   -> disimpan di spreadsheet lain milik unit tsb
//      (ID diambil dari URL: docs.google.com/spreadsheets/d/<ID>/edit). Akun
//      pemilik script ini harus punya akses edit ke spreadsheet tsb.
// Sheet BERSAMA (tidak dipisah per unit): users, roles, hakAkses, log, yayasan.
const UNITS = {
  tk:  { label: 'TK',  spreadsheetId: '' },
  sd:  { label: 'SD',  spreadsheetId: '' },
  smp: { label: 'SMP', spreadsheetId: '' },
  sma: { label: 'SMA', spreadsheetId: '' },
};
const SHARED_SHEETS = ['users', 'roles', 'hakAkses', 'log', 'yayasan'];
let UNIT_ = null;        // null = mode lama (permintaan tanpa parameter unit)
let UNIT_VALID_ = true;  // false = unit tidak dikenal (mis. tampilan "Semua Unit")

function setUnit_(u) {
  if (u === undefined || u === null || u === '') { UNIT_ = null; UNIT_VALID_ = true; return; }
  UNIT_ = String(u).toLowerCase();
  UNIT_VALID_ = !!UNITS[UNIT_];
}
function isShared_(key) { return SHARED_SHEETS.indexOf(key) !== -1; }
// Sheet per-unit diminta tanpa unit yg valid -> jangan baca/buat tab apa pun.
function unitTidakValidUntuk_(key) { return !isShared_(key) && UNIT_ !== null && !UNIT_VALID_; }
function spreadsheetFor_(key) {
  if (isShared_(key) || UNIT_ === null) return SpreadsheetApp.getActiveSpreadsheet();
  const id = UNITS[UNIT_].spreadsheetId;
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}
function tabName_(key) {
  const cfg = SHEETS[key];
  if (isShared_(key) || UNIT_ === null || UNITS[UNIT_].spreadsheetId) return cfg.name;
  return UNITS[UNIT_].label + ' - ' + cfg.name;
}


const SHEETS = {
  siswa: {
    name: 'Data Siswa',
    // "Status" & "Jenis Pendaftaran" ditaruh di AKHIR (bukan disisip di tengah) --
    // baris lama yg belum punya nilai di 2 kolom ini otomatis dianggap
    // Status="Aktif" & Jenis Pendaftaran="Siswa Baru" oleh React (lihat normalizeSheetSiswa).
    // "Rombel" jg ditaruh di AKHIR (kompatibel mundur) -- ruang kelas SPESIFIK (mis.
    // "1A") di dalam tingkat (Kelas/Tingkat). Siswa lama yg blm py Rombel dianggap
    // "belum ditentukan" oleh React, TIDAK dianggap Rombel kosong = error.
    headers: [
      'No', 'Kabupaten/Kota', 'NPSN', 'NSM', 'Jenjang', 'Kelas/Tingkat',
      'Nama Lengkap', 'NISN', 'NIK', 'Tempat Lahir', 'Tanggal Lahir',
      'Jenis Kelamin', 'Alamat', 'Nama Ayah Kandung', 'Nama Ibu Kandung', 'Pekerjaan',
      'Status', 'Jenis Pendaftaran', 'Rombel',
    ],
  },
  kelas: {
    name: 'Data Kelas',
    headers: ['No', 'Nama Kelas', 'Tingkat', 'Wali Kelas', 'Ruang', 'Kapasitas'],
  },
  guru: {
    name: 'Data Guru',
    // Kolom baru (Kategori dst) ditaruh di AKHIR -- kompatibel mundur dgn data lama.
    headers: [
      'No', 'Nama Lengkap', 'NIP/NUPTK', 'Jabatan', 'Mata Pelajaran', 'No HP', 'Email', 'Status',
      'Kategori', 'Jenis Kelamin', 'Pangkat/Golongan', 'Tempat Lahir', 'Tanggal Lahir',
      'Pendidikan Terakhir', 'Sertifikasi', 'Jumlah Jam Mengajar', 'TMT Mengajar', 'Tugas Tambahan',
      'Status Kepegawaian',
    ],
  },
  profil: {
    name: 'Profil Sekolah',
    headers: ['No', 'Nama Sekolah', 'NPSN', 'Alamat', 'Kepala Sekolah', 'Telepon', 'Email', 'Logo'],
  },
  tahunAjaran: {
    name: 'Tahun Ajaran',
    headers: ['No', 'Label', 'Mulai', 'Selesai', 'Aktif'],
  },
  riwayatAkademik: {
    name: 'Riwayat Akademik',
    // Riwayat "data bergerak" siswa -- SATU baris per (NISN + Tahun Ajaran), dibuat
    // lewat fitur Proses Kenaikan Kelas Tahunan (menu Data Siswa > Kenaikan Kelas).
    // Baris TIDAK ditimpa isinya kecuali utk mengisi "Status" akhir tahun (Naik Kelas/
    // Tinggal Kelas/Lulus/Pindah Sekolah/Berhenti) pada baris tahun yg sedang diproses --
    // baris tahun2 SEBELUMNYA dibiarkan permanen apa adanya. Sheet "Data Siswa" TETAP
    // py Kelas/Tingkat, Rombel, Status -- itu cuma nilai CACHE "kondisi saat ini",
    // disalin dari baris riwayat paling baru tiap kali diproses. Sheet INI-lah sumber
    // kebenaran riwayat lengkap siswa dari Kelas 1 sampai tamat/keluar.
    headers: ['No', 'NISN', 'Nama Siswa', 'Tahun Ajaran', 'Kelas/Tingkat', 'Rombel', 'Wali Kelas', 'Status', 'Tanggal', 'Keterangan'],
  },
  users: {
    name: 'Users',
    // "Status" ditaruh di AKHIR (kompatibel mundur) -- baris lama yg belum punya nilai
    // di kolom ini otomatis dianggap "Aktif" oleh React (lihat normalizeSheetUser),
    // jadi user yg sudah ada TIDAK tiba-tiba ke-nonaktifkan begitu kolom ini muncul.
    // "Unit" (multi-unit yayasan): 'semua' = akun tingkat yayasan, atau tk/sd/smp/sma.
    headers: ['No', 'Nama', 'Role', 'Username', 'Password', 'Email', 'Status', 'Unit'],
  },
  roles: {
    name: 'Roles',
    headers: ['No', 'Nama Role'],
  },
  hakAkses: {
    name: 'Hak Akses',
    // 1 baris = 1 ROLE. Kolom "PermissionsJson" berisi SELURUH izin role itu sbg JSON,
    // mis. {"tagihan":true,"tagihan.penerbitan-spp":true,"tagihan.tarif":false,...} --
    // kunci bisa ID halaman ATAU "halaman.tab" utk detail sampai level tab. Disimpan
    // sbg 1 blob JSON per role (bukan 1 baris per centang) supaya update selalu simpel:
    // baca baris role itu, gabung perubahan, tulis ulang JSON-nya -- tanpa perlu cari
    // baris mana yg harus di-update satu-satu tiap kali 1 centang berubah.
    headers: ['No', 'Role', 'PermissionsJson'],
  },
  yayasan: {
    name: 'Profil Yayasan',
    headers: ['No', 'Nama Yayasan', 'Alamat', 'Ketua Yayasan', 'Telepon', 'Email', 'Logo'],
  },
  log: {
    name: 'LogAktivitas',
    headers: ['No', 'Waktu', 'Username', 'Nama User', 'Aksi', 'Modul', 'Detail'],
  },
};

function doGet(e) {
  // PENTING (perbaikan keamanan): sebelumnya doGet TIDAK mengecek SECRET sama sekali,
  // artinya siapa pun yang tahu URL ini bisa membaca SEMUA data (termasuk password
  // di sheet Users) tanpa perlu tahu kata sandi apa pun. Sekarang wajib dicek dulu.
  if (!e.parameter || e.parameter.secret !== SECRET) {
    return jsonResponse_({ ok: false, error: 'Akses ditolak: kata sandi tidak cocok atau tidak disertakan.' });
  }
  // Mode BATCH: sheet=ALL mengembalikan SEMUA sheet sekaligus dalam 1 respons --
  // dipakai saat load pertama kali (login/buka app) supaya browser TIDAK perlu
  // menembak banyak request terpisah (masing2 request ke Apps Script punya overhead
  // sendiri & kena kuota bersama -- gabung jadi 1 mengurangi beban & kegagalan
  // "tidak terhubung" akibat kuota kepenuhan). Request tunggal (utk refresh setelah
  // tambah/edit/hapus) TETAP jalan spt biasa lewat sheet=<nama>, TIDAK berubah.
  setUnit_(e.parameter.unit);
  if (e.parameter.sheet === 'ALL') {
    const semua = {};
    Object.keys(SHEETS).forEach(key => { semua[key] = readSheetData_(key); });
    return jsonResponse_({ ok: true, data: semua });
  }
  // Mode REKAP YAYASAN: sheet=MULTI&units=tk,sd,smp,sma&sheets=siswa,kelas
  // -> { tk: { siswa: [...], kelas: [...] }, sd: {...}, ... } dalam 1 permintaan.
  if (e.parameter.sheet === 'MULTI') {
    const units = String(e.parameter.units || '').split(',').filter(u => UNITS[u]);
    const keys = String(e.parameter.sheets || '').split(',').filter(k => SHEETS[k] && !isShared_(k));
    const hasil = {};
    units.forEach(u => {
      setUnit_(u);
      hasil[u] = {};
      keys.forEach(k => { hasil[u][k] = readSheetData_(k); });
    });
    return jsonResponse_({ ok: true, data: hasil });
  }
  const which = SHEETS[e.parameter.sheet] ? e.parameter.sheet : 'siswa';
  return jsonResponse_({ ok: true, data: readSheetData_(which) });
}

function readSheetData_(key) {
  if (unitTidakValidUntuk_(key)) return [];
  const cfg = SHEETS[key];
  const sheet = getSheet_(key);
  const data = sheet.getDataRange().getValues();
  return data.slice(1).filter(r => r.some(cell => cell !== '')).map(row => {
    const obj = {};
    cfg.headers.forEach((h, i) => { obj[h] = formatCellValue_(row[i]); });
    return obj;
  });
}

// Kalau sel diketik manual di Sheets dgn format yg dikenali sbg tanggal (mis. "8/22/1978"),
// Google Sheets otomatis menyimpannya sbg tipe TANGGAL ASLI, bukan teks. Saat dibaca lewat
// Apps Script, nilai itu jadi objek Date -- dan begitu di-JSON-kan, JavaScript otomatis
// mengonversinya ke UTC, yg BISA BERGESER 1 HARI dibanding tanggal aslinya (krn WIB = UTC+7).
// Fungsi ini memaksa tanggal diformat manual sbg teks "yyyy-MM-dd" sesuai zona waktu WIB,
// SEBELUM dikirim sbg JSON -- supaya tanggalnya selalu benar & konsisten, apa pun cara
// data itu awalnya dimasukkan ke Sheets (lewat aplikasi ATAU diketik manual).
function formatCellValue_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, 'Asia/Jakarta', 'yyyy-MM-dd');
  }
  return value;
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SECRET) {
      return jsonResponse_({ ok: false, error: 'Kata sandi tidak cocok. Cek pengaturan koneksi.' });
    }
    setUnit_(body.unit);
    const which = SHEETS[body.sheet] ? body.sheet : 'siswa';
    if (unitTidakValidUntuk_(which)) {
      return jsonResponse_({ ok: false, error: 'Pilih unit sekolah terlebih dahulu sebelum mengubah data ini.' });
    }
    const cfg = SHEETS[which];
    const sheet = getSheet_(which);

    if (body.action === 'add') {
      appendRow_(sheet, cfg.headers, body.row);
      return jsonResponse_({ ok: true });
    }
    if (body.action === 'bulkAdd') {
      body.rows.forEach(row => appendRow_(sheet, cfg.headers, row));
      return jsonResponse_({ ok: true, count: body.rows.length });
    }
    if (body.action === 'update') {
      const found = updateRow_(sheet, cfg.headers, body.row);
      if (!found) return jsonResponse_({ ok: false, error: 'Baris dengan No=' + body.row['No'] + ' tidak ditemukan.' });
      return jsonResponse_({ ok: true });
    }
    if (body.action === 'delete') {
      const found = deleteRow_(sheet, cfg.headers, body.no);
      if (!found) return jsonResponse_({ ok: false, error: 'Baris dengan No=' + body.no + ' tidak ditemukan.' });
      return jsonResponse_({ ok: true });
    }
    if (body.action === 'setActiveTahunAjaran') {
      setActiveTahunAjaran_(sheet, cfg.headers, body.no);
      return jsonResponse_({ ok: true });
    }
    if (body.action === 'bulkUpdate') {
      // Update BANYAK baris sekaligus (by "No"), tiap baris cuma field yg disebut di
      // "patch" yg diubah -- field lain di baris itu TIDAK disentuh/ditimpa (beda dari
      // action 'update' biasa yg replace 1 baris utuh, jadi WAJIB kirim semua kolom).
      // Dipakai fitur "Isi NISN Massal (Sementara)" di Cek Data dan Sistem > Cek Data
      // NISN -- bisa sampai ratusan siswa sekaligus, jadi kolom "No" dibaca 1x (bulk
      // getValues) lalu semua update dieksekusi dlm 1 request, sama spt pola
      // bulkDeleteRows_ di Code-Keuangan.gs (baca sekali, bukan scan sel-per-sel per baris).
      const hasil = bulkUpdateRows_(sheet, cfg.headers, body.updates || []);
      return jsonResponse_({ ok: true, jumlahDiupdate: hasil.jumlahDiupdate, noTidakDitemukan: hasil.noTidakDitemukan });
    }
    if (body.action === 'upsertHakAkses') {
      // Server yg MENGGABUNGKAN 1 perubahan (itemId+checked) ke JSON izin role itu --
      // BUKAN menerima JSON lengkap dari client lalu menimpa mentah2. Kenapa: client
      // mengirim berdasarkan state React yg mungkin BELUM sempat ter-update kalau user
      // klik beberapa kotak cepat berturut-turut (event React & network async saling
      // susul) -- kalau server cuma menimpa mentah, perubahan yg "menang" cuma yg
      // requestnya selesai PALING AKHIR, sisanya keteter hilang. Dgn baca-gabung-tulis
      // di SINI (server SELALU baca kondisi sheet paling baru saat request itu jalan),
      // urutan/kecepatan request dari client tidak lagi jadi soal.
      upsertHakAksesRole_(sheet, cfg.headers, body.role, body.itemId, body.checked);
      return jsonResponse_({ ok: true });
    }
    return jsonResponse_({ ok: false, error: 'Aksi "' + body.action + '" tidak dikenal.' });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function getSheet_(key) {
  const cfg = SHEETS[key];
  const ss = spreadsheetFor_(key);
  const nama = tabName_(key);
  let sheet = ss.getSheetByName(nama);
  if (!sheet) sheet = ss.insertSheet(nama);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(cfg.headers);
  } else {
    // Sheet SUDAH ada isinya (dari sebelum ada field baru) -- baris header TIDAK
    // otomatis ditulis ulang seperti sheet baru. Jadi di sini kita SINKRONKAN: kalau
    // ada header yg didefinisikan di kode tapi belum ada di baris 1 Sheet, tambahkan
    // di ujung kanan. Supaya nambah field baru di kode tidak perlu edit Sheet manual.
    const existingHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    const missing = cfg.headers.filter(h => existingHeaders.indexOf(h) === -1);
    if (missing.length > 0) {
      sheet.getRange(1, existingHeaders.length + 1, 1, missing.length).setValues([missing]);
    }
  }
  return sheet;
}

function appendRow_(sheet, headers, rowObj) {
  // Sama persis dgn perbaikan di Code-Keuangan.gs: LockService WAJIB supaya penentuan
  // "No" berikutnya tidak tabrakan kalau 2 permintaan berjalan bersamaan (akar masalah
  // baris dobel berNo kembar -- lihat catatan lengkap di Code-Keuangan.gs).
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const nextNo = sheet.getLastRow(); // baris 1 = header, jadi ini otomatis nomor urut berikutnya
    const row = headers.map(h => (h === 'No' ? nextNo : (rowObj[h] !== undefined ? rowObj[h] : '')));
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
}

// Update BANYAK baris sekaligus (per "No") dlm 1 eksekusi -- tiap update = { no, patch:
// {field: value, ...} }, cuma field di "patch" yg ditulis, kolom lain di baris itu
// dibiarkan apa adanya (beda dari updateRow_ yg replace utuh 1 baris). LockService WAJIB
// (sama spt appendRow_/bulkDeleteRows_ style di Code-Keuangan.gs) supaya aman kalau ada
// proses lain nulis sheet yg sama bersamaan.
function bulkUpdateRows_(sheet, headers, updates) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const noCol = headers.indexOf('No') + 1;
    const lastRow = sheet.getLastRow();
    if (lastRow < 2 || !updates || updates.length === 0) {
      return { jumlahDiupdate: 0, noTidakDitemukan: (updates || []).map(u => String(u.no)) };
    }
    const nilaiNo = sheet.getRange(2, noCol, lastRow - 1, 1).getValues();
    const barisByNo = {};
    for (let i = 0; i < nilaiNo.length; i++) barisByNo[String(nilaiNo[i][0])] = i + 2; // +2: index 0 = baris sheet ke-2
    let jumlahDiupdate = 0;
    const noTidakDitemukan = [];
    updates.forEach(u => {
      const r = barisByNo[String(u.no)];
      if (r === undefined) { noTidakDitemukan.push(String(u.no)); return; }
      Object.keys(u.patch || {}).forEach(field => {
        const col = headers.indexOf(field) + 1;
        if (col > 0) sheet.getRange(r, col).setValue(u.patch[field]);
      });
      jumlahDiupdate++;
    });
    return { jumlahDiupdate, noTidakDitemukan };
  } finally {
    lock.releaseLock();
  }
}

// Cari nomor baris FISIK (index sheet, 1-based) yg kolom "No"-nya cocok dgn targetNo --
// baca kolom "No" SEKALI (1 panggilan getValues), bukan sel-per-sel dlm loop (SANGAT
// lambat utk sheet berbaris banyak -- tiap getRange().getValue() adalah 1 panggilan API
// tersendiri; makin banyak baris di atas, makin lama utk sampai ke baris yg dicari).
// Pola ini SUDAH dipakai di Code-Keuangan.gs -- fungsi ini menyusulkan pola yg sama ke
// Code.gs (Data Induk), yg SEBELUMNYA masih pakai loop sel-per-sel di updateRow_/
// deleteRow_/setActiveTahunAjaran_. Sheet siswa yg sudah beratus-ratus baris (mis. 282
// siswa) bikin loop lama itu perlu ratusan panggilan API cuma utk 1 update/delete --
// gejalanya: fitur spt "Pindah Rombel Massal" (yg update BANYAK siswa berturut-turut)
// jadi sangat lambat bahkan macet, karena tiap siswa yg dipindah mengulang scan lambat
// yg sama dari awal.
function cariBarisByNo_(sheet, headers, targetNoRaw) {
  const noCol = headers.indexOf('No') + 1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const targetNo = String(targetNoRaw);
  const nilaiNo = sheet.getRange(2, noCol, lastRow - 1, 1).getValues();
  for (let i = 0; i < nilaiNo.length; i++) {
    if (String(nilaiNo[i][0]) === targetNo) return i + 2; // +2: index 0 = baris sheet ke-2
  }
  return -1;
}

// Cari baris via kolom "No", timpa semua kolom lain dgn nilai baru. "No" sendiri tidak berubah.
function updateRow_(sheet, headers, rowObj) {
  const r = cariBarisByNo_(sheet, headers, rowObj['No']);
  if (r === -1) return false;
  const newRow = headers.map(h => (h === 'No' ? rowObj['No'] : (rowObj[h] !== undefined ? rowObj[h] : '')));
  sheet.getRange(r, 1, 1, headers.length).setValues([newRow]);
  return true;
}

// Cari baris utk Role tsb (kolom "Role"), GABUNGKAN 1 perubahan (itemId: checked) ke
// JSON izin yg SUDAH ADA di baris itu (baca dulu, ubah 1 key, tulis balik) -- atau buat
// baris baru kalau Role itu belum py baris sama sekali. Dibaca ULANG dari sheet setiap
// panggilan (bukan dari salinan lama) supaya aman dipanggil berkali-kali cepat
// berturut-turut tanpa kehilangan perubahan yg satu ketiban perubahan yg lain.
function upsertHakAksesRole_(sheet, headers, role, itemId, checked) {
  const roleCol = headers.indexOf('Role') + 1;
  const jsonCol = headers.indexOf('PermissionsJson') + 1;
  const lastRow = sheet.getLastRow();
  const roleDicari = String(role).trim();
  for (let r = 2; r <= lastRow; r++) {
    // PENTING: di-trim() dulu sebelum dibandingkan -- kalau tidak, satu saja spasi
    // nyasar (mis. dari copy-paste manual di Sheets) bikin baris yg SUDAH ADA utk
    // role ini tidak pernah ketemu, dan tiap "Terapkan" malah nambah baris BARU
    // (bukan nimpa baris lama) -- baris lama yg berisi izin2 sebelumnya jadi
    // "terkubur", padahal datanya sendiri masih ada, cuma tidak terbaca sbg 1
    // kesatuan lagi. Ini penyebab role bisa py 2-3 baris nyasar utk nama yg sama.
    const cellVal = String(sheet.getRange(r, roleCol).getValue()).trim();
    if (cellVal === roleDicari) {
      let perm = {};
      try { perm = JSON.parse(sheet.getRange(r, jsonCol).getValue() || '{}'); } catch (e) { perm = {}; }
      perm[itemId] = checked;
      sheet.getRange(r, jsonCol).setValue(JSON.stringify(perm));
      return;
    }
  }
  const perm = {};
  perm[itemId] = checked;
  appendRow_(sheet, headers, { Role: roleDicari, PermissionsJson: JSON.stringify(perm) });
}

// Cari baris via kolom "No", hapus barisnya. Nomor baris lain SENGAJA tidak digeser ulang
// (No hanya perlu unik, tidak harus berurutan tanpa celah).
function deleteRow_(sheet, headers, targetNoRaw) {
  const r = cariBarisByNo_(sheet, headers, targetNoRaw);
  if (r === -1) return false;
  sheet.deleteRow(r);
  return true;
}

// Set kolom "Aktif" = TRUE utk baris dgn No=targetNo, dan FALSE utk semua baris lain.
// Dilakukan dalam satu operasi supaya tidak pernah ada 0 atau 2 tahun ajaran aktif sekaligus.
// Dibaca+ditulis lewat SATU panggilan getValues/setValues masing2 (bukan loop sel-per-sel
// spt sebelumnya) -- sheet Tahun Ajaran biasanya kecil, tapi pola ini tetap dipakai
// konsisten dgn cariBarisByNo_/bulkUpdateRows_ di atas.
function setActiveTahunAjaran_(sheet, headers, targetNo) {
  const noCol = headers.indexOf('No') + 1;
  const aktifCol = headers.indexOf('Aktif') + 1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  const target = String(targetNo);
  const nilaiNo = sheet.getRange(2, noCol, lastRow - 1, 1).getValues();
  const nilaiAktifBaru = nilaiNo.map(r => [String(r[0]) === target ? 'TRUE' : 'FALSE']);
  sheet.getRange(2, aktifCol, nilaiAktifBaru.length, 1).setValues(nilaiAktifBaru);
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
