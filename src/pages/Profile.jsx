import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import PostCard from '../components/PostCard';
import '../styles/reddit_theme.css'; // Re-use our base styles

const Profile = () => {
    const { currentUser } = useAuth();
    const [myPosts, setMyPosts] = useState([]);
    const [profileData, setProfileData] = useState({
        bio: '',
        location: '',
        farmName: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    // 1. Fetch User Profile Data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!currentUser) return;
            const docRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setProfileData(docSnap.data());
            }
            setLoading(false);
        };
        fetchProfile();
    }, [currentUser]);

    // 2. Fetch User's Posts (My Activity)
    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'posts'),
            where('authorId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMyPosts(postsData);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleSaveProfile = async () => {
        if (!currentUser) return;
        try {
            await setDoc(doc(db, "users", currentUser.uid), {
                ...profileData,
                email: currentUser.email,
                updatedAt: new Date()
            }, { merge: true });
            setIsEditing(false);
            alert("Profile updated! 🚜");
        } catch (e) {
            console.error("Error updating profile:", e);
            alert("Failed to update profile.");
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading profile...</div>;

    // Threads-style Minimal Layout
    return (
        <div className="app-layout" style={{ justifyContent: 'center' }}>
            <main className="feed-container" style={{ maxWidth: '640px', width: '100%' }}>

                {/* User Info Header (Threads Style) */}
                <div style={{ background: 'white', border: '1px solid #ccc', borderRadius: '4px', padding: '24px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
                                {currentUser?.displayName || currentUser?.email?.split('@')[0]}
                            </h2>
                            <span style={{ background: '#f0f0f0', color: '#666', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>
                                🍇 GrapeGrowers Member
                            </span>
                        </div>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>
                            {/* Placeholder Avatar */}
                            🧑‍🌾
                        </div>
                    </div>

                    {isEditing ? (
                        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input
                                className="create-post-input"
                                placeholder="Farm Name (e.g., Sunny Vinyard)"
                                value={profileData.farmName || ''}
                                onChange={(e) => setProfileData({ ...profileData, farmName: e.target.value })}
                            />
                            <input
                                className="create-post-input"
                                placeholder="Location (e.g., Napa Valley, CA)"
                                value={profileData.location || ''}
                                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                            />
                            <textarea
                                className="create-post-input"
                                placeholder="Bio: Tell us about your farming journey..."
                                value={profileData.bio || ''}
                                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn btn-primary" onClick={handleSaveProfile}>Save Profile</button>
                                <button className="vote-btn" onClick={() => setIsEditing(false)} style={{ fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px', padding: '5px 10px' }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ marginTop: '15px' }}>
                            {profileData.farmName && <div style={{ fontWeight: 'bold' }}>📍 {profileData.farmName}</div>}
                            {profileData.location && <div style={{ color: '#555', fontSize: '14px', marginBottom: '5px' }}>🌍 {profileData.location}</div>}
                            <p style={{ lineHeight: '1.5', color: '#333' }}>
                                {profileData.bio || "No bio yet. Tap 'Edit Profile' to introduce yourself!"}
                            </p>
                            <button
                                onClick={() => setIsEditing(true)}
                                style={{ width: '100%', marginTop: '15px', padding: '8px', border: '1px solid #ccc', background: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                            >
                                Edit Profile
                            </button>
                        </div>
                    )}
                </div>

                {/* Tabs (Threads Style) */}
                <div style={{ display: 'flex', borderBottom: '1px solid #dbdbdb', marginBottom: '15px' }}>
                    <div style={{ flex: 1, textAlign: 'center', padding: '12px', borderBottom: '2px solid black', fontWeight: 'bold', cursor: 'pointer' }}>
                        Threads
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: '12px', color: '#999', cursor: 'pointer' }}>
                        Replies
                    </div>
                </div>

                {/* My Post Feed */}
                <div className="posts-list">
                    {myPosts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}
                    {myPosts.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                            <p>You haven't posted anything yet.</p>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
};

export default Profile;
