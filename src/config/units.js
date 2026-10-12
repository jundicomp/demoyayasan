/**
 * ===================================================================
 * DAFTAR UNIT SEKOLAH DALAM YAYASAN
 * ===================================================================
 * "id" WAJIB sama persis dengan kunci di objek UNITS pada kedua file
 * Apps Script (google-apps-script/Code.gs & Code-Keuangan.gs).
 * Mau menambah/mengurangi unit (mis. hanya SD & SMP)? Ubah daftar ini
 * DAN daftar UNITS di kedua file Apps Script, lalu deploy ulang.
 * ===================================================================
 */
export const UNITS = [
  { id: 'tk', label: 'TK', nama: 'Taman Kanak-kanak', warna: '#E07B24', soft: '#FDF0E4', tingkat: ['TK A', 'TK B'] },
  { id: 'sd', label: 'SD', nama: 'Sekolah Dasar', warna: '#C0392B', soft: '#FBE9E7', tingkat: ['1', '2', '3', '4', '5', '6'] },
  { id: 'smp', label: 'SMP', nama: 'Sekolah Menengah Pertama', warna: '#1E4FA0', soft: '#E6EEF9', tingkat: ['7', '8', '9'] },
  { id: 'sma', label: 'SMA', nama: 'Sekolah Menengah Atas', warna: '#5F6B73', soft: '#EEF1F3', tingkat: ['10', '11', '12'] },
];

// Nilai khusus untuk tampilan tingkat yayasan ("Semua Unit") dan untuk akun
// yang boleh membuka semua unit (Admin Yayasan).
export const SEMUA_UNIT = 'semua';

export const getUnit = (id) => UNITS.find(u => u.id === id) || null;
export const isUnitSekolah = (id) => !!getUnit(id);
