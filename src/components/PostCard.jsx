import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const PostCard = ({ post }) => {
    const { currentUser } = useAuth();
    const { language, t } = useLanguage();
    const [likes, setLikes] = useState(post.likes || []);
    const [comments, setComments] = useState(post.comments || []);
    const [translatedComments, setTranslatedComments] = useState({});
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isLiked, setIsLiked] = useState(false);

    // Translation State
    const [translatedContent, setTranslatedContent] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [showOriginal, setShowOriginal] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setIsLiked(likes.includes(currentUser.uid));
        }
    }, [currentUser, likes]);

    // Google Translate Helper
    const fetchTranslation = async (text, targetLang) => {
        if (!text) return '';
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data && data[0]) {
                return data[0].map(item => item[0]).join('');
            }
            return text;
        } catch (error) {
            console.error("Google Translate fetch error:", error);
            return text;
        }
    };

    // Automatic Translation for Post Content
    useEffect(() => {
        let isMounted = true;

        const translatePost = async () => {
            if (!post.title && !post.content) return;

            setIsTranslating(true);
            try {
                const targetLang = language;

                const [translatedTitle, translatedBody] = await Promise.all([
                    fetchTranslation(post.title, targetLang),
                    fetchTranslation(post.content, targetLang)
                ]);

                if (!isMounted) return;

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


    // Automatic Translation for Comments
    useEffect(() => {
        if (!showComments) return;

        const translateAllComments = async () => {
            const userLang = language;
            const newTranslations = {};

            await Promise.all(comments.map(async (comment, index) => {
                if (!comment.text) return;
                const translatedText = await fetchTranslation(comment.text, userLang);
                if (translatedText && translatedText !== comment.text) {
                    newTranslations[index] = translatedText;
                }
            }));

            setTranslatedComments(newTranslations);
        };

        translateAllComments();
    }, [showComments, language, comments]);


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
            alert(t('sunFeedback'));
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

        setComments([...comments, commentData]);
        setNewComment('');

        const postRef = doc(db, 'posts', post.id);
        await updateDoc(postRef, {
            comments: arrayUnion(commentData)
        });
    };

    // Determine what to show (Original vs Translated)
    const displayTitle = (translatedContent && !showOriginal) ? translatedContent.title : post.title;
    const displayBody = (translatedContent && !showOriginal) ? translatedContent.body : post.content;

    // Translation Indicator Logic
    const hasTranslation = !!translatedContent;

    return (
        <div className="reddit-card" style={{ padding: '16px', border: '1px solid #efefef', boxShadow: 'none', borderBottom: '1px solid #dbdbdb', borderRadius: 0, marginBottom: 0 }}>
            {/* Author Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#000' }}>
                    {post.author}
                    <span style={{ color: '#999', fontWeight: 'normal', fontSize: '13px', marginLeft: '5px' }}>{/* time param */}</span>
                </div>
                <div style={{ color: '#999', fontSize: '20px', lineHeight: '10px' }}>...</div>
            </div>

            {/* Content Area */}
            <div className="card-content-area" style={{ marginLeft: '0' }}>
                <h3 className="card-title" style={{ fontSize: '18px', marginBottom: '8px', fontWeight: 'bold' }}>{displayTitle}</h3>
                {displayBody && <p className="card-text" style={{ marginBottom: '8px', fontSize: '15px', lineHeight: '1.5', color: '#333' }}>{displayBody}</p>}

                {/* Subtle Translation Footer */}
                {hasTranslation && (
                    <div
                        onClick={() => setShowOriginal(!showOriginal)}
                        style={{
                            fontSize: '12px',
                            color: '#1da1f2',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginBottom: '10px'
                        }}
                    >
                        🌍 {showOriginal ? t('viewTranslated') : t('translatedFrom')}
                    </div>
                )}

                {post.imageUrl && (
                    <div className="card-image-container" style={{ borderRadius: '12px', overflow: 'hidden', marginTop: '5px' }}>
                        <img src={post.imageUrl} alt="Post content" className="card-image" style={{ width: '100%', display: 'block' }} />
                    </div>
                )}

                {/* Interaction Icons */}
                <div className="card-footer-actions" style={{ marginTop: '12px', display: 'flex', gap: '20px' }}>
                    <button
                        onClick={handleLike}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <span style={{ fontSize: '20px', color: isLiked ? '#FFD700' : '#333' }}>
                            {isLiked ? '☀️' : '🌥️'}
                        </span>
                        <span style={{ fontSize: '14px', color: isLiked ? '#FFD700' : '#666' }}>{likes.length > 0 ? likes.length : ''}</span>
                    </button>

                    <button
                        onClick={() => setShowComments(!showComments)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <span style={{ fontSize: '20px' }}>💬</span>
                        <span style={{ fontSize: '14px', color: '#666' }}>{comments.length > 0 ? comments.length : ''}</span>
                    </button>

                    <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                        <span style={{ fontSize: '20px' }}>↪️</span>
                    </button>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="comments-section" style={{ marginTop: '15px', borderTop: '1px solid #efefef', paddingTop: '10px' }}>
                        <div className="comments-list">
                            {comments.map((comment, index) => {
                                const isCommentTranslated = translatedComments[index] && !showOriginal;
                                const displayCommentText = isCommentTranslated ? translatedComments[index] : comment.text;

                                return (
                                    <div key={index} className="comment-item" style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                                        <div className="comment-author" style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {comment.author}
                                        </div>
                                        <div className="comment-text" style={{ fontSize: '14px' }}>{displayCommentText}</div>
                                        {translatedComments[index] && (
                                            <div style={{ fontSize: '11px', color: '#1da1f2', marginTop: '2px' }}>
                                                {showOriginal ? t('viewTranslated') : `🌍 ${t('translated')}`}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {comments.length === 0 && <div style={{ color: '#999', fontSize: '13px', padding: '10px 0' }}>{t('startConversation')}</div>}
                        </div>

                        {currentUser && (
                            <form className="comment-input-area" onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <input
                                    type="text"
                                    placeholder={`${t('replyTo')} ${post.author}...`}
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid #ddd', fontSize: '14px', background: '#f9f9f9' }}
                                />
                                <button type="submit" disabled={!newComment.trim()} style={{ background: 'none', border: 'none', color: '#0095f6', fontWeight: 'bold', cursor: 'pointer' }}>{t('postBtn')}</button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostCard;
