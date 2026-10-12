import { useState } from 'react';
import Modal from './Modal';

// Di atas batas ini, teks dipotong + muncul tombol "Selengkapnya" yg membuka
// modal isi lengkapnya. Sengaja pakai tombol (bukan cuma tooltip/hover) supaya
// tetap bisa dibuka di tablet/layar sentuh, bukan cuma di desktop.
const BATAS_KARAKTER = 26;

/**
 * Renderer sel tabel default (dipakai DataTable utk kolom TANPA `render` custom).
 * Tujuannya supaya 1 baris tabel SELALU tampil 1 baris -- teks pendek apa adanya
 * (no-wrap), teks panjang (alamat, keterangan, detail log, dst) dipotong +
 * tombol "Selengkapnya".
 */
export default function LongTextCell({ value, label }) {
  const [open, setOpen] = useState(false);

  if (value === null || value === undefined || value === '') return null;
  const text = String(value);

  if (text.length <= BATAS_KARAKTER) {
    return <span className="cell-nowrap">{text}</span>;
  }

  return (
    <span className="cell-longtext">
      <span className="cell-nowrap cell-truncate">{text}</span>
      <button type="button" className="link-more" onClick={() => setOpen(true)}>Selengkapnya</button>
      {open && (
        <Modal title={label || 'Detail'} onClose={() => setOpen(false)}>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0, fontSize: 13.5 }}>{text}</p>
        </Modal>
      )}
    </span>
  );
}
