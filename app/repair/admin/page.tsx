'use client';

import { useState, useEffect, useRef } from 'react';

type Ticket = {
    id: number;
    machine: string;
    detail: string;
    reporter: string;
    status: string;
    createdAt: string;
}

const STATUS_OPTIONS = ['รับเรื่องแล้ว', 'รอซ่อม', 'กำลังซ่อม', 'ซ่อมเสร็จแล้ว'];

export default function AdminPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [toasts, setToasts] = useState<string[]>([]);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3001');
        wsRef.current = ws;

        ws.onmessage = (ev) => {
            try {
                const payload = JSON.parse(ev.data);

                if (payload.type === 'init') setTickets(payload.tickets || []);
                else if (payload.type === 'new_ticket') {
                    setTickets((prev) => [...prev, payload.ticket]);
                    setToasts((prev) => [...prev, `${payload.ticket.machine}: ${payload.ticket.detail}`]);

                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('ใบแจ้งซ่อมใหม่', {
                            body: `${payload.ticket.machine} - ${payload.ticket.detail}`,
                            icon: '/notification.png'
                        });
                    }
                } else if (payload.type === 'update_status') {
                    console.log('test')
                    setTickets((prev) =>
                        prev.map((t) => (t.id === payload.ticket.id ? payload.ticket : t))
                    )
                }
            } catch (e) {
                console.log(e);
            }
        }

        return () => ws.close();
    }, []);

    const updateStatus = async (id: number, status: string) => {
        try {
            await fetch(`http://localhost:3001/tickets/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
        } catch (e) {
            alert('อัปเดตสถานะไม่สำเร็จ');
        }
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-black text-white
            p-6 flex flex-col items-center">
            <div className="w-full max-w-3xl space-y-4">
                <h1 className="text-2xl font-bold text-center">Admin - ใบแจ้งซ่อมเครื่องจักร</h1>
                {tickets.length === 0 ? (
                    <div className="text-gray-400 text-center">ยังไม่มีใบแจ้งซ่อม</div>
                ) : (
                    tickets.map((t) => (
                        <div key={t.id}
                            className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-semibold">{t.machine}</div>
                                    <div className="text-sm text-gray-300">{t.detail}</div>
                                    <div className="text-sm text-gray-400 mt-1">ผู้แจ้ง: {t.reporter}</div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        {new Date(t.createdAt).toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <select className="p-1 rounded bg-gray-700 border border-gray-600"
                                        value={t.status}
                                        onChange={(e) => updateStatus(t.id, e.target.value)}>
                                        {STATUS_OPTIONS.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Notification */}
            <div className="fixed top-4 right-4 flex flex-col gap-2">
                {toasts.map((msg, idx) => (
                    <div key={idx} className="bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-slide-in"
                        onAnimationEnd={() => setToasts((prev) => prev.filter((_, i) => i !== idx))}>
                        {msg}
                    </div>
                ))}
            </div>

            {/* SCSS */}
            {/*
            <style jsx>
                {`
                    @keyframes slide-in {
                        0% { opacity: 0; transform: translateX(100%); }
                        100% { opacity: 1; transform: translateX(0); }
                    }

                    .animate-slide-in {
                        animation: slide-in 0.5s ease forwards;
                    }
                `}
            </style>
            */}
        </div>
    )
}