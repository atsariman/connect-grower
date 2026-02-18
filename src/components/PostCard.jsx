import React from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const PostCard = ({ post }) => {
    const { currentUser } = useAuth();
    const likedByMe = post.likes && currentUser && post.likes.includes(currentUser.uid);
    const likeCount = post.likes ? post.likes.length : 0;

    const handleLike = async () => {
        if (!currentUser) {
            alert("Please login to like posts!");
            return;
        }

        const postRef = doc(db, "posts", post.id);

        try {
            if (likedByMe) {
                await updateDoc(postRef, {
                    likes: arrayRemove(currentUser.uid)
                });
            } else {
                await updateDoc(postRef, {
                    likes: arrayUnion(currentUser.uid)
                });
            }
        } catch (error) {
            console.error("Error updating like:", error);
        }
    };

    // Format timestamp
    let timeStr = '';
    if (post.createdAt) {
        try {
            const date = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
            timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            timeStr = 'Just now';
        }
    }

    return (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', borderRadius: '12px', background: 'white', border: '1px solid #eee' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.0rem', marginRight: '10px' }}>
                    {post.author || 'Anonymous'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#888' }}>
                    {timeStr}
                </div>
            </div>

            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>{post.title}</h3>

            {post.content && (
                <div style={{ fontSize: '1rem', lineHeight: '1.5', marginBottom: '15px', whiteSpace: 'pre-wrap' }}>
                    {post.content}
                </div>
            )}

            {post.imageUrl && (
                <div style={{ marginBottom: '15px' }}>
                    <img
                        src={post.imageUrl}
                        alt="Post content"
                        style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '400px', objectFit: 'cover' }}
                    />
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderTop: '1px solid #f0f0f0', paddingTop: '10px' }}>
                <button
                    onClick={handleLike}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '5px',
                        color: likedByMe ? '#e91e63' : '#666',
                        fontSize: '0.9rem'
                    }}
                >
                    {likedByMe ? '❤️' : '🤍'} {likeCount} Likes
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666', fontSize: '0.9rem' }}>
                    💬 {post.comments ? post.comments.length : 0} Comments
                </div>
            </div>
        </div>
    );
};

export default PostCard;
