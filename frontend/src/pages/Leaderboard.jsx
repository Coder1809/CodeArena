import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import API_BASE_URL from '../config';

export default function Leaderboard({ token }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/leaderboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setPlayers(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  return (
    <div style={{ maxWidth: '850px', margin: '2rem auto', width: '100%' }}>
      <div className="card">
        <h1 className="title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <Trophy size={34} color="#f59e0b" />
          Code Arena Standings
        </h1>
        <p className="subtitle" style={{ marginBottom: '1.75rem' }}>
          Global competitive programmers ranked by arena victories
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Loading arena leaderboard...
          </div>
        ) : error ? (
          <div style={{ color: '#ef4444', textAlign: 'center', padding: '1.5rem' }}>{error}</div>
        ) : players.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No arena matches recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="league-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Codeforces Handle</th>
                  <th style={{ textAlign: 'center' }}>Wins</th>
                  <th style={{ textAlign: 'center' }}>Losses</th>
                  <th style={{ textAlign: 'center' }}>Matches Played</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, index) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                      {index === 0 ? '🥇 1' : index === 1 ? '🥈 2' : index === 2 ? '🥉 3' : `#${index + 1}`}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.username}</td>
                    <td style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-mono)' }}>
                      {p.cf_handle ? (
                        <a
                          href={`https://codeforces.com/profile/${p.cf_handle}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#a78bfa', textDecoration: 'none' }}
                        >
                          @{p.cf_handle}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--success-color)', fontFamily: 'var(--font-mono)' }}>
                      {p.wins || 0}
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--danger-color)', fontFamily: 'var(--font-mono)' }}>
                      {p.losses || 0}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                      {p.matches_played || (p.wins + p.losses) || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
