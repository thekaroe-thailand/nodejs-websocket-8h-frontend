'use client';

import { useState } from 'react'
import ChatRoom from './chat-room';

export default function ChatPage() {
  const [character, setCharacter] = useState<string | null>(null);

  if (character) {
    return <ChatRoom character={character} />
  }

  const characters = [
    { name: 'กบ', color: 'green' },
    { name: 'มะลิ', color: 'pink' },
    { name: 'ปิงปอง', color: 'orange' }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br
      from-gray-900 via-gray-800 to-black text-white
    ">
      <h1 className="text-3xl font-bold mb-6">เลือกตัวละครของคุณ</h1>
      <div className="flex gap-4">
        {characters.map((c) => (
          <button key={c.name} onClick={() => setCharacter(c.name)} className={`
            px-6 py-3 rounded-2xl font-semibold text-lg shadow-lg transition-all
            duration-200 hover:scale-105  
            ${c.color === 'green' ? 'bg-green-600 hover:bg-green-700' : ''}
            ${c.color === 'pink' ? 'bg-pink-500 hover:bg-pink-600' : ''}
            ${c.color === 'orange' ? 'bg-orange-400 hover:bg-orange-500' : ''}
          `}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  )
}