'use client';

import React from 'react';

export interface PennantMatchRecord {
  round: number;
  tableNumber: number;
  mapName: string;
  opponents: string[];
  rank: number;
  magic: number;
  score: number;
}

export interface PennantPlayerDetailModalProps {
  playerName: string;
  matches: PennantMatchRecord[];
  onClose: () => void;
}

export default function PennantPlayerDetailModal({
  playerName,
  matches,
  onClose,
}: PennantPlayerDetailModalProps) {
  // 統計の計算
  const matchesPlayed = matches.length;
  const scoredMatches = matches.filter((m) => m.rank > 0);
  const totalMagic = matches.reduce((acc, m) => acc + m.magic, 0);
  const totalScore = scoredMatches.reduce((acc, m) => acc + m.score, 0);
  const avgRank =
    scoredMatches.length > 0
      ? (scoredMatches.reduce((acc, m) => acc + m.rank, 0) / scoredMatches.length).toFixed(2)
      : '-';

  // ラウンド・卓番号順にソート
  const sortedMatches = [...matches].sort(
    (a, b) => a.round - b.round || a.tableNumber - b.tableNumber
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-indigo-300">{playerName} さんの個人成績</h3>
            <p className="text-xs text-slate-400 mt-0.5">これまでの全対戦結果とスタッツ詳細 (ペナントレース)</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-bold cursor-pointer"
          >
            ✕ 閉じる
          </button>
        </div>

        {/* スタッツ概要グリッド */}
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
            <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">
              {totalMagic.toLocaleString()} G
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-xs text-slate-400">総合ポイント</div>
            <div className="text-lg font-bold text-indigo-300 mt-1 font-mono">{totalScore} pt</div>
          </div>
        </div>

        {/* 対戦履歴リスト */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 tracking-wider uppercase">対戦ラウンド履歴</h4>
          <div className="space-y-2">
            {sortedMatches.length > 0 ? (
              sortedMatches.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                >
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
                        <div className="text-xs font-mono text-emerald-400">
                          {m.magic.toLocaleString()} G
                        </div>
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
}