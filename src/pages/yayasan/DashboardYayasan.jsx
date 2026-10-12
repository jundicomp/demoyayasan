import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import Page from '../../components/layout/Page';
import InfoCard from '../../components/common/InfoCard';
import { IconUsers, IconTrendUp, IconAlertCircle, IconReceipt } from '../../components/common/icons';
import { useAppData } from '../../context/AppContext';
import { UNITS } from '../../config/units';
import { fetchMultiUnit, isConfigured } from '../../services/googleSheets';
import { pindahUnit } from '../../services/unitAktif';
import { formatRupiah, BULAN_ID, todayWIB } from '../../db/helpers';
import { exportToExcel } from '../../utils/exportTable';
import { rekapUnit, SHEETS_MASTER, SHEETS_KEUANGAN } from './rekapYayasan';
import { isiDataContoh } from './dataContoh';

const jt = (n) => 'Rp ' + (n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
const persen = (x) => (x === null ? '–' : Math.round(x * 100) + '%');

export default function DashboardYayasan() {
  const { profilYayasan, toast } = useAppData();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isi, setIsi] = useState(null); // { teks, persen } saat mengisi data contoh

  async function jalankanDataContoh() {
    if (!window.confirm('Isi semua unit dengan DATA CONTOH fiktif? Cocok untuk demo. Lanjutkan?')) return;
    setIsi({ teks: 'Memulai...', persen: 0 });
    try {
      await isiDataContoh(UNITS, (teks, p) => setIsi({ teks, persen: Math.round(p * 100) }));
      toast('Data contoh berhasil diisi ke semua unit.');
      setIsi(null);
      window.location.reload(); // muat ulang supaya profil yayasan & semua data ikut terbaca
    } catch (err) {
      toast('Gagal mengisi data contoh: ' + err.message, 'error');
      setIsi(null);
      muat();
    }
  }

  const muat = useCallback(async () => {
    if (!isConfigured('master') || !isConfigured('keuangan')) { setError('Koneksi Google Sheets belum diatur.'); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const ids = UNITS.map(u => u.id);
      const [m, k] = await Promise.all([fetchMultiUnit(ids, SHEETS_MASTER, 'master'), fetchMultiUnit(ids, SHEETS_KEUANGAN, 'keuangan')]);
      setData(UNITS.map(u => ({ unit: u, ...rekapUnit(m[u.id], k[u.id]) })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { muat(); }, [muat]);

  const total = useMemo(() => {
    if (!data) return null;
    const sum = (k) => data.reduce((s, d) => s + d[k], 0);
    const tagihan = sum('tagihanBulanIni'), terbayar = sum('terbayarBulanIni');
    return {
      siswa: sum('siswaAktif'), tagihan, terbayar, pemasukan: sum('pemasukanBulanIni'),
      tunggakan: sum('tunggakan'), penunggak: sum('jumlahPenunggak'),
      kepatuhan: tagihan > 0 ? terbayar / tagihan : null,
      tren: data[0].tren.map((t, i) => ({ label: t.label, ...Object.fromEntries(data.map(d => [d.unit.label, d.tren[i].total])) })),
    };
  }, [data]);

  const bulanIni = BULAN_ID[new Date(todayWIB() + 'T12:00:00').getMonth()];
  const chartUnit = data ? data.map(d => ({ unit: d.unit.label, Tagihan: d.tagihanBulanIni, Terbayar: d.terbayarBulanIni, warna: d.unit.warna })) : [];

  function unduh() {
    if (!data) return;
    const rows = data.map(d => ({
      Unit: d.unit.label, 'Nama Sekolah': d.namaSekolah || '-', 'Siswa Aktif': d.siswaAktif,
      [`Tagihan SPP ${bulanIni}`]: d.tagihanBulanIni, [`Terbayar ${bulanIni}`]: d.terbayarBulanIni,
      Kepatuhan: persen(d.kepatuhan), [`Pemasukan ${bulanIni}`]: d.pemasukanBulanIni,
      Tunggakan: d.tunggakan, 'Siswa Menunggak': d.jumlahPenunggak,
    }));
    rows.push({ Unit: 'TOTAL', 'Nama Sekolah': '', 'Siswa Aktif': total.siswa, [`Tagihan SPP ${bulanIni}`]: total.tagihan, [`Terbayar ${bulanIni}`]: total.terbayar, Kepatuhan: persen(total.kepatuhan), [`Pemasukan ${bulanIni}`]: total.pemasukan, Tunggakan: total.tunggakan, 'Siswa Menunggak': total.penunggak });
    exportToExcel(Object.keys(rows[0]), rows, 'Rekap Yayasan', `Rekap ${profilYayasan?.nama || 'Yayasan'} - ${todayWIB()}`);
    toast('Rekap yayasan diunduh.');
  }

  return (
    <Page pageId="dashboard-yayasan" title="Dashboard Yayasan" path="Yayasan / Dashboard">
      {loading && <div className="card"><div className="card-body" style={{ color: 'var(--muted)' }}>Mengumpulkan data dari {UNITS.length} unit...</div></div>}
      {error && !loading && (
        <div className="card"><div className="card-body" style={{ color: 'var(--red)' }}>Gagal memuat rekap: {error} <button className="btn btn-sm" onClick={muat} style={{ marginLeft: 8 }}>Coba lagi</button></div></div>
      )}

      {data && total && total.siswa === 0 && (
        <div className="card">
          <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px' }}>
              <h3 style={{ margin: 0 }}>Belum ada data di unit mana pun</h3>
              <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: 13 }}>
                Mulai dengan mengisi tiap unit lewat menu Unit Sekolah, atau isi semua unit dengan data contoh fiktif untuk keperluan demo
                (profil, kelas, siswa, tarif, tagihan SPP sejak Juli, dan pembayaran).
              </p>
              {isi && (
                <div style={{ marginTop: 10 }}>
                  <div className="yys-bar" style={{ width: '100%', height: 10 }}><i style={{ width: `${isi.persen}%`, background: '#1C7A3C' }} /></div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{isi.persen}% · {isi.teks}</div>
                </div>
              )}
            </div>
            <button className="btn btn-primary" onClick={jalankanDataContoh} disabled={!!isi}>{isi ? 'Mengisi...' : '✨ Isi Data Contoh'}</button>
          </div>
        </div>
      )}

      {data && total && total.siswa > 0 && (
        <>
          <div className="info-grid-4 yys-kpi">
            <InfoCard icon={IconUsers} color="c-green" value={total.siswa.toLocaleString('id-ID')} label={`Siswa aktif · ${UNITS.length} unit`} />
            <InfoCard icon={IconTrendUp} color="c-blue" value={jt(total.pemasukan)} label={`Pemasukan ${bulanIni}`} />
            <InfoCard icon={IconAlertCircle} color="c-red" value={jt(total.tunggakan)} label={`Tunggakan · ${total.penunggak} siswa`} />
            <InfoCard icon={IconReceipt} color="c-gold" value={persen(total.kepatuhan)} label={`Kepatuhan SPP ${bulanIni}`} />
          </div>

          <div className="yys-grid">
            <div className="card">
              <div className="card-head"><div><h3>Tagihan vs terbayar per unit</h3><p>SPP bulan {bulanIni} — persentase = tingkat kepatuhan bayar</p></div></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartUnit} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="unit" />
                    <YAxis tickFormatter={(v) => (v / 1e6) + ' jt'} width={56} />
                    <Tooltip formatter={(v) => formatRupiah(v)} />
                    <Legend />
                    <Bar dataKey="Tagihan" fill="#C9D6CD" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Terbayar" fill="#1C7A3C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><div><h3>Tren pemasukan</h3><p>6 bulan terakhir, per unit</p></div></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={total.tren} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(v) => (v / 1e6) + ' jt'} width={56} />
                    <Tooltip formatter={(v) => formatRupiah(v)} />
                    <Legend />
                    {UNITS.map(u => <Line key={u.id} type="monotone" dataKey={u.label} stroke={u.warna} strokeWidth={2.5} dot={{ r: 3 }} />)}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div><h3>Ringkasan per unit</h3><p>Klik tombol “Buka” untuk masuk ke unit tersebut</p></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm" onClick={muat}>↻ Muat Ulang</button>
                <button className="btn btn-sm" onClick={unduh}>📊 Excel</button>
              </div>
            </div>
            <div className="card-body" style={{ overflowX: 'auto' }}>
              <table className="yys-table">
                <thead><tr><th>Unit</th><th>Siswa</th><th>Tagihan {bulanIni}</th><th>Terbayar</th><th>Kepatuhan</th><th>Pemasukan</th><th>Tunggakan</th><th></th></tr></thead>
                <tbody>
                  {data.map(d => (
                    <tr key={d.unit.id}>
                      <td><span className="unit-dot" style={{ background: d.unit.warna, marginRight: 8 }} /><b>{d.unit.label}</b>{d.namaSekolah && <div className="yys-sub">{d.namaSekolah}</div>}</td>
                      <td>{d.siswaAktif}</td>
                      <td>{formatRupiah(d.tagihanBulanIni)}</td>
                      <td>{formatRupiah(d.terbayarBulanIni)}</td>
                      <td>
                        <span className="yys-bar"><i style={{ width: `${Math.round((d.kepatuhan || 0) * 100)}%`, background: d.unit.warna }} /></span>
                        {persen(d.kepatuhan)}
                      </td>
                      <td>{formatRupiah(d.pemasukanBulanIni)}</td>
                      <td style={{ color: d.tunggakan > 0 ? 'var(--red)' : undefined, fontWeight: 700 }}>{formatRupiah(d.tunggakan)}</td>
                      <td><button className="btn btn-sm" onClick={() => pindahUnit(d.unit.id)}>Buka →</button></td>
                    </tr>
                  ))}
                  <tr className="yys-total">
                    <td>Total</td><td>{total.siswa}</td><td>{formatRupiah(total.tagihan)}</td><td>{formatRupiah(total.terbayar)}</td>
                    <td>{persen(total.kepatuhan)}</td><td>{formatRupiah(total.pemasukan)}</td><td style={{ color: 'var(--red)' }}>{formatRupiah(total.tunggakan)}</td><td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Page>
  );
}
