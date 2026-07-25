import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import API_BASE_URL from '../config';

export default function JoinDuel({ user, token }) {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    const cleanRoomId = roomIdInput.trim();
    if (!cleanRoomId) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/join-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ roomId: cleanRoomId, userId: user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not join room');

      navigate(`/room/${cleanRoomId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '4rem auto', width: '100%' }}>
      <div className="card">
        <h1 className="title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <LogIn size={30} color="var(--success-color)" />
          Join Arena Room
        </h1>
        <p className="subtitle" style={{ marginBottom: '1.75rem' }}>
          Enter a Room ID shared by your opponent to join an active duel
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

        <form onSubmit={handleJoin}>
          <div className="form-group">
            <label className="label">Arena Room ID</label>
            <input
              type="text"
              placeholder="Paste Room UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)"
              value={roomIdInput}
              onChange={e => setRoomIdInput(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              marginTop: '0.5rem'
            }}
          >
            {loading ? 'Joining Arena...' : 'Join Arena Room'}
          </button>
        </form>
      </div>
    </div>
  );
}
