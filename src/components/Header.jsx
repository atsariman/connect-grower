import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import '../styles/index.css';

const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="glass-panel header-wrapper">
      <div className="container header-content">
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 'bold' }}>
          {t('logo')}
        </Link>
        <nav>
          <ul className="nav-list">
            <li><Link to="/" style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>{t('home')}</Link></li>
            <li><Link to="/chat" style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>{t('chat')}</Link></li>
            <li><Link to="/forum" style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>{t('forum')}</Link></li>
          </ul>
        </nav>
        <div className="translator-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px' }}
          >
            <option value="en">English 🇺🇸</option>
            <option value="ko">한국어 🇰🇷</option>
            <option value="ja">日本語 🇯🇵</option>
            <option value="it">Italiano 🇮🇹</option>
          </select>
          {currentUser ? (
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.9rem' }}
            >
              Logout
            </button>
          ) : (
            <Link to="/login">
              <button className="btn btn-primary" style={{ padding: '5px 15px', fontSize: '0.9rem' }}>
                Login
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
