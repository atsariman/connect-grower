import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Forum = () => {
    const { t } = useLanguage();

    return (
        <div className="container" style={{ padding: '40px 20px' }}>
            <h2>{t('forumTitle')}</h2>
            <p>{t('forumDesc')}</p>
            <div className="glass-panel" style={{ padding: '40px', marginTop: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚧</div>
                <h3>{t('forumSoon')}</h3>
                <p>{t('forumDetail')}</p>
            </div>
        </div>
    );
};

export default Forum;
