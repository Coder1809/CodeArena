import { useState, useEffect, useRef } from 'react';
import { Swords, CheckCircle, XCircle, Loader, Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react';
import API_BASE_URL from '../config';

export default function Login({ setToken, setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'otp'

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cfHandle, setCfHandle] = useState('');

  // OTP Verification state
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Custom validation state
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // CF handle verification state
  const [cfVerifying, setCfVerifying] = useState(false);
  const [cfVerified, setCfVerified] = useState(null); // null | { valid, handle, rating, rank }
  const cfDebounceRef = useRef(null);

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    let timer;
    if (resendCooldown > 0 && step === 'otp') {
      timer = setInterval(() => {
        setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown, step]);

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
  const validateField = (name, value, currentPassword = password) => {
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
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== currentPassword) return 'Passwords do not match';
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
      errors.confirmPassword = validateField('confirmPassword', confirmPassword, password);
    }
    errors.email = validateField('email', email);
    errors.password = validateField('password', password);

    setFieldErrors(errors);
    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: isRegister
    });

    return !Object.values(errors).some(e => e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!validateAll()) return;

    setLoading(true);

    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    const payload = isRegister
      ? {
          username: username.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          cfHandle: cfHandle.trim() || undefined
        }
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

      // If registration requires OTP email verification
      if (data.requireOtp) {
        setStep('otp');
        setOtp('');
        setResendCooldown(60);
        setNotice(data.message || 'Verification code sent to your email.');
        return;
      }

      // If direct login / token returned
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

  // Submit 6-digit OTP code to verify account
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otp: otp.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
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

  // Resend 6-digit OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError('');
    setNotice('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not resend code');
      }
      setResendCooldown(60);
      setNotice(data.message || 'A new 6-digit verification code has been sent!');
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  // Reset validation when toggling modes
  const toggleMode = (mode) => {
    setIsRegister(mode);
    setStep('form');
    setFieldErrors({});
    setTouched({});
    setError('');
    setNotice('');
    setOtp('');
    setConfirmPassword('');
    setCfVerified(null);
  };

  return (
    <div className="page-wrapper page-wrapper--narrow">
      <div className="card">
        {step === 'otp' ? (
          /* =========================================
             STEP 2: EMAIL OTP VERIFICATION SCREEN
             ========================================= */
          <div className="otp-container">
            <div className="otp-icon-badge">
              <Mail size={26} />
            </div>

            <div className="page-header" style={{ marginBottom: 0 }}>
              <h1 className="page-header__title">Verify Your Email</h1>
              <p className="page-header__subtitle">
                We sent a 6-digit verification code to<br />
                <span className="otp-target-email">{email}</span>
              </p>
            </div>

            {error && (
              <div className="alert alert--error" role="alert" style={{ width: '100%' }}>
                {error}
              </div>
            )}

            {notice && (
              <div className="alert alert--info" role="status" style={{ width: '100%' }}>
                {notice}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} style={{ width: '100%' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label className="label" htmlFor="otp-input" style={{ marginBottom: '8px' }}>
                  Enter 6-Digit Code
                </label>
                <input
                  id="otp-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="••••••"
                  value={otp}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(val);
                    if (error) setError('');
                  }}
                  className="otp-input-field"
                  autoFocus
                />
              </div>

              <div className="otp-actions">
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  style={{ width: '100%' }}
                >
                  {loading ? 'Verifying Code…' : 'Verify & Activate Account'}
                </button>

                <div className="otp-resend-row">
                  {resendCooldown > 0 ? (
                    <span>
                      Resend code in <strong>0:{resendCooldown < 10 ? `0${resendCooldown}` : resendCooldown}</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resending}
                      className="otp-resend-btn"
                    >
                      {resending ? 'Sending new code…' : 'Resend Verification Code'}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setError('');
                    setNotice('');
                  }}
                  className="otp-back-btn"
                >
                  <ArrowLeft size={16} /> Back to Registration
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* =========================================
             STEP 1: REGISTRATION / SIGN IN FORM
             ========================================= */
          <>
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

            {notice && (
              <div className="alert alert--info" role="status">
                {notice}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
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
                <div className="input-with-status">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => {
                      const val = e.target.value;
                      setPassword(val);
                      if (touched.confirmPassword && isRegister) {
                        setFieldErrors(prev => ({
                          ...prev,
                          confirmPassword: val !== confirmPassword ? 'Passwords do not match' : ''
                        }));
                      }
                    }}
                    onBlur={() => handleBlur('password', password)}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    className={touched.password && fieldErrors.password ? 'input--error' : ''}
                  />
                  <button
                    type="button"
                    className="input-toggle-btn"
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {touched.password && fieldErrors.password && (
                  <span className="field-error">{fieldErrors.password}</span>
                )}

                {isRegister && password && !fieldErrors.password && (
                  <div className="password-strength">
                    <div
                      className={`password-strength__bar ${
                        password.length >= 12 ? 'strong' : password.length >= 8 ? 'medium' : 'weak'
                      }`}
                    />
                    <span className="password-strength__label">
                      {password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Good' : 'Weak'}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password field (Register mode only) */}
              {isRegister && (
                <div className="form-group">
                  <label className="label" htmlFor="login-confirm-password">
                    Confirm Password <span className="label__required" aria-hidden="true">*</span>
                  </label>
                  <div className="input-with-status">
                    <input
                      id="login-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => {
                        const val = e.target.value;
                        setConfirmPassword(val);
                        if (touched.confirmPassword) {
                          setFieldErrors(prev => ({
                            ...prev,
                            confirmPassword: val !== password ? 'Passwords do not match' : ''
                          }));
                        }
                      }}
                      onBlur={() => handleBlur('confirmPassword', confirmPassword)}
                      autoComplete="new-password"
                      className={touched.confirmPassword && fieldErrors.confirmPassword ? 'input--error' : ''}
                    />
                    <button
                      type="button"
                      className="input-toggle-btn"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {touched.confirmPassword && fieldErrors.confirmPassword && (
                    <span className="field-error">{fieldErrors.confirmPassword}</span>
                  )}

                  {confirmPassword && !fieldErrors.confirmPassword && confirmPassword === password && (
                    <span className="field-success" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <CheckCircle size={14} color="var(--success)" /> Passwords match
                    </span>
                  )}
                </div>
              )}

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

              {/* Left-aligned required fields hint directly before submit button */}
              <p className="form-required-hint">
                <span className="label__required">*</span> Required fields
              </p>

              <button type="submit" disabled={loading}>
                {loading ? 'Processing…' : (isRegister ? 'Register Account' : 'Sign In')}
              </button>
            </form>

            <div className="auth-toggle">
              {isRegister ? (
                <p>
                  Already have an account?{' '}
                  <span
                    onClick={() => toggleMode(false)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && toggleMode(false)}
                  >
                    Sign In
                  </span>
                </p>
              ) : (
                <p>
                  Don&apos;t have an account?{' '}
                  <span
                    onClick={() => toggleMode(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && toggleMode(true)}
                  >
                    Register
                  </span>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
