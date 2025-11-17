'use client';

import { useEffect, useState } from 'react';

type Ticket = {
    id: number;
    machine: string;
    detail: string;
    reporter: string;
    status: string;
    createdAt: string;
}

export default function Dashboard() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [ws, setWs] = useState<WebSocket | null>(null);

    useEffect(() => {
        fetch('http://localhost:3001/tickets')
            .then(r => r.json())
            .then(setTickets);

        const socket = new WebSocket('ws://localhost:3001');
        setWs(socket);

        socket.onmessage = (ev) => {
            const payload = JSON.parse(ev.data);

            switch (payload.type) {
                case 'init':
                    setTickets(payload.tickets);
                    break;
                case 'new_ticket':
                    setTickets(prev => [...prev, payload.ticket]);
                    break;
                case 'update_status':
                    setTickets(prev => prev.map(t => t.id === payload.ticket.id ? payload.ticket : t));
                    break;
            }
        }

        return () => socket.close();
    }, []);

    const statusCounts = tickets.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusList = ['รับเรื่องแล้ว', 'รอซ่อม', 'กำลังซ่อม', 'ซ่อมเสร็จแล้ว'];

    return (
        <div className="min-h-screen p-6 bg-linear-to-br form-blue-900 via-gray-800 to-black text-white">
            <h1 className="text-3xl font-bold mb-6">Dashboard - สรุปงานแจ้งซ่อม</h1>
            <div className="grid grid-cols-4 gap-4 mb-6">
                {statusList.map(status => (
                    <div key={status} className={`p-4 rounded shadow-lg text-center
                        ${status === 'รับเรื่องแล้ว' ? 'bg-green-600' :
                            status === 'รอซ่อม' ? 'bg-yellow-500' :
                                status === 'กำลังซ่อม' ? 'bg-orange-600' :
                                    'bg-gray-600'}`}>
                        <div className="text-sm">{status}</div>
                        <div className="text-2xl font-bold">{statusCounts[status] || 0}</div>
                    </div>
                ))}
            </div>

            {/* รายการทั้งหมด */}
            <h2 className="text-xl font-semibold mb-2">รายการทั้งหมด</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auot">
                {tickets.map(t => (
                    <div key={t.id} className="bg-gray-800 p-3 rounded border border-gray-700 flex
                        justify-between items-center">
                        <div>
                            <div><span className="font-semibold">{t.machine}</span> - {t.detail}</div>
                            <div className="text-sm text-gray-400">
                                {t.status} * {new Date(t.createdAt).toLocaleString()}
                            </div>
                        </div>
                        <div className="text-sm text-gray-300">{t.reporter}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}