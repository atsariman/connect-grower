import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const PostCard = ({ post }) => {
    const { currentUser } = useAuth();
    const { language } = useLanguage();
    const [likes, setLikes] = useState(post.likes || []);
    const [comments, setComments] = useState(post.comments || []);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isLiked, setIsLiked] = useState(false);

    // Translation State
    const [translatedContent, setTranslatedContent] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setIsLiked(likes.includes(currentUser.uid));
        }
    }, [currentUser, likes]);

    // Google Translate Helper (Client-side usage is unofficial and for demo purposes)
    const fetchTranslation = async (text, targetLang) => {
        if (!text) return '';
        try {
            // Using a proxy or alternative free endpoint that mimics Google Translate
            // Note: Ideally this should be a backend proxy to hide keys/avoid CORS, but for this demo:
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            const data = await response.json();
            // Structure: [[["translated", "source", ...], ...], ...]
            if (data && data[0]) {
                return data[0].map(item => item[0]).join('');
            }
            return text;
        } catch (error) {
            console.error("Google Translate fetch error:", error);
            return text;
        }
    };

    // Automatic Translation Effect
    useEffect(() => {
        let isMounted = true;

        const translatePost = async () => {
            if (!post.title && !post.content) return;

            setIsTranslating(true);
            try {
                const targetLang = language; // 'ko', 'en', 'ja', 'it'

                const [translatedTitle, translatedBody] = await Promise.all([
                    fetchTranslation(post.title, targetLang),
                    fetchTranslation(post.content, targetLang)
                ]);

                if (!isMounted) return;

                // Check if translation is different from original
                // This is a simple check; for production, better language detection is needed.
                const isTitleDifferent = post.title && translatedTitle && translatedTitle.trim() !== post.title.trim();
                const isBodyDifferent = post.content && translatedBody && translatedBody.trim() !== post.content.trim();

                if (isTitleDifferent || isBodyDifferent) {
                    setTranslatedContent({
                        title: isTitleDifferent ? translatedTitle : post.title,
                        body: isBodyDifferent ? translatedBody : post.content,
                        lang: language
                    });
                } else {
                    setTranslatedContent(null);
                }

            } catch (error) {
                console.error("Auto-translation failed:", error);
            } finally {
                if (isMounted) setIsTranslating(false);
            }
        };

        translatePost();

        return () => { isMounted = false; };
    }, [language, post.title, post.content]);

    const handleLike = async () => {
        if (!currentUser) {
            alert("Please log in to like a post.");
            return;
        }

        const postRef = doc(db, 'posts', post.id);

        if (isLiked) {
            setLikes(prev => prev.filter(uid => uid !== currentUser.uid));
            await updateDoc(postRef, {
                likes: arrayRemove(currentUser.uid)
            });
        } else {
            setLikes(prev => [...prev, currentUser.uid]);
            await updateDoc(postRef, {
                likes: arrayUnion(currentUser.uid)
            });
        }
        setIsLiked(!isLiked);
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Please login to comment!");
            return;
        }
        if (!newComment.trim()) return;

        const commentData = {
            text: newComment,
            author: currentUser.displayName || currentUser.email.split('@')[0],
            createdAt: new Date().toISOString()
        };

        // Optimistically update UI
        setComments([...comments, commentData]);
        setNewComment('');

        const postRef = doc(db, 'posts', post.id);
        await updateDoc(postRef, {
            comments: arrayUnion(commentData)
        });
    };

    return (
        <div className="reddit-card">
            {/* Vote Column */}
            <div className="card-vote-column">
                <button
                    className="vote-btn"
                    onClick={handleLike}
                    style={{ color: isLiked ? '#ff4500' : '#878a8c' }}
                >
                    ▲
                </button>
                <span className="vote-count" style={{ color: isLiked ? '#ff4500' : 'inherit' }}>
                    {likes.length}
                </span>
                <button className="vote-btn">▼</button>
            </div>

            {/* Content Area */}
            <div className="card-content-area">
                <div className="card-header-meta">
                    <span className="sub-reddit-name">r/GrapeGrowers</span>
                    <span>• Posted by u/{post.author}</span>
                    <span>• {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
                </div>

                <h3 className="card-title">{post.title}</h3>
                {post.content && <p className="card-text" style={{ marginBottom: '10px', fontSize: '0.95rem', lineHeight: '1.5' }}>{post.content}</p>}

                {/* Auto Translation Display */}
                {translatedContent && (
                    <div style={{ background: '#f0f8ff', padding: '12px', borderRadius: '4px', marginBottom: '15px', borderLeft: '3px solid var(--primary-color)' }}>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            🌍 Translated to {language.toUpperCase()} {isTranslating && '(Updating...)'}
                        </div>
                        <h4 style={{ fontSize: '1rem', margin: '0 0 5px 0', color: '#333' }}>{translatedContent.title}</h4>
                        <p style={{ fontSize: '0.9rem', color: '#333', margin: 0 }}>{translatedContent.body}</p>
                    </div>
                )}

                {post.imageUrl && (
                    <div className="card-image-container">
                        <img src={post.imageUrl} alt="Post content" className="card-image" />
                    </div>
                )}

                <div className="card-footer-actions">
                    <button className="action-btn" onClick={() => setShowComments(!showComments)}>
                        💬 {comments.length} Comments
                    </button>
                    <button className="action-btn">↪️ Share</button>
                    <button className="action-btn">🔖 Save</button>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="comments-section">
                        {currentUser && (
                            <form className="comment-input-area" onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="Add a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                                <button type="submit" className="btn btn-primary" style={{ padding: '8px 15px' }}>Reply</button>
                            </form>
                        )}

                        <div className="comments-list">
                            {comments.map((comment, index) => (
                                <div key={index} className="comment-item">
                                    <div className="comment-author">u/{comment.author} <span style={{ fontWeight: 'normal', color: '#999', fontSize: '0.75rem' }}>• {new Date(comment.createdAt).toLocaleDateString()}</span></div>
                                    <div className="comment-text">{comment.text}</div>
                                </div>
                            ))}
                            {comments.length === 0 && <div style={{ color: '#999', fontStyle: 'italic', padding: '10px' }}>No comments yet. Be the first!</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostCard;
