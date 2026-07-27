'use client';

import React, { useState, useEffect } from 'react';

// プレイヤーの型定義
export interface Player {
  userId: string;
  name: string;
}

// 入力データの型定義
export interface MatchScoreInputProps {
  tableNumber: number;
  mapName: string;
  targetMagic: number;
  players: Player[];
  onSave: (scores: Record<string, { rank: number; magic: number; score: number }>) => void;
}

export default function MatchScoreInput({
  tableNumber,
  mapName,
  targetMagic,
  players,
  onSave,
}: MatchScoreInputProps) {
  // 順位の状態管理 (userId -> rank: 1~4)
  const [ranks, setRanks] = useState<Record<string, number>>({});
  // 魔力の状態管理 (userId -> magic: number)
  const [magics, setMagics] = useState<Record<string, number>>({});

  // 初期化：全員の魔力を目標魔力に設定
  useEffect(() => {
    const initialMagics: Record<string, number> = {};
    players.forEach((p) => {
      initialMagics[p.userId] = targetMagic;
    });
    setMagics(initialMagics);
  }, [players, targetMagic]);

  // 順位ボタンが押された時の処理（排他制御：同じ順位は選べない）
  const handleRankClick = (userId: string, rank: number) => {
    const newRanks = { ...ranks };

    // 既に他の人がその順位を選んでいたらクリアする
    Object.keys(newRanks).forEach((id) => {
      if (newRanks[id] === rank) {
        delete newRanks[id];
      }
    });

    // 既に自分がその順位を選んでいたら解除、違えば設定
    if (newRanks[userId] === rank) {
      delete newRanks[userId];
    } else {
      newRanks[userId] = rank;
    }

    // もし3人決まったら、残り1人を自動で空いている順位に埋める
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

  // 魔力変更ボタンの処理
  const handleMagicChange = (userId: string, delta: number) => {
    setMagics((prev) => ({
      ...prev,
      [userId]: (prev[userId] || 0) + delta,
    }));
  };

  // 直接魔力を入力した時の処理
  const handleMagicInput = (userId: string, value: string) => {
    const num = parseInt(value, 10);
    setMagics((prev) => ({
      ...prev,
      [userId]: isNaN(num) ? 0 : num,
    }));
  };

  // 保存ボタン（バリデーション付き）
  const handleSaveClick = () => {
    if (Object.keys(ranks).length < players.length) {
      alert('全員の順位が決まっていません！');
      return;
    }

    const resultData: Record<string, { rank: number; magic: number; score: number }> = {};
    players.forEach((p) => {
      const rank = ranks[p.userId] || 4;
      const magic = magics[p.userId] ?? targetMagic;
      // カルドセプトの簡易スコア計算例（順位点＋魔力ボーナスなど自由に変更可能）
      const score = (5 - rank) * 1000 + magic;

      resultData[p.userId] = { rank, magic, score };
    });

    onSave(resultData);
  };

  return (
    <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl text-slate-100">
      {/* ヘッダー情報 */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <span className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-semibold mr-2">
            卓 {tableNumber}
          </span>
          <h2 className="text-xl font-bold inline-block text-white">マップ: {mapName}</h2>
        </div>
        <div className="text-sm text-slate-400">
          目標魔力: <span className="text-amber-400 font-bold">{targetMagic.toLocaleString()}G</span>
        </div>
      </div>

      {/* プレイヤー一覧テーブル・カード */}
      <div className="space-y-4">
        {players.map((player) => {
          const currentRank = ranks[player.userId];
          const currentMagic = magics[player.userId] ?? targetMagic;

          return (
            <div
              key={player.userId}
              className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4"
            >
              {/* プレイヤー名 */}
              <div className="w-full md:w-1/4 font-medium text-lg text-indigo-200 truncate">
                {player.name}
              </div>

              {/* 順位選択ボタン (1位〜4位) */}
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

              {/* 魔力調整エリア */}
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

      {/* 確定ボタン */}
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