'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface Player {
  id: string;
  name: string;
}

interface PlayerManagerProps {
  players: Player[];
  onUpdatePlayers: (newPlayers: Player[]) => void;
  onStartTournament: () => void;
}

export default function PlayerManager({ players, onUpdatePlayers, onStartTournament }: PlayerManagerProps) {
  const [inputNames, setInputNames] = useState('');
  const [singleName, setSingleName] = useState('');

  // 1行ずつ改行して複数人一括追加
  const handleBulkAdd = () => {
    if (!inputNames.trim()) return;
    const namesArray = inputNames
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    const newPlayers: Player[] = namesArray.map((name, index) => ({
      id: `p_${Date.now()}_${index}`,
      name,
    }));

    onUpdatePlayers([...players, ...newPlayers]);
    setInputNames('');
  };

  // 1人ずつ追加
  const handleSingleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim()) return;

    const newPlayer: Player = {
      id: `p_${Date.now()}`,
      name: singleName.trim(),
    };

    onUpdatePlayers([...players, newPlayer]);
    setSingleName('');
  };

  // プレイヤー削除
  const handleDelete = (id: string) => {
    onUpdatePlayers(players.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader>
          <CardTitle>参加プレイヤー登録</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 一括登録エリア */}
          <div className="space-y-2">
            <Label htmlFor="bulk-names">プレイヤー一括登録（1行に1人入力）</Label>
            <textarea
              id="bulk-names"
              rows={5}
              className="w-full p-3 rounded-md bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="プレイヤーA&#13;&#10;プレイヤーB&#13;&#10;プレイヤーC"
              value={inputNames}
              onChange={(e) => setInputNames(e.target.value)}
            />
            <Button onClick={handleBulkAdd} className="w-full bg-blue-600 hover:bg-blue-700">
              一括で追加する
            </Button>
          </div>

          {/* 1人ずつ追加エリア */}
          <form onSubmit={handleSingleAdd} className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="single-name">1人ずつ追加</Label>
              <Input
                id="single-name"
                value={singleName}
                onChange={(e) => setSingleName(e.target.value)}
                placeholder="プレイヤー名"
                className="bg-slate-950 border-slate-800 text-slate-100"
              />
            </div>
            <Button type="submit" variant="secondary">追加</Button>
          </form>
        </CardContent>
      </Card>

      {/* 登録済みプレイヤー一覧 */}
      <Card className="bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader>
          <CardTitle>登録済みプレイヤー一覧 ({players.length}人)</CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <p className="text-slate-500 text-center py-4">まだプレイヤーが登録されていません</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2">
              {players.map((player) => (
                <div key={player.id} className="flex justify-between items-center bg-slate-950 px-3 py-2 rounded border border-slate-800">
                  <span>{player.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(player.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 大会スタート・卓組みへ進むボタン */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <Button
              onClick={onStartTournament}
              disabled={players.length < 4}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3"
            >
              {players.length < 4 ? '大会開始には最低4人必要です' : 'ラウンド1の卓組み（ペアリング）を作成する'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}