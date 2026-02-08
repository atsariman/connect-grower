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
    <header className="glass-panel header-wrapper" style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
      <div className="container header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 'bold' }}>
          ConnectGrower 🍇
        </Link>
        <nav>
          <ul className="nav-list" style={{ display: 'flex', gap: '20px', listStyle: 'none', margin: 0, padding: 0 }}>
            <li><Link to="/" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: '500' }}>🏠 {language === 'ko' ? '홈' : 'Home'}</Link></li>
            {/* <li><Link to="/chat" style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>💬 {language === 'ko' ? '채팅' : 'Chat'}</Link></li> */}
          </ul>
        </nav>
        <div className="translator-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', background: 'white' }}
          >
            <option value="en">English 🇺🇸</option>
            <option value="ko">한국어 🇰🇷</option>
            <option value="ja">日本語 🇯🇵</option>
            <option value="it">Italiano 🇮🇹</option>
          </select>

          {currentUser ? (
            <>
              <Link to="/profile" title="My Profile" style={{ textDecoration: 'none', border: '1px solid #ddd', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontSize: '20px' }}>
                🧑‍🌾
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login">
              <button className="btn btn-primary" style={{ padding: '6px 15px', fontSize: '0.9rem' }}>
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
