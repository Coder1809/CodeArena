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
      <div className="page-wrapper page-wrapper--narrow">
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="page-header">
            <div className="page-header__icon" style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-subtle)' }}>
              <ShieldAlert size={28} color="var(--danger)" />
            </div>
            <h2 className="page-header__title" style={{ color: 'var(--danger)' }}>
              Codeforces Handle Required
            </h2>
            <p className="page-header__subtitle">
              Set your Codeforces handle in your Dashboard before starting solo practice.
            </p>
          </div>
          <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  const activeDuration = parseInt(timeLimit) || 45;

  return (
    <div className="page-wrapper">
      <div className="card">
        <div className="page-header">
          <h1 className="page-header__title page-header__title--with-icon">
            <Target size={30} color="var(--success)" />
            Solo Practice Arena
          </h1>
          <p className="page-header__subtitle">
            Practice Codeforces problems under timed conditions with a custom timer
          </p>
        </div>

        <form onSubmit={handleCreateSoloMatch}>
          {/* Timer Duration */}
          <div className="form-group">
            <label className="label" htmlFor="solo-custom-timer">
              <Clock size={16} color="var(--success)" /> Practice Timer Duration
            </label>

            <div className="timer-presets">
              {[15, 30, 45, 60].map(mins => (
                <button
                  type="button"
                  key={mins}
                  className={`preset-btn ${!customTime && timeLimit === mins.toString() ? 'active' : ''}`}
                  onClick={() => handlePresetSelect(mins)}
                >
                  {mins} Mins
                </button>
              ))}
            </div>

            <input
              id="solo-custom-timer"
              type="number"
              min="1"
              max="300"
              placeholder="Or enter custom timer in minutes (e.g. 10, 90)"
              value={customTime}
              onChange={handleCustomTimeChange}
            />

            <div className="timer-info">
              Active Timer: <strong style={{ color: 'var(--success)' }}>{activeDuration} minutes</strong>
            </div>
          </div>

          {/* Rating Range */}
          <div className="grid">
            <div className="form-group">
              <label className="label" htmlFor="solo-rating-min">
                <Sliders size={16} color="var(--success)" /> Min Rating
              </label>
              <input
                id="solo-rating-min"
                type="number"
                min="800"
                max="3500"
                step="100"
                value={ratingMin}
                onChange={e => setRatingMin(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="solo-rating-max">
                <Sliders size={16} color="var(--success)" /> Max Rating
              </label>
              <input
                id="solo-rating-max"
                type="number"
                min="800"
                max="3500"
                step="100"
                value={ratingMax}
                onChange={e => setRatingMax(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn--success" disabled={loading}>
            {loading ? 'Setting Up…' : 'Start Solo Practice'}
          </button>
        </form>
      </div>
    </div>
  );
}
