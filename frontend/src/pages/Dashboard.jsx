import { useState, useEffect, useRef } from 'react';
import { Trophy, XCircle, Award, Code, Swords, MinusCircle, CheckCircle, Loader } from 'lucide-react';
import API_BASE_URL from '../config';

export default function Dashboard({ user, setUser, token }) {
  const [handleInput, setHandleInput] = useState(user?.cf_handle || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // CF handle verification state
  const [cfVerifying, setCfVerifying] = useState(false);
  const [cfVerified, setCfVerified] = useState(null);
  const cfDebounceRef = useRef(null);

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setUser(data);
            if (data.cf_handle) setHandleInput(data.cf_handle);
          }
        })
        .catch(() => {});
    }
  }, [token, setUser]);

  // Verify CF handle with debounce
  useEffect(() => {
    // Don't verify if handle matches current saved handle
    if (!handleInput.trim() || handleInput.trim() === user?.cf_handle) {
      setCfVerified(null);
      setCfVerifying(false);
      return;
    }

    setCfVerifying(true);
    setCfVerified(null);

    if (cfDebounceRef.current) clearTimeout(cfDebounceRef.current);

    cfDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/verify-cf?handle=${encodeURIComponent(handleInput.trim())}`);
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
  }, [handleInput, user?.cf_handle]);

  const handleSaveCF = async (e) => {
    e.preventDefault();
    if (!handleInput.trim()) return;

    // Block save if handle was checked and is invalid
    if (cfVerified && !cfVerified.valid) {
      setMsg('Error: This Codeforces handle does not exist. Please check and try again.');
      return;
    }

    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/update-cf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cfHandle: handleInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update handle');
      if (data.user) {
        setUser(data.user);
        setCfVerified(null);
        setMsg('Codeforces handle updated successfully!');
      }
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const wins = user?.wins || 0;
  const losses = user?.losses || 0;
  const draws = user?.draws || 0;
  const total = wins + losses + draws;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <div className="page-wrapper page-wrapper--dashboard">
      <div className="card">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar" aria-hidden="true">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="profile-info">
            <h1>{user?.username || 'Player'}</h1>
            <p>{user?.email}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__icon">
              <Award size={22} color="var(--accent)" />
            </div>
            <div className="stat-value stat-value--sm" style={{ color: 'var(--accent)' }}>
              {user?.cf_handle ? `@${user.cf_handle}` : 'Not Set'}
            </div>
            <div className="stat-label">CF Handle</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon">
              <Swords size={22} color="var(--accent)" />
            </div>
            <div className="stat-value">{total}</div>
            <div className="stat-label">Matches Played</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon">
              <Trophy size={22} color="var(--success)" />
            </div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{wins}</div>
            <div className="stat-label">Wins</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon">
              <XCircle size={22} color="var(--danger)" />
            </div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{losses}</div>
            <div className="stat-label">Losses</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon">
              <MinusCircle size={22} color="var(--text-secondary)" />
            </div>
            <div className="stat-value" style={{ color: 'var(--text-secondary)' }}>{draws}</div>
            <div className="stat-label">Draws</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon">
              <Code size={22} color="var(--warning)" />
            </div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{winRate}%</div>
            <div className="stat-label">Win Rate</div>
          </div>
        </div>

        {/* Codeforces Integration */}
        <form onSubmit={handleSaveCF} className="section">
          <h3 className="section__title">Codeforces Integration</h3>

          {msg && (
            <div className={`alert ${msg.startsWith('Error') ? 'alert--error' : 'alert--success'}`} role="status">
              {msg}
            </div>
          )}

          <div className="form-group">
            <label className="label" htmlFor="cf-handle-input">Codeforces Handle</label>
            <div className="input-with-status">
              <input
                id="cf-handle-input"
                type="text"
                placeholder="e.g. tourist, Benq"
                value={handleInput}
                onChange={e => setHandleInput(e.target.value)}
                autoComplete="off"
              />
              {handleInput.trim() && handleInput.trim() !== user?.cf_handle && (
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

          <button type="submit" className="btn--auto" disabled={loading || (cfVerified && !cfVerified.valid)}>
            {loading ? 'Saving…' : 'Update Handle'}
          </button>
        </form>
      </div>
    </div>
  );
}
