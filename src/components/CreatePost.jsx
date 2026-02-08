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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
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
            if (image) {
                const storageRef = ref(storage, `posts/${Date.now()}_${image.name}`);
                await uploadBytes(storageRef, image);
                imageUrl = await getDownloadURL(storageRef);
            }

            await addDoc(collection(db, "posts"), {
                title: title,
                content: content,
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
            alert("Post created successfully!");

        } catch (err) {
            console.error("Error creating post:", err);
            setError("Failed to create post. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) return (
        <div className="create-post-widget" style={{ justifyContent: 'center', color: '#666' }}>
            <p>Log in to share your farming story!</p>
        </div>
    );

    return (
        <div className="create-post-widget" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            <input
                type="text"
                placeholder="Title (e.g., My First Harvest)"
                className="create-post-input"
                style={{ marginBottom: '10px', fontWeight: 'bold' }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
                placeholder="Share your story..."
                className="create-post-input"
                style={{ marginBottom: '10px', minHeight: '80px', resize: 'vertical' }}
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />

            {preview && (
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }} />
                    <button
                        onClick={() => { setImage(null); setPreview(null); }}
                        style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
                    >✕</button>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="action-btn" style={{ cursor: 'pointer', color: 'var(--primary-color)' }}>
                    📷 Add Photo
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                </label>

                <button
                    onClick={handleSubmit}
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ padding: '8px 20px', borderRadius: '20px' }}
                >
                    {loading ? 'Posting...' : 'Post'}
                </button>
            </div>
        </div>
    );
};

export default CreatePost;
