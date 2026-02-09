import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import { useAuth } from '../context/AuthContext';
import '../styles/reddit_theme.css';

const Home = () => {
    const [posts, setPosts] = useState([]);
    const { currentUser } = useAuth();
    const [feedType, setFeedType] = useState('hot'); // 'hot', 'new', 'top'

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

            {/* Left Sidebar */}
            <aside className="sidebar">
                {/* Logo Section Removed: Moved back to Header */}

                <div className="sidebar-card">
                    <div className="sidebar-header">FEEDS</div>
                    <div className={`sidebar-menu-item ${feedType === 'home' ? 'active' : ''}`} onClick={() => setFeedType('home')}>🏠 Home</div>
                    <div className={`sidebar-menu-item ${feedType === 'popular' ? 'active' : ''}`} onClick={() => setFeedType('popular')}>🔥 Popular</div>
                    <div className="sidebar-menu-item">↗️ All</div>
                </div>

                <div className="sidebar-card">
                    <div className="sidebar-header">COMMUNITIES</div>
                    <div className="sidebar-menu-item active" style={{ background: '#e8f5e9', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                        🍇 r/GrapeGrowers
                    </div>
                </div>

                <div className="sidebar-card" style={{ padding: '15px', color: '#666', fontSize: '0.85rem' }}>
                    <p>ConnectGrower © 2026. The front page of agriculture.</p>
                </div>
            </aside>

            {/* Center Feed */}
            <main className="feed-container">
                {/* Create Post Widget */}
                {currentUser && <CreatePost />}

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
                            <h3>No posts yet</h3>
                            <p>Share your grape growing journey!</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Right Sidebar */}
            <aside className="sidebar" style={{ display: 'none' }}>
                {/* Future widgets */}
            </aside>

        </div>
    );
};

export default Home;
