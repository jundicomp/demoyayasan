import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Page from '../components/layout/Page';
import { useAppData } from '../context/AppContext';
import NotifikasiSiswaPerluTindakLanjut from '../components/common/NotifikasiSiswaPerluTindakLanjut';
import { rekapPemasukanBulanan, rekapPengeluaranBulanan, pembayaranAsli } from '../db/laporanHelpers';
import { formatRupiah, todayWIB } from '../db/helpers';
import InfoCard from '../components/common/InfoCard';
import {
  IconGraduationCap, IconBuilding, IconUsers, IconTrendUp, IconTrendDown,
  IconAlertCircle,
} from '../components/common/icons';

const WARNA_LP = ['#2563eb', '#7e3af2']; // Laki-laki, Perempuan

export default function Dashboard() {
  const {
    siswa, siswaLoading, siswaError, siswaLoaded, refreshSiswa, kelas, guru, tahunAjaranAktif,
    allTagihan, tagihanTerbayar, pembayaran, pembayaranLoaded, pengeluaran, pengeluaranLoaded, pemasukanLain,
  } = useAppData();

  const siswaAktif = useMemo(() => siswa.filter(s => (s.status || 'Aktif') === 'Aktif'), [siswa]);

  const stats = useMemo(() => {
    const perTingkat = {};
    const perGender = { 'Laki-laki': 0, 'Perempuan': 0, '-': 0 };
    siswaAktif.forEach(s => {
      const t = s.kelasTingkat || '-';
      perTingkat[t] = (perTingkat[t] || 0) + 1;
      const g = s.jenisKelamin === 'Laki-laki' || s.jenisKelamin === 'Perempuan' ? s.jenisKelamin : '-';
      perGender[g] += 1;
    });
    return { total: siswaAktif.length, perTingkat, perGender };
  }, [siswaAktif]);

  const tingkatList = Object.keys(stats.perTingkat).sort();
  const dataChartKelas = tingkatList.map(t => ({ kelas: `Kelas ${t}`, Siswa: stats.perTingkat[t] }));
  const dataChartGender = [
    { name: 'Laki-laki', value: stats.perGender['Laki-laki'] },
    { name: 'Perempuan', value: stats.perGender['Perempuan'] },
  ].filter(d => d.value > 0);

  // ==== Ringkasan Keuangan (bulan berjalan + tren 12 bulan, sesuai Laporan Keuangan) ====
  const keuanganSiap = tahunAjaranAktif && pembayaranLoaded && pengeluaranLoaded;
  const rekapKeuangan = useMemo(() => {
    if (!keuanganSiap) return null;
    const pemasukanBulanan = rekapPemasukanBulanan(tahunAjaranAktif.label, pembayaran, pemasukanLain);
    const pengeluaranBulanan = rekapPengeluaranBulanan(tahunAjaranAktif.label, pengeluaran);
    const [tahunIni, bulanIni] = todayWIB().split('-').map(Number); // yyyy-MM-dd -> [yyyy, MM]
    const bulanBerjalan = pemasukanBulanan.find(b => b.monthIdx === bulanIni - 1 && b.calYear === tahunIni);
    const pengeluaranBerjalan = pengeluaranBulanan.find(b => b.monthIdx === bulanIni - 1 && b.calYear === tahunIni);
    const dataChart = pemasukanBulanan.map((b, i) => ({
      bulan: b.label.split(' ')[0].slice(0, 3),
      Pemasukan: b.total,
      Pengeluaran: pengeluaranBulanan[i]?.total || 0,
    }));
    return {
      pemasukanBulanIni: bulanBerjalan?.total || 0,
      pengeluaranBulanIni: pengeluaranBerjalan?.total || 0,
      dataChart,
    };
  }, [keuanganSiap, tahunAjaranAktif, pembayaran, pengeluaran, pemasukanLain]);

  const tunggakan = useMemo(() => {
    return allTagihan.reduce((s, t) => {
      const sisa = t.nominal - tagihanTerbayar(t.refType, t.no, t.nisn);
      return s + (sisa > 0 ? sisa : 0);
    }, 0);
  }, [allTagihan, tagihanTerbayar]);

  return (
    <Page pageId="dashboard" title="Dashboard" path="Dashboard">
      <NotifikasiSiswaPerluTindakLanjut />

      {(kelas.length > 0 || guru.length > 0) && (
        <div className="info-grid" style={{ marginBottom: 20 }}>
          <InfoCard icon={IconGraduationCap} color="c-blue" value={guru.filter(g => g.status === 'Aktif').length} label="Guru & Staff Aktif" />
          <InfoCard icon={IconBuilding} color="c-purple" value={kelas.length} label="Kelas & Rombel" />
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <div><h3>📋 Data Siswa</h3><p>Diambil langsung dari Google Sheets — tahun ajaran aktif {tahunAjaranAktif?.label}.</p></div>
          <button className="btn btn-sm" onClick={refreshSiswa} disabled={siswaLoading}>{siswaLoading ? 'Memuat...' : '↻ Muat Ulang'}</button>
        </div>
        <div className="card-body">
          {siswaLoading && !siswaLoaded && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat data siswa...</p>}
          {siswaError && <p style={{ color: 'var(--red)', fontSize: 13 }}>Gagal memuat: {siswaError}</p>}
          {!siswaLoading && siswaLoaded && siswaAktif.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Belum ada siswa aktif tersimpan. Tambahkan lewat menu Data Siswa.</p>
          )}
          {siswaLoaded && siswaAktif.length > 0 && (
            <>
              <div className="info-grid" style={{ marginBottom: 20 }}>
                <InfoCard icon={IconUsers} color="c-green" value={stats.total} label="Total Siswa Aktif" />
                <InfoCard icon={IconUsers} color="c-blue" value={stats.perGender['Laki-laki']} label="Laki-laki" />
                <InfoCard icon={IconUsers} color="c-purple" value={stats.perGender['Perempuan']} label="Perempuan" />
              </div>

              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>
                <div style={{ flex: '2 1 340px', minWidth: 280 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>Sebaran per Kelas / Tingkat</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dataChartKelas}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="kelas" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="Siswa" fill="#16794a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: '1 1 220px', minWidth: 220 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>Jenis Kelamin</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={dataChartGender} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                        {dataChartGender.map((_, i) => <Cell key={i} fill={WARNA_LP[i % WARNA_LP.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>Sebaran per Kelas / Tingkat (angka)</div>
              <div className="kelas-grid">
                {tingkatList.map((t, i) => {
                  const gradients = [
                    'linear-gradient(135deg, var(--green), var(--green-dark))',
                    'linear-gradient(135deg, #3868C9, #123a7a)',
                    'linear-gradient(135deg, var(--purple), var(--purple-dark))',
                    'linear-gradient(135deg, #E0645F, #8f2c1f)',
                    'linear-gradient(135deg, #D9A441, #8a5b00)',
                    'linear-gradient(135deg, #16794a, #0d4a2c)',
                  ];
                  return (
                    <div key={t} className="kelas-card" style={{ background: gradients[i % gradients.length] }}>
                      <div className="val">{stats.perTingkat[t]}</div>
                      <div className="lbl">Kelas {t}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div><h3>💰 Ringkasan Keuangan</h3><p>Pemasukan vs pengeluaran sepanjang tahun ajaran {tahunAjaranAktif?.label}.</p></div></div>
        <div className="card-body">
          {!keuanganSiap && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat data keuangan...</p>}
          {keuanganSiap && (
            <>
              <div className="info-grid" style={{ marginBottom: 20 }}>
                <InfoCard icon={IconTrendUp} color="c-green" value={formatRupiah(rekapKeuangan.pemasukanBulanIni)} label="Pemasukan Bulan Ini" valueFontSize={20} />
                <InfoCard icon={IconTrendDown} color="c-red" value={formatRupiah(rekapKeuangan.pengeluaranBulanIni)} label="Pengeluaran Bulan Ini" valueFontSize={20} />
                <InfoCard icon={IconAlertCircle} color="c-gold" value={formatRupiah(tunggakan)} label="Total Tunggakan Aktif" valueFontSize={20} />
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={rekapKeuangan.dataChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                  <Tooltip formatter={(v) => formatRupiah(v)} />
                  <Legend />
                  <Bar dataKey="Pemasukan" fill="#16794a" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Pengeluaran" fill="#c0392b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>

    </Page>
  );
}
