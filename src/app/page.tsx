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
// Supabaseへイベントデータ（Z-Sentiment Index用）を非同期送信
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
  ticker?: string; // 銘柄コードまたはVTuber ID
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
  // ★追加：創業者モード・株主数バフ用プロパティ
  isIpoCard?: boolean;
  creatorName?: string;
  shareholderCount?: number; // 株主（ファン）保有数
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
  { id: 'st4', name: '推しが上場！', emoji: '👑', effect: 'VTuber自社IPOカードの株主バフ発動！' },
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

// 初期カード群（企業カード ＋ 初期自社IPO/VTuberカード）
const initialCards: Card[] = [
  { id: 'v1', ticker: 'VT-01', name: '創業者VTuber：電脳ミライ', sector: 'サイバー', base_attack: 2500, base_defense: 1200, cost: 2, effectType: 'attack', skillName: '自社IPO覚醒バフ', rarity: 'SSR', dividendRate: 60, level: 1, exp: 0, isIpoCard: true, creatorName: '電脳ミライ', shareholderCount: 340 },
  { id: '1', ticker: '7203', name: '情熱あふれる学生プログラマー', sector: 'フィジカル', base_attack: 1200, base_defense: 800, cost: 1, effectType: 'attack', skillName: 'オープンソース展開', rarity: 'R', dividendRate: 10, level: 1, exp: 0 },
  { id: '2', ticker: '9432', name: '街をつなぐコミュニティ配達員', sector: 'サイバー', base_attack: 400, base_defense: 300, cost: 1, effectType: 'draw', skillName: 'スマイル・ルート解析', rarity: 'R', dividendRate: 5, level: 1, exp: 0 },
  { id: '3', ticker: '9984', name: '起業を目指す天才リサーチャー', sector: 'アストラル', base_attack: 1400, base_defense: 1400, cost: 2, effectType: 'counter', skillName: 'フューチャー・カウンター', rarity: 'SR', dividendRate: 25, level: 1, exp: 0 },
  { id: '4', ticker: '6758', name: '次世代スマートシティ中枢銘柄', sector: 'サイバー', base_attack: 2600, base_defense: 1200, cost: 3, effectType: 'attack', skillName: '超並列エコ・システム', rarity: 'SSR', dividendRate: 50, level: 1, exp: 0 },
  { id: '5', ticker: 'TSLA', name: 'モビリティの赤龍', sector: 'フィジカル', base_attack: 2200, base_defense: 1500, cost: 3, effectType: 'attack', skillName: '紅蓮の交通網ブースト', rarity: 'SR', dividendRate: 30, level: 1, exp: 0 },
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

export default function Home() {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [youthEnergy, setYouthEnergy] = useState<number>(1500);
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);
  const [trendingSector, setTrendingSector] = useState<string>('サイバー');
  const [macroRegime, setMacroRegime] = useState<MacroRegime>(macroRegimes[0]);

  // モード切替（通常バトル / 創業者IPOモード）
  const [activeTab, setActiveTab] = useState<'battle' | 'ipo_creator'>('battle');
  
  // 創業者IPO入力用フォーム状態
  const [newIpoName, setNewIpoName] = useState('');
  const [newIpoSector, setNewIpoSector] = useState('サイバー');

  const [deck, setDeck] = useState<string[]>(['v1', '1', '4']);
  const [isBattling, setIsBattling] = useState<boolean>(false);
  const [enemyHp, setEnemyHp] = useState<number>(0);
  const [currentAp, setCurrentAp] = useState<number>(3);
  const [maxAp, setMaxAp] = useState<number>(3);
  const [turnCount, setTurnCount] = useState<number>(1);
  const [hand, setHand] = useState<Card[]>([]);
  const [battleLogs, setBattleLogs] = useState<string[]>([]);

  // 創業者モード：自社IPOカードの発行
  const handleCreateIpo = () => {
    if (!newIpoName.trim()) {
      alert('ブランド名 / VTuber名を入力してください！');
      return;
    }
    const createdCard: Card = {
      id: 'ipo_' + Date.now(),
      ticker: 'IPO-' + Math.floor(100 + Math.random() * 900),
      name: `【自社IPO】${newIpoName}`,
      sector: newIpoSector,
      base_attack: 2000,
      base_defense: 1000,
      cost: 2,
      effectType: 'attack',
      skillName: '株主数バフ覚醒',
      rarity: 'SSR',
      dividendRate: 40,
      level: 1,
      exp: 0,
      isIpoCard: true,
      creatorName: newIpoName,
      shareholderCount: 1, // 自分自身が最初の株主
    };

    setCards(prev => [createdCard, ...prev]);
    setNewIpoName('');
    alert(`🎉 『${createdCard.name}』を市場に上場（IPO）させました！ファンへ拡散して株主を増やしましょう！`);

    // Z-Sentiment/行動分析データ送信（B2Bデータ基盤用）
    trackEvent('creator_ipo_created', {
      creator_name: newIpoName,
      sector: newIpoSector,
    });
  };

  // K-Factor生み出し用：株主募集バイラルポスト機能
  const shareIpoToX = (card: Card) => {
    const text = encodeURIComponent(
      `🔥【マネストラ自社IPO】${card.creatorName || card.name} がゲーム内で上場しました！\n現在の株主数: ${card.shareholderCount || 1}名！\n私の株主（ファン）になって『株主数バフ』を覚醒させよう！\n\n#マネストラ #自社IPO #株主募集 #VTuber`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    
    // 株主数を擬似増加（バイラル効果促進）
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, shareholderCount: (c.shareholderCount || 1) + 5 } : c));
  };

  const startBattle = () => {
    const currentStage = stages[selectedStageIndex];
    setIsBattling(true);
    setEnemyHp(currentStage.maxHp);
    setCurrentAp(3);
    setMaxAp(3);
    setTurnCount(1);
    
    // デッキから手札を準備
    const pool = cards.filter(c => deck.includes(c.id));
    setHand(pool.slice(0, 3));
    setBattleLogs([`🌟 戦闘開始！ ${currentStage.enemyName} の防壁(HP:${currentStage.maxHp})に挑む！`]);
  };

  const playCard = (card: Card) => {
    if (card.cost > currentAp) {
      alert('ユースエナジー（AP）が足りません！');
      return;
    }
    setCurrentAp(prev => prev - card.cost);
    setHand(prev => prev.filter(c => c.id !== card.id));

    // ★株主数バフの計算（株主1人につき攻撃力+10、最大+2000）
    const shareholderBonus = card.isIpoCard ? Math.min(2000, (card.shareholderCount || 0) * 10) : 0;
    const totalAttack = card.base_attack + shareholderBonus;

    const nextHp = Math.max(0, enemyHp - totalAttack);
    setEnemyHp(nextHp);

    let log = `[ターン ${turnCount}] ${card.name} 展開！ ダメージ: ${totalAttack}`;
    if (shareholderBonus > 0) log += ` 👑(株主バフ +${shareholderBonus}!)`;
    
    setBattleLogs(prev => [log, ...prev]);

    if (nextHp <= 0) {
      alert('🎉 勝利！ 敵の防壁を突破しました！');
      setIsBattling(false);
      setYouthEnergy(prev => prev + stages[selectedStageIndex].reward);
    }
  };

  return (
    <main className="p-4 md:p-8 max-w-5xl mx-auto bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-cyan-500/30 pb-4 gap-4">
        <div>
          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-3 py-1 rounded-full font-black tracking-widest">
            MANESTRA // 株価連動TCG × クリエイターエコノミー
          </span>
          <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-400 to-emerald-400 mt-1">
            マネストラ：創業者モード統合版
          </h1>
        </div>
        <div className="bg-slate-800 border border-cyan-400/40 px-5 py-2 rounded-2xl">
          <p className="text-[10px] text-cyan-400 font-black uppercase">Youth Energy (資産)</p>
          <p className="text-2xl font-black text-cyan-300 font-mono">{youthEnergy} <span className="text-xs">pts</span></p>
        </div>
      </div>

      {/* タブ切り替え（通常運用・対戦 / 創業者自社IPOモード） */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab('battle')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'battle' ? 'bg-cyan-500 text-slate-950 font-black shadow-lg' : 'bg-slate-800 text-slate-400'
          }`}
        >
          🎮 運用・対戦モード
        </button>
        <button
          onClick={() => setActiveTab('ipo_creator')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'ipo_creator' ? 'bg-purple-500 text-white font-black shadow-lg' : 'bg-slate-800 text-slate-400'
          }`}
        >
          🚀 創業者モード（自社IPO & 株主バフ）
        </button>
      </div>

      {/* 創業者モード画面 */}
      {activeTab === 'ipo_creator' && (
        <div className="bg-slate-800/90 border-2 border-purple-500/40 rounded-3xl p-6 mb-8 shadow-2xl">
          <h2 className="text-xl font-black text-purple-300 mb-2">👑 自社ブランド / VTuber IPO 発行スタジオ</h2>
          <p className="text-xs text-slate-300 mb-6">
            自身や推しのインフルエンサーカードを発行・上場させ、X（Twitter）で株主（ファン）を募集しよう！<br />
            <strong>株主数が増えるほど「株主数バフ」が覚醒し、バトルでのステータスが跳ね上がります！</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              placeholder="ブランド名 または クリエイター名"
              value={newIpoName}
              onChange={(e) => setNewIpoName(e.target.value)}
              className="bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-sm w-full focus:outline-none focus:border-purple-400"
            />
            <select
              value={newIpoSector}
              onChange={(e) => setNewIpoSector(e.target.value)}
              className="bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-sm font-bold text-purple-300"
            >
              <option value="サイバー">サイバー属性</option>
              <option value="フィジカル">フィジカル属性</option>
              <option value="アストラル">アストラル属性</option>
            </select>
            <button
              onClick={handleCreateIpo}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-black px-6 py-3 rounded-xl text-xs whitespace-nowrap shadow-lg cursor-pointer"
            >
              🚀 上場（自社IPO）を申請する
            </button>
          </div>

          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">市場に上場中の自社IPOカード</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.filter(c => c.isIpoCard).map(card => (
              <div key={card.id} className="bg-slate-900 border border-purple-500/30 p-4 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full font-bold">{card.ticker}</span>
                    <span className="text-xs font-mono font-bold text-amber-300">👥 株主数: {card.shareholderCount || 1} 名</span>
                  </div>
                  <h4 className="text-lg font-black text-white">{card.name}</h4>
                  <p className="text-xs text-purple-300 mt-1">スキル: {card.skillName} (株主バフ ATK +{Math.min(2000, (card.shareholderCount || 0) * 10)})</p>
                </div>
                <button
                  onClick={() => shareIpoToX(card)}
                  className="mt-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-2 rounded-xl text-xs shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>📢</span> Xで株主（ファン）を募集する (K-Factor拡散)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 対戦・運用モード画面 */}
      {activeTab === 'battle' && (
        <>
          {!isBattling ? (
            <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 mb-8">
              <h2 className="text-sm font-bold text-slate-300 mb-4">🗺️ ターゲットセクター選択 & マーケット介入</h2>
              <div className="flex justify-between items-center bg-slate-900 p-5 rounded-2xl border border-cyan-500/30">
                <div>
                  <span className="text-xs text-rose-400 font-bold">SHADOW SYNDICATE</span>
                  <p className="text-xl font-black text-white mt-1">{stages[selectedStageIndex].enemyName}</p>
                  <p className="text-xs text-slate-400 mt-1">耐久(HP): {stages[selectedStageIndex].maxHp}</p>
                </div>
                <button
                  onClick={startBattle}
                  className="bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 px-8 py-4 rounded-2xl font-black text-sm shadow-lg cursor-pointer hover:scale-105 transition-transform"
                >
                  📈 マーケット介入（バトル）開始
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border-2 border-cyan-400/60 rounded-3xl p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-white">{stages[selectedStageIndex].enemyName}</h2>
                  <p className="text-xs text-rose-400 font-mono">敵防壁(HP): {enemyHp} / {stages[selectedStageIndex].maxHp}</p>
                </div>
                <div className="font-mono text-cyan-300 font-bold text-sm">
                  ⚡ AP: {currentAp} / {maxAp}
                </div>
              </div>

              <h3 className="text-xs font-bold text-slate-400 mb-3">🎴 手札ポートフォリオ（タップしてカード展開）</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {hand.map(card => (
                  <div
                    key={card.id}
                    onClick={() => playCard(card)}
                    className="bg-slate-800 border-2 border-cyan-400/80 p-4 rounded-2xl cursor-pointer hover:-translate-y-1 transition-transform"
                  >
                    <div className="flex justify-between text-[10px] text-cyan-300 mb-1">
                      <span>{card.sector}</span>
                      <span>COST {card.cost}</span>
                    </div>
                    <h4 className="font-black text-white text-sm">{card.name}</h4>
                    <p className="text-xs text-slate-300 mt-2 font-mono">ATK: {card.base_attack} {card.isIpoCard && `(+株主バフ)`}</p>
                  </div>
                ))}
              </div>

              {battleLogs.length > 0 && (
                <div className="bg-slate-950 p-3 rounded-xl font-mono text-xs text-cyan-300 max-h-32 overflow-y-auto">
                  {battleLogs.map((log, i) => <p key={i}>{log}</p>)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}