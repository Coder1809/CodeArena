import { useState } from 'react';
import { Trophy, XCircle, Award, User, Code } from 'lucide-react';
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
    <div style={{ maxWidth: '750px', margin: '2rem auto', width: '100%' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{
            background: 'var(--accent-gradient)',
            color: 'white',
            borderRadius: '20px',
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            fontWeight: '800',
            fontFamily: 'var(--font-heading)',
            boxShadow: '0 8px 24px var(--accent-glow)'
          }}>
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
              {user?.username || 'Player'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: '0.2rem 0 0 0', fontSize: '0.9rem' }}>
              {user?.email}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.25rem' }}>
          <div className="stat-card">
            <Award size={22} color="var(--accent-color)" style={{ marginBottom: '0.35rem' }} />
            <div className="stat-value" style={{ color: '#a78bfa', fontSize: '1.4rem' }}>
              {user?.cf_handle ? `@${user.cf_handle}` : 'Not Set'}
            </div>
            <div className="stat-label">CF Handle</div>
          </div>

          <div className="stat-card">
            <Trophy size={22} color="var(--success-color)" style={{ marginBottom: '0.35rem' }} />
            <div className="stat-value" style={{ color: 'var(--success-color)', fontSize: '1.6rem' }}>{wins}</div>
            <div className="stat-label">Wins</div>
          </div>

          <div className="stat-card">
            <XCircle size={22} color="var(--danger-color)" style={{ marginBottom: '0.35rem' }} />
            <div className="stat-value" style={{ color: 'var(--danger-color)', fontSize: '1.6rem' }}>{losses}</div>
            <div className="stat-label">Losses</div>
          </div>

          <div className="stat-card">
            <Code size={22} color="var(--warning-color)" style={{ marginBottom: '0.35rem' }} />
            <div className="stat-value" style={{ color: 'var(--warning-color)', fontSize: '1.6rem' }}>{winRate}%</div>
            <div className="stat-label">Win Rate</div>
          </div>
        </div>

        <form onSubmit={handleSaveCF} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
            Codeforces Integration
          </h3>
          {msg && (
            <p style={{
              fontSize: '0.88rem',
              color: msg.startsWith('Error') ? '#ef4444' : '#10b981',
              marginBottom: '1rem',
              fontWeight: 500
            }}>{msg}</p>
          )}
          <div className="form-group">
            <label className="label">Codeforces Handle</label>
            <input
              type="text"
              placeholder="e.g. tourist, Benq"
              value={handleInput}
              onChange={e => setHandleInput(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: 'auto', padding: '0.75rem 2rem' }}>
            {loading ? 'Saving...' : 'Update Handle'}
          </button>
        </form>
      </div>
    </div>
  );
}
