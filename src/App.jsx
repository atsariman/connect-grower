import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Forum from './pages/Forum';
import Login from './pages/Login';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/index.css';
import './styles/reddit_theme.css';

// Protected Route Component
const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
  if (!currentUser) return <Navigate to="/login" />;

  return children;
};

// Public Route Component (redirects to home if already logged in)
// const PublicRoute = ({ children }) => {
//     const { currentUser, loading } = useAuth();
//     if (loading) return <div>Loading...</div>;
//     if (currentUser) return <Navigate to="/" />;
//     return children;
// };

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main style={{ flex: 1 }}>
              <Routes>
                {/* Home is now public */}
                <Route path="/" element={<Home />} />

                {/* Login page */}
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route path="/chat" element={
                  <PrivateRoute>
                    <Chat />
                  </PrivateRoute>
                } />
                <Route path="/forum" element={
                  <PrivateRoute>
                    <Forum />
                  </PrivateRoute>
                } />
              </Routes>
            </main>
            <footer style={{ textAlign: 'center', padding: '20px', background: '#333', color: '#fff', marginTop: 'auto' }}>
              <p>&copy; 2026 ConnectGrower. All rights reserved.</p>
            </footer>
          </div>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
