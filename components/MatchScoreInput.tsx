'use client';

import React, { useState, useEffect } from 'react';

export interface Player {
  userId: string;
  name: string;
}

export interface MatchScoreInputProps {
  tableNumber: number;
  mapName: string;
  targetMagic: number;
  players: Player[];
  initialScores?: Record<string, { rank: number; magic: number; score: number }>;
  onSave: (scores: Record<string, { rank: number; magic: number; score: number }>) => void;
  // 追加: マップ名や目標魔力が変更された時のコールバック
  onUpdateSettings?: (mapName: string, targetMagic: number) => void;
}

export default function MatchScoreInput({
  tableNumber,
  mapName,
  targetMagic,
  players,
  initialScores,
  onSave,
  onUpdateSettings,
}: MatchScoreInputProps) {
  const [ranks, setRanks] = useState<Record<string, number>>({});
  const [magics, setMagics] = useState<Record<string, number>>({});

  // 編集可能なローカルステート（マップ名、目標魔力）
  const [currentMapName, setCurrentMapName] = useState(mapName);
  const [currentTargetMagic, setCurrentTargetMagic] = useState(targetMagic);

  // プロパティが変更されたらローカルステートも同期
  useEffect(() => {
    setCurrentMapName(mapName);
    setCurrentTargetMagic(targetMagic);
  }, [mapName, targetMagic]);

  // 初期化・保存済みデータの復元
  useEffect(() => {
    if (initialScores) {
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
  }, [initialScores, players, targetMagic]);

  // 設定変更時に親へ通知
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
    const newRanks = { ...ranks };

    Object.keys(newRanks).forEach((id) => {
      if (newRanks[id] === rank) {
        delete newRanks[id];
      }
    });

    if (newRanks[userId] === rank) {
      delete newRanks[userId];
    } else {
      newRanks[userId] = rank;
    }

    const assignedUserIds = Object.keys(newRanks);
    if (assignedUserIds.length === 3 && players.length === 4) {
      const unassignedUser = players.find((p) => !newRanks[p.userId] && p.userId !== userId);
      const usedRanks = Object.values(newRanks);
      const remainingRank = [1, 2, 3, 4].find((r) => !usedRanks.includes(r));

      if (unassignedUser && remainingRank) {
        newRanks[unassignedUser.userId] = remainingRank;
      }
    }

    setRanks(newRanks);
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
    if (Object.keys(ranks).length < players.length) {
      alert('全員の順位が決まっていません！');
      return;
    }

    // 現在の卓の参加人数
    const matchPlayerCount = players.length;

    const resultData: Record<string, { rank: number; magic: number; score: number }> = {};
    players.forEach((p) => {
      const rank = ranks[p.userId] || players.length;
      const magic = magics[p.userId] ?? currentTargetMagic;

      // 順位と人数に応じた勝ち点（score）を計算
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

      // 総合順位のタイブレーク用に魔力も考慮しつつ、scoreに勝ち点を格納
      resultData[p.userId] = { rank, magic, score: points };
    });

    onSave(resultData);
  };

  return (
    <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl text-slate-100">
      {/* ヘッダー情報：マップ名と目標魔力を変更可能に */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-semibold shrink-0">
            卓 {tableNumber}
          </span>
          <div className="flex items-center gap-2 w-full">
            <span className="text-sm text-slate-400 shrink-0">マップ:</span>
            <input
              type="text"
              value={currentMapName}
              onChange={(e) => handleMapNameChange(e.target.value)}
              placeholder="マップ名を入力"
              className="bg-slate-950 border border-slate-700 rounded px-3 py-1 text-white font-bold text-sm w-full md:w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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

      {/* プレイヤー一覧テーブル・カード */}
      <div className="space-y-4">
        {players.map((player) => {
          const currentRank = ranks[player.userId];
          const currentMagic = magics[player.userId] ?? currentTargetMagic;

          return (
            <div
              key={player.userId}
              className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="w-full md:w-1/4 font-medium text-lg text-indigo-200 truncate">
                {player.name}
              </div>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((rankNum) => {
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

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleMagicChange(player.userId, -1000)}
                  className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 rounded text-xs font-semibold"
                >
                  -1000
                </button>
                <button
                  type="button"
                  onClick={() => handleMagicChange(player.userId, -500)}
                  className="px-2 py-1.5 bg-red-950/40 hover:bg-red-900 border border-red-900 text-red-400 rounded text-xs"
                >
                  -500
                </button>

                <input
                  type="number"
                  value={currentMagic}
                  onChange={(e) => handleMagicInput(player.userId, e.target.value)}
                  className="w-28 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right font-mono text-amber-300 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-400">G</span>

                <button
                  type="button"
                  onClick={() => handleMagicChange(player.userId, 500)}
                  className="px-2 py-1.5 bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-900 text-emerald-400 rounded text-xs"
                >
                  +500
                </button>
                <button
                  type="button"
                  onClick={() => handleMagicChange(player.userId, 1000)}
                  className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded text-xs font-semibold"
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
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95"
        >
          スコアを確定して保存する
        </button>
      </div>
    </div>
  );
}