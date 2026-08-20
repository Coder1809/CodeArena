import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, Menu, X } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateDuel from './pages/CreateDuel';
import JoinDuel from './pages/JoinDuel';
import Leaderboard from './pages/Leaderboard';
import SoloPrep from './pages/SoloPrep';
import DuelRoom from './pages/DuelRoom';
import './index.css';
import API_BASE_URL from './config';

function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  });

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }, [theme]);

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function NavBar({ user, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar-left">
        <Link to="/dashboard" className="brand" aria-label="Code Arena Home">
          ⚔ Code Arena
        </Link>
        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className={`nav-links${menuOpen ? ' open' : ''}`} role="menubar">
        <Link to="/create" className={isActive('/create')} role="menuitem">Create Duel</Link>
        <Link to="/join" className={isActive('/join')} role="menuitem">Join Duel</Link>
        <Link to="/solo" className={isActive('/solo')} role="menuitem">Solo Prep</Link>
        <Link to="/leaderboard" className={isActive('/leaderboard')} role="menuitem">Leaderboard</Link>
        <Link to="/dashboard" className={isActive('/dashboard')} role="menuitem">Dashboard</Link>
      </div>

      <div className={`navbar-right${menuOpen ? ' open' : ''}`}>
        {user?.cf_handle && (
          <span className="handle-badge">@{user.cf_handle}</span>
        )}
        <ThemeToggle />
        <button className="btn--ghost" onClick={onLogout}>
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
      <div className="loading-screen">
        <div className="spinner" />
        <span className="loading-text">Loading Code Arena…</span>
      </div>
    );
  }

  return (
    <Router>
      <div className="container">
        {user && <NavBar user={user} onLogout={handleLogout} />}
        <main>
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
        </main>
      </div>
    </Router>
  );
}

export default App;
