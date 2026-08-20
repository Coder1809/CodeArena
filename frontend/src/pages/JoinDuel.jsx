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
    <div className="page-wrapper page-wrapper--narrow">
      <div className="card">
        <div className="page-header">
          <h1 className="page-header__title page-header__title--with-icon">
            <LogIn size={28} color="var(--success)" />
            Join Arena Room
          </h1>
          <p className="page-header__subtitle">
            Enter a Room ID shared by your opponent to join an active duel
          </p>
        </div>

        {error && (
          <div className="alert alert--error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin}>
          <div className="form-group">
            <label className="label" htmlFor="join-room-id">Arena Room ID</label>
            <input
              id="join-room-id"
              type="text"
              placeholder="Paste Room UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)"
              value={roomIdInput}
              onChange={e => setRoomIdInput(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <button type="submit" className="btn--success" disabled={loading}>
            {loading ? 'Joining Arena…' : 'Join Arena Room'}
          </button>
        </form>
      </div>
    </div>
  );
}
