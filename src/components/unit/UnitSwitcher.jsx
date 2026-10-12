import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UNITS, SEMUA_UNIT, getUnit, isUnitSekolah } from '../../config/units';
import { getUnitAktif, pindahUnit } from '../../services/unitAktif';

// Pemilih unit di header. Akun yayasan bisa berpindah unit; akun unit terkunci.
export default function UnitSwitcher() {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const aktif = getUnitAktif();
  const u = getUnit(aktif);
  const terkunci = isUnitSekolah(currentUser?.unit);

  useEffect(() => {
    if (!open) return;
    const tutup = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', tutup);
    return () => document.removeEventListener('mousedown', tutup);
  }, [open]);

  const label = u ? `Unit ${u.label}` : 'Semua Unit';
  const style = u ? { background: u.warna, borderColor: u.warna, color: '#fff' } : undefined;

  if (terkunci) {
    return <div className="unit-pill" style={style} data-tour="unit" title="Akun Anda khusus unit ini">{label} <span aria-hidden>🔒</span></div>;
  }

  return (
    <div className="unit-switch" ref={ref} data-tour="unit">
      <button type="button" className="unit-pill" style={style} onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}>
        {label} <span aria-hidden>▾</span>
      </button>
      {open && (
        <div className="unit-menu" role="listbox">
          <button type="button" className={aktif === SEMUA_UNIT ? 'on' : ''} onClick={() => pindahUnit(SEMUA_UNIT)}>
            <span className="unit-dot" style={{ background: '#123D22' }} />Semua Unit <small>rekap yayasan</small>
          </button>
          {UNITS.map(x => (
            <button type="button" key={x.id} className={aktif === x.id ? 'on' : ''} onClick={() => pindahUnit(x.id)}>
              <span className="unit-dot" style={{ background: x.warna }} />Unit {x.label} <small>{x.nama}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
