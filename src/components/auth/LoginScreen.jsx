import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppContext';
import ConnectionStatusBadge from './ConnectionStatusBadge';
import { LogoBawaan, namaSekolahAtauDefault } from '../brand/SchoolBrand';

export default function LoginScreen() {
  const { login, loginError, loggingIn } = useAuth();
  const { profilSekolah } = useAppData();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [checkingConnection, setCheckingConnection] = useState(true);

  async function submit(e) {
    e.preventDefault();
    await login(username, password);
  }

  return (
    <div className="login-screen">
      <div className="login-box">
        {profilSekolah?.logo ? (
          <img src={profilSekolah.logo} alt="Logo Sekolah" style={{ width: 64, height: 64, objectFit: 'contain', margin: '0 auto' }} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}><LogoBawaan nama={profilSekolah?.nama} size={64} /></div>
        )}
        <h2>{namaSekolahAtauDefault(profilSekolah)}</h2>
        <p className="login-sub">Platform SPP Yayasan</p>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <ConnectionStatusBadge onDone={() => setCheckingConnection(false)} />
        </div>

        {checkingConnection ? (
          <div style={{ padding: '18px 0 6px', textAlign: 'center' }}>
            <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>Memeriksa koneksi sebelum masuk...</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="field" style={{ marginBottom: 14, textAlign: 'left' }}>
              <label>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username Anda" />
            </div>
            <div className="field" style={{ marginBottom: 14, textAlign: 'left' }}>
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loggingIn}>
              {loggingIn ? 'Memeriksa akun...' : 'Masuk'}
            </button>
          </form>
        )}

        {loginError && <p className="login-error">{loginError}</p>}
        <div className="login-demo">
          <b>Akun demo</b> · password <code>123456</code>
          <div><code>demo</code> Admin Yayasan (semua unit)</div>
          <div><code>demo-tk</code> <code>demo-sd</code> <code>demo-smp</code> <code>demo-sma</code> Admin per unit</div>
        </div>
      </div>
    </div>
  );
}
