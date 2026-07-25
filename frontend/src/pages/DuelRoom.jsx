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
      <div style={{ textAlign: 'center', marginTop: '4rem', color: '#ef4444' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)' }}>Error Joining Arena</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/create')} style={{ marginTop: '1.25rem', width: 'auto' }}>
          Create New Arena Room
        </button>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
        Connecting to Code Arena...
      </div>
    );
  }

  const p1 = roomData.player1;
  const p2 = roomData.player2;

  return (
    <div style={{ maxWidth: '820px', margin: '2rem auto', width: '100%' }}>
      {solvedModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(7, 10, 18, 0.92)', zIndex: 9999,
          backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: 'white', textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '3.2rem', color: 'var(--success-color)', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
            🎉 {solvedModal.solver} Solved the Problem!
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
            Match complete! Verifying victory...
          </p>
        </div>
      )}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.75rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontFamily: 'var(--font-heading)' }}>
              Arena Room: <span style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-mono)' }}>{roomId}</span>
            </h2>
            <button
              onClick={copyRoomId}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: 0, marginTop: '0.35rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              {copied ? 'Copied Room ID' : 'Copy Room ID'}
            </button>
          </div>
          
          <div className="status-badge" style={{
            background: roomData.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : roomData.status === 'FINISHED' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
            border: `1px solid ${roomData.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.3)' : roomData.status === 'FINISHED' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
            color: roomData.status === 'ACTIVE' ? '#10b981' : roomData.status === 'FINISHED' ? '#f59e0b' : '#818cf8',
          }}>
            {roomData.status.toUpperCase()}
          </div>
        </div>

        {/* Players Display */}
        <div style={{ display: 'grid', gridTemplateColumns: roomData.isSolo ? '1fr' : '1fr 1fr', gap: '1.5rem', textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-heading)' }}>
              {p1 ? p1.username : 'Waiting for Player 1...'}
            </h3>
            <p style={{ color: 'var(--accent-color)', margin: '0.25rem 0 0 0', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
              {p1?.cf_handle ? `@${p1.cf_handle}` : ''}
            </p>
          </div>
          {!roomData.isSolo && (
            <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-heading)' }}>
                {p2 ? p2.username : 'Waiting for Player 2...'}
              </h3>
              <p style={{ color: 'var(--accent-color)', margin: '0.25rem 0 0 0', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                {p2?.cf_handle ? `@${p2.cf_handle}` : ''}
              </p>
            </div>
          )}
        </div>

        {/* Waiting State */}
        {roomData.status === 'WAITING' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p className="subtitle" style={{ marginBottom: '1.75rem' }}>
              {roomData.isSolo ? `Configured for ${roomData.timeLimit} minutes solo practice.` : p2 ? `Both competitors connected (${roomData.timeLimit} min timer). Click start match when ready!` : `Share Room ID with your opponent to join. (${roomData.timeLimit} min timer)`}
            </p>
            <button onClick={handleStartMatch} style={{ width: 'auto', padding: '0.85rem 2.25rem', fontSize: '1.05rem', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
              <Play size={20} /> Start Arena Match
            </button>
          </div>
        )}

        {/* Active State */}
        {roomData.status === 'ACTIVE' && (
          <div style={{ textAlign: 'center' }}>
            <div className="timer-display" style={{ marginBottom: '1.75rem' }}>
              <Clock style={{ display: 'inline', marginRight: '0.6rem', verticalAlign: 'middle' }} size={42} color="var(--accent-color)" />
              {formatTime(timeLeft)}
            </div>

            {roomData.problem ? (
              <div style={{ background: 'rgba(139, 92, 246, 0.08)', padding: '1.75rem', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.25)', marginBottom: '1.75rem' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Target Codeforces Problem
                </p>
                <h2 style={{ fontSize: '1.6rem', margin: '0 0 0.5rem 0', fontFamily: 'var(--font-heading)' }}>
                  <a href={`https://codeforces.com/contest/${roomData.problem.contestId}/problem/${roomData.problem.index}`} target="_blank" rel="noreferrer" style={{ color: '#a78bfa', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    {roomData.problem.name} <ExternalLink size={20} />
                  </a>
                </h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Contest Index: <strong style={{ fontFamily: 'var(--font-mono)' }}>{roomData.problem.contestId}{roomData.problem.index}</strong> • Rating: <strong style={{ color: 'var(--warning-color)', fontFamily: 'var(--font-mono)' }}>{roomData.problem.rating || 'Unrated'}</strong>
                </p>
              </div>
            ) : (
              <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Selecting random problem from Codeforces...</div>
            )}
          </div>
        )}

        {/* Finished State */}
        {roomData.status === 'FINISHED' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Trophy size={64} color="#f59e0b" style={{ margin: '0 auto 1.25rem' }} />
            <h2 style={{ fontSize: '2.2rem', color: '#f59e0b', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Arena Match Finished!
            </h2>
            <p style={{ marginTop: '0.75rem', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              {roomData.winner ? (
                <>Winner: <strong style={{ color: 'var(--success-color)' }}>{p1?.id === roomData.winner ? p1.username : p2?.username}</strong></>
              ) : (
                'Match time expired with no solutions submitted.'
              )}
            </p>
            <button onClick={() => navigate('/create')} style={{ marginTop: '1.75rem', width: 'auto' }}>
              Create Another Match
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
