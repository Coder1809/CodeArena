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
    <div className="page-wrapper page-wrapper--narrow">
      <div className="card">
        <div className="page-header">
          <div className="page-header__icon">
            <Swords size={28} color="var(--accent)" />
          </div>
          <h1 className="page-header__title">Code Arena</h1>
          <p className="page-header__subtitle">
            {isRegister ? 'Create your arena profile' : 'Sign in to challenge competitors'}
          </p>
        </div>

        {error && (
          <div className="alert alert--error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="label" htmlFor="login-username">Username</label>
              <input
                id="login-username"
                type="text"
                placeholder="codemaster"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          )}

          <div className="form-group">
            <label className="label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="label" htmlFor="login-cf">Codeforces Handle (Optional)</label>
              <input
                id="login-cf"
                type="text"
                placeholder="tourist"
                value={cfHandle}
                onChange={e => setCfHandle(e.target.value)}
                autoComplete="off"
              />
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Processing…' : (isRegister ? 'Register Account' : 'Sign In')}
          </button>
        </form>

        <div className="auth-toggle">
          {isRegister ? (
            <p>Already have an account?{' '}
              <span onClick={() => setIsRegister(false)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setIsRegister(false)}>
                Sign In
              </span>
            </p>
          ) : (
            <p>Don&apos;t have an account?{' '}
              <span onClick={() => setIsRegister(true)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setIsRegister(true)}>
                Register
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
