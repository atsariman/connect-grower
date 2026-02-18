import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import PostCard from '../components/PostCard';
import { useLanguage } from '../context/LanguageContext'; // Import useLanguage
import '../styles/reddit_theme.css';

const Profile = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage(); // Destructure t
    const [myPosts, setMyPosts] = useState([]);
    const [profileData, setProfileData] = useState({
        displayName: '',
        bio: '',
        location: '',
        farmName: '',
        country: 'US' // Default
    });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const countries = [
        { code: 'US', name: 'United States', flag: '🇺🇸' },
        { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
        { code: 'JP', name: 'Japan', flag: '🇯🇵' },
        { code: 'IT', name: 'Italy', flag: '🇮🇹' },
        { code: 'CN', name: 'China', flag: '🇨🇳' },
        { code: 'IN', name: 'India', flag: '🇮🇳' },
        { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
        { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
        { code: 'FR', name: 'France', flag: '🇫🇷' },
        { code: 'ES', name: 'Spain', flag: '🇪🇸' },
        { code: 'AU', name: 'Australia', flag: '🇦🇺' },
        { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    ];

    // 1. Fetch User Profile Data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!currentUser) return;
            const docRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfileData({
                    ...data,
                    displayName: currentUser.displayName || data.displayName || '',
                    country: data.country || 'US'
                });
            } else {
                setProfileData(prev => ({
                    ...prev,
                    displayName: currentUser.displayName || ''
                }));
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
            // Update Auth Profile if nickname changed
            if (profileData.displayName !== currentUser.displayName) {
                await updateProfile(currentUser, {
                    displayName: profileData.displayName
                });
            }

            // Update Firestore
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

    const selectedCountry = countries.find(c => c.code === profileData.country) || countries[0];

    // Threads-style Minimal Layout
    return (
        <div className="app-layout" style={{ justifyContent: 'center' }}>
            <main className="feed-container" style={{ maxWidth: '640px', width: '100%' }}>

                {/* User Info Header (Threads Style) */}
                <div style={{ background: 'white', border: '1px solid #ccc', borderRadius: '4px', padding: '24px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
                                {profileData.displayName || currentUser?.email?.split('@')[0]}
                            </h2>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ background: '#f0f0f0', color: '#666', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>
                                    {t('grapeMember')}
                                </span>
                                {profileData.country && (
                                    <span style={{ fontSize: '14px' }}>
                                        {selectedCountry.flag} {selectedCountry.name}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>
                            {/* Placeholder Avatar */}
                            🧑‍🌾
                        </div>
                    </div>

                    {isEditing ? (
                        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ textAlign: 'left' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>{t('nickname')}</label>
                                <input
                                    className="create-post-input"
                                    placeholder={t('nickname')}
                                    value={profileData.displayName || ''}
                                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                                />
                            </div>

                            {/* Country Selection */}
                            <div style={{ textAlign: 'left' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Country</label>
                                <select
                                    className="create-post-input"
                                    value={profileData.country || 'US'}
                                    onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                                    style={{ width: '100%', background: 'white' }}
                                >
                                    {countries.map(country => (
                                        <option key={country.code} value={country.code}>
                                            {country.flag} {country.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ textAlign: 'left' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>{t('farmName')}</label>
                                <input
                                    className="create-post-input"
                                    placeholder={t('farmNamePlaceholder')}
                                    value={profileData.farmName || ''}
                                    onChange={(e) => setProfileData({ ...profileData, farmName: e.target.value })}
                                />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>{t('location')}</label>
                                <input
                                    className="create-post-input"
                                    placeholder={t('locationPlaceholder')}
                                    value={profileData.location || ''}
                                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                                />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>{t('bio')}</label>
                                <textarea
                                    className="create-post-input"
                                    placeholder={t('bioPlaceholder')}
                                    value={profileData.bio || ''}
                                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button className="btn btn-primary" onClick={handleSaveProfile}>{t('saveProfile')}</button>
                                <button className="vote-btn" onClick={() => setIsEditing(false)} style={{ fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px', padding: '5px 10px' }}>{t('cancel')}</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ marginTop: '15px' }}>
                            {profileData.farmName && <div style={{ fontWeight: 'bold' }}>📍 {profileData.farmName}</div>}
                            {profileData.location && <div style={{ color: '#555', fontSize: '14px', marginBottom: '5px' }}>🌍 {profileData.location}</div>}
                            <p style={{ lineHeight: '1.5', color: '#333' }}>
                                {profileData.bio || t('noBio')}
                            </p>
                            <button
                                onClick={() => setIsEditing(true)}
                                style={{ width: '100%', marginTop: '15px', padding: '8px', border: '1px solid #ccc', background: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                            >
                                {t('editProfile')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Tabs (Threads Style) */}
                <div style={{ display: 'flex', borderBottom: '1px solid #dbdbdb', marginBottom: '15px' }}>
                    <div style={{ flex: 1, textAlign: 'center', padding: '12px', borderBottom: '2px solid black', fontWeight: 'bold', cursor: 'pointer' }}>
                        {t('threads')}
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: '12px', color: '#999', cursor: 'pointer' }}>
                        {t('replies')}
                    </div>
                </div>

                {/* My Post Feed */}
                <div className="posts-list">
                    {myPosts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}
                    {myPosts.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                            <p>{t('noPosts')}</p>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
};

export default Profile;
