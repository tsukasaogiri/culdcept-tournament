// components/RoundRobinManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Player } from './PlayerManager';
import MatchScoreInput from './MatchScoreInput';

interface RoundRobinManagerProps {
  players: Player[];
}

interface RoundRobinTable {
  round: number;
  tableNumber: number;
  players: { userId: string; name: string }[];
}

interface MatchResultData {
  rank: number;
  magic: number;
  score: number;
}

interface StandingsPlayer {
  id: string;
  name: string;
  matchesPlayed: number;
  totalScore: number;
  totalMagic: number;
  firsts: number;
  seconds: number;
  thirds: number;
  fourths: number;
}

const STORAGE_KEY_PREFIX = 'tournament_manager_';

export default function RoundRobinManager({ players }: RoundRobinManagerProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}_${players.map(p => p.id).sort().join('_')}`;

  const [mode, setMode] = useState<'long' | 'short'>('long'); // 長期モード vs 短期モード
  const [rounds, setRounds] = useState<RoundRobinTable[][]>([]);
  const [matchScores, setMatchScores] = useState<Record<string, Record<string, MatchResultData>>>({});
  const [tableSettings, setTableSettings] = useState<Record<string, { mapName: string; targetMagic: number }>>({});
  
  const [targetRoundsCount, setTargetRoundsCount] = useState<number>(3); // 短期モード用の希望ラウンド数
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [activeInputKey, setActiveInputKey] = useState<string | null>(null);
  const [isGenerated, setIsGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'standings'>('schedule');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.isGenerated) {
          setRounds(parsed.rounds || []);
          setMatchScores(parsed.matchScores || {});
          setTableSettings(parsed.tableSettings || {});
          setCurrentRound(parsed.currentRound || 1);
          setIsGenerated(parsed.isGenerated || false);
          setActiveTab(parsed.activeTab || 'schedule');
          if (parsed.mode) setMode(parsed.mode);
          if (parsed.targetRoundsCount) setTargetRoundsCount(parsed.targetRoundsCount);
        }
      } catch (e) {
        console.error('Failed to load data from localStorage', e);
      }
    }
    setIsInitialized(true);
  }, [storageKey]);

  useEffect(() => {
    if (!isInitialized) return;

    if (isGenerated) {
      const dataToSave = {
        rounds,
        matchScores,
        tableSettings,
        currentRound,
        isGenerated,
        activeTab,
        mode,
        targetRoundsCount,
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [rounds, matchScores, tableSettings, currentRound, isGenerated, activeTab, mode, targetRoundsCount, isInitialized, storageKey]);

  const isMultipleOfFour = players.length >= 4 && players.length % 4 === 0;

  // 長期モード（公式マトリクス総当たり）のスケジュール生成
  const handleGenerateLongSchedule = () => {
    const n = players.length;
    
    if (!isMultipleOfFour) {
      alert(`現在の参加人数は ${n} 人です。\n長期モード（総当たり戦）を行うには、参加人数が「4の倍数（4, 8, 12, 16, 20, 24, 28人…）」である必要があります。`);
      return;
    }

    let rawMatrix: number[][][] = [];

    if (n === 4) {
      rawMatrix = [
        [[0, 1, 2, 3]],
        [[0, 2, 1, 3]],
        [[0, 3, 1, 2]],
      ];
    } else if (n === 8) {
      rawMatrix = [
        [[0, 1, 2, 3], [4, 5, 6, 7]],
        [[0, 2, 5, 7], [1, 3, 4, 6]],
        [[0, 3, 4, 6], [1, 2, 5, 7]],
        [[0, 4, 5, 6], [1, 2, 3, 7]],
        [[0, 5, 3, 7], [1, 4, 2, 6]],
        [[0, 6, 1, 5], [2, 4, 3, 7]],
        [[0, 7, 1, 4], [2, 5, 3, 6]],
      ];
    } else if (n === 12) {
      rawMatrix = [
        [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11]],
        [[0, 4, 8, 9], [1, 5, 10, 11], [2, 6, 3, 7]],
        [[0, 5, 8, 10], [1, 4, 9, 11], [2, 7, 3, 6]],
        [[0, 6, 8, 11], [1, 7, 9, 10], [2, 4, 3, 5]],
        [[0, 7, 9, 10], [1, 6, 8, 11], [2, 5, 3, 4]],
        [[0, 1, 4, 5], [2, 3, 8, 9], [6, 7, 10, 11]],
        [[0, 1, 6, 7], [2, 3, 10, 11], [4, 5, 8, 9]],
        [[0, 2, 4, 6], [1, 3, 5, 7], [8, 9, 10, 11]],
        [[0, 2, 5, 7], [1, 3, 4, 6], [8, 10, 9, 11]],
        [[0, 3, 4, 7], [1, 2, 5, 6], [8, 9, 10, 11]],
        [[0, 3, 5, 6], [1, 2, 4, 7], [8, 10, 9, 11]],
      ];
    } else if (n === 16) {
      const tableAssignments = [
        [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3],
        [1, 2, 4, 2, 1, 4, 4, 3, 4, 1, 1, 1, 3, 1, 4],
        [1, 3, 1, 4, 3, 3, 2, 3, 4, 4, 4, 2, 4, 3, 3],
        [2, 4, 3, 2, 2, 1, 2, 3, 3, 3, 1, 3, 2, 2, 3],
        [3, 2, 1, 1, 4, 1, 2, 2, 2, 4, 2, 1, 1, 2, 4],
        [1, 4, 4, 3, 4, 1, 1, 1, 3, 1, 4, 4, 1, 3, 1],
        [3, 3, 2, 3, 4, 4, 4, 2, 4, 3, 3, 4, 2, 4, 3],
        [2, 1, 2, 3, 3, 3, 1, 3, 2, 2, 3, 1, 3, 2, 1],
        [4, 1, 2, 2, 2, 4, 2, 1, 1, 2, 4, 2, 1, 4, 4],
        [4, 1, 1, 1, 3, 1, 4, 4, 1, 3, 1, 4, 3, 3, 2],
        [4, 4, 4, 2, 4, 3, 3, 4, 2, 4, 3, 2, 2, 1, 2],
        [3, 3, 1, 3, 2, 2, 3, 1, 3, 2, 1, 1, 4, 1, 2],
        [2, 4, 2, 1, 1, 2, 4, 2, 1, 4, 4, 3, 4, 1, 1],
        [3, 1, 4, 4, 1, 3, 1, 4, 3, 3, 2, 3, 4, 4, 4],
        [4, 3, 3, 4, 2, 4, 3, 2, 2, 1, 2, 3, 3, 3, 1],
        [2, 2, 3, 1, 3, 2, 1, 1, 4, 1, 2, 2, 2, 4, 2],
      ];

      const matrix: number[][][] = [];
      for (let r = 0; r < 15; r++) {
        const tables: number[][] = [[], [], [], []];
        for (let p = 0; p < 16; p++) {
          const tNum = tableAssignments[p][r] - 1;
          tables[tNum].push(p);
        }
        matrix.push(tables);
      }
      rawMatrix = matrix;
    } else if (n === 20) {
      const tableAssignments = [
        [1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4],
        [1,2,4,4,2,4,3,2,3,2,3,1,1,5,3,3,5,2,5],
        [1,3,3,1,3,2,1,2,1,2,5,5,4,2,2,4,1,4,4],
        [2,2,5,2,1,5,1,5,1,4,4,3,1,1,3,5,3,3,4],
        [1,4,1,5,4,5,4,5,3,3,2,5,5,2,4,2,2,3,5],
        [3,5,4,3,4,3,4,2,2,1,4,4,1,3,1,1,2,4,4],
        [4,3,2,3,2,3,1,1,5,3,3,5,2,5,5,1,3,3,1],
        [2,1,2,1,2,5,5,4,2,2,4,1,4,4,5,2,2,5,2],
        [5,1,5,1,4,4,3,1,1,3,5,3,3,4,1,1,4,1,5],
        [5,4,5,3,3,2,5,5,2,4,2,2,3,5,5,3,5,4,3],
        [3,4,2,2,1,4,4,1,3,1,1,2,4,4,2,4,3,2,3],
        [3,1,1,5,3,3,5,2,5,5,1,3,3,1,3,2,1,2,1],
        [5,5,4,2,2,4,1,4,4,5,2,2,5,2,1,5,1,5,1],
        [4,3,1,1,3,5,3,3,4,1,1,4,1,5,4,5,4,5,3],
        [2,5,5,2,4,2,2,3,5,5,3,5,4,3,4,3,4,3,2],
        [4,4,1,3,1,1,2,4,4,2,4,3,2,3,2,3,1,1,5],
        [3,5,2,5,5,1,3,3,1,3,2,1,2,1,2,5,5,4,2],
        [4,1,4,4,5,2,2,5,2,1,5,1,5,1,4,4,3,1,1],
        [5,3,3,4,1,1,4,1,5,4,5,4,5,3,3,2,5,5,2],
        [2,2,3,5,5,3,5,4,3,4,3,4,2,2,1,4,4,1,3],
      ];

      const matrix: number[][][] = [];
      for (let r = 0; r < 19; r++) {
        const tables: number[][] = [[], [], [], [], []];
        for (let p = 0; p < 20; p++) {
          const tNum = tableAssignments[p][r] - 1;
          tables[tNum].push(p);
        }
        matrix.push(tables);
      }
      rawMatrix = matrix;
    } else if (n === 24) {
      const tableAssignments = [
        [1,2,3,4,5,6,1,2,3,4,5,6,1,2,3,4,5,6,1,2,3,4,5],
        [1,2,4,4,6,2,4,6,5,3,4,4,2,5,5,3,4,3,5,4,1,1,6],
        [1,3,3,5,1,3,5,4,2,3,3,1,4,4,2,3,2,4,3,6,6,5,5],
        [2,2,4,6,2,4,3,1,2,2,6,3,3,1,2,1,3,2,5,5,4,4,5],
        [1,3,5,1,3,2,6,1,1,5,2,2,6,1,6,2,1,4,4,3,3,4,6],
        [2,4,6,2,1,5,6,6,4,1,1,5,6,5,1,6,3,3,2,2,3,5,5],
        [3,5,1,6,4,5,5,3,6,6,4,5,4,6,5,2,2,1,1,2,4,4,6],
        [4,6,5,3,4,4,2,5,5,3,4,3,5,4,1,1,6,6,1,3,3,5,1],
        [5,4,2,3,3,1,4,4,2,3,2,4,3,6,6,5,5,6,2,2,4,6,2],
        [3,1,2,2,6,3,3,1,2,1,3,2,5,5,4,4,5,1,1,3,5,1,3],
        [6,1,1,5,2,2,6,1,6,2,1,4,4,3,3,4,6,6,2,4,6,2,1],
        [6,6,4,1,1,5,6,5,1,6,3,3,2,2,3,5,5,1,3,5,1,6,4],
        [5,3,6,6,4,5,4,6,5,2,2,1,1,2,4,4,6,2,4,6,5,3,4],
        [2,5,5,3,4,3,5,4,1,1,6,6,1,3,3,5,1,3,5,4,2,3,3],
        [4,4,2,3,2,4,3,6,6,5,5,6,2,2,4,6,2,4,3,1,2,2,6],
        [3,1,2,1,3,2,5,5,4,4,5,1,1,3,5,1,3,2,6,1,1,5,2],
        [6,1,6,2,1,4,4,3,3,4,6,6,2,4,6,2,1,5,6,6,4,1,1],
        [6,5,1,6,3,3,2,2,3,5,5,1,3,5,1,6,4,5,5,3,6,6,4],
        [4,6,5,2,2,1,1,2,4,4,6,2,4,6,5,3,4,4,2,5,5,3,4],
        [5,4,1,1,6,6,1,3,3,5,1,3,5,4,2,3,3,1,4,4,2,3,2],
        [3,6,6,5,5,6,2,2,4,6,2,4,3,1,2,2,6,3,3,1,2,1,3],
        [5,5,4,4,5,1,1,3,5,1,3,2,6,1,1,5,2,2,6,1,6,2,1],
        [4,3,3,4,6,6,2,4,6,2,1,5,6,6,4,1,1,5,6,5,1,6,3],
        [2,2,3,5,5,1,3,5,1,6,4,5,5,3,6,6,4,5,4,6,5,2,2],
      ];

      const matrix: number[][][] = [];
      for (let r = 0; r < 23; r++) {
        const tables: number[][] = [[], [], [], [], [], []];
        for (let p = 0; p < 24; p++) {
          const tNum = tableAssignments[p][r] - 1;
          tables[tNum].push(p);
        }
        matrix.push(tables);
      }
      rawMatrix = matrix;
    } else if (n === 28) {
      const tableAssignments = [
        [1,2,3,4,5,6,7,1,2,3,4,5,6,7,1,2,3,4,5,6,7,1,2,3,4,5,6],
        [1,2,4,4,6,1,2,4,6,6,2,4,7,5,5,1,6,6,3,3,4,7,7,6,6,4,7],
        [1,3,3,5,7,1,3,5,5,1,3,6,4,4,7,5,5,2,2,3,6,6,5,5,3,6,6],
        [2,2,4,6,7,2,4,4,7,2,5,3,3,6,4,4,1,1,2,5,5,4,4,2,5,5,6],
        [1,3,5,6,1,3,3,6,1,4,2,2,5,3,3,7,7,1,4,4,3,3,1,4,4,5,7],
        [2,4,5,7,2,2,5,7,3,1,1,4,2,2,6,6,7,3,3,2,2,7,3,3,4,6,6],
        [3,4,6,1,1,4,6,2,7,7,3,1,1,5,5,6,2,2,1,1,6,2,2,3,5,5,7],
        [3,5,7,7,3,5,1,6,6,2,7,7,4,4,5,1,1,7,7,5,1,1,2,4,4,6,1],
        [4,6,6,2,4,7,5,5,1,6,6,3,3,4,7,7,6,6,4,7,7,1,3,3,5,7,1],
        [5,5,1,3,6,4,4,7,5,5,2,2,3,6,6,5,5,3,6,6,7,2,2,4,6,7,2],
        [4,7,2,5,3,3,6,4,4,1,1,2,5,5,4,4,2,5,5,6,1,1,3,5,6,1,3],
        [6,1,4,2,2,5,3,3,7,7,1,4,4,3,3,1,4,4,5,7,7,2,4,5,7,2,2],
        [7,3,1,1,4,2,2,6,6,7,3,3,2,2,7,3,3,4,6,6,1,3,4,6,1,1,4],
        [2,7,7,3,1,1,5,5,6,2,2,1,1,6,2,2,3,5,5,7,2,3,5,7,7,3,5],
        [6,6,2,7,7,4,4,5,1,1,7,7,5,1,1,2,4,4,6,1,2,4,6,6,2,4,7],
        [5,1,6,6,3,3,4,7,7,6,6,4,7,7,1,3,3,5,7,1,3,5,5,1,3,6,4],
        [7,5,5,2,2,3,6,6,5,5,3,6,6,7,2,2,4,6,7,2,4,4,7,2,5,3,3],
        [4,4,1,1,2,5,5,4,4,2,5,5,6,1,1,3,5,6,1,3,3,6,1,4,2,2,5],
        [3,7,7,1,4,4,3,3,1,4,4,5,7,7,2,4,5,7,2,2,5,7,3,1,1,4,2],
        [6,6,7,3,3,2,2,7,3,3,4,6,6,1,3,4,6,1,1,4,6,2,7,7,3,1,1],
        [5,6,2,2,1,1,6,2,2,3,5,5,7,2,3,5,7,7,3,5,1,6,6,2,7,7,4],
        [5,1,1,7,7,5,1,1,2,4,4,6,1,2,4,6,6,2,4,7,5,5,1,6,6,3,3],
        [7,7,6,6,4,7,7,1,3,3,5,7,1,3,5,5,1,3,6,4,4,7,5,5,2,2,3],
        [6,5,5,3,6,6,7,2,2,4,6,7,2,4,4,7,2,5,3,3,6,4,4,1,1,2,5],
        [4,4,2,5,5,6,1,1,3,5,6,1,3,3,6,1,4,2,2,5,3,3,7,7,1,4,4],
        [3,1,4,4,5,7,7,2,4,5,7,2,2,5,7,3,1,1,4,2,2,6,6,7,3,3,2],
        [7,3,3,4,6,6,1,3,4,6,1,1,4,6,2,7,7,3,1,1,5,5,6,2,2,1,1],
        [2,2,3,5,5,7,2,3,5,7,7,3,5,1,6,6,2,7,7,4,4,5,1,1,7,7,5],
      ];

      const matrix: number[][][] = [];
      for (let r = 0; r < 27; r++) {
        const tables: number[][] = [[], [], [], [], [], [], []];
        for (let p = 0; p < 28; p++) {
          const tNum = tableAssignments[p][r] - 1;
          tables[tNum].push(p);
        }
        matrix.push(tables);
      }
      rawMatrix = matrix;
    } else {
      const numTables = n / 4;
      const numRounds = n - 1;
      const indices = Array.from({ length: n }, (_, i) => i);
      const matrix: number[][][] = [];

      for (let r = 0; r < numRounds; r++) {
        const roundTables: number[][] = [];
        for (let t = 0; t < numTables; t++) {
          roundTables.push([
            indices[t * 4],
            indices[t * 4 + 1],
            indices[t * 4 + 2],
            indices[t * 4 + 3],
          ]);
        }
        matrix.push(roundTables);

        const fixed = indices[0];
        const rest = indices.slice(1);
        rest.unshift(rest.pop()!);
        indices.splice(0, indices.length, fixed, ...rest);
      }
      rawMatrix = matrix;
    }

    const generatedRounds: RoundRobinTable[][] = [];

    rawMatrix.forEach((roundTablesData, rIdx) => {
      const rTables: RoundRobinTable[] = roundTablesData.map((tableIndices, tIdx) => ({
        round: rIdx + 1,
        tableNumber: tIdx + 1,
        players: tableIndices.map(pIdx => ({
          userId: players[pIdx].id,
          name: players[pIdx].name,
        })),
      }));
      generatedRounds.push(rTables);
    });

    setRounds(generatedRounds);
    setIsGenerated(true);
    setMatchScores({});
    setCurrentRound(1);
    setActiveInputKey(null);
  };

  // 短期モード（ラウンド数自由＆対戦被り最小化）のスケジュール生成
// 短期モード・3人卓などの偏りを均等化する自動ペアリングアルゴリズム
  const handleGenerateShortSchedule = () => {
    const n = players.length;
    
    if (n < 3) {
      alert('参加人数は最低3人必要です。');
      return;
    }

    const totalRounds = targetRoundsCount;
    const generatedRounds: RoundRobinTable[][] = [];

    // 過去の対戦ペアのカウント用 (id1 -> id2 -> count)
    const encounterCount: Record<string, Record<string, number>> = {};
    players.forEach(p => {
      encounterCount[p.id] = {};
      players.forEach(p2 => {
        if (p.id !== p2.id) encounterCount[p.id][p2.id] = 0;
      });
    });

    // プレイヤーごとの管理
    const matchCounts: Record<string, number> = {}; // 出場回数
    const threePlayerTableCounts: Record<string, number> = {}; // 3人卓に入った回数
    players.forEach(p => { 
      matchCounts[p.id] = 0; 
      threePlayerTableCounts[p.id] = 0;
    });

    // 端数（例: 5人なら 4人卓×0, 3人卓×1 / 実質5人なら 4人卓+3人卓など、余り人数に応じた卓構成を計算）
    // 4人卓と3人卓の組み合わせで全員をさばく
    for (let r = 0; r < totalRounds; r++) {
      const roundNum = r + 1;
      
      // 今回のラウンドで「3人卓」に入るべき優先度が高い人（これまでに3人卓回数が少ない人）をベースに選出
      let sortedPlayers = [...players].sort((a, b) => {
        // 1. まず出場回数が少ない人
        if (matchCounts[a.id] !== matchCounts[b.id]) {
          return matchCounts[a.id] - matchCounts[b.id];
        }
        // 2. 次に3人卓の回数が少ない人（3人卓の負担を均等化）
        if (threePlayerTableCounts[a.id] !== threePlayerTableCounts[b.id]) {
          return threePlayerTableCounts[a.id] - threePlayerTableCounts[b.id];
        }
        return Math.random() - 0.5;
      });

      // 4人卓と3人卓の割り振りを決定する
      // 残り人数を 4 または 3 の倍数で綺麗に分割する
      // 例: 5人 -> 3人卓×1, 2人...ではなく基本は 3人+2人は無理なので 5人なら (2+3にするか、あるいは 4人卓1つ+1人余り？ボードゲームなので最低3人卓が必要)
      // 一般に、n人を「4人卓」と「3人卓」だけで構成できるか？
      // 4x + 3y = n を満たす組み合わせを計算する
      
      let num4 = 0;
      let num3 = 0;
      let found = false;

      // できるだけ4人卓を多くし、余りを3人卓にする組み合わせを探す
      for (let x = Math.floor(n / 4); x >= 0; x--) {
        const rem = n - x * 4;
        if (rem % 3 === 0) {
          num4 = x;
          num3 = rem / 3;
          found = true;
          break;
        }
      }

      // もし綺麗に割り切れない端数（例: 2人など）が出る場合のフォールバック
      if (!found) {
        // ざっくり4人卓と3人卓に振り分ける
        num4 = Math.floor(n / 4);
        num3 = (n % 4 > 0) ? 1 : 0; 
      }

      // 卓のサイズの配列を作る (例: [4, 4, 3] など)
      const tableSizes: number[] = [];
      for (let i = 0; i < num4; i++) tableSizes.push(4);
      for (let i = 0; i < num3; i++) tableSizes.push(3);

      // もし人数調整で余ったり足りなかった場合の微調整（全員がどこかの卓に入るようにする）
      let assignedCount = tableSizes.reduce((a, b) => a + b, 0);
      if (assignedCount < n && tableSizes.length > 0) {
        // 足りない分を既存の卓（3人卓など）に割り振って4人にする
        for (let i = 0; i < (n - assignedCount); i++) {
          tableSizes[i % tableSizes.length] += 1;
        }
      } else if (assignedCount > n && tableSizes.length > 0) {
        // 多すぎたら削る
        for (let i = 0; i < (assignedCount - n); i++) {
          if (tableSizes[i] > 3) tableSizes[i] -= 1;
        }
      }

      // 3人卓に入るべき人を「3人卓の回数が少ない順」から優先的に割り当てる
      // 逆に4人卓には、これまでに3人卓を多く経験している人を優先的に回すと公平になる
      // ここでは「3人卓回数が少ない人」を優先して3人卓にアサインしていく（あるいは公平にローテーション）
      
      const tablesForRound: { tableNumber: number; playerIds: string[] }[] = [];
      let playerPool = [...sortedPlayers];
      let tableNum = 1;

      // 3人卓を先に割り当てると公平性をコントロールしやすい
      // サイズが小さい卓（3人卓）に誰を入れるか
      tableSizes.sort((a, b) => a - b); // 3人卓を先に処理

      tableSizes.forEach(size => {
        if (playerPool.length === 0) return;

        const tablePlayers: string[] = [];
        
        // 卓の最初の人（シード）を選ぶ
        // 3人卓の場合は、threePlayerTableCounts が最も少ない人を優先
        playerPool.sort((a, b) => {
          if (size === 3) {
            if (threePlayerTableCounts[a.id] !== threePlayerTableCounts[b.id]) {
              return threePlayerTableCounts[a.id] - threePlayerTableCounts[b.id];
            }
          }
          return matchCounts[a.id] - matchCounts[b.id];
        });

        const seed = playerPool.shift()!;
        tablePlayers.push(seed.id);

        // 残りのメンバーを「対戦被りが少なく、かつ希望の卓サイズバランスに合う人」から選ぶ
        while (tablePlayers.length < size && playerPool.length > 0) {
          let bestIdx = 0;
          let minScore = Infinity;

          playerPool.forEach((candidate, idx) => {
            // 対戦被りスコア
            let encSum = 0;
            tablePlayers.forEach(tpId => {
              encSum += encounterCount[candidate.id]?.[tpId] || 0;
            });
            
            // 評価値 = 対戦被り + 3人卓バイアス調整
            let score = encSum;
            if (size === 3) {
              score += threePlayerTableCounts[candidate.id] * 2; // 3人卓偏りペナルティ
            }

            if (score < minScore) {
              minScore = score;
              bestIdx = idx;
            }
          });

          const chosen = playerPool.splice(bestIdx, 1)[0];
          tablePlayers.push(chosen.id);
        }

        // 統計情報の更新
        if (tablePlayers.length === 3) {
          tablePlayers.forEach(pId => {
            threePlayerTableCounts[pId] = (threePlayerTableCounts[pId] || 0) + 1;
          });
        }

        for (let i = 0; i < tablePlayers.length; i++) {
          for (let j = i + 1; j < tablePlayers.length; j++) {
            const idA = tablePlayers[i];
            const idB = tablePlayers[j];
            encounterCount[idA][idB] = (encounterCount[idA][idB] || 0) + 1;
            encounterCount[idB][idA] = (encounterCount[idB][idA] || 0) + 1;
          }
        }

        tablePlayers.forEach(pId => {
          matchCounts[pId] = (matchCounts[pId] || 0) + 1;
        });

        tablesForRound.push({
          tableNumber: tableNum++,
          playerIds: tablePlayers,
        });
      });

      const roundTablesData: RoundRobinTable[] = tablesForRound.map(t => ({
        round: roundNum,
        tableNumber: t.tableNumber,
        players: t.playerIds.map(pId => {
          const pObj = players.find(x => x.id === pId)!;
          return { userId: pObj.id, name: pObj.name };
        }),
      }));

      generatedRounds.push(roundTablesData);
    }

    setRounds(generatedRounds);
    setIsGenerated(true);
    setMatchScores({});
    setCurrentRound(1);
    setActiveInputKey(null);
  };

  const handleGenerateSchedule = () => {
    if (mode === 'long') {
      handleGenerateLongSchedule();
    } else {
      handleGenerateShortSchedule();
    }
  };

  const handleUpdateSettings = (key: string, mapName: string, targetMagic: number) => {
    setTableSettings(prev => ({
      ...prev,
      [key]: { mapName, targetMagic },
    }));
  };

  const handleSaveScores = (key: string, scores: Record<string, MatchResultData>) => {
    const adjustedScores: Record<string, MatchResultData> = {};
    Object.entries(scores).forEach(([userId, data]) => {
      let assignedScore = 0;
      if (data.rank === 1) assignedScore = 3;
      else if (data.rank === 2) assignedScore = 2;
      else if (data.rank === 3) assignedScore = 1;
      else if (data.rank === 4) assignedScore = 0;

      adjustedScores[userId] = {
        ...data,
        score: assignedScore,
      };
    });

    setMatchScores(prev => ({
      ...prev,
      [key]: mode === 'long' ? adjustedScores : scores,
    }));
    setActiveInputKey(null);
  };

  const handleResetSettings = () => {
    if (window.confirm('現在のリーグ戦データと入力されたスコアがリセットされます。よろしいですか？')) {
      setIsGenerated(false);
      setRounds([]);
      setMatchScores({});
      setTableSettings({});
      localStorage.removeItem(storageKey);
    }
  };

  const totalMatches = rounds.reduce((acc, r) => acc + r.length, 0);
  const completedMatches = Object.keys(matchScores).length;
  const progressPercent = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  const calculateStandings = (): StandingsPlayer[] => {
    const statsMap: Record<string, StandingsPlayer> = {};

    players.forEach(p => {
      statsMap[p.id] = {
        id: p.id,
        name: p.name,
        matchesPlayed: 0,
        totalScore: 0,
        totalMagic: 0,
        firsts: 0,
        seconds: 0,
        thirds: 0,
        fourths: 0,
      };
    });

    Object.values(matchScores).forEach(tableResult => {
      Object.entries(tableResult).forEach(([userId, data]) => {
        if (statsMap[userId]) {
          statsMap[userId].matchesPlayed += 1;
          statsMap[userId].totalScore += data.score;
          statsMap[userId].totalMagic += data.magic;

          if (data.rank === 1) statsMap[userId].firsts += 1;
          else if (data.rank === 2) statsMap[userId].seconds += 1;
          else if (data.rank === 3) statsMap[userId].thirds += 1;
          else if (data.rank === 4) statsMap[userId].fourths += 1;
        }
      });
    });

    return Object.values(statsMap).sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return b.totalMagic - a.totalMagic;
    });
  };

  const standings = calculateStandings();

  if (!isInitialized) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <CardTitle>対戦マネージャー</CardTitle>
              {!isGenerated && (
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setMode('long')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      mode === 'long' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    長期モード（総当たり）
                  </button>
                  <button
                    onClick={() => setMode('short')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      mode === 'short' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    短期モード（ラウンド数自由）
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              現在の参加人数：<span className="text-indigo-400 font-bold">{players.length}人</span>
              {mode === 'long' ? (
                isMultipleOfFour ? (
                  <span className="ml-2 text-emerald-400 font-bold">（✓ 4の倍数：全員フル参加の総当たり戦）</span>
                ) : (
                  <span className="ml-2 text-rose-400 font-bold">（⚠️ 4の倍数ではありません。人数を4の倍数にするか短期モードをご利用ください）</span>
                )
              ) : (
                <span className="ml-2 text-emerald-400 font-bold">（任意のラウンド数で自動対戦編成）</span>
              )}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {isGenerated && (
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 mr-2">
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    activeTab === 'schedule' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  対戦スケジュール
                </button>
                <button
                  onClick={() => setActiveTab('standings')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    activeTab === 'standings' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  順位表・ランキング
                </button>
              </div>
            )}
            {!isGenerated ? (
              <div className="flex items-center gap-2">
                {mode === 'short' && (
                  <div className="flex items-center gap-1 text-xs text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    <span>ラウンド数:</span>
                    <select 
                      value={targetRoundsCount}
                      onChange={(e) => setTargetRoundsCount(Number(e.target.value))}
                      className="bg-slate-900 text-amber-300 font-bold px-2 py-0.5 rounded border border-slate-700 focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <option key={num} value={num}>{num} ラウンド</option>
                      ))}
                    </select>
                  </div>
                )}
                <Button 
                  onClick={handleGenerateSchedule} 
                  className={`text-xs ${mode === 'long' && !isMultipleOfFour ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                >
                  リーグ戦を開始する
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={handleResetSettings} className="border-slate-700 text-slate-300 text-xs">
                設定をリセット
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isGenerated ? (
            <div className="text-center py-10 space-y-3">
              <div className="text-sm text-slate-300">
                現在のモード：<span className="text-indigo-400 font-bold">{mode === 'long' ? '長期モード（総当たり戦）' : '短期モード（ラウンド数自由設定）'}</span>
              </div>
              {mode === 'long' && !isMultipleOfFour ? (
                <div className="max-w-md mx-auto bg-rose-950/40 border border-rose-900/60 p-4 rounded-xl text-xs text-rose-300 space-y-1">
                  <p className="font-bold">【参加人数エラー】</p>
                  <p>長期モードは参加人数が<strong>「4の倍数（4, 8, 12, 16, 20, 24, 28人…）」</strong>のときのみ開催できます。人数を調整するか、「短期モード」に切り替えてください。</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  「リーグ戦を開始する」ボタンを押すとスケジュールが生成されます。
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span>参加プレイヤー: <strong className="text-indigo-300">{players.length}人 ({mode === 'long' ? 'お休みゼロ・総当たり' : '短期マッチ戦'})</strong></span>
                  <span className="font-bold text-indigo-400">
                    消化進捗: {completedMatches} / {totalMatches} 試合完了 ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {activeTab === 'schedule' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4 max-h-40 overflow-y-auto">
                    {rounds.map((_, rIdx) => {
                      const rNum = rIdx + 1;
                      const isSelected = currentRound === rNum;
                      return (
                        <Button
                          key={rNum}
                          size="sm"
                          onClick={() => {
                            setCurrentRound(rNum);
                            setActiveInputKey(null);
                          }}
                          className={`text-xs ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          ラウンド {rNum}
                        </Button>
                      );
                    })}
                  </div>

                  {rounds[currentRound - 1] && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-slate-950/60 border border-slate-800/80 p-3 rounded-lg">
                        <h3 className="text-sm font-bold text-indigo-300">ラウンド {currentRound} の対戦卓一覧</h3>
                        <div className="text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-900/50 px-2.5 py-1 rounded">
                          {mode === 'long' ? '全員参加（お休みなし）' : `全 ${rounds[currentRound - 1].length} 卓`}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {rounds[currentRound - 1].map((table) => {
                          const tableKey = `${currentRound}-${table.tableNumber}`;
                          const isFinished = !!matchScores[tableKey];
                          const isEditing = activeInputKey === tableKey;
                          const currentSettings = tableSettings[tableKey] || { mapName: '', targetMagic: 8000 };

                          return (
                            <div key={table.tableNumber} className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4 shadow-lg">
                              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <span className="text-sm font-bold text-slate-200">
                                  第 {table.tableNumber} 卓 ({table.players.length}人対戦)
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => setActiveInputKey(isEditing ? null : tableKey)}
                                  className={`text-xs ${isFinished ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                                >
                                  {isFinished ? 'スコア修正' : 'スコア入力'}
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                {table.players.map((p) => {
                                  const pScore = matchScores[tableKey]?.[p.userId];
                                  return (
                                    <div key={p.userId} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
                                      <span className="font-medium text-sm text-indigo-200">{p.name}</span>
                                      {pScore ? (
                                        <span className="text-amber-400 font-mono text-xs mt-2">
                                          {pScore.rank}位 / {pScore.magic}G ({pScore.score}pt)
                                        </span>
                                      ) : (
                                        <span className="text-slate-500 text-xs mt-2">未入力</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {isEditing && (
                                <div className="mt-4 pt-4 border-t border-slate-800 bg-slate-900 p-4 rounded-xl">
                                  <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-bold text-indigo-400">第 {table.tableNumber} 卓 スコア入力</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setActiveInputKey(null)}
                                      className="text-xs text-slate-400 hover:text-white"
                                    >
                                      閉じる ✕
                                    </Button>
                                  </div>
                                  <MatchScoreInput
                                    tableNumber={table.tableNumber}
                                    mapName={currentSettings.mapName}
                                    targetMagic={currentSettings.targetMagic}
                                    players={table.players}
                                    initialScores={matchScores[tableKey]}
                                    onUpdateSettings={(map, magic) => handleUpdateSettings(tableKey, map, magic)}
                                    onSave={(scores) => handleSaveScores(tableKey, scores)}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'standings' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <h3 className="text-sm font-bold text-indigo-300 mb-3">リアルタイム順位表</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="pb-2 font-medium">順位</th>
                            <th className="pb-2 font-medium">プレイヤー名</th>
                            <th className="pb-2 font-medium text-center">試合数</th>
                            <th className="pb-2 font-medium text-center">1位 / 2位 / 3位 / 4位</th>
                            <th className="pb-2 font-medium text-right">総魔力 (G)</th>
                            <th className="pb-2 font-medium text-right">総合ポイント</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {standings.map((p, idx) => (
                            <tr key={p.id} className="hover:bg-slate-900/50">
                              <td className="py-3 font-bold text-slate-300">
                                {idx === 0 ? '🥇 1位' : idx === 1 ? '🥈 2位' : idx === 2 ? '🥉 3位' : `${idx + 1}位`}
                              </td>
                              <td className="py-3 font-semibold text-slate-100">{p.name}</td>
                              <td className="py-3 text-center text-slate-300">{p.matchesPlayed}</td>
                              <td className="py-3 text-center text-slate-300">
                                <span className="text-amber-400">{p.firsts}</span> /{' '}
                                <span className="text-slate-300">{p.seconds}</span> /{' '}
                                <span className="text-amber-700">{p.thirds}</span> /{' '}
                                <span className="text-slate-500">{p.fourths}</span>
                              </td>
                              <td className="py-3 text-right font-mono text-slate-300">{p.totalMagic.toLocaleString()} G</td>
                              <td className="py-3 text-right font-bold font-mono text-indigo-400 text-sm">{p.totalScore} pt</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}