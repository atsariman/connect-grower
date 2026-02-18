import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CreatePost = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [activeTab, setActiveTab] = useState('post'); // 'post' or 'image'

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setActiveTab('image');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Please login to post!");
            return;
        }
        if (!title.trim()) {
            alert("Please add a title!");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let imageUrl = null;
            if (activeTab === 'image' && image) {
                const storageRef = ref(storage, `posts/${Date.now()}_${image.name}`);
                await uploadBytes(storageRef, image);
                imageUrl = await getDownloadURL(storageRef);
            }

            await addDoc(collection(db, "posts"), {
                title: title,
                content: activeTab === 'post' ? content : '',
                imageUrl: imageUrl,
                author: currentUser.displayName || currentUser.email.split('@')[0],
                authorId: currentUser.uid,
                likes: [],
                comments: [],
                createdAt: serverTimestamp()
            });

            // Reset form
            setTitle('');
            setContent('');
            setImage(null);
            setPreview(null);
            setActiveTab('post');
            alert("Post created successfully!");

        } catch (err) {
            console.error("Error creating post:", err);
            setError("Failed to create post. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) return (
        <div className="create-post-widget" style={{ flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>Join the conversation! 🚜</h3>
            <p style={{ margin: 0, color: '#666' }}>Log in to share your harvest, ask questions, or report issues.</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <a href="/login" className="btn btn-primary" style={{ textDecoration: 'none', borderRadius: '20px', padding: '8px 20px' }}>Log In</a>
                <a href="/signup" className="btn btn-secondary" style={{ textDecoration: 'none', borderRadius: '20px', padding: '8px 20px' }}>Sign Up</a>
            </div>
        </div>
    );

    return (
        <div className="create-post-widget" style={{ flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
            {error && <div style={{ color: 'red', padding: '10px' }}>{error}</div>}

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #edeff1' }}>
                <button
                    onClick={() => setActiveTab('post')}
                    style={{
                        flex: 1, padding: '15px', background: activeTab === 'post' ? '#f6f7f8' : 'white',
                        border: 'none', borderBottom: activeTab === 'post' ? '2px solid #0079d3' : 'none',
                        fontWeight: 'bold', color: activeTab === 'post' ? '#0079d3' : '#878a8c', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                >
                    <span style={{ fontSize: '18px' }}>📄</span> Post
                </button>
                <button
                    onClick={() => setActiveTab('image')}
                    style={{
                        flex: 1, padding: '15px', background: activeTab === 'image' ? '#f6f7f8' : 'white',
                        border: 'none', borderBottom: activeTab === 'image' ? '2px solid #0079d3' : 'none',
                        fontWeight: 'bold', color: activeTab === 'image' ? '#0079d3' : '#878a8c', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                >
                    <span style={{ fontSize: '18px' }}>📷</span> Image & Video
                </button>
            </div>

            <div style={{ padding: '16px' }}>
                {/* Title Input */}
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                        width: '100%', padding: '10px 15px', borderRadius: '4px', border: '1px solid #edeff1',
                        fontSize: '1.0rem', marginBottom: '12px', fontWeight: '500', outline: 'none'
                    }}
                />

                {/* Content Area */}
                {activeTab === 'post' ? (
                    <textarea
                        placeholder="Text (optional)"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        style={{
                            width: '100%', minHeight: '120px', padding: '10px 15px', borderRadius: '4px',
                            border: '1px solid #edeff1', fontSize: '0.95rem', resize: 'vertical', outline: 'none',
                            fontFamily: 'inherit'
                        }}
                    />
                ) : (
                    <div style={{
                        border: '1px dashed #edeff1', borderRadius: '4px', padding: '40px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        minHeight: '200px', backgroundColor: '#f6f7f8'
                    }}>
                        {preview ? (
                            <div style={{ position: 'relative', width: '100%' }}>
                                <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', display: 'block', margin: '0 auto', borderRadius: '4px' }} />
                                <button
                                    onClick={() => { setImage(null); setPreview(null); }}
                                    style={{
                                        position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white',
                                        border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >✕</button>
                            </div>
                        ) : (
                            <label style={{ cursor: 'pointer', textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>☁️</div>
                                <div style={{ color: '#0079d3', fontWeight: 'bold', marginBottom: '5px' }}>Upload Image</div>
                                <div style={{ color: '#878a8c', fontSize: '0.8rem' }}>Drag and drop or click to upload</div>
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                            </label>
                        )}
                    </div>
                )}

                {/* Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid #edeff1', paddingTop: '16px' }}>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn btn-primary"
                        style={{
                            padding: '8px 24px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem',
                            opacity: (!title.trim()) ? 0.5 : 1, cursor: (!title.trim()) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePost;
