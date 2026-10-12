import { postKeUnit, saveProfilYayasanToSheet } from '../../services/googleSheets';
import { BULAN_ID, todayWIB } from '../../db/helpers';

/**
 * DATA CONTOH FIKTIF untuk demo -- mengisi ke-4 unit sekaligus (profil, tahun ajaran,
 * kelas, siswa, tarif SPP, tagihan SPP sejak Juli s/d bulan ini, dan pembayaran).
 * Semua nama, NISN, dan angka di sini karangan, bukan data sungguhan.
 */
const NAMA_DEPAN = ['Aisyah', 'Budi', 'Citra', 'Dimas', 'Eka', 'Fajar', 'Gita', 'Hendra', 'Intan', 'Joko', 'Kirana', 'Lutfi', 'Mira', 'Nanda', 'Oki', 'Putri', 'Raka', 'Salsa', 'Tegar', 'Umi', 'Vino', 'Wulan', 'Yoga', 'Zahra'];
const NAMA_BELAKANG = ['Pratama', 'Lestari', 'Saputra', 'Rahmawati', 'Nugroho', 'Maharani', 'Wijaya', 'Permata', 'Hakim', 'Anggraini'];
const GURU = ['Ibu Sari', 'Bapak Anton', 'Ibu Dewi', 'Bapak Rudi', 'Ibu Lina', 'Bapak Hadi'];

const KONFIG = {
  tk: { nama: 'TK Contoh Harapan', spp: 250000, perKelas: 5, tingkat: ['TK A', 'TK B'], bayar: 0.93 },
  sd: { nama: 'SD Contoh Harapan', spp: 300000, perKelas: 4, tingkat: ['1', '2', '3', '4', '5', '6'], bayar: 0.88 },
  smp: { nama: 'SMP Contoh Harapan', spp: 400000, perKelas: 6, tingkat: ['7', '8', '9'], bayar: 0.81 },
  sma: { nama: 'SMA Contoh Harapan', spp: 500000, perKelas: 6, tingkat: ['10', '11', '12'], bayar: 0.74 },
};

const pad2 = (n) => String(n).padStart(2, '0');

function bulanBerjalan() {
  const [y, m, d] = todayWIB().split('-').map(Number); // m: 1-12
  const awalTA = m >= 7 ? y : y - 1;
  const label = `${awalTA}/${awalTA + 1}`;
  const daftar = [];
  for (let i = 0; ; i++) {
    const mi = (6 + i) % 12; const th = mi >= 6 ? awalTA : awalTA + 1;
    daftar.push({ mi, th });
    if (mi === m - 1 && th === y) break;
    if (i > 11) break;
  }
  return { label, awalTA, daftar, hariIni: d, bulanIni: m - 1, tahunIni: y };
}

export async function isiDataContoh(units, onProgress = () => {}) {
  const ta = bulanBerjalan();
  const langkah = 1 + units.length * 7;
  let selesai = 0;
  const step = async (teks, fn) => { onProgress(teks, selesai / langkah); await fn(); selesai++; onProgress(teks, selesai / langkah); };

  await step('Profil yayasan', () => saveProfilYayasanToSheet({
    'Nama Yayasan': 'Yayasan Pendidikan Contoh', 'Ketua Yayasan': 'Bapak Ketua Contoh',
    Alamat: 'Jl. Pendidikan No. 1, Kota Contoh', Telepon: '0000-000000', Email: 'info@yayasan-contoh.sch.id', Logo: '',
  }, false));

  let urut = 0;
  for (const u of units) {
    const c = KONFIG[u.id];
    if (!c) continue;
    const L = u.label;
    await step(`${L}: profil sekolah`, () => postKeUnit(u.id, { action: 'add', sheet: 'profil', row: { No: 1, 'Nama Sekolah': c.nama, NPSN: '1000000' + urut, Alamat: 'Jl. Pendidikan No. 1, Kota Contoh', 'Kepala Sekolah': 'Kepala ' + c.nama } }));
    await step(`${L}: tahun ajaran`, () => postKeUnit(u.id, { action: 'add', sheet: 'tahunAjaran', row: { Label: ta.label, Mulai: `${ta.awalTA}-07-01`, Selesai: `${ta.awalTA + 1}-06-30`, Aktif: 'TRUE' } }));

    const kelas = c.tingkat.map((t, i) => ({ 'Nama Kelas': `${t}${u.id === 'tk' ? '' : 'A'}`.trim(), Tingkat: t, 'Wali Kelas': GURU[i % GURU.length], Ruang: `${L}-${i + 1}`, Kapasitas: 28 }));
    await step(`${L}: kelas`, () => postKeUnit(u.id, { action: 'bulkAdd', sheet: 'kelas', rows: kelas }));

    const siswa = [];
    kelas.forEach((k) => {
      for (let j = 0; j < c.perKelas; j++) {
        const nama = `${NAMA_DEPAN[urut % NAMA_DEPAN.length]} ${NAMA_BELAKANG[(urut * 3) % NAMA_BELAKANG.length]}`;
        siswa.push({
          'Nama Lengkap': nama, NISN: `${u.id.toUpperCase()}${String(1001 + urut)}`, Jenjang: L,
          'Kelas/Tingkat': k.Tingkat, Rombel: k['Nama Kelas'], 'Jenis Kelamin': urut % 2 ? 'Laki-laki' : 'Perempuan',
          'Tempat Lahir': 'Kota Contoh', Alamat: `Jl. Contoh No. ${urut + 1}`, Status: 'Aktif', 'Jenis Pendaftaran': 'Siswa Baru',
        });
        urut++;
      }
    });
    await step(`${L}: ${siswa.length} siswa`, () => postKeUnit(u.id, { action: 'bulkAdd', sheet: 'siswa', rows: siswa }));

    await step(`${L}: tarif SPP`, () => postKeUnit(u.id, { action: 'add', sheet: 'tarif', row: { 'Tahun Ajaran': ta.label, Jenis: 'SPP', Tipe: 'Bulanan', Nominal: c.spp, Wajib: 'Ya', 'Kelas/Tingkat': 'Semua Kelas', 'Nominal Tetap': 'Ya' } }, 'keuangan'));

    const tagihan = [];
    siswa.forEach(s => ta.daftar.forEach(b => tagihan.push({
      NISN: s.NISN, 'Nama Siswa': s['Nama Lengkap'], 'Tahun Ajaran': ta.label, Bulan: BULAN_ID[b.mi], 'Tahun Kalender': b.th,
      Nominal: c.spp, 'Jatuh Tempo': `${b.th}-${pad2(b.mi + 1)}-10`, Keterangan: '', 'Nominal Tetap': 'Ya',
    })));
    await step(`${L}: ${tagihan.length} tagihan SPP`, () => postKeUnit(u.id, { action: 'bulkAdd', sheet: 'tagihanSpp', rows: tagihan }, 'keuangan'));

    // Pembayaran: pola tetap per unit (tingkat kepatuhan berbeda-beda), tanggal <= hari ini.
    const pembayaran = [];
    tagihan.forEach((t, i) => {
      const acak = ((i * 37 + urut) % 100) / 100;
      if (acak >= c.bayar) return;
      const bi = BULAN_ID.indexOf(t.Bulan);
      const bulanIni = bi === ta.bulanIni && t['Tahun Kalender'] === ta.tahunIni;
      const hari = Math.max(1, Math.min(1 + (i % 9), bulanIni ? ta.hariIni : 28));
      pembayaran.push({
        RefType: 'SPP', RefNo: i + 1, NISN: t.NISN, 'Nama Siswa': t['Nama Siswa'], Jenis: `SPP ${t.Bulan} ${t['Tahun Kalender']}`,
        Nominal: c.spp, 'Tanggal Bayar': `${t['Tahun Kalender']}-${pad2(bi + 1)}-${pad2(hari)}`, Metode: i % 3 ? 'Tunai' : 'Transfer', Keterangan: '', Akun: 'Kas',
      });
    });
    await step(`${L}: ${pembayaran.length} pembayaran`, () => postKeUnit(u.id, { action: 'bulkAdd', sheet: 'pembayaran', rows: pembayaran }, 'keuangan'));
  }
  onProgress('Selesai', 1);
}
