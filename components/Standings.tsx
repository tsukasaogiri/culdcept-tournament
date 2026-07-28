'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Player } from './PlayerManager';

interface StandingsProps {
  players: Player[];
  matchResults: { round: number; tableNumber: number; scores: any }[];
}

export default function Standings({ players, matchResults }: StandingsProps) {
  const [copied, setCopied] = useState(false);

  const statsMap: { [userId: string]: { name: string; points: number; totalScore: number; totalMagic: number; matchesPlayed: number; opponentIds: string[] } } = {};

  players.forEach(p => {
    statsMap[p.id] = {
      name: p.name,
      points: 0,
      totalScore: 0,
      totalMagic: 0,
      matchesPlayed: 0,
      opponentIds: [],
    };
  });

  matchResults.forEach(match => {
    const scores = match.scores;
    if (!scores) return;

    const participantIds = Object.keys(scores);

matchResults.forEach(match => {
    const scores = match.scores;
    if (!scores) return;

    const participantIds = Object.keys(scores);

    participantIds.forEach(userId => {
      const data = scores[userId];
      if (statsMap[userId]) {
        statsMap[userId].matchesPlayed += 1;
        // MatchScoreInputで計算されたポイント（score）をそのまま足す
        statsMap[userId].totalScore += Number(data.score) || 0;
        statsMap[userId].points += Number(data.score) || 0; 
        statsMap[userId].totalMagic += Number(data.magic) || 0;
        
        participantIds.forEach(oppId => {
          if (oppId !== userId) {
            statsMap[userId].opponentIds.push(oppId);
          }
        });
      }
    });
  });
  });

  const winRateMap: { [userId: string]: number } = {};
  Object.entries(statsMap).forEach(([id, stat]) => {
    const maxPossiblePoints = stat.matchesPlayed * 4;
    winRateMap[id] = maxPossiblePoints > 0 ? stat.points / maxPossiblePoints : 0;
  });

  const omwMap: { [userId: string]: number } = {};
  Object.entries(statsMap).forEach(([id, stat]) => {
    if (stat.opponentIds.length === 0) {
      omwMap[id] = 0;
    } else {
      const totalOpponentWinRate = stat.opponentIds.reduce((sum, oppId) => {
        return sum + (winRateMap[oppId] !== undefined ? winRateMap[oppId] : 0);
      }, 0);
      omwMap[id] = totalOpponentWinRate / stat.opponentIds.length;
    }
  });

  const ranking = Object.entries(statsMap)
    .map(([id, stat]) => ({
      id,
      ...stat,
      omw: omwMap[id] || 0,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (Math.abs(b.omw - a.omw) > 0.0001) return b.omw - a.omw;
      return b.totalMagic - a.totalMagic;
    });

  // X（Twitter）用のテキスト生成
  const handleCopyShareText = () => {
    if (ranking.length === 0) return;

    let text = `🏆 カルドセプト 大会結果 🏆\n\n`;
    ranking.slice(0, 3).forEach((p, idx) => {
      const medals = ['🥇 優勝', '🥈 準優勝', '🥉 3位'];
      text += `${medals[idx]}: ${p.name} (${p.points}pt / OMW ${(p.omw * 100).toFixed(1)}%)\n`;
    });
    text += `\n#カルドセプト #Culdcept`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* 🏆 表彰台 (リザルト) セクション：試合結果がある場合のみ表示 */}
      {ranking.length > 0 && (
        <Card className="bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/40 border-indigo-900/50 text-slate-100 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <span>🏆</span> 大会リザルト（表彰台）
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyShareText}
              className="border-slate-700 bg-slate-800 text-xs hover:bg-slate-700 text-slate-200"
            >
              {copied ? '✨ コピーしました！' : '📋 結果をSNS用にコピー'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* 1位 (優勝) */}
              {ranking[0] && (
                <div className="bg-gradient-to-br from-amber-950/40 to-slate-900 border-2 border-amber-500/60 rounded-xl p-4 text-center relative shadow-lg shadow-amber-500/10">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500 text-slate-950 font-black text-xs px-3 py-0.5 rounded-full shadow">
                    👑 優勝
                  </div>
                  <div className="text-3xl mt-2 mb-1">🥇</div>
                  <div className="font-bold text-lg text-amber-200 truncate">{ranking[0].name}</div>
                  <div className="text-xs text-slate-400 mt-2 space-y-0.5">
                    <div>総合Pt: <span className="text-amber-400 font-bold">{ranking[0].points} pt</span></div>
                    <div>OMW%: {(ranking[0].omw * 100).toFixed(1)}%</div>
                    <div>総魔力: {ranking[0].totalMagic.toLocaleString()} G</div>
                  </div>
                </div>
              )}

              {/* 2位 (準優勝) */}
              {ranking[1] && (
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900 border border-slate-400/50 rounded-xl p-4 text-center relative shadow-lg">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-slate-300 text-slate-950 font-bold text-xs px-3 py-0.5 rounded-full shadow">
                    準優勝
                  </div>
                  <div className="text-3xl mt-2 mb-1">🥈</div>
                  <div className="font-bold text-lg text-slate-200 truncate">{ranking[1].name}</div>
                  <div className="text-xs text-slate-400 mt-2 space-y-0.5">
                    <div>総合Pt: <span className="text-slate-200 font-bold">{ranking[1].points} pt</span></div>
                    <div>OMW%: {(ranking[1].omw * 100).toFixed(1)}%</div>
                    <div>総魔力: {ranking[1].totalMagic.toLocaleString()} G</div>
                  </div>
                </div>
              )}

              {/* 3位 */}
              {ranking[2] && (
                <div className="bg-gradient-to-br from-amber-900/30 to-slate-900 border border-amber-800/50 rounded-xl p-4 text-center relative shadow-lg">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-700 text-white font-bold text-xs px-3 py-0.5 rounded-full shadow">
                    第3位
                  </div>
                  <div className="text-3xl mt-2 mb-1">🥉</div>
                  <div className="font-bold text-lg text-amber-100 truncate">{ranking[2].name}</div>
                  <div className="text-xs text-slate-400 mt-2 space-y-0.5">
                    <div>総合Pt: <span className="text-amber-300 font-bold">{ranking[2].points} pt</span></div>
                    <div>OMW%: {(ranking[2].omw * 100).toFixed(1)}%</div>
                    <div>総魔力: {ranking[2].totalMagic.toLocaleString()} G</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 従来の総合順位表 (スタンディングス) */}
      <Card className="bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader>
          <CardTitle>現在の総合順位表 (スタンディングス)</CardTitle>
        </CardHeader>
        <CardContent>
          {ranking.length === 0 ? (
            <p className="text-slate-500 text-center py-4">まだ集計データがありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm">
                    <th className="p-3">順位</th>
                    <th className="p-3">プレイヤー名</th>
                    <th className="p-3">総合Pt</th>
                    <th className="p-3">OMW%</th>
                    <th className="p-3">総魔力</th>
                    <th className="p-3">対戦数</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((player, index) => (
                    <tr key={player.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="p-3 font-bold text-blue-400">{index + 1}位</td>
                      <td className="p-3 font-medium">{player.name}</td>
                      <td className="p-3 font-bold">{player.points} pt</td>
                      <td className="p-3 text-slate-300">{(player.omw * 100).toFixed(1)}%</td>
                      <td className="p-3 text-slate-300">{player.totalMagic.toLocaleString()} G</td>
                      <td className="p-3 text-slate-400">{player.matchesPlayed} 試合</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}