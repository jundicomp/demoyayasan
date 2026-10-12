export const YAYASAN_FIELDS = [
  { key: 'Nama Yayasan', label: 'Nama Yayasan', type: 'text', required: true },
  { key: 'Ketua Yayasan', label: 'Ketua Yayasan', type: 'text' },
  { key: 'Alamat', label: 'Alamat', type: 'text' },
  { key: 'Telepon', label: 'Telepon', type: 'text' },
  { key: 'Email', label: 'Email', type: 'email' },
];

export function normalizeSheetYayasan(row) {
  return {
    nama: String(row['Nama Yayasan'] ?? '').trim(),
    ketua: String(row['Ketua Yayasan'] ?? '').trim(),
    alamat: String(row['Alamat'] ?? '').trim(),
    telepon: String(row['Telepon'] ?? '').trim(),
    email: String(row['Email'] ?? '').trim(),
    logo: row['Logo'] ? String(row['Logo']) : null,
  };
}
