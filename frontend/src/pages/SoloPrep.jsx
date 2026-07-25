import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, ShieldAlert, Clock, Sliders } from 'lucide-react';
import API_BASE_URL from '../config';

export default function SoloPrep({ user, token }) {
  const [timeLimit, setTimeLimit] = useState('45');
  const [customTime, setCustomTime] = useState('');
  const [ratingMin, setRatingMin] = useState('800');
  const [ratingMax, setRatingMax] = useState('1200');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePresetSelect = (mins) => {
    setTimeLimit(mins.toString());
    setCustomTime('');
  };

  const handleCustomTimeChange = (e) => {
    const val = e.target.value;
    setCustomTime(val);
    if (val && !isNaN(val) && parseInt(val) > 0) {
      setTimeLimit(val);
    }
  };

  const handleCreateSoloMatch = async (e) => {
    e.preventDefault();
    if (!user?.cf_handle) return alert('Please set your Codeforces handle on your profile first.');

    const finalMins = parseInt(timeLimit) || 45;
    if (finalMins < 1 || finalMins > 300) {
      return alert('Please enter a duration between 1 and 300 minutes.');
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/create-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: user.id,
          timeLimit: finalMins,
          ratingMin,
          ratingMax,
          isSolo: true
        })
      });
      const data = await res.json();
      if (data.roomId) {
        navigate(`/room/${data.roomId}`);
      } else {
        alert('Error: ' + (data.error || 'Failed to create solo room'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.cf_handle) {
    return (
      <div style={{ maxWidth: '500px', margin: '4rem auto', width: '100%', textAlign: 'center' }}>
        <div className="card" style={{ borderColor: 'var(--danger-color)' }}>
          <ShieldAlert size={48} color="var(--danger-color)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: 'var(--danger-color)', marginBottom: '0.5rem', fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>
            Codeforces Handle Required
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Set your Codeforces handle in your Dashboard before starting solo practice.
          </p>
          <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  const activeDuration = parseInt(timeLimit) || 45;

  return (
    <div style={{ maxWidth: '620px', margin: '2rem auto', width: '100%' }}>
      <div className="card">
        <h1 className="title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          <Target size={34} color="#10b981" />
          Solo Practice Arena
        </h1>
        <p className="subtitle">
          Practice Codeforces problems under timed conditions with a custom timer
        </p>

        <form onSubmit={handleCreateSoloMatch}>
          {/* Custom Timer Feature */}
          <div className="form-group">
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} color="#10b981" /> Practice Timer Duration
            </label>
            
            <div className="timer-presets">
              {[15, 30, 45, 60].map(mins => (
                <button
                  type="button"
                  key={mins}
                  className={`preset-btn ${!customTime && timeLimit === mins.toString() ? 'active' : ''}`}
                  style={!customTime && timeLimit === mins.toString() ? { background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' } : {}}
                  onClick={() => handlePresetSelect(mins)}
                >
                  {mins} Mins
                </button>
              ))}
            </div>

            <div style={{ marginTop: '0.6rem' }}>
              <input
                type="number"
                min="1"
                max="300"
                placeholder="Or enter custom timer in minutes (e.g. 10, 90)"
                value={customTime}
                onChange={handleCustomTimeChange}
              />
            </div>

            <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
              Active Timer: <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>{activeDuration} minutes</strong>
            </div>
          </div>

          <div className="grid">
            <div className="form-group">
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sliders size={16} color="#10b981" /> Min Rating
              </label>
              <input
                type="number"
                min="800"
                max="3500"
                step="100"
                value={ratingMin}
                onChange={e => setRatingMin(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sliders size={16} color="#10b981" /> Max Rating
              </label>
              <input
                type="number"
                min="800"
                max="3500"
                step="100"
                value={ratingMax}
                onChange={e => setRatingMax(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              marginTop: '0.5rem'
            }}
          >
            {loading ? 'Setting Up...' : 'Start Solo Practice'}
          </button>
        </form>
      </div>
    </div>
  );
}
