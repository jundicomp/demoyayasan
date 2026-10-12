import { SEMUA_UNIT, isUnitSekolah } from '../config/units';

/**
 * Unit yang sedang dibuka (tk/sd/smp/sma) atau "semua" (tampilan yayasan).
 * Disimpan di localStorage supaya bertahan saat halaman di-refresh. Setiap
 * permintaan ke Google Sheets otomatis membawa unit ini (lihat googleSheets.js),
 * jadi seluruh halaman SPP yang sudah ada otomatis bekerja per unit.
 *
 * Ganti unit = simpan nilai baru lalu muat ulang halaman, supaya semua data
 * di memori pasti berasal dari unit yang baru (tidak ada data unit lain tercampur).
 */
const KEY = 'unitAktif_v1';

function baca() {
  try {
    const v = localStorage.getItem(KEY);
    return v && (v === SEMUA_UNIT || isUnitSekolah(v)) ? v : SEMUA_UNIT;
  } catch {
    return SEMUA_UNIT;
  }
}

let unitAktif = baca();

export const getUnitAktif = () => unitAktif;
export const isModeYayasan = () => unitAktif === SEMUA_UNIT;

export function setUnitAktif(unit) {
  unitAktif = unit === SEMUA_UNIT || isUnitSekolah(unit) ? unit : SEMUA_UNIT;
  try { localStorage.setItem(KEY, unitAktif); } catch { /* diblokir browser -- tetap jalan di memori */ }
}

// Pindah unit + muat ulang aplikasi ke halaman awal unit tsb.
export function pindahUnit(unit) {
  setUnitAktif(unit);
  window.location.hash = unit === SEMUA_UNIT ? '#/dashboard-yayasan' : '#/dashboard';
  window.location.reload();
}
