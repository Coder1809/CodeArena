import { useState } from 'react';
import { Swords } from 'lucide-react';
import API_BASE_URL from '../config';

export default function Login({ setToken, setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cfHandle, setCfHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    const payload = isRegister 
      ? { username, email, password, cfHandle }
      : { email, password };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setToken(data.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '5rem auto', width: '100%' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'var(--accent-gradient)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          boxShadow: '0 8px 24px var(--accent-glow)'
        }}>
          <Swords size={32} color="#ffffff" />
        </div>
        <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Code Arena</h1>
        <p className="subtitle" style={{ marginBottom: '1.75rem' }}>
          {isRegister ? 'Create your arena profile' : 'Sign in to challenge competitors'}
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            padding: '0.75rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="label">Username</label>
              <input
                type="text"
                placeholder="codemaster"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="label">Email Address</label>
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegister && (
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="label">Codeforces Handle (Optional)</label>
              <input
                type="text"
                placeholder="tourist"
                value={cfHandle}
                onChange={e => setCfHandle(e.target.value)}
              />
            </div>
          )}

          <button type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Processing...' : (isRegister ? 'Register Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isRegister ? (
            <p>Already have an account? <span style={{ color: '#a78bfa', cursor: 'pointer', fontWeight: 600 }} onClick={() => setIsRegister(false)}>Sign In</span></p>
          ) : (
            <p>Don't have an account? <span style={{ color: '#a78bfa', cursor: 'pointer', fontWeight: 600 }} onClick={() => setIsRegister(true)}>Register</span></p>
          )}
        </div>
      </div>
    </div>
  );
}
