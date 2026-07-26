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
    <div className="page-wrapper page-wrapper--wide">
      <div className="card">
        <div className="page-header">
          <h1 className="page-header__title page-header__title--with-icon">
            <Trophy size={30} color="var(--warning)" />
            Code Arena Standings
          </h1>
          <p className="page-header__subtitle">
            Global competitive programmers ranked by arena victories
          </p>
        </div>

        {loading ? (
          <div aria-busy="true" aria-label="Loading leaderboard">
            {[...Array(5)].map((_, i) => (
              <div className="skeleton skeleton--row" key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="alert alert--error" role="alert">{error}</div>
        ) : players.length === 0 ? (
          <div className="empty-state">
            No arena matches recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="league-table" role="table">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Player</th>
                  <th scope="col">Codeforces Handle</th>
                  <th scope="col" style={{ textAlign: 'center' }}>Wins</th>
                  <th scope="col" style={{ textAlign: 'center' }}>Losses</th>
                  <th scope="col" style={{ textAlign: 'center' }}>Matches Played</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, index) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                      {index === 0 ? '🥇 1' : index === 1 ? '🥈 2' : index === 2 ? '🥉 3' : `#${index + 1}`}
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.username}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {p.cf_handle ? (
                        <a
                          href={`https://codeforces.com/profile/${p.cf_handle}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--accent)' }}
                        >
                          @{p.cf_handle}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
                      {p.wins || 0}
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
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
