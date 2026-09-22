import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <h1>WASTEFLOW</h1>
        <p className="sub">Galle District Solid Waste Operations &amp; Monitoring System</p>

        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="driver"
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>

        {error ? <div className="notice error">{error}</div> : null}

        <button className="primary-block" type="submit" disabled={loading}>
          {loading ? 'SIGNING IN…' : 'SIGN IN'}
        </button>

        <div className="demo-accounts">
          <strong>Demo accounts</strong> (synthetic — work with or without a backend):
          <br />
          <code>driver/driver123</code> · <code>supervisor/super123</code> ·{' '}
          <code>receiving/receiving123</code> · <code>processing/processing123</code> ·{' '}
          <code>officer/officer123</code> · <code>admin/admin123</code>
        </div>
      </form>
    </div>
  );
}
