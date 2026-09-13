import { useState, useEffect, useRef } from 'react';
import { Swords, CheckCircle, XCircle, Loader } from 'lucide-react';
import API_BASE_URL from '../config';

export default function Login({ setToken, setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cfHandle, setCfHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Custom validation state
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // CF handle verification state
  const [cfVerifying, setCfVerifying] = useState(false);
  const [cfVerified, setCfVerified] = useState(null); // null | { valid, handle, rating, rank }
  const cfDebounceRef = useRef(null);

  // Verify Codeforces handle with debounce
  useEffect(() => {
    if (!cfHandle.trim() || !isRegister) {
      setCfVerified(null);
      setCfVerifying(false);
      return;
    }

    setCfVerifying(true);
    setCfVerified(null);

    if (cfDebounceRef.current) clearTimeout(cfDebounceRef.current);

    cfDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/verify-cf?handle=${encodeURIComponent(cfHandle.trim())}`);
        const data = await res.json();
        setCfVerified(data);
      } catch {
        setCfVerified({ valid: false, error: 'Could not verify handle' });
      } finally {
        setCfVerifying(false);
      }
    }, 600);

    return () => {
      if (cfDebounceRef.current) clearTimeout(cfDebounceRef.current);
    };
  }, [cfHandle, isRegister]);

  // Validate a single field
  const validateField = (name, value) => {
    switch (name) {
      case 'username':
        if (!value.trim()) return 'Username is required';
        if (value.trim().length < 3) return 'Username must be at least 3 characters';
        if (value.trim().length > 30) return 'Username must be under 30 characters';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (name, value) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateAll = () => {
    const errors = {};
    if (isRegister) {
      errors.username = validateField('username', username);
    }
    errors.email = validateField('email', email);
    errors.password = validateField('password', password);

    setFieldErrors(errors);
    setTouched({ username: true, email: true, password: true });

    return !Object.values(errors).some(e => e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateAll()) return;

    setLoading(true);

    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    const payload = isRegister
      ? { username: username.trim(), email: email.trim(), password, cfHandle: cfHandle.trim() || undefined }
      : { email: email.trim(), password };

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

  // Reset validation when toggling modes
  const toggleMode = (mode) => {
    setIsRegister(mode);
    setFieldErrors({});
    setTouched({});
    setError('');
    setCfVerified(null);
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

        <form onSubmit={handleSubmit} noValidate>
          <p className="form-required-hint">
            <span className="label__required" aria-hidden="true">*</span> indicates a required field
          </p>

          {isRegister && (
            <div className="form-group">
              <label className="label" htmlFor="login-username">
                Username <span className="label__required" aria-hidden="true">*</span>
              </label>
              <input
                id="login-username"
                type="text"
                placeholder="codemaster"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onBlur={() => handleBlur('username', username)}
                autoComplete="username"
                className={touched.username && fieldErrors.username ? 'input--error' : ''}
              />
              {touched.username && fieldErrors.username && (
                <span className="field-error">{fieldErrors.username}</span>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="label" htmlFor="login-email">
              Email Address <span className="label__required" aria-hidden="true">*</span>
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => handleBlur('email', email)}
              autoComplete="email"
              className={touched.email && fieldErrors.email ? 'input--error' : ''}
            />
            {touched.email && fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label className="label" htmlFor="login-password">
              Password <span className="label__required" aria-hidden="true">*</span>
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => handleBlur('password', password)}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              className={touched.password && fieldErrors.password ? 'input--error' : ''}
            />
            {touched.password && fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
            {isRegister && password && !fieldErrors.password && (
              <div className="password-strength">
                <div className={`password-strength__bar ${
                  password.length >= 12 ? 'strong' : password.length >= 8 ? 'medium' : 'weak'
                }`} />
                <span className="password-strength__label">
                  {password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Good' : 'Weak'}
                </span>
              </div>
            )}
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="label" htmlFor="login-cf">
                Codeforces Handle <span className="label__optional">(Optional)</span>
              </label>
              <div className="input-with-status">
                <input
                  id="login-cf"
                  type="text"
                  placeholder="tourist"
                  value={cfHandle}
                  onChange={e => setCfHandle(e.target.value)}
                  autoComplete="off"
                />
                {cfHandle.trim() && (
                  <span className="input-status-icon">
                    {cfVerifying && <Loader size={16} className="spin-icon" color="var(--text-muted)" />}
                    {!cfVerifying && cfVerified?.valid && <CheckCircle size={16} color="var(--success)" />}
                    {!cfVerifying && cfVerified && !cfVerified.valid && <XCircle size={16} color="var(--danger)" />}
                  </span>
                )}
              </div>
              {!cfVerifying && cfVerified?.valid && (
                <span className="field-success">
                  ✓ Verified — {cfVerified.handle} ({cfVerified.rank}{cfVerified.rating ? `, ${cfVerified.rating}` : ''})
                </span>
              )}
              {!cfVerifying && cfVerified && !cfVerified.valid && (
                <span className="field-error">Handle not found on Codeforces</span>
              )}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Processing…' : (isRegister ? 'Register Account' : 'Sign In')}
          </button>
        </form>

        <div className="auth-toggle">
          {isRegister ? (
            <p>Already have an account?{' '}
              <span onClick={() => toggleMode(false)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && toggleMode(false)}>
                Sign In
              </span>
            </p>
          ) : (
            <p>Don&apos;t have an account?{' '}
              <span onClick={() => toggleMode(true)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && toggleMode(true)}>
                Register
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
