import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const Forum = () => {
    const { t } = useLanguage();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPosts(postsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching posts:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                <h2>{t('forumTitle')}</h2>
                <p style={{ color: '#666' }}>{t('forumDesc')}</p>
            </div>

            {/* Create Post Widget */}
            <div style={{ marginBottom: '30px' }}>
                <CreatePost />
            </div>

            {/* Posts Feed */}
            <div className="posts-feed">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Loading discussions... 🚜</div>
                ) : posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '12px' }}>
                        <h3>No posts yet!</h3>
                        <p>Be the first to share your farming story.</p>
                    </div>
                ) : (
                    posts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))
                )}
            </div>
        </div>
    );
};

export default Forum;
