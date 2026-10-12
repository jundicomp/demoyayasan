import { useEffect } from 'react';
import { useAppData } from '../../context/AppContext';
import { initials } from '../../db/helpers';

// Nama tampilan bawaan kalau Profil Sekolah belum diisi (versi demo / instalasi baru).
export const NAMA_DEFAULT = 'SPP Yayasan';

export function namaSekolahAtauDefault(profilSekolah) {
  return (profilSekolah?.nama || '').trim() || NAMA_DEFAULT;
}

// Logo lingkaran bawaan: inisial nama sekolah (mis. "SN" utk "SD Nusantara"),
// atau "SPP" kalau Profil Sekolah belum diisi. Dipakai kalau logo belum di-upload.
export function LogoBawaan({ nama, size = 48 }) {
  const teks = (nama || '').trim() ? initials(nama) : 'SPP';
  const fontSize = teks.length > 2 ? 13 : 17;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <circle cx="24" cy="24" r="21" fill="#1C7A3C" />
      <text x="24" y="25" textAnchor="middle" dominantBaseline="central" fontFamily="Arial, sans-serif" fontSize={fontSize} fontWeight="800" fill="#F0B429">{teks}</text>
    </svg>
  );
}

// Sinkronkan judul tab browser + favicon dgn Profil Sekolah (nama & logo).
export function BrandSync() {
  const { profilSekolah } = useAppData();
  const nama = (profilSekolah?.nama || '').trim();
  const logo = profilSekolah?.logo;

  useEffect(() => {
    document.title = nama ? `${nama} — SPP Yayasan` : `${NAMA_DEFAULT} — Platform SPP`;
  }, [nama]);

  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    if (!link.dataset.default) link.dataset.default = link.getAttribute('href') || '';
    if (logo) {
      link.removeAttribute('type');
      link.href = logo;
    } else {
      link.setAttribute('type', 'image/svg+xml');
      link.href = link.dataset.default;
    }
  }, [logo]);

  return null;
}
