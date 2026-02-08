import React, { createContext, useState, useContext } from 'react';

// Translation Dictionary (Mock Data)
const translations = {
    en: {
        logo: '🌱 ConnectGrower',
        home: 'Home',
        chat: 'Global Chat',
        forum: 'Farm Insight',
        heroTitle: 'Connect, Share, Grow Together 🌱',
        heroDesc: "The world's first global community for farmers. Join us to share insights, trade tips, and grow your farming network.",
        joinBtn: 'Join the Community',
        updatesTitle: 'Latest Updates from Farmers 🌾',
        post1: 'Today we harvested 500kg of organic tomatoes! 🍅 The weather was perfect.',
        post2: 'Trying out a new irrigation system for my corn fields. Any tips? 🌽',
        post3: 'Harvest season for grapes is starting next week! 🍇 Excited but nervous.',
        likes: 'Likes',
        comment: 'Comment',
        translate: 'Translate',
        chatTitle: 'Global Farmers Chat 💬',
        chatPlaceholder: 'Type a message (auto-translated)...',
        send: 'Send',
        forumTitle: 'Farm Insight Board (Coming Soon) 🚜',
        forumDesc: 'Share your farming knowledge and ask questions here!',
        forumSoon: 'We are building this feature for you!',
        forumDetail: 'Soon you will be able to post detailed guides and questions.'
    },
    ko: {
        logo: '🌱 ConnectGrower',
        home: '홈',
        chat: '글로벌 채팅',
        forum: '농사 지혜',
        heroTitle: '연결하고, 공유하고, 함께 성장해요 🌱',
        heroDesc: '전 세계 농부들을 위한 최초의 글로벌 커뮤니티입니다. 아이디어를 나누고, 팁을 공유하며, 함께 성장하세요.',
        joinBtn: '커뮤니티 가입하기',
        updatesTitle: '농부들의 최신 소식 🌾',
        post1: '오늘 유기농 토마토 500kg 수확했어요! 🍅 날씨가 정말 완벽했네요.',
        post2: '옥수수 밭에 새로운 관개 시스템을 써보는 중이에요. 팁 있으신 분? 🌽',
        post3: '다음 주부터 포도 수확 시작해요! 🍇 설레기도 하고 긴장되네요.',
        likes: '좋아요',
        comment: '댓글',
        translate: '번역하기',
        chatTitle: '글로벌 농부 채팅방 💬',
        chatPlaceholder: '메시지를 입력하세요 (자동 번역됨)...',
        send: '전송',
        forumTitle: '농사 지혜 게시판 (오픈 예정) 🚜',
        forumDesc: '여기에 농사 노하우를 공유하고 질문해보세요!',
        forumSoon: '여러분을 위해 열심히 만들고 있어요!',
        forumDetail: '곧 자세한 가이드와 질문을 올릴 수 있게 될 거예요.'
    },
    ja: {
        logo: '🌱 ConnectGrower',
        home: 'ホーム',
        chat: 'グローバルチャット',
        forum: '農業インサイト',
        heroTitle: 'つながり、共有し、共に成長しよう 🌱',
        heroDesc: '世界中の農家のための初のグローバルコミュニティです。アイデアを共有し、ヒントを交換し、共に成長しましょう。',
        joinBtn: 'コミュニティに参加',
        updatesTitle: '農家からの最新情報 🌾',
        post1: '今日、有機トマト500kgを収穫しました！🍅 天気は最高でした。',
        post2: 'トウモロコシ畑で新しい灌漑システムを試しています。何かアドバイスはありますか？🌽',
        post3: '来週からブドウの収穫シーズンが始まります！🍇 ワクワクするけど緊張もします。',
        likes: 'いいね',
        comment: 'コメント',
        translate: '翻訳',
        chatTitle: 'グローバル農家チャット 💬',
        chatPlaceholder: 'メッセージを入力（自動翻訳）...',
        send: '送信',
        forumTitle: '農業インサイト掲示板（近日公開）🚜',
        forumDesc: 'あなたの農業ノウハウを共有し、ここで質問しましょう！',
        forumSoon: '現在、この機能を構築中です！',
        forumDetail: '間もなく詳細なガイドや質問を投稿できるようになります。'
    },
    it: {
        logo: '🌱 ConnectGrower',
        home: 'Home',
        chat: 'Chat Globale',
        forum: 'Approfondimenti',
        heroTitle: 'Connettiti, Condividi, Cresci Insieme 🌱',
        heroDesc: 'La prima community globale per agricoltori. Unisciti a noi per condividere idee, scambiare consigli e far crescere la tua rete.',
        joinBtn: 'Unisciti alla Community',
        updatesTitle: 'Ultimi Aggiornamenti dagli Agricoltori 🌾',
        post1: 'Oggi abbiamo raccolto 500kg di pomodori biologici! 🍅 Il tempo era perfetto.',
        post2: 'Sto provando un nuovo sistema di irrigazione per i miei campi di mais. Qualche consiglio? 🌽',
        post3: 'La stagione della vendemmia inizia la prossima settimana! 🍇 Eccitato ma nervoso.',
        likes: 'Piace',
        comment: 'Commenta',
        translate: 'Traduci',
        chatTitle: 'Chat Globale degli Agricoltori 💬',
        chatPlaceholder: 'Scrivi un messaggio (traduzione automatica)...',
        send: 'Invia',
        forumTitle: 'Bacheca Approfondimenti (Prossimamente) 🚜',
        forumDesc: 'Condividi le tue conoscenze agricole e fai domande qui!',
        forumSoon: 'Stiamo costruendo questa funzionalità per te!',
        forumDetail: 'Presto potrai pubblicare guide dettagliate e domande.'
    }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');

    const value = {
        language,
        setLanguage,
        t: (key) => translations[language][key] || key,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
