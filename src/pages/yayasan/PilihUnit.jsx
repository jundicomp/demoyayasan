import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SEMUA_UNIT, isUnitSekolah } from '../../config/units';
import { pindahUnit } from '../../services/unitAktif';

// Route bantu: /pilih-unit/:unitId -> pindah unit (dipakai menu sidebar/tablet/HP).
export default function PilihUnit() {
  const { unitId } = useParams();
  const { currentUser } = useAuth();
  const boleh = !isUnitSekolah(currentUser?.unit) && (unitId === SEMUA_UNIT || isUnitSekolah(unitId));
  useEffect(() => { if (boleh) pindahUnit(unitId); }, [boleh, unitId]);
  if (!boleh) return <Navigate to="/" replace />;
  return <div className="content"><p style={{ color: 'var(--muted)' }}>Membuka unit...</p></div>;
}
