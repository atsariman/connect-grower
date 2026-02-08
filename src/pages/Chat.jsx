import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { storage, db } from '../firebase'; // Import db
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    doc,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore'; // Import Firestore functions
import '../styles/index.css';

const Chat = () => {
    const { t, language } = useLanguage();
    const { currentUser } = useAuth();
    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [isSending, setIsSending] = useState(false); // Prevents double submission
    const [selectedImage, setSelectedImage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');

    // Fetch messages from Firestore in real-time
    useEffect(() => {
        const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, []);

    // Auto-scroll on new messages
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, replyingTo]);

    const translateText = async (text, sourceLang, targetLang) => {
        try {
            const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`);
            const data = await response.json();
            if (data && data.responseData) {
                return data.responseData.translatedText;
            }
            return text;
        } catch (error) {
            console.error("Translation error:", error);
            return text;
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        // Block if empty, uploading file, or already sending text
        if (!inputText.trim() || isSending || uploading) return;

        setIsSending(true); // Lock
        try {
            await sendMessage(inputText, 'text');
            setInputText('');
            setReplyingTo(null);
        } finally {
            setIsSending(false); // Unlock
        }
    };

    const sendMessage = async (content, type = 'text') => {
        if (!currentUser) {
            alert("Login required to chat!");
            return;
        }

        // Generate translations only for text messages
        const translations = {
            ko: type === 'text' ? content : '',
            en: type === 'text' ? content : '',
            ja: type === 'text' ? content : '',
            it: type === 'text' ? content : ''
        };

        if (type === 'text') {
            // Identify languages to translate to (exclude source language)
            const targetLangs = ['ko', 'en', 'ja', 'it'].filter(lang => lang !== language);

            // Parallel fetch for speed
            await Promise.all(targetLangs.map(async (targetLang) => {
                const translated = await translateText(content, language, targetLang);
                translations[targetLang] = translated;
            }));
        }

        try {
            await addDoc(collection(db, "messages"), {
                user: currentUser.displayName || currentUser.email.split('@')[0],
                uid: currentUser.uid,
                text: type === 'text' ? content : '',
                mediaUrl: type !== 'text' ? content : null,
                type: type,
                likes: [],
                replyTo: replyingTo ? {
                    user: replyingTo.user,
                    text: replyingTo.type === 'text' ? replyingTo.text : (replyingTo.type === 'image' ? '📷 Photo' : '🎥 Video')
                } : null,
                createdAt: serverTimestamp(),
                originalLang: language,
                translations: translations
            });
        } catch (error) {
            console.error("Error sending message: ", error);
            alert("Failed to send message");
        }
    }

    const handleFileClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!currentUser) {
            alert("Login required to upload files!");
            return;
        }

        setUploading(true); // This locks sending too
        try {
            const storageRef = ref(storage, `chat_media/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            const type = file.type.startsWith('image/') ? 'image' : 'video';

            await sendMessage(downloadURL, type);

        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Upload failed! (Check Console)");
        } finally {
            setUploading(false);
            e.target.value = null;
        }
    };

    const handleLike = async (msg) => {
        if (!currentUser) return;

        const msgRef = doc(db, "messages", msg.id);
        const isLiked = msg.likes && msg.likes.includes(currentUser.uid);

        try {
            if (isLiked) {
                await updateDoc(msgRef, {
                    likes: arrayRemove(currentUser.uid)
                });
            } else {
                await updateDoc(msgRef, {
                    likes: arrayUnion(currentUser.uid)
                });
            }
        } catch (error) {
            console.error("Error updating like:", error);
        }
    };

    const handleReplyClick = (msg) => {
        setReplyingTo(msg);
    };

    return (
        <div className="container chat-layout" style={{ padding: '20px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: '20px' }}>{t('chatTitle')}</h2>

            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                <div
                    ref={chatContainerRef}
                    className="chat-messages"
                    style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f9f9f9', scrollBehavior: 'smooth' }}
                >
                    {messages.map(msg => {
                        const isMe = currentUser && msg.uid === currentUser.uid;
                        const translatedText = (msg.translations && msg.translations[language]) || msg.text;

                        // Modified logic: Show translation ONLY if different from original text
                        // This fixes issues where user typed in wrong language mode or duplicate display
                        const showTranslation = msg.type === 'text' &&
                            translatedText &&
                            translatedText.trim() !== msg.text.trim();

                        const likedByMe = msg.likes && currentUser && msg.likes.includes(currentUser.uid);
                        const likeCount = msg.likes ? msg.likes.length : 0;

                        // Format timestamp
                        let timeStr = '';
                        if (msg.createdAt) {
                            // Handle Firestore Timestamp or Date object
                            const date = msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt);
                            timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        }

                        return (
                            <div key={msg.id} style={{
                                marginBottom: '15px',
                                textAlign: isMe ? 'right' : 'left',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isMe ? 'flex-end' : 'flex-start'
                            }}>

                                <div style={{
                                    display: 'inline-block',
                                    padding: msg.type === 'text' ? '12px 18px' : '5px',
                                    borderRadius: '18px',
                                    background: isMe ? 'var(--primary-color)' : 'white',
                                    color: isMe ? 'white' : 'black',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    maxWidth: '85%',
                                    borderBottomRightRadius: isMe ? '4px' : '18px',
                                    borderBottomLeftRadius: isMe ? '18px' : '4px',
                                    textAlign: 'left',
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}>
                                    {/* Reply Preview */}
                                    {msg.replyTo && (
                                        <div style={{
                                            background: isMe ? 'rgba(0,0,0,0.1)' : '#f0f0f0',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            marginBottom: '6px',
                                            fontSize: '0.85rem',
                                            borderLeft: '3px solid rgba(0,0,0,0.2)'
                                        }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.75rem', opacity: 0.8 }}>
                                                ↩️ {msg.replyTo.user}
                                            </div>
                                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {msg.replyTo.text}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '4px', fontWeight: 'bold', padding: msg.type !== 'text' ? '5px 5px 0' : '0' }}>{msg.user}</div>

                                    {msg.type === 'text' && (
                                        <div style={{ fontSize: '1rem', marginBottom: showTranslation ? '6px' : '0' }}>
                                            {msg.text}
                                        </div>
                                    )}

                                    {msg.type === 'image' && (
                                        <img
                                            src={msg.mediaUrl}
                                            alt="User upload"
                                            onClick={() => setSelectedImage(msg.mediaUrl)}
                                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '12px', display: 'block', cursor: 'pointer', objectFit: 'cover' }}
                                        />
                                    )}

                                    {msg.type === 'video' && (
                                        <video controls src={msg.mediaUrl} style={{ maxWidth: '100%', borderRadius: '12px', display: 'block' }} />
                                    )}

                                    {showTranslation && (
                                        <div style={{
                                            fontSize: '0.9rem',
                                            opacity: 0.9,
                                            paddingTop: '6px',
                                            borderTop: `1px solid ${isMe ? 'rgba(255,255,255,0.3)' : '#eee'}`,
                                            fontStyle: 'italic'
                                        }}>
                                            🌍 {translatedText}
                                        </div>
                                    )}
                                </div>

                                {/* Meta and Actions */}
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: '#999',
                                    marginTop: '4px',
                                    padding: '0 5px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <span>{timeStr}</span>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button
                                            onClick={() => handleLike(msg)}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: likedByMe ? '#e91e63' : '#aaa',
                                                padding: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', transition: 'transform 0.1s'
                                            }}
                                            title={likedByMe ? "Unlike" : "Like"}
                                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.8)'}
                                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            {likedByMe ? '❤️' : '🤍'} <span style={{ marginLeft: '2px', fontSize: '0.75rem' }}>{likeCount > 0 ? likeCount : ''}</span>
                                        </button>
                                        <button
                                            onClick={() => handleReplyClick(msg)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 0, fontSize: '0.9rem' }}
                                            title="Reply"
                                        >
                                            ↩️
                                        </button>
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                    {uploading && (
                        <div style={{ textAlign: 'center', padding: '10px', color: '#666', fontStyle: 'italic' }}>
                            Uploading media... ⏳
                        </div>
                    )}
                </div>

                {/* Lightbox Modal */}
                {selectedImage && (
                    <div
                        onClick={() => setSelectedImage(null)}
                        style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, cursor: 'zoom-out'
                        }}
                    >
                        <img src={selectedImage} alt="Full size" style={{ maxWidth: '95%', maxHeight: '90%', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)' }} />
                    </div>
                )}

                {/* Reply Indicator Banner */}
                {replyingTo && (
                    <div style={{
                        padding: '10px 20px',
                        background: '#f0f4c3',
                        borderTop: '1px solid #dce775',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.9rem',
                        color: '#555',
                        position: 'absolute',
                        bottom: '70px',
                        left: 0, right: 0, zIndex: 10
                    }}>
                        <div>
                            <span style={{ fontWeight: 'bold' }}>Replying to {replyingTo.user}:</span>
                            <span style={{ marginLeft: '5px', fontStyle: 'italic', opacity: 0.8 }}>
                                {replyingTo.type === 'text' ? replyingTo.text.substring(0, 20) + (replyingTo.text.length > 20 ? '...' : '') : 'Media'}
                            </span>
                        </div>
                        <button
                            onClick={() => setReplyingTo(null)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#888' }}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <form className="chat-input-form" onSubmit={handleSend} style={{ padding: '20px', background: 'white', borderTop: '1px solid #eee', display: 'flex', gap: '10px', alignItems: 'center', position: 'relative', zIndex: 20 }}>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" style={{ display: 'none' }} />
                    <button
                        type="button"
                        onClick={handleFileClick}
                        className="btn chat-camera-btn"
                        disabled={isSending || uploading}
                        style={{ borderRadius: '50%', width: '45px', height: '45px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f0f0', color: '#666', border: '1px solid #ddd', flexShrink: 0, opacity: (isSending || uploading) ? 0.5 : 1 }}
                    >
                        📷
                    </button>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={isSending ? "Translating & Sending..." : (replyingTo ? `Replying...` : t('chatPlaceholder'))}
                        className="chat-input-field"
                        style={{ flex: 1, padding: '12px', borderRadius: '25px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none', paddingLeft: '20px', background: isSending ? '#f5f5f5' : 'white' }}
                        disabled={isSending || uploading}
                    />
                    <button type="submit" disabled={isSending || uploading} className="btn btn-primary chat-send-btn" style={{ borderRadius: '25px', padding: '10px 25px', flexShrink: 0, opacity: (isSending || uploading) ? 0.7 : 1 }}>{t('send')}</button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
