'use client'

import { useEffect, useState } from 'react'

type Message = { sender: string; text: string; }

export default function ChatRoom({ character }: { character: string }) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3001');
        setSocket(ws);

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                setMessages((prev) => [...prev, msg])
            } catch (e) {
                console.error('invalid message')
            }
        }

        return () => ws.close();
    }, []);

    const sendMessage = () => {
        if (socket && input.trim()) {
            const msg = { sender: character, text: input };
            socket.send(JSON.stringify(msg));
            setInput('');
        }
    }

    return (
        <div className="chat-wrapper">
            <div className="chat-header">ห้องแชท - {character}</div>
            <div className="chat-messages">
                {messages.map((msg, i) => {
                    const isMe = msg.sender === character;
                    const colorClass =
                        msg.sender === 'กบ'
                            ? 'bg-green-600'
                            : msg.sender === 'มะลิ'
                                ? 'bg-pink-500'
                                : msg.sender === 'ปิงปอง'
                                    ? 'bg-orange-400'
                                    : 'bg-gray-600';

                    return (
                        <div key={i}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <span className='text-sm text-gray-300 mb-1'>{msg.sender}</span>
                            <div className={`chat-message ${colorClass} ${isMe ? 'self-end' : 'self-start'}`}>
                                {msg.text}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className='chat-input-container'>
                <input className='chat-input'
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder='พิมพ์ข้อความ...'
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
                <button className='chat-button' onClick={sendMessage}>
                    ส่ง
                </button>
            </div>
        </div>
    )
}