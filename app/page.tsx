'use client';

import { useState, useEffect, useRef } from 'react';
import PlayerManager, { Player } from '@/components/PlayerManager';
import MatchScoreInput from '@/components/MatchScoreInput';
import Standings from '@/components/Standings';
import RoundRobinManager from '@/components/RoundRobinManager';
import PennantManager from '@/components/PennantManager';
import { Button } from '@/components/ui/button';

interface TableData {
  tableNumber: number;
  mapName?: string;
  targetMagic?: number;
  players: { userId: string; name: string; score: string; totalMagic: string }[];
}

interface MatchResultItem {
  round: number;
  tableNumber: number;
  scores: any;
}

interface RoundHistory {
  round: number;
  tables: TableData[];
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'register' | 'play'>('register');
  
  const [tournamentMode, setTournamentMode] = useState<'swiss' | 'round_robin' | 'pennant'>('swiss');
  
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [enablePlayoff, setEnablePlayoff] = useState<boolean>(false);
  const [isPlayoff, setIsPlayoff] = useState<boolean>(false);

  const [players, setPlayers] = useState<Player[]>([
    { id: 'u1', name: 'プレイヤーA' },
    { id: 'u2', name: 'プレイヤーB' },
    { id: 'u3', name: 'プレイヤーC' },
    { id: 'u4', name: 'プレイヤーD' },
  ]);
  const [tables, setTables] = useState<TableData[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [matchResults, setMatchResults] = useState<MatchResultItem[]>([]);

  const [roundHistories, setRoundHistories] = useState<RoundHistory[]>([]);
  const [viewingRound, setViewingRound] = useState<number>(1);

  const [roundParticipants, setRoundParticipants] = useState<Record<number, string[]>>({});

  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [pendingNextRound, setPendingNextRound] = useState<number>(1);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);

  useEffect(() => {
    setIsMounted(true);
    const savedStep = localStorage.getItem('catan_step');
    const savedPlayers = localStorage.getItem('catan_players');
    const savedTables = localStorage.getItem('catan_tables');
    const savedRound = localStorage.getItem('catan_round');
    const savedResults = localStorage.getItem('catan_results');
    const savedHistories = localStorage.getItem('catan_histories');
    const savedViewingRound = localStorage.getItem('catan_viewing_round');
    const savedParticipants = localStorage.getItem('culdcept_round_participants');
    const savedMode = localStorage.getItem('culdcept_tournament_mode');
    const savedTotalRounds = localStorage.getItem('culdcept_total_rounds');
    const savedEnablePlayoff = localStorage.getItem('culdcept_enable_playoff');
    const savedIsPlayoff = localStorage.getItem('culdcept_is_playoff');

    if (savedStep) setStep(savedStep as 'register' | 'play');
    if (savedPlayers) setPlayers(JSON.parse(savedPlayers));
    if (savedTables) setTables(JSON.parse(savedTables));
    if (savedRound) {
      const r = Number(savedRound);
      setCurrentRound(r);
      if (!savedViewingRound) setViewingRound(r);
    }
    if (savedResults) setMatchResults(JSON.parse(savedResults));
    if (savedHistories) {
      setRoundHistories(JSON.parse(savedHistories));
    } else if (savedTables && savedRound) {
      setRoundHistories([{ round: Number(savedRound), tables: JSON.parse(savedTables) }]);
    }
    if (savedViewingRound) setViewingRound(Number(savedViewingRound));
    if (savedParticipants) setRoundParticipants(JSON.parse(savedParticipants));
    if (savedMode) setTournamentMode(savedMode as 'swiss' | 'round_robin' | 'pennant');
    if (savedTotalRounds) setTotalRounds(Number(savedTotalRounds));
    if (savedEnablePlayoff) setEnablePlayoff(JSON.parse(savedEnablePlayoff));
    if (savedIsPlayoff) setIsPlayoff(JSON.parse(savedIsPlayoff));
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('catan_step', step);
    localStorage.setItem('catan_players', JSON.stringify(players));
    localStorage.setItem('catan_tables', JSON.stringify(tables));
    localStorage.setItem('catan_round', String(currentRound));
    localStorage.setItem('catan_results', JSON.stringify(matchResults));
    localStorage.setItem('catan_histories', JSON.stringify(roundHistories));
    localStorage.setItem('catan_viewing_round', String(viewingRound));
    localStorage.setItem('culdcept_round_participants', JSON.stringify(roundParticipants));
    localStorage.setItem('culdcept_tournament_mode', tournamentMode);
    localStorage.setItem('culdcept_total_rounds', String(totalRounds));
    localStorage.setItem('culdcept_enable_playoff', JSON.stringify(enablePlayoff));
    localStorage.setItem('culdcept_is_playoff', JSON.stringify(isPlayoff));
  }, [isMounted, step, players, tables, currentRound, matchResults, roundHistories, viewingRound, roundParticipants, tournamentMode, totalRounds, enablePlayoff, isPlayoff]);

  const handleExportData = () => {
    const tournamentData = {
      step,
      players,
      tables,
      currentRound,
      matchResults,
      roundHistories,
      viewingRound,
      roundParticipants,
      tournamentMode,
      totalRounds,
      enablePlayoff,
      isPlayoff,
      version: 13,
      updatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(tournamentData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `culdcept-tournament-${dateStr}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        if (data.players && Array.isArray(data.players)) {
          setPlayers(data.players);
          if (data.step) setStep(data.step);
          if (data.tables) setTables(data.tables);
          if (data.currentRound) {
            setCurrentRound(data.currentRound);
            setViewingRound(data.currentRound);
          }
          if (data.matchResults) setMatchResults(data.matchResults);
          if (data.roundHistories) setRoundHistories(data.roundHistories);
          if (data.viewingRound) setViewingRound(data.viewingRound);
          if (data.roundParticipants) setRoundParticipants(data.roundParticipants);
          if (data.tournamentMode) setTournamentMode(data.tournamentMode);
          if (data.totalRounds) setTotalRounds(data.totalRounds);
          if (data.enablePlayoff !== undefined) setEnablePlayoff(data.enablePlayoff);
          if (data.isPlayoff !== undefined) setIsPlayoff(data.isPlayoff);

          alert('大会データを正常に復元しました！');
        } else {
          alert('ファイルの形式が正しくありません。');
        }
      } catch (err) {
        console.error(err);
        alert('ファイルの読み込みに失敗しました。');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  if (!isMounted) {
    return null;
  }

  const generateSwissTables = (roundNum: number, participantIds: string[]) => {
    const activePlayers = players.filter(p => participantIds.includes(p.id));
    const statsMap: { [userId: string]: { id: string; name: string; points: number; totalScore: number } } = {};
    activePlayers.forEach(p => {
      statsMap[p.id] = { id: p.id, name: p.name, points: 0, totalScore: 0 };
    });

    matchResults.forEach(match => {
      if (match.round > totalRounds) return;
      const scores = match.scores;
      if (!scores) return;
      const matchPlayerCount = Object.keys(scores).length;

      Object.entries(scores).forEach(([userId, data]: [string, any]) => {
        if (statsMap[userId]) {
          statsMap[userId].totalScore += Number(data.score) || 0;
          const rank = Number(data.rank);

          if (matchPlayerCount === 4) {
            if (rank === 1) statsMap[userId].points += 6;
            else if (rank === 2) statsMap[userId].points += 4;
            else if (rank === 3) statsMap[userId].points += 2;
            else if (rank === 4) statsMap[userId].points += 0;
          } else if (matchPlayerCount === 3) {
            if (rank === 1) statsMap[userId].points += 6;
            else if (rank === 2) statsMap[userId].points += 3;
            else if (rank === 3) statsMap[userId].points += 0;
          } else if (matchPlayerCount === 2) {
            if (rank === 1) statsMap[userId].points += 6;
            else if (rank === 2) statsMap[userId].points += 0;
          }
        }
      });
    });

    let sortedPlayers = [...activePlayers];
    if (roundNum === 1) {
      sortedPlayers.sort(() => Math.random() - 0.5);
    } else {
      sortedPlayers.sort((a, b) => {
        const statA = statsMap[a.id];
        const statB = statsMap[b.id];
        if (!statA || !statB) return 0;
        if (statB.points !== statA.points) {
          return statB.points - statA.points;
        }
        return statB.totalScore - statA.totalScore;
      });
    }

    const totalPlayers = sortedPlayers.length;
    let numTables = Math.ceil(totalPlayers / 4);
    if (totalPlayers <= 2) {
      numTables = 1;
    }

    const baseSize = Math.floor(totalPlayers / numTables);
    const remainder = totalPlayers % numTables;

    const newTables: TableData[] = [];
    let currentIndex = 0;

    for (let i = 0; i < numTables; i++) {
      const currentTableSize = baseSize + (i < remainder ? 1 : 0);
      const chunk = sortedPlayers.slice(currentIndex, currentIndex + currentTableSize);
      currentIndex += currentTableSize;

      newTables.push({
        tableNumber: i + 1,
        mapName: ``,
        targetMagic: 8000,
        players: chunk.map((p, index) => ({
          userId: p.id,
          name: p.name,
          score: `${index + 1}位`,
          totalMagic: '8000',
        })),
      });
    }

    setRoundParticipants(prev => ({ ...prev, [roundNum]: participantIds }));
    setTables(newTables);
    setCurrentRound(roundNum);
    setViewingRound(roundNum);

    setRoundHistories(prev => {
      const existing = prev.find(h => h.round === roundNum);
      if (existing) {
        return prev.map(h => h.round === roundNum ? { ...h, tables: newTables } : h);
      } else {
        return [...prev, { round: roundNum, tables: newTables }];
      }
    });
  };

  const generatePlayoffTables = () => {
    const allIds = players.map(p => p.id);
    const activePlayers = players.filter(p => allIds.includes(p.id));
    const statsMap: { [userId: string]: { points: number; totalScore: number } } = {};
    activePlayers.forEach(p => { statsMap[p.id] = { points: 0, totalScore: 0 }; });

    matchResults.forEach(match => {
      if (match.round > totalRounds) return;
      const scores = match.scores;
      if (!scores) return;
      const matchPlayerCount = Object.keys(scores).length;
      Object.entries(scores).forEach(([userId, data]: [string, any]) => {
        if (statsMap[userId]) {
          statsMap[userId].totalScore += Number(data.score) || 0;
          const rank = Number(data.rank);
          if (matchPlayerCount === 4) {
            if (rank === 1) statsMap[userId].points += 6;
            else if (rank === 2) statsMap[userId].points += 4;
            else if (rank === 3) statsMap[userId].points += 2;
          }
        }
      });
    });

    let sortedActive = [...activePlayers].sort((a, b) => {
      const sA = statsMap[a.id] || { points: 0, totalScore: 0 };
      const sB = statsMap[b.id] || { points: 0, totalScore: 0 };
      if (sB.points !== sA.points) return sB.points - sA.points;
      return sB.totalScore - sA.totalScore;
    });

    const playoffPlayers = sortedActive.slice(0, 4);
    const playoffRoundNum = totalRounds + 1;
    const newTables: TableData[] = [];

    newTables.push({
      tableNumber: 1,
      mapName: '',
      targetMagic: 8000,
      players: playoffPlayers.map((p, index) => ({
        userId: p.id,
        name: p.name,
        score: `${index + 1}位`,
        totalMagic: '8000',
      })),
    });

    setIsPlayoff(true);
    setCurrentRound(playoffRoundNum);
    setViewingRound(playoffRoundNum);
    setTables(newTables);

    setRoundHistories(prev => [
      ...prev,
      { round: playoffRoundNum, tables: newTables }
    ]);

    alert('予選上位4名による決勝プレーオフの卓組みを作成しました！');
  };

  const handleStartTournament = () => {
    setMatchResults([]);
    setRoundHistories([]);
    setRoundParticipants({});
    setIsPlayoff(false);
    
    if (tournamentMode === 'swiss') {
      const allIds = players.map(p => p.id);
      generateSwissTables(1, allIds);
    }
    
    setStep('play'); 
  };

  const handleOpenParticipantModal = (nextRoundNum: number) => {
    setPendingNextRound(nextRoundNum);
    setSelectedParticipantIds(players.map(p => p.id));
    setIsParticipantModalOpen(true);
  };

  const handleConfirmNextRound = () => {
    if (selectedParticipantIds.length === 0) {
      alert('参加者が1人も選択されていません！');
      return;
    }
    generateSwissTables(pendingNextRound, selectedParticipantIds);
    setIsParticipantModalOpen(false);
    alert(`成績に基づいてラウンド ${pendingNextRound} のスイスドロー卓組みを作成しました！`);
  };

  const handleSaveTableScores = (tableNumber: number, scores: any) => {
    setMatchResults(prev => {
      const existingIndex = prev.findIndex(
        item => item.round === viewingRound && item.tableNumber === tableNumber
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { round: viewingRound, tableNumber, scores };
        return updated;
      } else {
        return [...prev, { round: viewingRound, tableNumber, scores }];
      }
    });

    alert(`第${tableNumber}卓（ラウンド ${viewingRound}）のスコアを保存しました！`);
  };

  const handleUpdateTableSettings = (tableNumber: number, newMapName: string, newTargetMagic: number) => {
    const updateTablesList = (list: TableData[]) =>
      list.map(t => t.tableNumber === tableNumber ? { ...t, mapName: newMapName, targetMagic: newTargetMagic } : t);

    if (viewingRound === currentRound) {
      setTables(prev => updateTablesList(prev));
    }

    setRoundHistories(prev =>
      prev.map(h => h.round === viewingRound ? { ...h, tables: updateTablesList(h.tables) } : h)
    );
  };

  const viewingTables = roundHistories.find(h => h.round === viewingRound)?.tables || (viewingRound === currentRound ? tables : []);
  const viewingRoundResultsCount = matchResults.filter(item => item.round === viewingRound).length;

  const isQualifyingFinished = currentRound === totalRounds && matchResults.filter(item => item.round === totalRounds).length === viewingTables.length && viewingTables.length > 0;

  const playoffRoundNum = totalRounds + 1;
  const playoffMatch = matchResults.find(item => item.round === playoffRoundNum && item.tableNumber === 1);
  
  let playoffRankings: { userId: string; rank: number; name: string; totalMagic: string }[] = [];
  if (playoffMatch && playoffMatch.scores) {
    const scoresObj = playoffMatch.scores;
    const list = Object.entries(scoresObj).map(([userId, data]: [string, any]) => {
      const p = players.find(pl => pl.id === userId);
      return {
        userId,
        name: p ? p.name : '不明',
        rank: Number(data.rank) || 4,
        totalMagic: data.totalMagic || data.magic || '0',
      };
    });
    list.sort((a, b) => a.rank - b.rank);
    playoffRankings = list;
  }

  const handleResetAll = () => {
    if (confirm('保存されているすべてのデータをリセットして初期状態に戻しますか？')) {
      localStorage.clear();
      setStep('register');
      setTables([]);
      setCurrentRound(1);
      setMatchResults([]);
      setRoundHistories([]);
      setRoundParticipants({});
      setViewingRound(1);
      setTournamentMode('swiss');
      setTotalRounds(3);
      setEnablePlayoff(false);
      setIsPlayoff(false);
      window.location.reload();
    }
  };

  const getModeLabel = () => {
    if (tournamentMode === 'swiss') return `📊 スイスドロー戦 (予選全 ${totalRounds} R ${enablePlayoff ? '/ 決勝上位4名あり' : ''})`;
    if (tournamentMode === 'round_robin') return `🔄 リーグ戦モード (短期・長期)`;
    return `⚾ ペナントレースモード`;
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-2 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold">カルドセプト 大会スコア入力ツール</h1>
            <p className="text-sm text-slate-400">
              {step === 'register' ? 'プレイヤー登録 & 大会モード選択' : `現在: ${getModeLabel()}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportData} 
              accept=".json" 
              className="hidden" 
            />
            
            <Button
              variant="outline"
              onClick={handleExportData}
              className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs"
            >
              💾 大会を保存(JSON)
            </Button>

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs"
            >
              📁 ファイルから復元
            </Button>

            {step === 'play' ? (
              <Button
                variant="outline"
                onClick={() => setStep('register')}
                className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs"
              >
                ⚙️ 設定・プレイヤー管理
              </Button>
            ) : (
              matchResults.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setStep('play')}
                  className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs"
                >
                  ← 大会画面に戻る
                </Button>
              )
            )}

            <Button
              variant="destructive"
              onClick={handleResetAll}
              className="bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 text-xs"
            >
              リセット
            </Button>
          </div>
        </header>

        {step === 'register' ? (
          <div className="space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <h2 className="text-sm font-bold text-slate-200">1. 大会形式（モード）の選択</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setTournamentMode('swiss')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    tournamentMode === 'swiss'
                      ? 'bg-blue-950/40 border-blue-600 text-blue-200 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-100 mb-1">📊 スイスドロー戦</div>
                  <p className="text-xs text-slate-400">勝敗が近い人同士が毎ラウンド自動マッチング。オプションで決勝プレーオフ可能。</p>
                </button>

                <button
                  onClick={() => setTournamentMode('round_robin')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    tournamentMode === 'round_robin'
                      ? 'bg-indigo-950/40 border-indigo-600 text-indigo-200 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-100 mb-1">🔄 リーグ戦モード</div>
                  <p className="text-xs text-slate-400">短期モード（1人1〜10試合）や、4の倍数限定の長期総当たり戦（参加者-1試合）を選択可能。</p>
                </button>

                <button
                  onClick={() => setTournamentMode('pennant')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    tournamentMode === 'pennant'
                      ? 'bg-indigo-950/40 border-indigo-600 text-indigo-200 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                   }`}
                >
                  <div className="font-bold text-sm text-slate-100 mb-1">⚾ ペナントレースモード</div>
                  <p className="text-xs text-slate-400">複数サイクルの長期総当たりを専用管理するペナントモード。</p>
                </button>
              </div>

              {tournamentMode === 'swiss' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 mt-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-300">予選総ラウンド数:</span>
                    <select
                      value={totalRounds}
                      onChange={(e) => setTotalRounds(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-700 text-amber-300 font-bold rounded px-3 py-1.5 text-xs focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((r) => (
                        <option key={r} value={r}>
                          全 {r} ラウンド
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-300">決勝プレーオフ:</span>
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-950 border border-slate-700 px-3 py-1.5 rounded text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={enablePlayoff}
                        onChange={(e) => setEnablePlayoff(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span>予選上位4名で決勝を行う</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
              <h2 className="text-sm font-bold text-slate-200 mb-2">2. プレイヤーの登録と大会スタート</h2>
              <PlayerManager
                players={players}
                onUpdatePlayers={setPlayers}
                onStartTournament={handleStartTournament}
              />
            </div>

            {matchResults.length > 0 && (
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-center">
                <p className="text-xs text-slate-400 mb-3">すでに大会が進行中です。</p>
                <Button
                  onClick={() => setStep('play')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2"
                >
                  ← 大会画面に戻る
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">現在のモード:</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded ${
                  tournamentMode === 'swiss' 
                    ? 'bg-blue-950 text-blue-300 border border-blue-800' 
                    : tournamentMode === 'round_robin' 
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {getModeLabel()}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => setStep('register')}
                className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
              >
                設定やプレイヤーを変更する
              </Button>
            </div>

            {tournamentMode === 'round_robin' ? (
              <RoundRobinManager players={players} />
            ) : tournamentMode === 'pennant' ? (
              <PennantManager players={players} />
            ) : (
              <div className="space-y-8">
                
                {playoffRankings.length > 0 && (
                  <div className="bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-900 border-2 border-amber-500/80 p-6 rounded-2xl shadow-2xl space-y-4">
                    <div className="text-center space-y-1">
                      <span className="text-amber-400 font-bold text-xs tracking-widest uppercase bg-amber-950/60 px-3 py-1 rounded-full border border-amber-600/50">
                        🏆 TOURNAMENT CHAMPIONSHIP RESULT 🏆
                      </span>
                      <h2 className="text-2xl font-extrabold text-amber-200 mt-2">大会最終結果（決勝プレーオフ）</h2>
                      <p className="text-xs text-slate-400">予選を勝ち抜いた上位4名による決勝戦の最終着順です。</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      {playoffRankings.map((item) => {
                        const isWinner = item.rank === 1;
                        return (
                          <div
                            key={item.userId}
                            className={`p-4 rounded-xl border flex flex-col justify-between relative overflow-hidden transition-all ${
                              isWinner
                                ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/10'
                                : 'bg-slate-800/80 border-slate-700'
                            }`}
                          >
                            {isWinner && (
                              <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-bold text-[10px] px-2.5 py-0.5 rounded-bl font-mono">
                                CHAMPION
                              </div>
                            )}
                            <div>
                              <div className="text-xs font-semibold text-slate-400 mb-1">
                                {item.rank === 1 ? '🥇 優勝' : item.rank === 2 ? '🥈 準優勝' : item.rank === 3 ? '🥉 3位' : '4位'}
                              </div>
                              <div className="text-lg font-bold text-slate-100 truncate mb-2">{item.name}</div>
                            </div>
                            <div className="text-xs text-slate-300 font-mono border-t border-slate-700/60 pt-2 flex justify-between items-center">
                              <span>総魔力</span>
                              <span className="font-bold text-amber-300">{item.totalMagic} G</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-xs text-slate-400 mr-2 font-semibold">ラウンド選択:</span>
                    {Array.from({ length: currentRound }, (_, i) => i + 1).map((rNum) => {
                      const isFinished = matchResults.filter(item => item.round === rNum).length > 0;
                      const isPlayoffRound = rNum > totalRounds;
                      return (
                        <button
                          key={rNum}
                          onClick={() => setViewingRound(rNum)}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                            viewingRound === rNum
                              ? 'bg-blue-600 text-white shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <span>{isPlayoffRound ? `🏆 決勝(R${rNum})` : `R ${rNum}`}</span>
                          {isFinished && <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>}
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded border border-slate-800">
                    表示中: {viewingRound > totalRounds ? `🏆 決勝プレーオフ` : `ラウンド ${viewingRound}`} {viewingRound === currentRound ? '(進行中)' : '(過去のラウンド)'}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/50 px-4 py-2 rounded border border-slate-800/50">
                  <h2 className="text-md font-semibold">
                    {viewingRound > totalRounds ? '🏆 決勝プレーオフの対戦卓' : `ラウンド ${viewingRound} の対戦卓一覧`} (全 {viewingTables.length} 卓)
                  </h2>
                </div>

                {viewingTables.map((table) => {
                  const existingMatch = matchResults.find(
                    item => item.round === viewingRound && item.tableNumber === table.tableNumber
                  );

                  return (
                    <MatchScoreInput
                      key={`${viewingRound}-${table.tableNumber}`}
                      tableNumber={table.tableNumber}
                      mapName={table.mapName || ``}
                      targetMagic={table.targetMagic ?? 8000}
                      players={table.players}
                      initialScores={existingMatch?.scores}
                      onSave={(scores) => handleSaveTableScores(table.tableNumber, scores)}
                      onUpdateSettings={(newMap, newTarget) => handleUpdateTableSettings(table.tableNumber, newMap, newTarget)}
                      allRounds={roundHistories}
                      allMatchScores={matchResults}
                      allTableSettings={viewingTables}
                    />
                  );
                })}

                {viewingRound === currentRound && viewingRoundResultsCount === viewingTables.length && viewingTables.length > 0 && (
                  <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 text-center space-y-4">
                    <h3 className="text-lg font-bold text-green-400">
                      {currentRound > totalRounds ? '🏆 決勝プレーオフが終了しました！' : `ラウンド ${currentRound} の全卓が入力されました！`}
                    </h3>
                    
                    {isQualifyingFinished && enablePlayoff && !isPlayoff ? (
                      <div className="space-y-2">
                        <p className="text-xs text-amber-300 font-bold">🎉 予選全 {totalRounds} ラウンドが終了しました！上位4名による決勝プレーオフに進みます。</p>
                        <Button
                          onClick={generatePlayoffTables}
                          className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-6 py-2.5 text-xs shadow-lg"
                        >
                          🏆 決勝プレーオフの卓組みを作成する →
                        </Button>
                      </div>
                    ) : currentRound < totalRounds ? (
                      <Button
                        onClick={() => handleOpenParticipantModal(currentRound + 1)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 text-xs"
                      >
                        ラウンド {currentRound + 1} の卓組みを作成して次へ進む →
                      </Button>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs text-amber-300 font-bold">
                          {isPlayoff ? '🏆 大会の全日程が終了しました！優勝者の決定をお祝いしましょう！' : `🎉 全 ${totalRounds} ラウンドの全日程が終了しました！お疲れ様でした。`}
                        </p>
                        <p className="text-xs text-slate-400">下の総合順位表から最終結果をご確認ください。</p>
                      </div>
                    )}
                  </div>
                )}

                <Standings 
                  players={players} 
                  matchResults={matchResults.filter(item => item.round <= totalRounds)} 
                />
              </div>
            )}
          </div>
        )}

      </div>

      {isParticipantModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold">ラウンド {pendingNextRound} の参加メンバー確認</h3>
            <p className="text-xs text-slate-400">
              このラウンドに参加するプレイヤーにチェックを入れてください。
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {players.map(p => {
                const isChecked = selectedParticipantIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className="flex items-center justify-between p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg cursor-pointer"
                  >
                    <span className="font-medium text-slate-200">{p.name}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedParticipantIds(prev => [...prev, p.id]);
                        } else {
                          setSelectedParticipantIds(prev => prev.filter(id => id !== p.id));
                        }
                      }}
                      className="w-4 h-4 accent-indigo-600 rounded"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsParticipantModalOpen(false)}
                className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleConfirmNextRound}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4"
              >
                このメンバーで卓組みを作る
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}