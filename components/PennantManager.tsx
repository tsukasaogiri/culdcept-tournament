'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Player } from './PlayerManager';
import MatchScoreInput from './MatchScoreInput';

interface PennantManagerProps {
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

const STORAGE_KEY_PREFIX = 'culdcept_pennant_manager_';

export default function PennantManager({ players }: PennantManagerProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}_${players.map(p => p.id).sort().join('_')}`;

  const [rounds, setRounds] = useState<RoundRobinTable[][]>([]);
  const [matchScores, setMatchScores] = useState<Record<string, Record<string, MatchResultData>>>({});
  const [tableSettings, setTableSettings] = useState<Record<string, { mapName: string; targetMagic: number }>>({});
  
  const [loopCount, setLoopCount] = useState<number>(1); // ループ回数（周回数）
  const [enablePlayoffs, setEnablePlayoffs] = useState<boolean>(true); // プレーオフを行うかどうか
  const [playoffScores, setPlayoffScores] = useState<Record<string, MatchResultData>>({});
  const [playoffSettings, setPlayoffSettings] = useState<{ mapName: string; targetMagic: number }>({ mapName: '', targetMagic: 8000 });
  const [isPlayoffEditing, setIsPlayoffEditing] = useState<boolean>(false);

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
          if (parsed.loopCount) setLoopCount(parsed.loopCount);
          if (parsed.enablePlayoffs !== undefined) setEnablePlayoffs(parsed.enablePlayoffs);
          if (parsed.playoffScores) setPlayoffScores(parsed.playoffScores);
          if (parsed.playoffSettings) setPlayoffSettings(parsed.playoffSettings);
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
        loopCount,
        enablePlayoffs,
        playoffScores,
        playoffSettings,
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [rounds, matchScores, tableSettings, currentRound, isGenerated, activeTab, loopCount, enablePlayoffs, playoffScores, playoffSettings, isInitialized, storageKey]);

  const isMultipleOfFour = players.length >= 4 && players.length % 4 === 0 && players.length <= 28;

  // ループ回数を反映した総当たりスケジュール生成
  const handleGenerateSchedule = () => {
    const n = players.length;
    
    if (!isMultipleOfFour) {
      alert(`現在の参加人数は ${n} 人です。\n総当たり戦を行うには、参加人数が「4〜28人の4の倍数」である必要があります。`);
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
    }

    const generatedRounds: RoundRobinTable[][] = [];
    const baseRoundsCount = rawMatrix.length;

    // 指定されたループ回数（周回数）だけスケジュールを繰り返して生成
    for (let l = 0; l < loopCount; l++) {
      rawMatrix.forEach((roundTablesData, rIdx) => {
        const absoluteRoundNum = l * baseRoundsCount + (rIdx + 1);
        const rTables: RoundRobinTable[] = roundTablesData.map((tableIndices, tIdx) => ({
          round: absoluteRoundNum,
          tableNumber: tIdx + 1,
          players: tableIndices.map(pIdx => ({
            userId: players[pIdx].id,
            name: players[pIdx].name,
          })),
        }));
        generatedRounds.push(rTables);
      });
    }

    setRounds(generatedRounds);
    setIsGenerated(true);
    setMatchScores({});
    setPlayoffScores({});
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

  const handleSavePlayoffScores = (scores: Record<string, MatchResultData>) => {
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

    setPlayoffScores(adjustedScores);
    setIsPlayoffEditing(false);
  };

  const handleResetSettings = () => {
    if (window.confirm('現在の総当たり戦データと入力されたスコアがリセットされます。よろしいですか？')) {
      setIsGenerated(false);
      setRounds([]);
      setMatchScores({});
      setTableSettings({});
      setPlayoffScores({});
      localStorage.removeItem(storageKey);
    }
  };

  const totalMatches = rounds.reduce((acc, r) => acc + r.length, 0);
  const completedMatches = Object.keys(matchScores).length;
  const progressPercent = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
  const isAllMatchesFinished = totalMatches > 0 && completedMatches === totalMatches;

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
  const top4Players = standings.slice(0, 4);

  if (!isInitialized) return null;

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-emerald-300">⚾ 総当たり戦・ペナントレース管理</CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              現在の参加人数：<span className="text-emerald-400 font-bold">{players.length}人</span>
              {isMultipleOfFour ? (
                <span className="ml-2 text-emerald-400 font-bold">（✓ 対応人数：総当たり戦が可能）</span>
              ) : (
                <span className="ml-2 text-rose-400 font-bold">（⚠️ 4〜28人の4の倍数である必要があります）</span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {isGenerated && (
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 mr-2">
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    activeTab === 'schedule' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  対戦スケジュール
                </button>
                <button
                  onClick={() => setActiveTab('standings')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    activeTab === 'standings' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  順位表・ランキング
                </button>
              </div>
            )}
            {!isGenerated ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span>ループ:</span>
                  <select 
                    value={loopCount}
                    onChange={(e) => setLoopCount(Number(e.target.value))}
                    className="bg-slate-900 text-emerald-300 font-bold px-2 py-0.5 rounded border border-slate-700 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map(num => (
                      <option key={num} value={num}>{num} 周</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={enablePlayoffs}
                    onChange={(e) => setEnablePlayoffs(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                  />
                  <span>プレーオフあり</span>
                </label>

                <Button 
                  onClick={handleGenerateSchedule} 
                  className={`text-xs ${!isMultipleOfFour ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold'}`}
                >
                  総当たり戦を開始する →
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={handleResetSettings} className="border-red-900 bg-red-950/40 text-red-200 hover:bg-red-900 text-xs">
                設定をリセット
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isGenerated ? (
            <div className="text-center py-10 space-y-3">
              {!isMultipleOfFour ? (
                <div className="max-w-md mx-auto bg-rose-950/40 border border-rose-900/60 p-4 rounded-xl text-xs text-rose-300 space-y-1">
                  <p className="font-bold">【参加人数エラー】</p>
                  <p>総当たり戦を行うには、参加人数が<strong>「4〜28人の4の倍数（4, 8, 12, 16, 20, 24, 28人）」</strong>である必要があります。プレイヤー人数を変更してください。</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  ループ回数やプレーオフ設定を行い、「総当たり戦を開始する」ボタンを押すとスケジュールが生成されます。
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span>参加プレイヤー: <strong className="text-emerald-300">{players.length}人（総当たり戦 / {loopCount}周回 {enablePlayoffs ? '/ プレーオフあり' : ''}）</strong></span>
                  <span className="font-bold text-emerald-400">
                    消化進捗: {completedMatches} / {totalMatches} 試合完了 ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
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
                              ? 'bg-emerald-600 text-white font-bold'
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
                        <h3 className="text-sm font-bold text-emerald-300">ラウンド {currentRound} の対戦卓一覧</h3>
                        <div className="text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-900/50 px-2.5 py-1 rounded">
                          全員参加（お休みなし）
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
                                  第 {table.tableNumber} 卓 (4人対戦)
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => setActiveInputKey(isEditing ? null : tableKey)}
                                  className={`text-xs ${isFinished ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
                                >
                                  {isFinished ? 'スコア修正' : 'スコア入力'}
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                {table.players.map((p) => {
                                  const pScore = matchScores[tableKey]?.[p.userId];
                                  return (
                                    <div key={p.userId} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
                                      <span className="font-medium text-sm text-emerald-200">{p.name}</span>
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
                                    <span className="text-xs font-bold text-emerald-400">第 {table.tableNumber} 卓 スコア入力</span>
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
                <div className="space-y-6">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <h3 className="text-sm font-bold text-emerald-300 mb-3">🏆 レギュラーシーズン 通算順位表</h3>
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
                              <td className="py-3 text-right font-bold font-mono text-emerald-400 text-sm">{p.totalScore} pt</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {enablePlayoffs && (
                    <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4 shadow-lg">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="text-sm font-bold text-amber-300">🔥 プレーオフ（ファイナル4人戦）</h3>
                          <p className="text-xs text-slate-400 mt-0.5">レギュラーシーズン上位4名による最終決戦</p>
                        </div>
                        {isAllMatchesFinished ? (
                          <Button
                            size="sm"
                            onClick={() => setIsPlayoffEditing(!isPlayoffEditing)}
                            className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold"
                          >
                            {Object.keys(playoffScores).length > 0 ? 'スコア修正' : 'スコア入力'}
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-500">全レギュラー戦終了後に開放されます</span>
                        )}
                      </div>

                      {!isAllMatchesFinished ? (
                        <div className="text-center py-6 text-xs text-slate-500">
                          すべてのレギュラーシーズン試合（全 {totalMatches} 試合）が完了すると、上位4名が決定しプレーオフを行えます。
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            {top4Players.map((p, idx) => {
                              const pScore = playoffScores[p.id];
                              return (
                                <div key={p.id} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-amber-400">予選 {idx + 1}位</span>
                                    <span className="font-medium text-sm text-slate-100">{p.name}</span>
                                  </div>
                                  {pScore ? (
                                    <span className="text-amber-300 font-mono text-xs mt-2">
                                      プレーオフ {pScore.rank}位 / {pScore.magic}G
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 text-xs mt-2">未入力</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {isPlayoffEditing && (
                            <div className="mt-4 pt-4 border-t border-slate-800 bg-slate-900 p-4 rounded-xl">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-amber-400">プレーオフ 決勝戦スコア入力</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setIsPlayoffEditing(false)}
                                  className="text-xs text-slate-400 hover:text-white"
                                >
                                  閉じる ✕
                                </Button>
                              </div>
                              <MatchScoreInput
                                tableNumber={1}
                                mapName={playoffSettings.mapName}
                                targetMagic={playoffSettings.targetMagic}
                                players={top4Players.map(p => ({ userId: p.id, name: p.name }))}
                                initialScores={playoffScores}
                                onUpdateSettings={(map, magic) => setPlayoffSettings({ mapName: map, targetMagic: magic })}
                                onSave={handleSavePlayoffScores}
                              />
                            </div>
                          )}

                          {Object.keys(playoffScores).length > 0 && (
                            <div className="mt-4 bg-slate-900 border border-amber-900/50 p-4 rounded-xl text-center space-y-2">
                              <h4 className="text-xs font-bold text-amber-400">👑 プレーオフ最終結果（チャンピオン決定）</h4>
                              <div className="flex justify-center gap-6 text-xs pt-1">
                                {top4Players
                                  .slice()
                                  .sort((a, b) => (playoffScores[a.id]?.rank || 5) - (playoffScores[b.id]?.rank || 5))
                                  .map((p, idx) => {
                                    const rank = playoffScores[p.id]?.rank;
                                    return (
                                      <div key={p.id} className="flex flex-col items-center">
                                        <span className="text-slate-400">{idx === 0 ? '🏆 優勝' : `${idx + 1}位`}</span>
                                        <span className="font-bold text-slate-100 mt-1">{p.name}</span>
                                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">{playoffScores[p.id]?.magic}G</span>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}