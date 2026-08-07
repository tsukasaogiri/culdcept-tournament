'use client';

import React, { useState, useEffect } from 'react';

export interface Player {
  userId: string;
  id?: string;
  name: string;
}

export interface MatchScoreInputProps {
  tableNumber: number;
  mapName: string;
  targetMagic: number;
  players: Player[];
  initialScores?: Record<string, { rank: number; magic: number; score: number }>;
  
  currentRound?: number;
  totalRounds?: number;

  allRounds?: any;
  allMatchScores?: any;
  allTableSettings?: any;
  allStandings?: { id: string; name: string; matchesPlayed: number; totalMagic: number; totalScore: number }[];
  
  onSave: (scores: Record<string, { rank: number; magic: number; score: number }>) => void;
  onUpdateSettings?: (mapName: string, targetMagic: number) => void;
}

const CEPT_BEGINS_MAPS = [
  '古書館',
  'リカドの村',
  '天空庭園',
  'シーダモの港',
  'ガイデス闘技場１',
  'ガイデス闘技場２',
  '地の神殿',
  '塔都テレイア',
  '風の神殿',
  '炎都ビステア',
  '火の神殿',
  '水の神殿跡',
  '闇神の神殿',
  '闇神ノンデス',
  '天空庭園（半壊）',
  'ロータリー',
  'ザ・エイト',
  'ダブルハート',
  'モルフォ',
];

export default function MatchScoreInput({
  tableNumber,
  mapName,
  targetMagic,
  players,
  initialScores,
  currentRound,
  totalRounds,
  allRounds = [],
  allMatchScores = {},
  allTableSettings = {},
  allStandings = [],
  onSave,
  onUpdateSettings,
}: MatchScoreInputProps) {
  const [ranks, setRanks] = useState<Record<string, number>>({});
  const [magics, setMagics] = useState<Record<string, number>>({});

  const [currentMapName, setCurrentMapName] = useState(mapName);
  const [currentTargetMagic, setCurrentTargetMagic] = useState(targetMagic);

  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<string | null>(null);

  const matchPlayerCount = players.length;
  const rankButtons = Array.from({ length: matchPlayerCount }, (_, i) => i + 1);

  useEffect(() => {
    setCurrentMapName(mapName);
    setCurrentTargetMagic(targetMagic);
  }, [mapName, targetMagic]);

useEffect(() => {
    if (initialScores && Object.keys(initialScores).length > 0) {
      const loadedRanks: Record<string, number> = {};
      const loadedMagics: Record<string, number> = {};
      Object.entries(initialScores).forEach(([userId, data]) => {
        loadedRanks[userId] = data.rank;
        loadedMagics[userId] = data.magic;
      });
      setRanks(loadedRanks);
      setMagics(loadedMagics);
    } else {
      const initialMagics: Record<string, number> = {};
      players.forEach((p) => {
        initialMagics[p.userId] = targetMagic;
      });
      setMagics(initialMagics);
      setRanks({});
    }
  }, [initialScores, targetMagic, tableNumber, currentRound]); 
  // ※ players, allRounds, allMatchScores などの配列・オブジェクト型は依存配列から除外します

  const handleMapNameChange = (newName: string) => {
    setCurrentMapName(newName);
    if (onUpdateSettings) {
      onUpdateSettings(newName, currentTargetMagic);
    }
  };

  const handleTargetMagicChange = (newMagic: number) => {
    setCurrentTargetMagic(newMagic);
    if (onUpdateSettings) {
      onUpdateSettings(currentMapName, newMagic);
    }
  };

  const handleRankClick = (userId: string, rank: number) => {
    setRanks((prev) => {
      const newRanks = { ...prev };
      if (newRanks[userId] === rank) {
        delete newRanks[userId];
      } else {
        newRanks[userId] = rank;
      }
      return newRanks;
    });
  };

  const handleMagicChange = (userId: string, delta: number) => {
    setMagics((prev) => ({
      ...prev,
      [userId]: (prev[userId] ?? currentTargetMagic) + delta,
    }));
  };

  const handleMagicInput = (userId: string, value: string) => {
    const num = parseInt(value, 10);
    setMagics((prev) => ({
      ...prev,
      [userId]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSaveClick = () => {
    if (Object.keys(ranks).length < matchPlayerCount) {
      alert('全員の順位が決まっていません！');
      return;
    }

    const resultData: Record<string, { rank: number; magic: number; score: number }> = {};
    players.forEach((p) => {
      const rank = ranks[p.userId] || matchPlayerCount;
      const magic = magics[p.userId] ?? currentTargetMagic;

      let points = 0;
      if (matchPlayerCount === 4) {
        if (rank === 1) points = 6;
        else if (rank === 2) points = 4;
        else if (rank === 3) points = 2;
        else if (rank === 4) points = 0;
      } else if (matchPlayerCount === 3) {
        if (rank === 1) points = 6;
        else if (rank === 2) points = 3;
        else if (rank === 3) points = 0;
      } else if (matchPlayerCount === 2) {
        if (rank === 1) points = 6;
        else if (rank === 2) points = 0;
      }

      resultData[p.userId] = { rank, magic, score: points };
    });

    onSave(resultData);
  };

  useEffect(() => {
  console.log("--- MatchScoreInput デバッグ ---");
  console.log("Current Round:", currentRound);
  console.log("All Rounds:", allRounds);
  console.log("All MatchScores:", allMatchScores);
  console.log("Players:", players);
}, [currentRound, allRounds, allMatchScores, players]);

  return (
    <div className="w-full max-w-7xl bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-2xl text-slate-100 mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-semibold shrink-0">
            卓 {tableNumber} ({matchPlayerCount}人卓)
            {currentRound && totalRounds ? ` / R${currentRound} (全${totalRounds}R)` : ''}
          </span>
          <div className="flex items-center gap-2 w-full">
            <span className="text-sm text-slate-400 shrink-0">マップ:</span>
            <select
              value={currentMapName}
              onChange={(e) => handleMapNameChange(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-3 py-1 text-white font-bold text-sm w-full md:w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>マップを選択</option>
              {currentMapName && !CEPT_BEGINS_MAPS.includes(currentMapName) && (
                <option value={currentMapName}>{currentMapName}</option>
              )}
              {CEPT_BEGINS_MAPS.map((mapTitle) => (
                <option key={mapTitle} value={mapTitle}>
                  {mapTitle}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-sm text-slate-400 shrink-0">目標魔力:</span>
          <input
            type="number"
            value={currentTargetMagic}
            step={500}
            onChange={(e) => handleTargetMagicChange(Number(e.target.value))}
            className="w-32 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right font-mono text-amber-300 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-sm text-amber-400 font-bold">G</span>
        </div>
      </div>

      <div className="space-y-4">
        {players.map((player) => {
          const currentRank = ranks[player.userId];
          const currentMagic = magics[player.userId] ?? currentTargetMagic;

          return (
            <div
              key={player.userId}
              className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4 flex flex-col xl:flex-row items-center justify-between gap-4"
            >
              <button
                type="button"
                onClick={() => setSelectedPlayerForDetail(player.userId)}
                className="w-full xl:w-1/5 font-medium text-lg text-indigo-300 hover:text-indigo-200 truncate text-center xl:text-left underline underline-offset-4 decoration-indigo-500/50 hover:decoration-indigo-300 transition-colors cursor-pointer"
                title="クリックして個人成績を表示"
              >
                {player.name} <span className="text-xs text-slate-400 font-normal">📊</span>
              </button>

              <div className="flex items-center gap-2 shrink-0">
                {rankButtons.map((rankNum) => {
                  const isSelected = currentRank === rankNum;
                  return (
                    <button
                      key={rankNum}
                      type="button"
                      onClick={() => handleRankClick(player.userId, rankNum)}
                      className={`w-10 h-10 rounded-lg font-bold transition-all ${
                        isSelected
                          ? rankNum === 1
                            ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300'
                            : rankNum === 2
                            ? 'bg-slate-300 text-slate-950 shadow-lg ring-2 ring-white'
                            : rankNum === 3
                            ? 'bg-amber-700 text-white shadow-lg ring-2 ring-amber-500'
                            : 'bg-slate-700 text-slate-300'
                          : 'bg-slate-900/80 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {rankNum}位
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1 xl:justify-end w-full xl:w-auto">
                <button
                  type="button"
                  onClick={() => handleMagicChange(player.userId, -1000)}
                  className="px-2 py-1.5 bg-red-950/70 hover:bg-red-900 border border-red-800 text-red-300 rounded text-xs font-semibold shrink-0"
                >
                  -1000
                </button>
                <button
                  type="button"
                  onClick={() => handleMagicChange(player.userId, -100)}
                  className="px-2 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 rounded text-xs shrink-0"
                >
                  -100
                </button>
                <button
                  type="button"
                  onClick={() => handleMagicChange(player.userId, -10)}
                  className="px-2 py-1.5 bg-red-950/50 hover:bg-red-900 border border-red-900 text-red-400 rounded text-xs shrink-0"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => handleMagicChange(player.userId, -1)}
                  className="px-2 py-1.5 bg-red-950/40 hover:bg-red-900 border border-red-950 text-red-400 rounded text-xs shrink-0"
                >
                  -1
                </button>

                <div className="flex items-center gap-1 mx-1 shrink-0 my-1">
                  <input
                    type="number"
                    value={currentMagic}
                    onChange={(e) => handleMagicInput(player.userId, e.target.value)}
                    className="w-28 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right font-mono text-amber-300 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <span className="text-xs text-slate-400">G</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleMagicChange(player.userId, 1)}
                  className="px-2 py-1.5 bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-950 text-emerald-400 rounded text-xs shrink-0"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => handleMagicChange(player.userId, 10)}
                  className="px-2 py-1.5 bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-900 text-emerald-400 rounded text-xs shrink-0"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => handleMagicChange(player.userId, 100)}
                  className="px-2 py-1.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded text-xs shrink-0"
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => handleMagicChange(player.userId, 1000)}
                  className="px-2 py-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded text-xs font-semibold shrink-0"
                >
                  +1000
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSaveClick}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95"
        >
          スコアを確定して保存する
        </button>
      </div>

{selectedPlayerForDetail && (() => {
        const targetPlayer: any = players.find(p => p.userId === selectedPlayerForDetail || p.id === selectedPlayerForDetail) || 
                                  (Array.isArray(allStandings) ? allStandings.find((s: any) => s.id === selectedPlayerForDetail) : null) ||
                                  { userId: selectedPlayerForDetail, id: selectedPlayerForDetail, name: 'プレイヤー' };

        const targetId = targetPlayer.userId || targetPlayer.id || selectedPlayerForDetail;
        const targetName = targetPlayer.name || 'プレイヤー';

        // 試合データを格納するマップ
        const collectedMatchesMap = new Map<string, {
          round: number;
          tableNumber: number;
          mapName: string;
          scores: Record<string, any>;
          players: any[];
        }>();

        // 1. allRounds (roundHistories) からベースを作成
        if (Array.isArray(allRounds)) {
          allRounds.forEach((h: any) => {
            if (h && Array.isArray(h.tables)) {
              h.tables.forEach((t: any) => {
                if (t && Array.isArray(t.players)) {
                  const matchKey = `r${h.round}-t${t.tableNumber}`;
                  collectedMatchesMap.set(matchKey, {
                    round: Number(h.round) || 1,
                    tableNumber: Number(t.tableNumber) || 1,
                    mapName: t.mapName || currentMapName,
                    scores: {},
                    players: t.players
                  });
                }
              });
            }
          });
        }

        // 2. allMatchScores (保存済みスコア) をマージ
        if (allMatchScores) {
          const matchArray = Array.isArray(allMatchScores) 
            ? allMatchScores 
            : Object.values(allMatchScores);
            
          matchArray.forEach((m: any) => {
            if (m) {
              const rNum = Number(m.round) || 1;
              const tNum = Number(m.tableNumber) || 1;
              const matchKey = `r${rNum}-t${tNum}`;
              if (collectedMatchesMap.has(matchKey)) {
                const existing = collectedMatchesMap.get(matchKey)!;
                existing.scores = { ...existing.scores, ...(m.scores || {}) };
                if (m.mapName) existing.mapName = m.mapName;
                if (m.players) existing.players = m.players;
              } else {
                collectedMatchesMap.set(matchKey, {
                  round: rNum,
                  tableNumber: tNum,
                  mapName: m.mapName || currentMapName,
                  scores: m.scores || {},
                  players: m.players || players
                });
              }
            }
          });
        }

        // 3. 現在入力中の画面のデータもリアルタイムに反映
        const currentRoundNum = Number(currentRound) || 1;
        const currentKey = `r${currentRoundNum}-t${tableNumber}`;
        
        const activeScores: Record<string, any> = {};
        players.forEach(p => {
          if (ranks[p.userId]) {
            const r = ranks[p.userId];
            const m = magics[p.userId] ?? currentTargetMagic;
            let pts = 0;
            if (matchPlayerCount === 4) {
              if (r === 1) pts = 6; else if (r === 2) pts = 4; else if (r === 3) pts = 2; else pts = 0;
            } else if (matchPlayerCount === 3) {
              if (r === 1) pts = 6; else if (r === 2) pts = 3; else pts = 0;
            } else {
              if (r === 1) pts = 6; else pts = 0;
            }
            activeScores[p.userId] = { rank: r, magic: m, score: pts };
          } else if (initialScores && initialScores[p.userId]) {
            activeScores[p.userId] = initialScores[p.userId];
          }
        });

        if (collectedMatchesMap.has(currentKey)) {
          const existing = collectedMatchesMap.get(currentKey)!;
          existing.scores = { ...existing.scores, ...activeScores };
          existing.mapName = currentMapName;
        } else {
          collectedMatchesMap.set(currentKey, {
            round: currentRoundNum,
            tableNumber: tableNumber,
            mapName: currentMapName,
            scores: activeScores,
            players: players
          });
        }

        // 4. 該当プレイヤーが参加している試合を抽出
        const playerMatches: {
          round: number;
          tableNumber: number;
          mapName: string;
          opponents: string[];
          rank: number;
          magic: number;
          score: number;
        }[] = [];

        collectedMatchesMap.forEach((matchInfo) => {
          const matchPlayers = matchInfo.players && matchInfo.players.length > 0 ? matchInfo.players : players;
          
          const isParticipant = matchPlayers.some((tp: any) => String(tp.userId || tp.id) === String(targetId));
          if (!isParticipant) return;

          const myData = matchInfo.scores[targetId];
          const opponents = matchPlayers
            .filter((tp: any) => String(tp.userId || tp.id) !== String(targetId))
            .map((tp: any) => tp.name);

          playerMatches.push({
            round: matchInfo.round,
            tableNumber: matchInfo.tableNumber,
            mapName: matchInfo.mapName || 'マップ未設定',
            opponents,
            rank: myData ? Number(myData.rank) || 0 : 0,
            magic: myData ? Number(myData.magic ?? myData.totalMagic) || 0 : 0,
            score: myData ? Number(myData.score) || 0 : 0,
          });
        });

        playerMatches.sort((a, b) => a.round - b.round || a.tableNumber - b.tableNumber);

        const matchesPlayed = playerMatches.length;
        const scoredMatches = playerMatches.filter(m => m.rank > 0);
        const totalMagic = playerMatches.reduce((acc, m) => acc + m.magic, 0);
        const totalScore = scoredMatches.reduce((acc, m) => acc + m.score, 0);
        const avgRank = scoredMatches.length > 0 
          ? (scoredMatches.reduce((acc, m) => acc + m.rank, 0) / scoredMatches.length).toFixed(2)
          : '-';

        return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-indigo-300">{targetName} さんの個人成績</h3>
                  <p className="text-xs text-slate-400 mt-0.5">これまでの全対戦結果とスタッツ詳細</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedPlayerForDetail(null)}
                  className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-bold"
                >
                  ✕ 閉じる
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-xs text-slate-400">総試合数</div>
                  <div className="text-lg font-bold text-indigo-400 mt-1">{matchesPlayed} 試合</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-xs text-slate-400">平均順位</div>
                  <div className="text-lg font-bold text-amber-400 mt-1">{avgRank} 位</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-xs text-slate-400">総獲得魔力</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">{totalMagic.toLocaleString()} G</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-xs text-slate-400">総合ポイント</div>
                  <div className="text-lg font-bold text-indigo-300 mt-1 font-mono">{totalScore} pt</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 tracking-wider uppercase">対戦ラウンド履歴</h4>
                <div className="space-y-2">
                  {playerMatches.length > 0 ? (
                    playerMatches.map((m, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-900 px-2 py-0.5 rounded font-bold">
                              R {m.round}
                            </span>
                            <span className="text-xs text-slate-400">第 {m.tableNumber} 卓</span>
                            <span className="text-xs text-slate-500">（マップ: {m.mapName || '未設定'}）</span>
                          </div>
                          <div className="text-xs text-slate-300">
                            対戦相手: <span className="text-slate-400">{m.opponents.join(', ') || 'なし'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {m.rank > 0 ? (
                            <div className="text-right">
                              <div className={`text-xs font-bold ${m.rank === 1 ? 'text-amber-400' : 'text-slate-200'}`}>
                                {m.rank}位 ({m.score}pt)
                              </div>
                              <div className="text-xs font-mono text-emerald-400">{m.magic.toLocaleString()} G</div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">未入力</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                      まだ対戦履歴がありません
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}