'use client';

import { useState, useEffect, useRef } from 'react';
import PlayerManager, { Player } from '@/components/PlayerManager';
import MatchScoreInput from '@/components/MatchScoreInput';
import Standings from '@/components/Standings';
import RoundRobinManager from '@/components/RoundRobinManager';
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
  
  // 大会モードの選択 ('swiss' = スイスドロー戦, 'round_robin' = 総当たり戦)
  const [tournamentMode, setTournamentMode] = useState<'swiss' | 'round_robin'>('swiss');

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
    if (savedMode) setTournamentMode(savedMode as 'swiss' | 'round_robin');
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
  }, [isMounted, step, players, tables, currentRound, matchResults, roundHistories, viewingRound, roundParticipants, tournamentMode]);

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
      version: 6,
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
        mapName: `ラウンド ${roundNum} マップ`,
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

  const handleStartTournament = () => {
    setMatchResults([]);
    setRoundHistories([]);
    setRoundParticipants({});
    
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
  const isViewingRoundFinished = viewingRoundResultsCount === viewingTables.length && viewingTables.length > 0;

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
      window.location.reload();
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-2 md:p-6">
      {/* max-w-4xl を max-w-7xl に変更し、より広い幅で表示できるようにしました */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold">カルドセプト 大会スコア入力ツール</h1>
            <p className="text-sm text-slate-400">
              {step === 'register' ? 'プレイヤー登録 & 大会形式の選択' : `現在: ${tournamentMode === 'swiss' ? 'スイスドロー戦' : '総当たり戦'} 進行中`}
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
            
            {/* ★ 始めに大会形式を選ぶセクション */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
              <h2 className="text-sm font-bold text-slate-200">1. 大会形式（モード）の選択</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setTournamentMode('swiss')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    tournamentMode === 'swiss'
                      ? 'bg-blue-950/40 border-blue-600 text-blue-200 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-100 mb-1">📊 スイスドロー戦</div>
                  <p className="text-xs text-slate-400">毎ラウンド、勝敗や成績が近い人同士が自動でマッチングされる形式です。</p>
                </button>

                <button
                  onClick={() => setTournamentMode('round_robin')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    tournamentMode === 'round_robin'
                      ? 'bg-indigo-950/40 border-indigo-600 text-indigo-200 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-100 mb-1">🔄 総当たり戦（リーグ戦）</div>
                  <p className="text-xs text-slate-400">全員がもれなく対戦できるように組み合わせを全ラウンド自動生成する形式です。</p>
                </button>
              </div>
            </div>

            {/* プレイヤー登録・管理コンポーネント */}
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
            
            {/* 進行中の上部表示（どちらのモードかを表示） */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">現在のモード:</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded ${tournamentMode === 'swiss' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-indigo-950 text-indigo-300 border border-indigo-800'}`}>
                  {tournamentMode === 'swiss' ? '📊 スイスドロー戦' : '🔄 総当たり戦（リーグ戦）'}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => setStep('register')}
                className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
              >
                モードやプレイヤーを変更する
              </Button>
            </div>

            {tournamentMode === 'round_robin' ? (
              <RoundRobinManager players={players} />
            ) : (
              <div className="space-y-8">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-xs text-slate-400 mr-2 font-semibold">ラウンド選択:</span>
                    {Array.from({ length: currentRound }, (_, i) => i + 1).map((rNum) => {
                      const isFinished = matchResults.filter(item => item.round === rNum).length > 0;
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
                          <span>R {rNum}</span>
                          {isFinished && <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>}
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded border border-slate-800">
                    表示中: ラウンド {viewingRound} {viewingRound === currentRound ? '(進行中)' : '(過去のラウンド)'}
                  </span>
              </div>

              <div className="flex justify-between items-center bg-slate-900/50 px-4 py-2 rounded border border-slate-800/50">
                <h2 className="text-md font-semibold">
                  ラウンド {viewingRound} の対戦卓一覧 (全 {viewingTables.length} 卓)
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
                    mapName={table.mapName || `ラウンド ${viewingRound} マップ`}
                    targetMagic={table.targetMagic ?? 8000}
                    players={table.players}
                    initialScores={existingMatch?.scores}
                    onSave={(scores) => handleSaveTableScores(table.tableNumber, scores)}
                    onUpdateSettings={(newMap, newTarget) => handleUpdateTableSettings(table.tableNumber, newMap, newTarget)}
                  />
                );
              })}

              {viewingRound === currentRound && isViewingRoundFinished && (
                <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 text-center space-y-4">
                  <h3 className="text-lg font-bold text-green-400">ラウンド {currentRound} の全卓が入力されました！</h3>
                  <Button
                    onClick={() => handleOpenParticipantModal(currentRound + 1)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2"
                  >
                    ラウンド {currentRound + 1} の卓組みを作成して次へ進む →
                  </Button>
                </div>
              )}

              <Standings players={players} matchResults={matchResults} />
            </div>
          )}

        </div>
        )}

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

    </div>
   </main>
  );
}