import { useState } from 'react';
import { Trophy, XCircle, Award, Code } from 'lucide-react';
import API_BASE_URL from '../config';

export default function Dashboard({ user, setUser, token }) {
  const [handleInput, setHandleInput] = useState(user?.cf_handle || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSaveCF = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/update-cf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cfHandle: handleInput })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update handle');
      if (data.user) {
        setUser(data.user);
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
  const total = wins + losses;
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
            <input
              id="cf-handle-input"
              type="text"
              placeholder="e.g. tourist, Benq"
              value={handleInput}
              onChange={e => setHandleInput(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <button type="submit" className="btn--auto" disabled={loading}>
            {loading ? 'Saving…' : 'Update Handle'}
          </button>
        </form>
      </div>
    </div>
  );
}
