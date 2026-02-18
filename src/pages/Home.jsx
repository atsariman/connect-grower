import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/reddit_theme.css';

const Home = () => {
    const [posts, setPosts] = useState([]);
    const { currentUser } = useAuth();
    const [feedType, setFeedType] = useState('hot'); // 'hot', 'new', 'top'
    const { t } = useLanguage();

    useEffect(() => {
        // Real-time listener for posts
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPosts(postsData);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="app-layout">

            {/* Left Sidebar (Navigation) */}
            <aside className="sidebar-left">
                <div className="sidebar-card">
                    <div className="sidebar-header">FEEDS</div>
                    <div className={`sidebar-menu-item ${feedType === 'home' ? 'active' : ''}`} onClick={() => setFeedType('home')}>🏠 Home</div>
                    <div className={`sidebar-menu-item ${feedType === 'popular' ? 'active' : ''}`} onClick={() => setFeedType('popular')}>🔥 Popular</div>
                    <div className="sidebar-menu-item">↗️ All</div>
                </div>

                <div className="sidebar-card">
                    <div className="sidebar-header">COMMUNITIES</div>
                    <div className="sidebar-menu-item active" style={{ background: '#e8f5e9', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                        🍊 r/CitrusGrowers
                    </div>
                    <div className="sidebar-menu-item">🌽 r/CornFarmers</div>
                    <div className="sidebar-menu-item">🍅 r/TomatoLovers</div>
                </div>
            </aside>

            {/* Center Feed */}
            <main className="feed-container">
                {/* Create Post Widget */}
                <CreatePost />

                {/* Feed Sort Options */}
                <div style={{ background: 'white', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '15px', padding: '10px', display: 'flex', gap: '15px' }}>
                    <span style={{ fontWeight: 'bold', color: feedType === 'hot' ? 'var(--primary-color)' : '#878a8c', cursor: 'pointer' }} onClick={() => setFeedType('hot')}>🔥 Hot</span>
                    <span style={{ fontWeight: 'bold', color: feedType === 'new' ? 'var(--primary-color)' : '#878a8c', cursor: 'pointer' }} onClick={() => setFeedType('new')}>✨ New</span>
                    <span style={{ fontWeight: 'bold', color: feedType === 'top' ? 'var(--primary-color)' : '#878a8c', cursor: 'pointer' }} onClick={() => setFeedType('top')}>🏆 Top</span>
                </div>

                {/* Posts List */}
                <div className="posts-list">
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}
                    {posts.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🍂</div>
                            <h3>No posts found</h3>
                            <p>Be the first to share in this topic!</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Right Sidebar (Community Info) */}
            <aside className="sidebar-right">
                {/* About Community Widget */}
                <div className="sidebar-card">
                    <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>About Community</span>
                        <span>•••</span>
                    </div>
                    <div style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <div style={{ fontSize: '2rem' }}>🍊</div>
                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>r/CitrusGrowers</span>
                        </div>
                        <p style={{ fontSize: '0.9rem', marginBottom: '15px', lineHeight: '1.4' }}>
                            The #1 community for citrus farmers worldwide. Share your harvest, ask questions, and grow together!
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            <div>
                                <div style={{ fontSize: '1.2rem' }}>1.2k</div>
                                <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal' }}>Members</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '1.2rem' }}>150</div>
                                <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal' }}>Online</div>
                            </div>
                        </div>
                        <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', fontSize: '0.85rem' }}>
                            🗓️ Created Feb 10, 2026
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', marginTop: '15px', borderRadius: '20px', fontWeight: 'bold' }}>Join Community</button>
                    </div>
                </div>

                {/* Rules Widget */}
                <div className="sidebar-card">
                    <div className="sidebar-header">r/CitrusGrowers Rules</div>
                    <ol style={{ padding: '0', margin: '0', listStyle: 'none' }}>
                        <li style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem', fontWeight: 'bold' }}>1. Be respectful to fellow farmers</li>
                        <li style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem', fontWeight: 'bold' }}>2. Posts must be related to citrus</li>
                        <li style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem', fontWeight: 'bold' }}>3. No spam or self-promotion</li>
                    </ol>
                </div>

                <div style={{ padding: '10px', fontSize: '0.8rem', color: '#878a8c' }}>
                    ConnectGrower © 2026. All rights reserved.
                </div>
            </aside>

        </div>
    );
};

export default Home;
