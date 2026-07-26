import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Clock, ExternalLink, Trophy, Play, Copy, Check, Swords } from 'lucide-react';
import API_BASE_URL from '../config';

export default function DuelRoom({ user, token }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [solvedModal, setSolvedModal] = useState({ show: false, solver: '' });
  
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(API_BASE_URL);
    
    socketRef.current.emit('join-room', { roomId, userId: user?.id }, (res) => {
      if (res.success) {
        setRoomData(res.room);
      } else {
        setError(res.error || 'Failed to join room');
      }
    });

    socketRef.current.on('room-updated', (data) => {
      setRoomData(data);
    });

    socketRef.current.on('start-match', (data) => {
      setRoomData(data);
    });

    socketRef.current.on('problem-selected', (problem) => {
      setRoomData(prev => prev ? { ...prev, problem } : prev);
    });

    socketRef.current.on('submission-found', ({ player, cfHandle }) => {
      setSolvedModal({ show: true, solver: player || cfHandle });
      setTimeout(() => {
        setSolvedModal({ show: false, solver: '' });
      }, 4000);
    });

    socketRef.current.on('match-ended', ({ winner, winnerId }) => {
      setRoomData(prev => prev ? { ...prev, status: 'FINISHED', winner: winnerId } : prev);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [roomId, user]);

  useEffect(() => {
    if (!roomData || roomData.status !== 'ACTIVE' || !roomData.startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - roomData.startTime) / 1000);
      const totalSeconds = (roomData.timeLimit || 45) * 60;
      const remaining = Math.max(0, totalSeconds - elapsed);
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [roomData]);

  const handleStartMatch = () => {
    socketRef.current.emit('start-match', { roomId }, (res) => {
      if (!res.success) alert(res.error || 'Could not start match');
    });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (error) {
    return (
      <div className="page-wrapper page-wrapper--narrow">
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="page-header">
            <h2 className="page-header__title" style={{ color: 'var(--danger)' }}>Error Joining Arena</h2>
            <p className="page-header__subtitle">{error}</p>
          </div>
          <button className="btn--auto" onClick={() => navigate('/create')}>
            Create New Arena Room
          </button>
        </div>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span className="loading-text">Connecting to Code Arena…</span>
      </div>
    );
  }

  const p1 = roomData.player1;
  const p2 = roomData.player2;

  const statusClass = roomData.status === 'ACTIVE'
    ? 'status-badge--active'
    : roomData.status === 'FINISHED'
      ? 'status-badge--finished'
      : 'status-badge--waiting';

  return (
    <div className="page-wrapper page-wrapper--wide">
      {/* Solved Modal */}
      {solvedModal.show && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Problem solved notification">
          <h1>🎉 {solvedModal.solver} Solved the Problem!</h1>
          <p>Match complete! Verifying victory…</p>
        </div>
      )}

      <div className="card">
        {/* Room Header */}
        <div className="room-header">
          <div>
            <h2>Arena Room</h2>
            <span className="room-header__id">{roomId}</span>
            <button
              className="copy-btn"
              onClick={copyRoomId}
              aria-label={copied ? 'Room ID copied' : 'Copy Room ID'}
            >
              {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
              {copied ? 'Copied Room ID' : 'Copy Room ID'}
            </button>
          </div>

          <div className={`status-badge ${statusClass}`}>
            {roomData.status.toUpperCase()}
          </div>
        </div>

        {/* Players Display */}
        <div className={`player-grid ${roomData.isSolo ? 'player-grid--solo' : 'player-grid--duel'}`}>
          <div className="player-card">
            <h3>{p1 ? p1.username : 'Waiting for Player 1…'}</h3>
            <p>{p1?.cf_handle ? `@${p1.cf_handle}` : ''}</p>
          </div>
          {!roomData.isSolo && (
            <div className="player-card">
              <h3>{p2 ? p2.username : 'Waiting for Player 2…'}</h3>
              <p>{p2?.cf_handle ? `@${p2.cf_handle}` : ''}</p>
            </div>
          )}
        </div>

        {/* Waiting State */}
        {roomData.status === 'WAITING' && (
          <div className="center-state">
            <p className="subtitle">
              {roomData.isSolo
                ? `Configured for ${roomData.timeLimit} minutes solo practice.`
                : p2
                  ? `Both competitors connected (${roomData.timeLimit} min timer). Click start match when ready!`
                  : `Share Room ID with your opponent to join. (${roomData.timeLimit} min timer)`}
            </p>
            <button className="btn--auto btn--lg" onClick={handleStartMatch}>
              <Play size={20} /> Start Arena Match
            </button>
          </div>
        )}

        {/* Active State */}
        {roomData.status === 'ACTIVE' && (
          <div style={{ textAlign: 'center' }}>
            <div className="timer-display" aria-live="polite" aria-label={`Time remaining: ${formatTime(timeLeft)}`}>
              <Clock size={38} color="var(--accent)" />
              {formatTime(timeLeft)}
            </div>

            {roomData.problem ? (
              <div className="problem-card">
                <p className="problem-card__label">Target Codeforces Problem</p>
                <h2 className="problem-card__name">
                  <a
                    href={`https://codeforces.com/contest/${roomData.problem.contestId}/problem/${roomData.problem.index}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {roomData.problem.name} <ExternalLink size={18} />
                  </a>
                </h2>
                <p className="problem-card__meta">
                  Contest Index: <strong>{roomData.problem.contestId}{roomData.problem.index}</strong>
                  {' · '}
                  Rating: <strong style={{ color: 'var(--warning)' }}>{roomData.problem.rating || 'Unrated'}</strong>
                </p>
              </div>
            ) : (
              <div className="empty-state">Selecting random problem from Codeforces…</div>
            )}
          </div>
        )}

        {/* Finished State */}
        {roomData.status === 'FINISHED' && (
          <div className="winner-display">
            <Trophy size={56} color="var(--warning)" />
            <h2>Arena Match Finished!</h2>
            <p>
              {roomData.winner ? (
                <>Winner: <strong style={{ color: 'var(--success)' }}>{p1?.id === roomData.winner ? p1.username : p2?.username}</strong></>
              ) : (
                'Match time expired with no solutions submitted.'
              )}
            </p>
            <button className="btn--auto" onClick={() => navigate('/create')} style={{ marginTop: 'var(--space-6)' }}>
              Create Another Match
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
