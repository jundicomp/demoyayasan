import { useEffect, useState } from 'react';
import { LOGO_MAX_BYTES } from '../../db/profilFields';
import { YAYASAN_FIELDS } from '../../db/yayasanFields';
import Page from '../../components/layout/Page';
import { saveProfilYayasanToSheet, isConfigured } from '../../services/googleSheets';
import { useAppData } from '../../context/AppContext';
import SaveProgressModal from '../../components/common/SaveProgressModal';

const kosong = () => ({ 'Nama Yayasan': '', 'Ketua Yayasan': '', 'Alamat': '', 'Telepon': '', 'Email': '', 'Logo': '' });

// Profil yayasan -- tampil di halaman login, sidebar "Semua Unit", Dashboard Yayasan,
// dan jadi cadangan nama/logo unit yang profil sekolahnya belum diisi.
export default function ProfilYayasan() {
  const { profilYayasan, profilYayasanExists, refreshProfilYayasan, toast } = useAppData();
  const [form, setForm] = useState(kosong());
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState(null);

  useEffect(() => {
    if (profilYayasan) {
      setForm({
        'Nama Yayasan': profilYayasan.nama || '',
        'Ketua Yayasan': profilYayasan.ketua || '',
        'Alamat': profilYayasan.alamat || '',
        'Telepon': profilYayasan.telepon || '',
        'Email': profilYayasan.email || '',
        'Logo': profilYayasan.logo || '',
      });
    }
  }, [profilYayasan]);

  function setField(key, value) { setForm(f => ({ ...f, [key]: value })); }

  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('File harus berupa gambar.', 'error'); return; }
    if (file.size > LOGO_MAX_BYTES) {
      toast(`Ukuran logo maksimal ${Math.round(LOGO_MAX_BYTES / 1024)}KB (batasan sel Google Sheets). Kompres/perkecil dulu gambarnya.`, 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => setField('Logo', evt.target.result);
    reader.readAsDataURL(file);
  }

  async function submit(e) {
    e.preventDefault();
    if (!isConfigured()) { toast('Atur koneksi Google Sheets dulu (menu Pengaturan Koneksi).', 'error'); return; }
    const wajib = YAYASAN_FIELDS.find(f => f.required && !String(form[f.key]).trim());
    if (wajib) { toast(`${wajib.label} wajib diisi.`, 'error'); return; }
    setSaving(true);
    setPhase('saving');
    try {
      await saveProfilYayasanToSheet(form, profilYayasanExists);
      setPhase('done');
      await new Promise(r => setTimeout(r, 1100));
      await refreshProfilYayasan();
      toast('Profil yayasan tersimpan.');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
      setPhase(null);
    }
  }

  return (
    <Page pageId="profil-yayasan" title="Profil Yayasan" path="Yayasan / Profil Yayasan">
    <div className="card">
      <div className="card-head">
        <div><h3>Profil Yayasan</h3><p>Identitas yayasan — tampil di halaman login, tampilan Semua Unit, dan Dashboard Yayasan. Profil tiap sekolah diatur di dalam unit masing-masing.</p></div>
      </div>
      <form onSubmit={submit}>
        <div className="card-body">
          <div className="field span2" style={{ marginBottom: 18 }}>
            <label>Logo Yayasan</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 72, height: 72, border: '1px dashed var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#F6F8F5', flexShrink: 0 }}>
                {form['Logo'] ? <img src={form['Logo']} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 11, color: 'var(--muted)' }}>Belum ada</span>}
              </div>
              <div>
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ fontSize: 12.5 }} />
                <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '6px 0 0' }}>
                  Maks {Math.round(LOGO_MAX_BYTES / 1024)}KB — disimpan langsung di sel Google Sheets, jadi ukurannya dibatasi.
                </p>
                {form['Logo'] && <button type="button" className="btn btn-sm" style={{ marginTop: 6 }} onClick={() => setField('Logo', '')}>↺ Hapus Logo</button>}
              </div>
            </div>
          </div>

          <div className="form-grid">
            {YAYASAN_FIELDS.map(f => (
              <div key={f.key} className="field">
                <label>{f.label}{f.required && <span style={{ color: 'var(--red)' }}> *</span>}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
        <div className="card-body" style={{ borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Profil Yayasan'}</button>
        </div>
      </form>
      {phase && <SaveProgressModal phase={phase} />}
    </div>
    </Page>
  );
}
