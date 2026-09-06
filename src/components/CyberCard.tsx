'use client';

import React, { useState } from 'react';

type CardComponentProps = {
  name?: string;
  sector?: string;
  rarity?: 'SSR' | 'SR' | 'R' | 'N' | string;
  attack?: number;
  defense?: number;
  cost?: number;
  skillName?: string;
  imageUrl?: string;
  fallbackImageUrl?: string;
};

export default function CyberCard({
  name = "次世代スマートシティ中枢銘柄",
  sector = "サイバー",
  rarity = "SSR",
  attack = 2600,
  defense = 1200,
  cost = 3,
  skillName = "超並列エコ・システム",
  imageUrl = "/path-to-your-image.jpg",
  fallbackImageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop", // 綺麗なサイバー風フォールバック画像
}: CardComponentProps) {
  // 画像の読み込みエラーを検知してフォールバックに切り替えるステート
  const [imgSrc, setImgSrc] = useState(imageUrl);

  // レアリティに応じた外枠グラデーションとシャドウの色を動的に切り分け
  const getRarityStyle = (rar = "N") => {
    switch (rar.toUpperCase()) {
      case 'SSR':
        return {
          gradient: 'bg-gradient-to-b from-yellow-300 via-amber-400 to-rose-500',
          shadow: 'shadow-amber-500/30',
          badge: 'bg-gradient-to-r from-yellow-200 to-amber-300 text-slate-950 border-amber-100',
          border: 'border-amber-400/50',
        };
      case 'SR':
        return {
          gradient: 'bg-gradient-to-b from-purple-400 via-fuchsia-500 to-indigo-500',
          shadow: 'shadow-purple-500/30',
          badge: 'bg-gradient-to-r from-purple-200 to-fuchsia-300 text-slate-950 border-purple-100',
          border: 'border-purple-400/50',
        };
      case 'R':
        return {
          gradient: 'bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-600',
          shadow: 'shadow-blue-500/30',
          badge: 'bg-gradient-to-r from-sky-200 to-blue-300 text-slate-950 border-blue-100',
          border: 'border-blue-400/50',
        };
      default:
        return {
          gradient: 'bg-gradient-to-b from-cyan-400 via-sky-500 to-emerald-400',
          shadow: 'shadow-cyan-500/20',
          badge: 'bg-gradient-to-r from-cyan-300 to-emerald-300 text-slate-950 border-cyan-200',
          border: 'border-cyan-500/40',
        };
    }
  };

  const rarityStyle = getRarityStyle(rarity);

  return (
    <div 
      className={`relative w-72 h-[420px] rounded-3xl p-1 ${rarityStyle.gradient} shadow-2xl ${rarityStyle.shadow} group hover:scale-105 transition-transform duration-300 select-none shrink-0`}
    >
      {/* カード内側のベースフレーム */}
      <div className={`relative w-full h-full bg-slate-950 rounded-[22px] overflow-hidden flex flex-col justify-between p-4 border ${rarityStyle.border}`}>
        
        {/* ヘッダー情報（属性＆レアリティ） */}
        <div className="flex justify-between items-center z-10">
          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-3 py-0.5 rounded-full font-black tracking-wider">
            {sector} // SECTOR
          </span>
          <span className={`text-[10px] font-black px-3 py-0.5 rounded-full border shadow-lg ${rarityStyle.badge}`}>
            ★ {rarity}
          </span>
        </div>

        {/* イラスト表示エリア（背景レイヤー） */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10"></div>
          <img 
            src={imgSrc} 
            alt={name} 
            onError={() => setImgSrc(fallbackImageUrl)}
            className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700 opacity-90"
          />
        </div>

        {/* フッター情報（カード名・スキル・ステータス） */}
        <div className="relative z-10 mt-auto pt-20">
          <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-3 shadow-xl">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-black text-white tracking-tight truncate max-w-[180px]">
                {name}
              </h3>
              <span className="text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-400/40 px-2 py-0.5 rounded font-mono">
                COST {cost}
              </span>
            </div>

            <p className="text-[10px] text-cyan-300 font-bold mb-2">
              🌟 {skillName}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
              <div className="bg-slate-950/60 rounded-lg p-1.5 text-center border border-cyan-500/20">
                <span className="text-[9px] text-slate-400 block">ATK (影響力)</span>
                <span className="font-black text-cyan-300">{attack.toLocaleString()}</span>
              </div>
              <div className="bg-slate-950/60 rounded-lg p-1.5 text-center border border-sky-500/20">
                <span className="text-[9px] text-slate-400 block">DEF (安全性)</span>
                <span className="font-black text-sky-300">{defense.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}