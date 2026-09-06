'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import CyberCard from '../components/CyberCard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// ==========================================
// 匿名ユーザーIDの自動生成・保持ヘルパー
// ==========================================
const getOrCreateAnonymousUserId = (): string => {
  if (typeof window === 'undefined') return 'server-side';
  const STORAGE_KEY = 'manestra_anon_user_id';
  let userId = localStorage.getItem(STORAGE_KEY);
  if (!userId) {
    userId = 'anon_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(STORAGE_KEY, userId);
  }
  return userId;
};

// ==========================================
// Supabaseへイベントデータを非同期送信する共通関数
// ==========================================
const trackEvent = async (eventName: string, eventData: Record<string, any> = {}) => {
  if (!supabase) return;
  try {
    const anonymousId = getOrCreateAnonymousUserId();
    await supabase.from('user_events').insert({
      user_id: anonymousId,
      event_name: eventName,
      payload: eventData,
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};

type Card = {
  id: string;
  ticker?: string; // 銘柄コード
  name: string;
  sector: string;
  base_attack: number;
  base_defense: number;
  cost: number;
  effectType: 'attack' | 'draw' | 'search' | 'counter';
  skillName: string;
  rarity?: string;
  dividendRate?: number;
  level: number;
  exp: number;
  imageUrl?: string;
};

type SupportCard = {
  id: string;
  name: string;
  effectType: 'cost_down' | 'heal_ap' | 'boost_attack' | 'short_squeeze';
  description: string;
};

type Stamp = {
  id: string;
  name: string;
  emoji: string;
  effect: string;
};

type MacroRegime = {
  id: 'innovation' | 'inflation' | 'recession';
  name: string;
  description: string;
  buffText: string;
};

const macroRegimes: MacroRegime[] = [
  { id: 'innovation', name: '🚀 イノベーション・ブーム', description: '技術革新が加速し、サイバー・アストラル属性の威力が1.3倍！', buffText: 'サイバー/アストラル ATK 1.3倍' },
  { id: 'inflation', name: '📈 インフレ・高騰期', description: '経済全体が活性化し、自動配当（パッシブ収入）が1.5倍にアップ！', buffText: 'パッシブ配当 1.5倍' },
  { id: 'recession', name: '🛡️ リセッション（防衛期）', description: '市場が冷え込み、すべてのカードのコストが1増加する代わりに安全性(DEF)が倍増！', buffText: 'コスト+1 / DEF 2倍' },
];

const stampList: Stamp[] = [
  { id: 'st1', name: '全米が泣いた', emoji: '🎬', effect: '感動の嵐を巻き起こした！' },
  { id: 'st2', name: '概念が覆る', emoji: '🤯', effect: 'パラダイムシフトが発生！' },
  { id: 'st3', name: '全ツッパ・S高', emoji: '📈', effect: 'ストップ高気配！買い気配が殺到中！' },
  { id: 'st4', name: '尊い...', emoji: '🥺', effect: 'チームの絆が深まった...' },
  { id: 'st5', name: 'イナゴ急増中', emoji: '🦗', effect: '市場の流動性が一気に爆発！' },
];

const supportCardsList: SupportCard[] = [
  { id: 's1', name: 'チームの連携最適化', effectType: 'cost_down', description: '仲間のひらめきで、今ターンの全プロジェクトコストを1軽減する（最低0）' },
  { id: 's2', name: '未来への情熱投資', effectType: 'heal_ap', description: '即座にユースエナジー（行動力）を2回復する' },
  { id: 's3', name: 'イノベーション・ブースト', effectType: 'boost_attack', description: 'このターン、社会変革を狙うすべての解決プロジェクトの威力が1.5倍になる' },
  { id: 's4', name: 'ショートスクイーズ（踏み上げ）', effectType: 'short_squeeze', description: '敵の空売りを逆手に取り、防御力を攻撃力に完全変換して特大ダメージ！' },
];

type Stage = {
  name: string;
  enemyName: string;
  enemySector: string;
  maxHp: number;
  reward: number;
  penalty: number;
};

const stages: Stage[] = [
  { name: '裏路地の情報隠蔽ネットワーク', enemyName: '組織の末端工作員：ファントム', enemySector: 'サイバー', maxHp: 5000, reward: 600, penalty: 200 },
  { name: '街のインフラを歪める偽装サーバー', enemyName: '組織のコード幹部：グリッチ', enemySector: 'アストラル', maxHp: 9000, reward: 1200, penalty: 400 },
  { name: '黒幕の要塞：シンジケート・タワー', enemyName: '組織の最高幹部：オーバーロード', enemySector: 'フィジカル', maxHp: 16000, reward: 2500, penalty: 800 },
];

// 初期カード群にも dividendRate を設定
const initialCards: Card[] = [
  { id: '1', ticker: '7203', name: '情熱あふれる学生プログラマー', sector: 'フィジカル', base_attack: 1200, base_defense: 800, cost: 1, effectType: 'attack', skillName: 'オープンソース展開', rarity: 'R', dividendRate: 10, level: 1, exp: 0, imageUrl: '/cards/student-programmer.jpg' },
  { id: '2', ticker: '9432', name: '街をつなぐコミュニティ配達員', sector: 'サイバー', base_attack: 400, base_defense: 300, cost: 1, effectType: 'draw', skillName: 'スマイル・ルート解析', rarity: 'R', dividendRate: 5, level: 1, exp: 0, imageUrl: '/cards/community-delivery.jpg' },
  { id: '3', ticker: '9984', name: '起業を目指す天才リサーチャー', sector: 'アストラル', base_attack: 1400, base_defense: 1400, cost: 2, effectType: 'counter', skillName: 'フューチャー・カウンター', rarity: 'SR', dividendRate: 25, level: 1, exp: 0, imageUrl: '/cards/genius-researcher.jpg' },
  { id: '4', ticker: '6758', name: '次世代スマートシティ中枢銘柄', sector: 'サイバー', base_attack: 2600, base_defense: 1200, cost: 3, effectType: 'attack', skillName: '超並列エコ・システム', rarity: 'SSR', dividendRate: 50, level: 1, exp: 0, imageUrl: '/cards/smart-city.jpg' },
  { id: '5', ticker: 'TSLA', name: 'モビリティの赤龍', sector: 'フィジカル', base_attack: 2200, base_defense: 1500, cost: 3, effectType: 'attack', skillName: '紅蓮の交通網ブースト', rarity: 'SR', dividendRate: 30, level: 1, exp: 0, imageUrl: '/cards/mobility-red-dragon.jpg' },
  { id: '6', ticker: 'NVDA', name: '半導体ファントム', sector: 'サイバー', base_attack: 2800, base_defense: 1100, cost: 4, effectType: 'search', skillName: '量子演算回路解放', rarity: 'SSR', dividendRate: 55, level: 1, exp: 0, imageUrl: '/cards/semiconductor-phantom.jpg' },
  { id: '7', ticker: '2931', name: 'グリーンエネルギー獅子', sector: 'アストラル', base_attack: 1900, base_defense: 1800, cost: 2, effectType: 'draw', skillName: 'エコ・オーラ供給', rarity: 'SR', dividendRate: 35, level: 1, exp: 0, imageUrl: '/cards/green-energy-lion.jpg' },
  { id: '8', ticker: '1211.HK', name: '次世代EVファクトリー', sector: 'フィジカル', base_attack: 3100, base_defense: 2000, cost: 5, effectType: 'attack', skillName: 'クリーンモビリティ量産', rarity: 'SSR', dividendRate: 70, level: 1, exp: 0, imageUrl: '/cards/next-gen-ev-factory.jpg' },
  { id: '9', ticker: '3993', name: 'AI特化ベンチャー', sector: 'サイバー', base_attack: 900, base_defense: 700, cost: 1, effectType: 'draw', skillName: '若き天才のひらめき', rarity: 'R', dividendRate: 15, level: 1, exp: 0, imageUrl: '/cards/ai-venture.jpg' },
  { id: '10', ticker: 'MSFT', name: '核融合エネルギー開発', sector: 'アストラル', base_attack: 4200, base_defense: 2500, cost: 6, effectType: 'attack', skillName: '究極プラズマ出力', rarity: 'SSR', dividendRate: 100, level: 1, exp: 0, imageUrl: '/cards/nuclear-fusion-dev.jpg' },
];

const getSectorMultiplier = (cardSector: string, enemySector: string): number => {
  if (
    (cardSector === 'フィジカル' && enemySector === 'サイバー') ||
    (cardSector === 'サイバー' && enemySector === 'アストラル') ||
    (cardSector === 'アストラル' && enemySector === 'フィジカル')
  ) {
    return 1.3;
  }
  return 1.0;
};

// ==========================================
// Web Speech API による音声読み上げヘルパー
// ==========================================
const speakCharacterVoice = (text: string, isVoiceEnabled: boolean) => {
  if (!isVoiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  
  window.speechSynthesis.cancel();
  const cleanText = text.replace(/【.*?】/g, '').replace(/#\w+/g, '').trim();
  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'ja-JP';
  utterance.rate = 1.1;
  utterance.pitch = 1.0;
  
  window.speechSynthesis.speak(utterance);
};

const playSound = (type: 'card_play' | 'hit' | 'gacha_open' | 'support' | 'win' | 'ssr_fanfare') => {
  if (typeof window === 'undefined') return;
  
  const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  const now = ctx.currentTime;

  if (type === 'card_play') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'hit') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'gacha_open') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.08);
    osc.frequency.setValueAtTime(783.99, now + 0.16);
    osc.frequency.setValueAtTime(1046.50, now + 0.24);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
  } else if (type === 'support') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.15);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === 'win') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(554.37, now + 0.15);
    osc.frequency.setValueAtTime(659.25, now + 0.3);
    osc.frequency.setValueAtTime(880, now + 0.45);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    osc.start(now);
    osc.stop(now + 0.8);
  } else if (type === 'ssr_fanfare') {
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, now + idx * 0.12);
      g.gain.setValueAtTime(0.2, now + idx * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
      o.start(now + idx * 0.12);
      o.stop(now + idx * 0.12 + 0.4);
    });
  }
};

const aiChatVoices = [
  "【仲間: ハルト】「新しく追加された『核融合エネルギー開発』や『モビリティの赤龍』、めちゃくちゃ強力だな！」",
  "【仲間: ミオ】「『半導体ファントム』と『AI特化ベンチャー』で演算力をブーストすれば敵なしだよ！」",
  "【仲間: ソウタ】「『グリーンエネルギー獅子』と『次世代EVファクトリー』でクリーンな都市基盤を固めようぜ！」",
  "【マーケット速報】市場全体にパッシブ配当（自動エナジー生成）がプラス供給されています！"
];

export default function Home() {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [youthEnergy, setYouthEnergy] = useState<number>(1500);
  
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);
  const [trendingSector, setTrendingSector] = useState<string>('サイバー');
  
  const [macroRegime, setMacroRegime] = useState<MacroRegime>(macroRegimes[0]);

  const [isBgmPlaying, setIsBgmPlaying] = useState<boolean>(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);

  const bgmTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [hashtagPostCount, setHashtagPostCount] = useState<number>(1420);
  const [playerRank, setPlayerRank] = useState<number>(3);
  const [playerTitle, setPlayerTitle] = useState<string>('伝説のイナゴ投資家');
  const [isInagoTime, setIsInagoTime] = useState<boolean>(false);

  const [liveTimeline, setLiveTimeline] = useState<Array<{ id: string; user: string; text: string; time: string }>>([
    { id: '1', user: '@crypto_daisuki', text: '「核融合エネルギー開発 [MSFT]」の買い板、厚すぎワロタｗｗ これマジでストップ高行くぞ！ #マネストラ', time: 'たった今' },
    { id: '2', user: '@startup_manga', text: 'おいおい、トップランカーの動向が熱すぎる。ワイもポートフォリオ組み替えるわ！ #マネストラ', time: '1分前' },
    { id: '3', user: '@inago_fund', text: 'キターーー！トレンドセクター変更で全セクターに買いが殺到中！ #マネストラ 🚀', time: '2分前' },
  ]);

  const [deck, setDeck] = useState<string[]>(['1', '5', '6', '8', '10']);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('manestra_deck');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setDeck(parsed);
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }, []);

  const [sectorFilter, setSectorFilter] = useState<string>('すべて');
  const [rarityFilter, setRarityFilter] = useState<string>('すべて');

  const [hand, setHand] = useState<Card[]>([]);
  const [currentAp, setCurrentAp] = useState<number>(3);
  const [maxAp, setMaxAp] = useState<number>(3);
  const [turnCount, setTurnCount] = useState<number>(1);

  const [selectedSupport, setSelectedSupport] = useState<SupportCard | null>(null);
  const [hasUsedSupport, setHasUsedSupport] = useState<boolean>(false);
  const [isCostDownActive, setIsCostDownActive] = useState<boolean>(false);
  const [isBoostActive, setIsBoostActive] = useState<boolean>(false);
  const [isShortSqueezeActive, setIsShortSqueezeActive] = useState<boolean>(false);
  
  const [isBattling, setIsBattling] = useState<boolean>(false);
  const [enemyHp, setEnemyHp] = useState<number>(0);
  const [enemyIntent, setEnemyIntent] = useState<string>('日常警戒中');
  const [battleLogs, setBattleLogs] = useState<string[]>([]);
  
  const [battleResult, setBattleResult] = useState<{ isWin: boolean; message: string; score: number; turns: number; rank: number; title: string } | null>(null);
  const [isHitEffect, setIsHitEffect] = useState<boolean>(false);

  const [floatingStamp, setFloatingStamp] = useState<{ emoji: string; name: string } | null>(null);
  const [currentChatIndex, setCurrentChatIndex] = useState<number>(0);

  const [showPackModal, setShowPackModal] = useState<boolean>(false);
  const [openStep, setOpenStep] = useState<'ready' | 'ripping' | 'revealed'>('ready');
  const [pulledCard, setPulledCard] = useState<Card | null>(null);
  const [isFlashActive, setIsFlashActive] = useState<boolean>(false);
  const [highScores, setHighScores] = useState<Record<number, number>>({});

  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      localStorage.setItem('manestra_deck', JSON.stringify(deck));
    }
  }, [deck, isMounted]);

  useEffect(() => {
    const socialBuzzInterval = setInterval(() => {
      const randomUsers = ['@bitcoin_inu', '@venture_girl', '@diamond_hands', '@stock_master_z', '@startup_hero'];
      const randomComments = [
        '「モビリティの赤龍 [TSLA]」強すぎないか？トレンド合致でワンパンなんだがｗ #マネストラ',
        '誰だ今の巨大トレンド仕掛けたの！一気に資産増えたんだが！ #マネストラ',
        'イナゴ急増中キターーー！今のうちに買い付けとけ！ #マネストラ 📈',
        'ファンドの売り板を完全に踏み上げてるの気持ちよすぎるｗｗ #マネストラ'
      ];

      const newPost = {
        id: Math.random().toString(),
        user: randomUsers[Math.floor(Math.random() * randomUsers.length)],
        text: randomComments[Math.floor(Math.random() * randomComments.length)],
        time: 'たった今'
      };

      setLiveTimeline(prev => [newPost, ...prev].slice(0, 5));
      setHashtagPostCount(prev => prev + Math.floor(Math.random() * 15) + 5);
    }, 12000);

    return () => clearInterval(socialBuzzInterval);
  }, []);

  useEffect(() => {
    if (!isBgmPlaying) {
      if (bgmTimerRef.current) clearInterval(bgmTimerRef.current);
      return;
    }

    const playBgmLoop = () => {
      if (typeof window === 'undefined') return;
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const chords = selectedStageIndex === 0 
        ? [261.63, 329.63, 392.00, 523.25] 
        : selectedStageIndex === 1 
        ? [220.00, 261.63, 329.63, 440.00] 
        : [196.00, 246.94, 293.66, 392.00]; 

      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = isBattling ? 'sawtooth' : 'sine';
        
        const now = ctx.currentTime + idx * 0.35;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(isBattling ? 0.04 : 0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
      });
    };

    bgmTimerRef.current = setInterval(playBgmLoop, 1600);
    return () => {
      if (bgmTimerRef.current) clearInterval(bgmTimerRef.current);
    };
  }, [isBgmPlaying, selectedStageIndex, isBattling]);

  useEffect(() => {
    const passiveIncomeInterval = setInterval(() => {
      const baseDividend = cards.reduce((acc, c) => acc + (c.dividendRate || 10) + (c.level - 1) * 5, 0);
      const multiplier = macroRegime.id === 'inflation' ? 1.5 : 1.0;
      const totalDividend = Math.floor(baseDividend * multiplier);

      setYouthEnergy((prev) => prev + totalDividend);
    }, 10000);

    const chatInterval = setInterval(() => {
      const nextIndex = (currentChatIndex + 1) % aiChatVoices.length;
      setCurrentChatIndex(nextIndex);
      speakCharacterVoice(aiChatVoices[nextIndex], isVoiceEnabled);
    }, 8000);

    const regimeInterval = setInterval(() => {
      const randomRegime = macroRegimes[Math.floor(Math.random() * macroRegimes.length)];
      setMacroRegime(randomRegime);
    }, 45000);

    return () => {
      clearInterval(passiveIncomeInterval);
      clearInterval(chatInterval);
      clearInterval(regimeInterval);
    };
  }, [cards, macroRegime, currentChatIndex, isVoiceEnabled]);

  const sendStamp = (stamp: Stamp) => {
    playSound('support');
    setFloatingStamp(stamp);
    setTimeout(() => setFloatingStamp(null), 1800);

    setHashtagPostCount((prev) => {
      const nextCount = prev + 55;
      if (nextCount > 1500 && !isInagoTime) {
        setIsInagoTime(true);
      }
      return nextCount;
    });

    const newLog = `【SNSトレンド速報】あなたが「#マネストラ ${stamp.emoji} ${stamp.name}」をポスト！ (${stamp.effect})`;
    setBattleLogs((prev) => [newLog, ...prev]);
  };

  const toggleDeckCard = (cardId: string) => {
    if (isBattling) return;
    playSound('card_play');
    if (deck.includes(cardId)) {
      if (deck.length <= 3) {
        alert('プロジェクト編成には最低3枚のカードが必要です！');
        return;
      }
      setDeck(deck.filter((id) => id !== cardId));
    } else {
      if (deck.length >= 6) {
        alert('プロジェクト編成には最大6枚までしか組み込めません！');
        return;
      }
      setDeck([...deck, cardId]);
    }
  };

  const startBattle = () => {
    if (deck.length < 3) {
      alert('最低3枚以上のプロジェクトでチームを組んでください！');
      return;
    }

    playSound('card_play');
    const currentStage = stages[selectedStageIndex];
    setIsBattling(true);
    setEnemyHp(currentStage.maxHp);
    setCurrentAp(isInagoTime ? 4 : 3);
    setMaxAp(isInagoTime ? 4 : 3);
    setTurnCount(1);
    setBattleResult(null);
    setHasUsedSupport(false);
    setIsCostDownActive(false);
    setIsBoostActive(false);
    setIsShortSqueezeActive(false);
    setEnemyIntent('組織の売り浴びせ（次ターン強力なハッキング攻撃）');

    drawHandCards(3);
    setBattleLogs([`🌟 組織の陰謀を暴くため、${currentStage.enemyName} の拠点へ突入開始！（組織の防壁耐久力: ${currentStage.maxHp}） [市場レジーム: ${macroRegime.name}]`]);
    speakCharacterVoice(`さあ、${currentStage.enemyName}との決戦だ！プロジェクトを展開するぞ！`, isVoiceEnabled);
  };

  const drawHandCards = (count: number) => {
    const pool = cards.filter((c) => deck.includes(c.id));
    const drawn: Card[] = [];
    for (let i = 0; i < count; i++) {
      if (pool.length > 0) {
        const randomCard = pool[Math.floor(Math.random() * pool.length)];
        drawn.push({ ...randomCard, id: randomCard.id + '-' + Math.random() });
      }
    }
    setHand((prev) => [...prev, ...drawn].slice(-5));
  };

  const playSupportCard = () => {
    if (!selectedSupport) {
      alert('⚠️ 発動するサポート作戦を選択してください！');
      return;
    }
    if (hasUsedSupport) {
      alert('⚠️ サポート作戦は1ターンに1回しか実行できません！');
      return;
    }

    playSound('support');
    let logs = [...battleLogs];
    setHasUsedSupport(true);

    if (selectedSupport.effectType === 'cost_down') {
      setIsCostDownActive(true);
      logs.unshift(`[ターン ${turnCount}] 💡 作戦【${selectedSupport.name}】発動！ 今ターン、全プロジェクトコストが軽減！`);
    } else if (selectedSupport.effectType === 'heal_ap') {
      setCurrentAp((prev) => Math.min(6, prev + 2));
      logs.unshift(`[ターン ${turnCount}] 💡 作戦【${selectedSupport.name}】発動！ ユースエナジーが2回復！`);
    } else if (selectedSupport.effectType === 'boost_attack') {
      setIsBoostActive(true);
      logs.unshift(`[ターン ${turnCount}] 💡 作戦【${selectedSupport.name}】発動！ 変革プロジェクトの威力が1.5倍に増幅！`);
    } else if (selectedSupport.effectType === 'short_squeeze') {
      setIsShortSqueezeActive(true);
      logs.unshift(`[ターン ${turnCount}] 💡 作戦【${selectedSupport.name}】発動！ 敵の空売りをカウンターする態勢が整った！`);
    }

    setBattleLogs(logs);
    speakCharacterVoice(`作戦、${selectedSupport.name}を発動！`, isVoiceEnabled);
  };

  const playCard = (card: Card) => {
    const baseCost = macroRegime.id === 'recession' ? card.cost + 1 : card.cost;
    const actualCost = isCostDownActive ? Math.max(0, baseCost - 1) : baseCost;

    if (actualCost > currentAp) {
      alert('⚡ ユースエナジー（行動力）が足りません！');
      return;
    }

    playSound('card_play');
    const currentStage = stages[selectedStageIndex];
    setCurrentAp(currentAp - actualCost);
    setHand(hand.filter((h) => h.id !== card.id));

    let logs = [...battleLogs];

    speakCharacterVoice(`${card.name}、${card.skillName}！`, isVoiceEnabled);

    if (card.effectType === 'draw') {
      drawHandCards(1);
      logs.unshift(`[ターン ${turnCount}] ${card.name} のスキル発動！ 新たなアイデアを1枚ドロー！`);
    } else if (card.effectType === 'search') {
      const pool = cards.filter((c) => deck.includes(c.id));
      const targetCard = pool.find((c) => c.sector === card.sector) || pool[0];
      if (targetCard) {
        setHand((prev) => [...prev, { ...targetCard, id: targetCard.id + '-search-' + Math.random() }].slice(-5));
        logs.unshift(`[ターン ${turnCount}] ${card.name} のスキル発動！ 【${targetCard.name}】の協力を取り付けました！`);
      }
    } else {
      const baseId = card.id.includes('-') ? card.id.split('-')[0] : card.id;
      const originalCard = cards.find(c => c.id === baseId) || card;

      const isTrending = originalCard.sector === trendingSector;
      let sectorMulti = getSectorMultiplier(originalCard.sector, currentStage.enemySector);
      
      if (macroRegime.id === 'innovation' && (originalCard.sector === 'サイバー' || originalCard.sector === 'アストラル')) {
        sectorMulti *= 1.3;
      }

      const boostMulti = isBoostActive ? 1.5 : 1.0;
      const inagoMulti = isInagoTime ? 1.2 : 1.0;
      
      const levelBonus = 1 + (originalCard.level - 1) * 0.2;
      const defMultiplier = macroRegime.id === 'recession' ? 2.0 : 1.0;
      const squeezeBonus = isShortSqueezeActive ? (originalCard.base_defense * defMultiplier) * 1.5 : (originalCard.base_defense * defMultiplier) * 0.4;
      
      const attackPower = Math.floor((originalCard.base_attack * levelBonus) * (isTrending ? 1.6 : 1.0) * sectorMulti * boostMulti * inagoMulti + squeezeBonus);

      const nextEnemyHp = Math.max(0, enemyHp - attackPower);
      setEnemyHp(nextEnemyHp);

      playSound('hit');
      setIsHitEffect(true);
      setTimeout(() => setIsHitEffect(false), 400);

      let logText = `[ターン ${turnCount}] ${originalCard.name} (Lv.${originalCard.level}) 展開！ ${attackPower} の社会変革インパクト！`;
      if (isTrending) logText += ' ⭐【市場トレンド合致】';
      if (sectorMulti > 1.3) logText += ' 🎯【マクロ/弱点看破】';
      if (isShortSqueezeActive) logText += ' 🚀【踏み上げスクイーズ発動！】';
      if (isInagoTime) logText += ' 🔥【イナゴ倍率適用】';
      logText += `（残り組織防壁: ${nextEnemyHp}）`;
      logs.unshift(logText);

      if (nextEnemyHp <= 0) {
        setBattleLogs(logs);
        endBattle(true, logs);
        return;
      }
    }

    setBattleLogs(logs);
  };

  const handleEndTurn = () => {
    playSound('card_play');
    let logs = [...battleLogs];
    logs.unshift(`--- ターン ${turnCount} 終了 ---`);

    const nextTurn = turnCount + 1;
    if (nextTurn > 6) {
      endBattle(false, logs);
      return;
    }

    setTurnCount(nextTurn);
    setCurrentAp(isInagoTime ? 4 : 3);
    setHasUsedSupport(false);
    setIsCostDownActive(false);
    setIsBoostActive(false);
    setIsShortSqueezeActive(false);
    setEnemyIntent(nextTurn % 2 === 0 ? '組織の買い板崩し・売り煽り工作' : '裏工作パケットのばら撒き');
    drawHandCards(2);
    setBattleLogs(logs);
  };

  const endBattle = async (isWin: boolean, logs: string[]) => {
    if (isWin) {
      playSound('win');
      speakCharacterVoice('やったぞ！市場の勝利だ！', isVoiceEnabled);
    } else {
      playSound('hit');
      speakCharacterVoice('くっ、押し返されてしまった...', isVoiceEnabled);
    }

    const currentStage = stages[selectedStageIndex];
    const delta = isWin ? currentStage.reward : -currentStage.penalty;
    const newEnergy = Math.max(0, youthEnergy + delta);
    setYouthEnergy(newEnergy);

    if (isWin) {
      setCards((prevCards) =>
        prevCards.map((c) => {
          if (deck.includes(c.id)) {
            const newExp = c.exp + 50;
            const nextExpNeeded = c.level * 100;
            if (newExp >= nextExpNeeded) {
              return { ...c, level: c.level + 1, exp: newExp - nextExpNeeded, dividendRate: (c.dividendRate || 10) + 5 };
            }
            return { ...c, exp: newExp };
          }
          return c;
        })
      );
    }

    const calculatedScore = isWin ? Math.max(200, (7 - turnCount) * 1000 + currentStage.reward) : 0;
    const currentBest = highScores[selectedStageIndex] || 0;
    if (calculatedScore > currentBest) {
      setHighScores((prev) => ({ ...prev, [selectedStageIndex]: calculatedScore }));
    }

    let assignedRank = 3;
    let assignedTitle = '鋭い目の個人投資家';
    if (calculatedScore > 6000) {
      assignedRank = 1;
      assignedTitle = '伝説のイナゴ投資家';
    } else if (calculatedScore > 4000) {
      assignedRank = 2;
      assignedTitle = 'ストップ高の覇者';
    }
    setPlayerRank(assignedRank);
    setPlayerTitle(assignedTitle);

    if (isWin) {
      logs.unshift(`🎉 組織の陰謀を阻止し、社会システムを正常化しました！ (+${currentStage.reward} エナジー / デッキカードがEXPを獲得！)`);
    } else {
      logs.unshift(`💥 組織の妨害により作戦が中断されました…。 (-${currentStage.penalty} エナジー)`);
    }
    setBattleLogs(logs);

    setBattleResult({
      isWin,
      turns: turnCount,
      score: calculatedScore,
      rank: assignedRank,
      title: assignedTitle,
      message: isWin
        ? `🎉 上場益大成功！ ターン数: ${turnCount} / スコア: ${calculatedScore}pts (称号: 【${assignedTitle}】)`
        : `💥 ロスカット… 組織の妨害により ${currentStage.penalty} エナジーが失われました。`,
    });
    setIsBattling(false);

    trackEvent('battle_end', {
      stage_index: selectedStageIndex,
      stage_name: currentStage.name,
      is_win: isWin,
      turns: turnCount,
      score: calculatedScore,
      title: assignedTitle,
    });
  };

  const openPack = async () => {
    const cost = 400;
    if (youthEnergy < cost) {
      alert('⚠️ ユースエナジーが不足しています（必要: 400 エナジー）');
      return;
    }

    playSound('gacha_open');
    setYouthEnergy((prev) => prev - cost);
    setOpenStep('ripping');
    setPulledCard(null);
    setIsFlashActive(false);

    speakCharacterVoice('IPOパックの買い付けを実行中...', isVoiceEnabled);

    await new Promise((resolve) => setTimeout(resolve, 1400));

    const newCardsPool: Card[] = [
      { id: Math.random().toString(), ticker: 'TSLA', name: 'モビリティの赤龍', sector: 'フィジカル', base_attack: 2200, base_defense: 1500, cost: 3, effectType: 'attack', skillName: '紅蓮の交通網ブースト', rarity: 'SR', dividendRate: 30, level: 1, exp: 0, imageUrl: '/cards/mobility-red-dragon.jpg' },
      { id: Math.random().toString(), ticker: 'NVDA', name: '半導体ファントム', sector: 'サイバー', base_attack: 2800, base_defense: 1100, cost: 4, effectType: 'search', skillName: '量子演算回路解放', rarity: 'SSR', dividendRate: 55, level: 1, exp: 0, imageUrl: '/cards/semiconductor-phantom.jpg' },
      { id: Math.random().toString(), ticker: '2931', name: 'グリーンエネルギー獅子', sector: 'アストラル', base_attack: 1900, base_defense: 1800, cost: 2, effectType: 'draw', skillName: 'エコ・オーラ供給', rarity: 'SR', dividendRate: 35, level: 1, exp: 0, imageUrl: '/cards/green-energy-lion.jpg' },
      { id: Math.random().toString(), ticker: '1211.HK', name: '次世代EVファクトリー', sector: 'フィジカル', base_attack: 3100, base_defense: 2000, cost: 5, effectType: 'attack', skillName: 'クリーンモビリティ量産', rarity: 'SSR', dividendRate: 70, level: 1, exp: 0, imageUrl: '/cards/next-gen-ev-factory.jpg' },
      { id: Math.random().toString(), ticker: '3993', name: 'AI特化ベンチャー', sector: 'サイバー', base_attack: 900, base_defense: 700, cost: 1, effectType: 'draw', skillName: '若き天才のひらめき', rarity: 'R', dividendRate: 15, level: 1, exp: 0, imageUrl: '/cards/ai-venture.jpg' },
      { id: Math.random().toString(), ticker: 'MSFT', name: '核融合エネルギー開発', sector: 'アストラル', base_attack: 4200, base_defense: 2500, cost: 6, effectType: 'attack', skillName: '究極プラズマ出力', rarity: 'SSR', dividendRate: 100, level: 1, exp: 0, imageUrl: '/cards/nuclear-fusion-dev.jpg' },
    ];

    const picked = newCardsPool[Math.floor(Math.random() * newCardsPool.length)];

    setCards((prev) => [...prev, picked]);
    setPulledCard(picked);

    if (picked.rarity === 'SSR' || picked.rarity === 'SR') {
      setIsFlashActive(true);
      if (picked.rarity === 'SSR') {
        playSound('ssr_fanfare');
        speakCharacterVoice(`やった！激レア、${picked.name}をゲットだ！`, isVoiceEnabled);
      } else {
        playSound('win');
        speakCharacterVoice(`おっ、${picked.name}を調達したぞ！`, isVoiceEnabled);
      }
    } else {
      speakCharacterVoice(`${picked.name}が加わったぞ。`, isVoiceEnabled);
    }

    setOpenStep('revealed');

    trackEvent('gacha_open', {
      card_name: picked.name,
      rarity: picked.rarity,
      sector: picked.sector,
    });
  };

  const shareToTwitter = () => {
    if (!battleResult) return;
    const text = encodeURIComponent(
      `【マネストラ - 若者たちの社会改革プロジェクト】\nSTAGE ${selectedStageIndex + 1} (${stages[selectedStageIndex].name}) の陰謀を ${battleResult.turns}ターン で撃破！\n🏆 称号：【${battleResult.title}】\n📈 トレンドランキング順位：第 ${battleResult.rank} 位\n資産評価スコア：${battleResult.score} pts\n\n#マネストラ #株トレンド #ストップ高 #若者革命`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');

    trackEvent('share_to_twitter', {
      stage_index: selectedStageIndex,
      score: battleResult.score,
      turns: battleResult.turns,
      title: battleResult.title,
    });
  };

  const filteredCards = cards.filter(card => {
    const matchSector = sectorFilter === 'すべて' || card.sector === sectorFilter;
    const matchRarity = rarityFilter === 'すべて' || (card.rarity || 'R') === rarityFilter;
    return matchSector && matchRarity;
  });

  const currentStage = stages[selectedStageIndex];

  return (
    <main className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto bg-slate-900 min-h-screen text-slate-100 selection:bg-cyan-400 selection:text-slate-950 font-sans overflow-x-hidden">
      
      {/* ライブフィード ＆ 音声コントロールバー */}
      <div className="bg-cyan-950/60 border border-cyan-400/30 rounded-2xl px-4 py-2.5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-cyan-200 shadow-md">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="font-bold text-cyan-300 whitespace-nowrap">市場ライブフィード:</span>
          <span className="break-words leading-relaxed">{aiChatVoices[currentChatIndex]}</span>
        </div>
        
        <div className="flex items-center gap-2 shrink-0 flex-wrap w-full sm:w-auto justify-end">
          <button
            onClick={() => {
              const nextState = !isVoiceEnabled;
              setIsVoiceEnabled(nextState);
              if (nextState) speakCharacterVoice('キャラクター音声ガイドを有効にしました', true);
            }}
            className={`px-3 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer border ${
              isVoiceEnabled 
                ? 'bg-sky-500/20 text-sky-300 border-sky-400/50 shadow' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            🗣️ キャラ音声: {isVoiceEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => {
              if (!isBgmPlaying) playSound('card_play');
              setIsBgmPlaying(!isBgmPlaying);
            }}
            className={`px-3 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer border ${
              isBgmPlaying 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow animate-pulse' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            🎵 BGM: {isBgmPlaying ? 'ON' : 'OFF'}
          </button>
          
          <div className="bg-slate-900/80 px-3 py-1 rounded-xl border border-cyan-500/30 font-mono text-[11px]">
            <span className="text-amber-300">🌍 <strong>{macroRegime.name}</strong></span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-cyan-500/30 pb-5 gap-4">
        <div>
          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-3 py-1 rounded-full font-black tracking-widest uppercase">
            MANESTRA // ULTIMATE STO & TCG EVOLUTION
          </span>
          <h1 className="text-2xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-400 to-emerald-400 mt-2 tracking-tight">
            マネストラ：未来をつくる社会
          </h1>
        </div>
        <div className="bg-slate-800/90 border border-cyan-400/40 px-5 py-2.5 rounded-2xl shadow-xl text-left sm:text-right backdrop-blur w-full sm:w-auto">
          <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">Youth Energy (資産)</p>
          <p className="text-2xl font-black text-cyan-300 font-mono">{youthEnergy} <span className="text-xs font-normal">pts</span></p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-cyan-950/80 border border-purple-500/30 rounded-3xl p-5 mb-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
          <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-400/30 px-3 py-1 rounded-full font-black tracking-widest uppercase">
            🚀 爆益・Xトレンド連動スタジオ (#マネストラ)
          </span>
          <div className="text-xs font-mono text-cyan-300 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
            👑 現在のトレンド順位: <strong className="text-amber-300">第 {playerRank} 位</strong> ({playerTitle})
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {stampList.map((stamp) => (
            <button
              key={stamp.id}
              onClick={() => {
                sendStamp(stamp);
                speakCharacterVoice(`${stamp.name}！市場が大きくざわついています！`, isVoiceEnabled);
              }}
              className="bg-slate-800/90 hover:bg-purple-600/20 hover:border-purple-400 border border-slate-700 px-4 py-3 rounded-2xl transition-all cursor-pointer flex flex-col items-center shrink-0 group shadow-lg hover:scale-105"
            >
              <span className="text-2xl group-hover:scale-125 transition-transform">{stamp.emoji}</span>
              <span className="text-[10px] font-bold text-slate-200 mt-1 whitespace-nowrap">{stamp.name}</span>
            </button>
          ))}
        </div>

        {floatingStamp && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fade-in pointer-events-none p-4 text-center">
            <span className="text-6xl animate-bounce mb-2">{floatingStamp.emoji}</span>
            <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-cyan-300">
              「{floatingStamp.name}」#マネストラでポスト完了！
            </p>
            <p className="text-xs text-slate-300 mt-1">{floatingStamp.effect}</p>
          </div>
        )}
      </div>

      <div className="bg-slate-900/90 border-2 border-purple-500/40 rounded-3xl p-5 mb-8 shadow-2xl relative overflow-hidden backdrop-blur">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
            <h3 className="text-xs font-black text-purple-300 uppercase tracking-widest">
              X (Twitter) リアルタイム・トレンドフィード (#マネストラ)
            </h3>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono bg-purple-500/20 text-purple-200 border border-purple-400/30 px-3 py-1 rounded-full">
              🔥 ポスト数: <strong className="text-amber-300">{hashtagPostCount}</strong> 件
            </span>
            {isInagoTime && (
              <span className="text-[10px] font-black bg-rose-500 text-white px-3 py-1 rounded-full animate-bounce shadow-lg">
                🚨 イナゴタイム発動中 (報酬・威力 1.2倍！)
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
          {liveTimeline.map((item) => (
            <div key={item.id} className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl flex items-start justify-between gap-3 text-xs animate-fade-in">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-cyan-400">{item.user}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                </div>
                <p className="text-slate-200 break-words">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-cyan-950 via-slate-800 to-sky-950 border-2 border-cyan-400/40 rounded-3xl p-6 md:p-8 mb-8 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center relative overflow-hidden group gap-6">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider shadow">
            ✨ IPOパック買い付け
          </span>
          <h2 className="text-2xl md:text-3xl font-black mt-2 tracking-tight text-white">
            次世代アイデア・IPOパック
          </h2>
          <p className="text-xs text-cyan-100 mt-1 max-w-md">
            400エナジーを投資して新規上場銘柄を買い付け！「モビリティの赤龍 [TSLA]」や「核融合エネルギー開発 [MSFT]」などの強力なSSRカードを狙おう。
          </p>
        </div>
        <button
          onClick={() => { playSound('card_play'); setOpenStep('ready'); setPulledCard(null); setIsFlashActive(false); setShowPackModal(true); }}
          className="relative z-10 bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black px-8 py-4 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap animate-bounce border-2 border-cyan-200 w-full md:w-auto text-center"
        >
          📈 銘柄を買い付ける (400 pts)
        </button>
      </div>

      {!isBattling && (
        <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-3xl p-6 mb-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">🗺️ ターゲットセクター選択 (ポートフォリオ編成: {deck.length}/6)</h2>
            <span className="text-xs font-mono text-cyan-300 font-bold bg-cyan-500/10 border border-cyan-400/30 px-3 py-1 rounded-full">
              🏆 最高評価スコア: {highScores[selectedStageIndex] || 0} pts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {stages.map((stg, idx) => (
              <button
                key={idx}
                onClick={() => { playSound('card_play'); setSelectedStageIndex(idx); }}
                className={`p-4 rounded-2xl text-xs font-black transition-all cursor-pointer text-left border ${
                  selectedStageIndex === idx 
                    ? 'bg-cyan-500/20 text-white shadow-lg border-cyan-400 ring-2 ring-cyan-400/30' 
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 border-slate-600/50'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-cyan-300 uppercase tracking-wider">MARKET {idx + 1}</span>
                  <span className="text-[10px] text-emerald-300 font-mono">Best: {highScores[idx] || 0}</span>
                </div>
                <div className="text-sm font-black text-white break-words">{stg.name}</div>
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/80 border border-cyan-500/30 p-6 rounded-2xl gap-6 shadow-inner">
            <div className="w-full">
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
                SHADOW SYNDICATE // 売り手ファンドの陰謀
              </span>
              <p className="text-2xl font-black text-white mt-2 break-words">{currentStage.enemyName}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-full font-bold">セクター属性: {currentStage.enemySector}</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-3 py-1 rounded-full font-bold">⭐ 注目トレンド: {trendingSector}</span>
              </div>
              <p className="text-xs text-slate-400 mt-3">組織の売り板防壁: <strong className="text-rose-400 font-mono text-sm">{currentStage.maxHp}</strong></p>
            </div>
            
            <div className="w-full md:w-auto text-center shrink-0">
              <button
                onClick={startBattle}
                disabled={deck.length < 3}
                className={`w-full md:w-auto px-10 py-5 rounded-2xl font-black text-sm shadow-2xl transition-all ${
                  deck.length >= 3
                    ? 'bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 cursor-pointer shadow-cyan-500/30 animate-pulse border-2 border-cyan-200'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600'
                }`}
              >
                {deck.length >= 3 ? '📈 マーケット介入（買い気配）開始！' : '3枚以上選択してください'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isBattling && (
        <div className={`bg-slate-900 border-2 border-cyan-400/60 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl space-y-6 relative overflow-visible transition-transform duration-100 ${isHitEffect ? 'scale-[1.01] bg-cyan-950/20' : ''}`}>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800/90 border border-slate-700 p-5 rounded-2xl gap-4 shadow-lg backdrop-blur">
            <div className="w-full">
              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-full font-black">
                MARKET CONFRONTATION // 敵対ファンド攻防戦
              </span>
              <h2 className="text-2xl font-black text-white mt-1.5 tracking-tight break-words">{currentStage.enemyName}</h2>
              <div className="mt-2 font-mono text-xs text-rose-300 bg-rose-950/40 border border-rose-500/30 px-3 py-1 rounded-lg inline-block">
                組織の売り板防壁(HP): <strong>{enemyHp}</strong> / {currentStage.maxHp}
              </div>
            </div>
            
            <div className="bg-slate-950/60 border border-slate-700 p-4 rounded-2xl text-left md:text-right w-full md:w-auto font-mono shrink-0">
              <p className="text-xs text-cyan-300 font-bold tracking-wider">
                ⚡ ユースエナジー: <span className="text-lg font-black text-cyan-200">{currentAp} / {maxAp}</span>
              </p>
              <p className="text-[11px] text-sky-300 mt-1">経過ターン: <strong>{turnCount}</strong> / 6</p>
              <p className="text-[10px] text-rose-300 mt-1 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded break-words">
                💡 敵の動向: {enemyIntent}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-950/80 via-slate-800 to-sky-950/80 border border-cyan-400/40 rounded-3xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-2 flex-wrap">
                <span>💡</span> サポート作戦枠 <span className="text-[10px] text-slate-400">(1ターンに1回実行可能)</span>
              </h3>
              {hasUsedSupport && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-0.5 rounded-full font-bold">
                  本ターン作戦実行済み ✓
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              {supportCardsList.map((sup) => {
                const isSelected = selectedSupport?.id === sup.id;
                return (
                  <div
                    key={sup.id}
                    onClick={() => { if (!hasUsedSupport) { playSound('card_play'); setSelectedSupport(sup); } }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/25 border-cyan-400 ring-2 ring-cyan-400/30 text-white'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    } ${hasUsedSupport ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <p className="text-xs font-black text-cyan-200 break-words">{sup.name}</p>
                    <p className="text-[10px] text-slate-300 mt-1 break-words">{sup.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="text-right">
              <button
                onClick={playSupportCard}
                disabled={hasUsedSupport || !selectedSupport}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs shadow-lg transition-all ${
                  !hasUsedSupport && selectedSupport
                    ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 cursor-pointer shadow-cyan-400/30'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                💡 サポート作戦を発動
              </button>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-6 overflow-visible">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2 flex-wrap">
                <span>🎴</span> 手札ポートフォリオ {isCostDownActive && <span className="text-cyan-300 font-mono text-[11px]">✨【チーム連携でコスト軽減中】</span>}
              </h3>
              <button
                onClick={handleEndTurn}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl shadow-lg cursor-pointer transition-all border border-cyan-200"
              >
                ターン終了 ➡
              </button>
            </div>

            {hand.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 font-mono">
                手札のプロジェクトがありません。「ターン終了」を押して新しい銘柄を補充してください。
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {hand.map((card) => {
                  const baseCost = macroRegime.id === 'recession' ? card.cost + 1 : card.cost;
                  const actualCost = isCostDownActive ? Math.max(0, baseCost - 1) : baseCost;
                  const isAffordable = actualCost <= currentAp;
                  const isTrending = card.sector === trendingSector;

                  return (
                    <div
                      key={card.id}
                      onClick={() => playCard(card)}
                      className={`group relative bg-gradient-to-b from-slate-800 to-slate-900 border-2 rounded-3xl p-5 shadow-2xl transition-all duration-300 select-none min-w-0 ${
                        isAffordable 
                          ? 'border-cyan-400/80 hover:-translate-y-2 hover:shadow-cyan-400/30 cursor-pointer ring-1 ring-cyan-400/20' 
                          : 'border-slate-700 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 min-w-0">
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-3 py-0.5 rounded-full font-bold truncate">
                          {card.sector} (Lv.{card.level})
                        </span>
                        <span className="text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-400/40 px-3 py-0.5 rounded-full font-mono shadow shrink-0">
                          COST {actualCost}
                        </span>
                      </div>

                      <div className="relative group/name">
                        <h4 className="text-base font-black text-white tracking-tight group-hover:text-cyan-300 transition-colors truncate">
                          {card.ticker ? `[${card.ticker}] ` : ''}{card.name}
                        </h4>
                        <div className="absolute left-0 bottom-full mb-1 hidden group-hover/name:block z-50 bg-slate-950 text-cyan-300 text-xs font-black px-3 py-1.5 rounded-xl border border-cyan-400 shadow-2xl whitespace-nowrap pointer-events-none">
                          ✨ {card.ticker ? `[${card.ticker}] ` : ''}{card.name}
                        </div>
                      </div>

                      <p className="text-[11px] text-sky-300 font-bold mt-1 break-words">
                        {card.effectType === 'draw' ? '🎁 ドロー' : card.effectType === 'search' ? '🔍 サーチ' : card.effectType === 'counter' ? '⚡ カウンター' : '🌟 アクション'} : {card.skillName}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-700 text-xs font-mono text-slate-300 space-y-1">
                        <div className="flex justify-between gap-2 flex-wrap">
                          <span className="text-cyan-300 font-bold">影響力 (ATK): {Math.floor(card.base_attack * (1 + (card.level - 1) * 0.2))}</span>
                          <span className="text-sky-300 font-bold">安全性 (DEF): {card.base_defense}</span>
                        </div>
                        {/* 手札にも自動配当を表示 */}
                        <div className="text-emerald-400 font-bold text-[11px]">
                          💰 自動配当: +{(card.dividendRate || 10) + (card.level - 1) * 5} pts / 10秒
                        </div>
                      </div>

                      {isTrending && (
                        <div className="mt-3 text-[10px] bg-cyan-500/20 text-cyan-300 text-center rounded-xl py-1 font-black border border-cyan-400/30">
                          ⭐ トレンド一致・ストップ高気配
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {battleLogs.length > 0 && (
            <div className="bg-slate-950 text-cyan-200 border border-slate-700 rounded-2xl p-4 font-mono text-xs space-y-1.5 max-h-44 overflow-y-auto shadow-inner">
              <p className="text-cyan-300 font-bold pb-2 border-b border-slate-800 flex items-center gap-2">
                <span>📜</span> マーケット取引・変動ログ
              </p>
              {battleLogs.map((log, index) => (
                <p key={index} className="leading-relaxed break-words">{log}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {battleResult && !isBattling && (
        <div className={`p-6 mb-8 rounded-3xl text-center shadow-2xl transition-all border ${
          battleResult.isWin ? 'bg-cyan-950/90 border-cyan-400/60 text-cyan-200' : 'bg-rose-950/90 border-rose-500/60 text-rose-200'
        }`}>
          <p className="font-bold text-base mb-2 break-words">{battleResult.message}</p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-4">
            {battleResult.isWin && (
              <button
                onClick={shareToTwitter}
                className="w-full sm:w-auto bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-6 py-2.5 rounded-xl text-xs font-black cursor-pointer shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>🕞</span> X (Twitter) でランキング結果をシェア
              </button>
            )}
            <button
              onClick={() => { playSound('card_play'); setBattleResult(null); }}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer border border-slate-600 shadow"
            >
              リザルトを閉じる
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 mt-12 gap-4">
        <h2 className="text-lg font-black flex items-center gap-2 text-slate-200 flex-wrap">
          <span>🎴</span> 保有プロジェクト・育成一覧 <span className="text-xs font-normal text-slate-400">（クリックしてデッキ編成）</span>
        </h2>
        
        <div className="flex flex-wrap items-center gap-2 text-xs w-full md:w-auto">
          <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 flex-wrap">
            <span className="text-slate-400">属性:</span>
            {['すべて', 'フィジカル', 'サイバー', 'アストラル'].map(sec => (
              <button
                key={sec}
                onClick={() => setSectorFilter(sec)}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${sectorFilter === sec ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
              >
                {sec}
              </button>
            ))}
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 flex-wrap">
            <span className="text-slate-400">レア:</span>
            {['すべて', 'R', 'SR', 'SSR'].map(rar => (
              <button
                key={rar}
                onClick={() => setRarityFilter(rar)}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${rarityFilter === rar ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
              >
                {rar}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.map((card) => {
          const isSelected = deck.includes(card.id);

          if (card.imageUrl) {
            return (
              <div 
                key={card.id} 
                onClick={() => toggleDeckCard(card.id)}
                className={`group/name relative cursor-pointer transition-transform hover:scale-105 ${isSelected ? 'ring-4 ring-cyan-400 rounded-3xl' : ''}`}
              >
                {isSelected && (
                  <div className="absolute -top-2.5 -left-2.5 z-25 overflow-hidden rounded-md bg-cyan-500 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-slate-950 shadow-md">
                    PORTFOLIO IN ✓
                  </div>
                )}
                
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover/name:block z-50 bg-slate-950 text-cyan-300 text-xs font-black px-3 py-1.5 rounded-xl border border-cyan-400 shadow-2xl whitespace-nowrap pointer-events-none">
                  ✨ {card.ticker ? `[${card.ticker}] ` : ''}{card.name}
                </div>

                <CyberCard
                  name={card.ticker ? `[${card.ticker}] ${card.name}` : card.name}
                  sector={card.sector}
                  rarity={card.rarity || 'SSR'}
                  attack={Math.floor(card.base_attack * (1 + (card.level - 1) * 0.2))}
                  defense={card.base_defense}
                  cost={card.cost}
                  skillName={card.skillName}
                  imageUrl={card.imageUrl}
                />

                {/* 自動配当・EXPゲージオーバーレイを追加 */}
                <div className="mt-2 p-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl backdrop-blur font-mono text-xs">
                  <div className="flex justify-between items-center text-emerald-400 font-bold">
                    <span>💰 自動配当:</span>
                    <span>+{(card.dividendRate || 10) + (card.level - 1) * 5} pts / 10秒</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-800">
                    <div 
                      className="bg-cyan-400 h-full transition-all duration-300" 
                      style={{ width: `${Math.min(100, (card.exp / (card.level * 100)) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-right text-slate-400 mt-0.5">
                    Lv.{card.level} (EXP: {card.exp} / {card.level * 100})
                  </div>
                </div>
              </div>
            );
          }

          const isSR = card.rarity === 'SR';

          return (
            <div
              key={card.id}
              onClick={() => toggleDeckCard(card.id)}
              className={`group relative border-2 rounded-3xl p-6 shadow-2xl cursor-pointer transition-all duration-300 hover:-translate-y-2 select-none overflow-visible min-w-0 ${
                isSelected 
                  ? 'border-cyan-400 ring-4 ring-cyan-400/20 bg-cyan-950/30' 
                  : 'border-slate-700 bg-slate-800/90 hover:border-slate-600'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 bg-cyan-400 text-slate-950 text-[10px] px-4 py-1 rounded-br-2xl font-black z-10 shadow-lg">
                  PORTFOLIO IN ✓
                </div>
              )}
              
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 min-w-0">
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-3 py-1 rounded-full font-bold truncate">
                  {card.sector} // Lv.{card.level}
                </span>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-md shrink-0 ${
                  isSR ? 'bg-sky-500/20 text-sky-300 border-sky-400/40' : 'bg-slate-700 text-slate-300 border-slate-600'
                }`}>
                  {card.rarity || 'R'}
                </span>
              </div>

              <div className="relative group/name">
                <h3 className="text-xl font-black text-white tracking-tight group-hover:text-cyan-200 transition-colors truncate">
                  {card.ticker ? `[${card.ticker}] ` : ''}{card.name}
                </h3>
                <div className="absolute left-0 bottom-full mb-1 hidden group-hover/name:block z-50 bg-slate-950 text-cyan-300 text-xs font-black px-3 py-1.5 rounded-xl border border-cyan-400 shadow-2xl whitespace-nowrap pointer-events-none">
                  ✨ {card.ticker ? `[${card.ticker}] ` : ''}{card.name}
                </div>
              </div>

              <p className="text-xs text-sky-300 font-bold mt-1 break-words">
                {card.effectType === 'draw' ? '🎁 ドロー' : card.effectType === 'search' ? '🔍 サーチ' : card.effectType === 'counter' ? '⚡ カウンター' : '🌟 アクション'} : {card.skillName} (コスト: {card.cost})
              </p>
              
              <div className="mt-5 space-y-2 text-xs text-slate-300 border-t border-slate-700 pt-4 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">影響力 (ATK):</span>
                  <span className="font-bold text-cyan-300">{Math.floor(card.base_attack * (1 + (card.level - 1) * 0.2))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">安全性 (DEF):</span>
                  <span className="font-bold text-sky-300">{card.base_defense}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800">
                  <span>💰 自動配当:</span>
                  <span>+{(card.dividendRate || 10) + (card.level - 1) * 5} pts / 10秒</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 mt-2 overflow-hidden border border-slate-700">
                  <div className="bg-cyan-400 h-full transition-all" style={{ width: `${Math.min(100, (card.exp / (card.level * 100)) * 100)}%` }}></div>
                </div>
                <div className="text-[10px] text-right text-slate-400">EXP: {card.exp} / {card.level * 100}</div>
              </div>

              <div className="mt-5 text-center text-[10px] font-bold text-slate-400 pt-3 border-t border-slate-700/50 group-hover:text-slate-200 transition-colors">
                {isSelected ? 'クリックしてポートフォリオから外す' : 'クリックしてポートフォリオに組み込む'}
              </div>
            </div>
          );
        })}
      </div>

      {showPackModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          {isFlashActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-sky-400/20 to-emerald-400/20 animate-ping pointer-events-none z-0"></div>
          )}

          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative text-white flex flex-col items-center z-10">
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-sky-400 mb-1">
              📈 新規IPO銘柄・買い付け
            </h2>
            <p className="text-xs text-slate-300 mb-6">パッケージをタップして買い注文を執行せよ！</p>

            {openStep === 'ready' && (
              <div 
                onClick={openPack}
                className="w-56 h-80 bg-gradient-to-tr from-cyan-950 via-slate-800 to-sky-950 rounded-3xl shadow-2xl border-2 border-cyan-400/80 flex flex-col items-center justify-between p-6 cursor-pointer transform transition-transform hover:scale-105 active:scale-95 my-2 select-none relative overflow-hidden group"
              >
                <div>
                  <span className="text-[10px] bg-cyan-400 text-slate-950 px-3 py-1 rounded-full font-black shadow">IPO パッケージ</span>
                  <p className="text-lg font-black mt-4 tracking-wider text-cyan-200">次世代イノベーション株</p>
                </div>
                <div className="bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-black px-5 py-3 rounded-2xl shadow-xl animate-bounce text-xs border border-cyan-200">
                  📈 タップして買い付け！ (400 pts)
                </div>
              </div>
            )}

            {openStep === 'ripping' && (
              <div className="py-28 flex flex-col items-center justify-center">
                <div className="text-6xl animate-bounce mb-4">📈</div>
                <p className="font-black text-cyan-300 text-2xl tracking-widest animate-pulse">
                  IPO EXECUTING...
                </p>
                <p className="text-xs text-sky-300 mt-2">注文板をマッチング中...</p>
              </div>
            )}

            {openStep === 'revealed' && pulledCard && (
              <div className="py-2 w-full animate-fade-in flex flex-col items-center">
                {pulledCard.rarity === 'SSR' && (
                  <div className="mb-2 text-xs font-black text-amber-300 bg-amber-500/20 border border-amber-400 px-4 py-1 rounded-full animate-pulse shadow-lg text-center">
                    ✨🌟 SSR 激レア・トップ銘柄獲得！ 🌟✨
                  </div>
                )}

                <div className="mb-4 relative group/name">
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover/name:block z-50 bg-slate-950 text-cyan-300 text-xs font-black px-3 py-1.5 rounded-xl border border-cyan-400 shadow-2xl whitespace-nowrap pointer-events-none">
                    ✨ {pulledCard.ticker ? `[${pulledCard.ticker}] ` : ''}{pulledCard.name}
                  </div>
                  <CyberCard
                    name={pulledCard.ticker ? `[${pulledCard.ticker}] ${pulledCard.name}` : pulledCard.name}
                    sector={pulledCard.sector}
                    rarity={pulledCard.rarity || 'SSR'}
                    attack={pulledCard.base_attack}
                    defense={pulledCard.base_defense}
                    cost={pulledCard.cost}
                    skillName={pulledCard.skillName}
                    imageUrl={pulledCard.imageUrl || '/cards/smart-city.jpg'}
                  />
                </div>

                <button
                  onClick={() => { playSound('card_play'); setShowPackModal(false); }}
                  className="w-full bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black py-4 rounded-2xl shadow-xl cursor-pointer transition-transform hover:scale-105 active:scale-95 border border-cyan-200"
                >
                  ポートフォリオに組み込む 🎉
                </button>
              </div>
            )}

            {openStep !== 'ripping' && (
              <button
                onClick={() => { playSound('card_play'); setShowPackModal(false); }}
                className="mt-4 text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                閉じる
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}