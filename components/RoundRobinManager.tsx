// components/RoundRobinManager.tsx
'use client';

import { useState } from 'react';
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

export default function RoundRobinManager({ players }: RoundRobinManagerProps) {
  const [rounds, setRounds] = useState<RoundRobinTable[][]>([]);
  const [matchScores, setMatchScores] = useState<Record<string, Record<string, MatchResultData>>>({});
  const [tableSettings, setTableSettings] = useState<Record<string, { mapName: string; targetMagic: number }>>({});
  
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [activeInputKey, setActiveInputKey] = useState<string | null>(null);
  const [isGenerated, setIsGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'standings'>('schedule');

  // 4の倍数チェック
  const isMultipleOfFour = players.length >= 4 && players.length % 4 === 0;

  // 対戦スケジュール生成ロジック
  const handleGenerateSchedule = () => {
    const n = players.length;
    
    if (!isMultipleOfFour) {
      alert(`現在の参加人数は ${n} 人です。\n総当たり戦（4人卓）を行うには、参加人数が「4の倍数（4, 8, 12, 16, 20, 24, 28人…）」である必要があります。`);
      return;
    }

    let rawMatrix: number[][][] = [];

    // --- 4人の場合 (全3ラウンド) ---
    if (n === 4) {
      rawMatrix = [
        [[0, 1, 2, 3]],
        [[0, 2, 1, 3]],
        [[0, 3, 1, 2]],
      ];
    } 
    // --- 8人の場合 (全7ラウンド・2卓) ---
    else if (n === 8) {
      rawMatrix = [
        [[0, 1, 2, 3], [4, 5, 6, 7]],
        [[0, 2, 5, 7], [1, 3, 4, 6]],
        [[0, 3, 4, 6], [1, 2, 5, 7]],
        [[0, 4, 5, 6], [1, 2, 3, 7]],
        [[0, 5, 3, 7], [1, 4, 2, 6]],
        [[0, 6, 1, 5], [2, 4, 3, 7]],
        [[0, 7, 1, 4], [2, 5, 3, 6]],
      ];
    } 
    // --- 12人の場合 (全11ラウンド・3卓) ---
    else if (n === 12) {
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
    }
    // --- 16人の場合 (全15ラウンド・4卓) ---
    else if (n === 16) {
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
    }
    // --- 20人の場合 (全19ラウンド・5卓) ---
    else if (n === 20) {
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
    }
    // --- 24人の場合 (全23ラウンド・6卓) ---
    else if (n === 24) {
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
    }
    // --- 28人の場合 (全27ラウンド・7卓) サイトの指定表を完全に反映 ---
    else if (n === 28) {
      const tableAssignments = [
        [1,2,3,4,5,6,7,1,2,3,4,5,6,7,1,2,3,4,5,6,7,1,2,3,4,5,6], // 選手1
        [1,2,4,4,6,1,2,4,6,6,2,4,7,5,5,1,6,6,3,3,4,7,7,6,6,4,7], // 選手2
        [1,3,3,5,7,1,3,5,5,1,3,6,4,4,7,5,5,2,2,3,6,6,5,5,3,6,6], // 選手3
        [2,2,4,6,7,2,4,4,7,2,5,3,3,6,4,4,1,1,2,5,5,4,4,2,5,5,6], // 選手4
        [1,3,5,6,1,3,3,6,1,4,2,2,5,3,3,7,7,1,4,4,3,3,1,4,4,5,7], // 選手5
        [2,4,5,7,2,2,5,7,3,1,1,4,2,2,6,6,7,3,3,2,2,7,3,3,4,6,6], // 選手6
        [3,4,6,1,1,4,6,2,7,7,3,1,1,5,5,6,2,2,1,1,6,2,2,3,5,5,7], // 選手7
        [3,5,7,7,3,5,1,6,6,2,7,7,4,4,5,1,1,7,7,5,1,1,2,4,4,6,1], // 選手8
        [4,6,6,2,4,7,5,5,1,6,6,3,3,4,7,7,6,6,4,7,7,1,3,3,5,7,1], // 選手9
        [5,5,1,3,6,4,4,7,5,5,2,2,3,6,6,5,5,3,6,6,7,2,2,4,6,7,2], // 選手10
        [4,7,2,5,3,3,6,4,4,1,1,2,5,5,4,4,2,5,5,6,1,1,3,5,6,1,3], // 選手11
        [6,1,4,2,2,5,3,3,7,7,1,4,4,3,3,1,4,4,5,7,7,2,4,5,7,2,2], // 選手12
        [7,3,1,1,4,2,2,6,6,7,3,3,2,2,7,3,3,4,6,6,1,3,4,6,1,1,4], // 選手13
        [2,7,7,3,1,1,5,5,6,2,2,1,1,6,2,2,3,5,5,7,2,3,5,7,7,3,5], // 選手14
        [6,6,2,7,7,4,4,5,1,1,7,7,5,1,1,2,4,4,6,1,2,4,6,6,2,4,7], // 選手15
        [5,1,6,6,3,3,4,7,7,6,6,4,7,7,1,3,3,5,7,1,3,5,5,1,3,6,4], // 選手16
        [7,5,5,2,2,3,6,6,5,5,3,6,6,7,2,2,4,6,7,2,4,4,7,2,5,3,3], // 選手17
        [4,4,1,1,2,5,5,4,4,2,5,5,6,1,1,3,5,6,1,3,3,6,1,4,2,2,5], // 選手18
        [3,7,7,1,4,4,3,3,1,4,4,5,7,7,2,4,5,7,2,2,5,7,3,1,1,4,2], // 選手19
        [6,6,7,3,3,2,2,7,3,3,4,6,6,1,3,4,6,1,1,4,6,2,7,7,3,1,1], // 選手20
        [5,6,2,2,1,1,6,2,2,3,5,5,7,2,3,5,7,7,3,5,1,6,6,2,7,7,4], // 選手21
        [5,1,1,7,7,5,1,1,2,4,4,6,1,2,4,6,6,2,4,7,5,5,1,6,6,3,3], // 選手22
        [7,7,6,6,4,7,7,1,3,3,5,7,1,3,5,5,1,3,6,4,4,7,5,5,2,2,3], // 選手23
        [6,5,5,3,6,6,7,2,2,4,6,7,2,4,4,7,2,5,3,3,6,4,4,1,1,2,5], // 選手24
        [4,4,2,5,5,6,1,1,3,5,6,1,3,3,6,1,4,2,2,5,3,3,7,7,1,4,4], // 選手25
        [3,1,4,4,5,7,7,2,4,5,7,2,2,5,7,3,1,1,4,2,2,6,6,7,3,3,2], // 選手26
        [7,3,3,4,6,6,1,3,4,6,1,1,4,6,2,7,7,3,1,1,5,5,6,2,2,1,1], // 選手27
        [2,2,3,5,5,7,2,3,5,7,7,3,5,1,6,6,2,7,7,4,4,5,1,1,7,7,5], // 選手28
      ];

      const matrix: number[][][] = [];
      for (let r = 0; r < 27; r++) {
        const tables: number[][] = [[], [], [], [], [], [], []]; // 7卓分 (index 0〜6)
        for (let p = 0; p < 28; p++) {
          const tNum = tableAssignments[p][r] - 1;
          tables[tNum].push(p);
        }
        matrix.push(tables);
      }
      rawMatrix = matrix;
    }
    // --- その他の4の倍数ケース（サークル法） ---
    else {
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

  const handleUpdateSettings = (key: string, mapName: string, targetMagic: number) => {
    setTableSettings(prev => ({
      ...prev,
      [key]: { mapName, targetMagic },
    }));
  };

const handleSaveScores = (key: string, scores: Record<string, MatchResultData>) => {
    // 順位に応じた勝ち点を強制的に適用（1位:3pt, 2位:2pt, 3位:1pt, 4位:0pt）
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
      [key]: adjustedScores,
    }));
    setActiveInputKey(null);
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

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>総当たり戦（4人卓・公式マトリクス対応）モード</CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              現在の参加人数：<span className="text-indigo-400 font-bold">{players.length}人</span>
              {isMultipleOfFour ? (
                <span className="ml-2 text-emerald-400 font-bold">（✓ 4の倍数：お休みゼロで全員が平等に参加できます）</span>
              ) : (
                <span className="ml-2 text-rose-400 font-bold">（⚠️ 4の倍数ではありません。人数を4の倍数に調整してください）</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
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
              <Button 
                onClick={handleGenerateSchedule} 
                className={`text-xs ${isMultipleOfFour ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                リーグ戦を開始する
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setIsGenerated(false)} className="border-slate-700 text-slate-300 text-xs">
                設定をリセット
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isGenerated ? (
            <div className="text-center py-10 space-y-3">
              <div className="text-sm text-slate-300">
                現在の参加人数：<span className="text-indigo-400 font-bold">{players.length}人</span>
              </div>
              {!isMultipleOfFour ? (
                <div className="max-w-md mx-auto bg-rose-950/40 border border-rose-900/60 p-4 rounded-xl text-xs text-rose-300 space-y-1">
                  <p className="font-bold">【参加人数エラー】</p>
                  <p>参加人数が<strong>「4の倍数（4, 8, 12, 16, 20, 24, 28人…）」</strong>のときのみリーグ戦を開催できます。</p>
                </div>
              ) : (
                <p className="text-xs text-emerald-400">
                  条件を満たしています。「リーグ戦を開始する」を押してください。
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span>参加プレイヤー: <strong className="text-indigo-300">{players.length}人（お休みゼロ・全員フル参加）</strong></span>
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
                          全員参加（お休みなし）
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {rounds[currentRound - 1].map((table) => {
                          const tableKey = `${currentRound}-${table.tableNumber}`;
                          const isFinished = !!matchScores[tableKey];
                          const isEditing = activeInputKey === tableKey;
                          const currentSettings = tableSettings[tableKey] || { mapName: '', targetMagic: 10000 };

                          return (
                            <div key={table.tableNumber} className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4 shadow-lg">
                              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <span className="text-sm font-bold text-slate-200">第 {table.tableNumber} 卓 (4人対戦)</span>
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
                    <h3 className="text-sm font-bold text-indigo-300 mb-3">総当たり戦 リアルタイム順位表</h3>
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