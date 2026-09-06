// app/api/market-trend/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 例: 実際の外部株価APIやYahoo!ファイナンス、
    // あるいはJPX公式のJ-Quants APIなどをここで呼び出す。
    // 今回は代表銘柄の騰落率をシミュレートして判定するロジックの例を記載します。

    // セクターごとの代表コード（例）
    // モビリティ: トヨタ等, 半導体: 東エレク等, エネルギー: 出光等
    
    const sectors = ['モビリティ', '半導体', 'エネルギー'];
    
    // 実運用ではここでfetch()を使い外部APIからデータを取得
    // const res = await fetch('https://api.example.com/stock-prices');
    // const data = await res.json();

    // デモとして、ランダムではなく「時間帯や曜日、または簡易的な外部データ」に基づいた判定ロジック、
    // あるいは外部APIのレスポンスから最も騰落率が高いセクターを算出する処理を記述
    const simulatedIndex = Math.floor(Date.now() / (1000 * 60 * 60)) % sectors.length;
    const activeTrendingSector = sectors[simulatedIndex];

    return NextResponse.json({
      success: true,
      trendingSector: activeTrendingSector,
      updatedAt: new Date().toISOString(),
      dataSource: 'Live Market Simulation API',
    });
  } catch (error) {
    console.error('Market API Error:', error);
    return NextResponse.json({ success: false, trendingSector: '半導体' }, { status: 500 });
  }
}