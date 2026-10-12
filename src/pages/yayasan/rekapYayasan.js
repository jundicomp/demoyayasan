import { normalizeSheetSiswa } from '../../db/siswaFields';
import { normalizeSheetTahunAjaran } from '../../db/tahunAjaranFields';
import { normalizeSheetProfil } from '../../db/profilFields';
import { normalizeSheetTagihanSpp, normalizeSheetTagihanLain, hitungTerbayar } from '../../db/tagihanHelpers';
import { normalizeSheetPembayaran } from '../../db/pembayaranFields';
import { normalizeSheetBeasiswaKategori, normalizeSheetBeasiswaSiswa, nominalEfektifTagihan } from '../../db/beasiswaFields';
import { pembayaranAsli } from '../../db/laporanHelpers';
import { BULAN_ID, BULAN_SHORT, parseTanggalFleksibel, todayWIB } from '../../db/helpers';

/**
 * Hitung ringkasan SATU unit dari data mentah hasil fetchMultiUnit().
 * Logika tunggakan SAMA dengan halaman Rekap Tunggakan di unit (sisa > 0 dan
 * sudah lewat jatuh tempo, memperhitungkan potongan beasiswa & pemutihan).
 */
export function rekapUnit(master = {}, keuangan = {}, sekarang = new Date(todayWIB() + 'T12:00:00')) {
  const siswa = (master.siswa || []).map(normalizeSheetSiswa);
  const siswaAktif = siswa.filter(s => (s.status || 'Aktif') === 'Aktif');
  const tahunAktif = (master.tahunAjaran || []).map(normalizeSheetTahunAjaran).find(t => t.aktif) || null;
  const profil = (master.profil || [])[0] ? normalizeSheetProfil(master.profil[0]) : null;

  const tagihan = [
    ...(keuangan.tagihanSpp || []).map(normalizeSheetTagihanSpp),
    ...(keuangan.tagihanLain || []).map(normalizeSheetTagihanLain),
  ];
  const pembayaran = (keuangan.pembayaran || []).map(normalizeSheetPembayaran);
  const bKat = (keuangan.beasiswaKategori || []).map(normalizeSheetBeasiswaKategori);
  const bSis = (keuangan.beasiswaSiswa || []).map(normalizeSheetBeasiswaSiswa);
  const cutoff = sekarang.getTime();

  const bulanNama = BULAN_ID[sekarang.getMonth()];
  const tahunNow = sekarang.getFullYear();
  let tagihanBulanIni = 0, terbayarBulanIni = 0, tunggakan = 0;
  const penunggak = new Set();

  tagihan.forEach(t => {
    const terbayar = hitungTerbayar(pembayaran, t.refType, t.no, t.nisn);
    const { nominalEfektif } = nominalEfektifTagihan(t, bSis, bKat, cutoff, terbayar);
    if (t.refType === 'SPP' && String(t.bulan) === bulanNama && Number(t.tahunKalender) === tahunNow) {
      tagihanBulanIni += nominalEfektif;
      terbayarBulanIni += Math.min(terbayar, nominalEfektif);
    }
    const jt = parseTanggalFleksibel(t.jatuhTempo);
    const sisa = nominalEfektif - terbayar;
    if (sisa > 0 && jt && jt.getTime() < cutoff) { tunggakan += sisa; penunggak.add(t.nisn); }
  });

  // Pemasukan 6 bulan terakhir (pembayaran asli, tanpa pemutihan)
  const asli = pembayaranAsli(pembayaran);
  const tren = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(tahunNow, sekarang.getMonth() - i, 1);
    const total = asli.filter(p => {
      const x = parseTanggalFleksibel(p.tanggalBayar);
      return x && x.getMonth() === d.getMonth() && x.getFullYear() === d.getFullYear();
    }).reduce((s, p) => s + p.nominal, 0);
    tren.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: `${BULAN_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, total });
  }

  return {
    namaSekolah: profil?.nama || '',
    tahunAktif: tahunAktif?.label || '',
    siswaAktif: siswaAktif.length,
    tagihanBulanIni, terbayarBulanIni,
    kepatuhan: tagihanBulanIni > 0 ? terbayarBulanIni / tagihanBulanIni : null,
    pemasukanBulanIni: tren[tren.length - 1].total,
    tunggakan, jumlahPenunggak: penunggak.size,
    tren,
  };
}

export const SHEETS_MASTER = ['siswa', 'tahunAjaran', 'profil'];
export const SHEETS_KEUANGAN = ['tagihanSpp', 'tagihanLain', 'pembayaran', 'beasiswaKategori', 'beasiswaSiswa'];
