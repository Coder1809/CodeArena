import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateDuel from './pages/CreateDuel';
import JoinDuel from './pages/JoinDuel';
import Leaderboard from './pages/Leaderboard';
import SoloPrep from './pages/SoloPrep';
import DuelRoom from './pages/DuelRoom';
import './index.css';
import API_BASE_URL from './config';

function NavBar({ user, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <span className="brand">⚔ Code Arena</span>
        <div className="nav-links">
          <Link to="/create" className={isActive('/create')}>Create Duel</Link>
          <Link to="/join" className={isActive('/join')}>Join Duel</Link>
          <Link to="/solo" className={isActive('/solo')}>Solo Prep</Link>
          <Link to="/leaderboard" className={isActive('/leaderboard')}>Leaderboard</Link>
          <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
        </div>
      </div>
      <div className="nav-user" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user?.cf_handle && (
          <span className="handle" style={{ margin: 0 }}>
            @{user.cf_handle}
          </span>
        )}
        <button
          style={{
            padding: '0.45rem 0.9rem',
            width: 'auto',
            fontSize: '0.82rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            borderRadius: '9px'
          }}
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setLoading(false);
      });
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <h2 style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-heading)', fontSize: '1.8rem' }}>
          Loading Code Arena...
        </h2>
      </div>
    );
  }

  return (
    <Router>
      <div className="container">
        {user && <NavBar user={user} onLogout={handleLogout} />}
        <Routes>
          <Route path="/login" element={!token ? <Login setToken={setToken} setUser={setUser} /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={token ? <Dashboard user={user} setUser={setUser} token={token} /> : <Navigate to="/login" />} />
          <Route path="/create" element={token ? <CreateDuel user={user} token={token} /> : <Navigate to="/login" />} />
          <Route path="/join" element={token ? <JoinDuel user={user} token={token} /> : <Navigate to="/login" />} />
          <Route path="/solo" element={token ? <SoloPrep user={user} token={token} /> : <Navigate to="/login" />} />
          <Route path="/leaderboard" element={token ? <Leaderboard token={token} /> : <Navigate to="/login" />} />
          <Route path="/room/:roomId" element={token ? <DuelRoom user={user} token={token} /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
