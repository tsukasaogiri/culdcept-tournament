// src/app/page.tsx
'use client';

import MatchScoreInput from '@/components/MatchScoreInput';

export default function Home() {
  const samplePlayers = [
    { userId: 'u1', name: 'セプターA' },
    { userId: 'u2', name: 'セプターB' },
    { userId: 'u3', name: 'セプターC' },
    { userId: 'u4', name: 'セプターD' },
  ];

  const handleSave = (scores: any) => {
    alert('入力データ:\n' + JSON.stringify(scores, null, 2));
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex items-center justify-center">
      <MatchScoreInput
        tableNumber={1}
        mapName="シンプル"
        targetMagic={8000}
        players={samplePlayers}
        onSave={handleSave}
      />
    </main>
  );
}