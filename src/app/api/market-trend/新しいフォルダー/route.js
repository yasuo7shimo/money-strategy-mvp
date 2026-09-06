// app/api/stock-trends/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 例: Alpha Vantage などの外部APIを叩く場合（APIキーはサーバー側で安全に管理）
    const apiKey = process.env.STOCK_API_KEY || 'demo';
    
    // 実際の株価データを取得する代表的なシンボル（例: 半導体関連の代表としてSOX指数やNVIDIA等、あるいは日本のJ-Quantsなど）
    // ここではサンプルとして主要セクターの騰落率をシミュレート、または外部APIへリクエスト
    const sectors = [
      { id: 'semiconductor', symbol: 'NVDA', name: '半導体' },
      { id: 'energy', symbol: 'XLE', name: 'エネルギー' },
      { id: 'retail', symbol: 'AMZN', name: '小売・商社' }
    ];

    const updatedSectors = await Promise.all(
      sectors.map(async (sector) => {
        let changePercent = 0;
        try {
          // 例としてAlpha Vantageのエンドポイントを叩く想定（モックフォールバック付き）
          const res = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${sector.symbol}&apikey=${apiKey}`
          );
          const data = await res.json();
          const quote = data['Global Quote'];
          if (quote && quote['10. change percent']) {
            changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
          } else {
            // API制限やデモ環境用のフォールバック（ランダムまたは直近の傾向値）
            changePercent = (Math.random() * 4 - 1.8); // -1.8% 〜 +2.2%
          }
        } catch (e) {
          changePercent = 1.5; // エラー時はプラス補正のデフォルト
        }

        // 前日比がプラスであれば、対応するカードのATKをアップする倍率を決定
        const isBullish = changePercent > 0;
        const atkMultiplier = isBullish ? 1.25 : 0.90; // プラスならATK 25%UP、マイナスなら90%にダウン

        return {
          sectorId: sector.id,
          name: sector.name,
          symbol: sector.symbol,
          changePercent: Number(changePercent.toFixed(2)),
          isBullish,
          atkMultiplier,
          buffDescription: isBullish ? '🔥 トレンド特効ボーナス中 (+25% ATK)' : '📉 逆風トレンド (-10% ATK)'
        };
      })
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      marketTrends: updatedSectors
    });

  } catch (error) {
    console.error('Stock API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}