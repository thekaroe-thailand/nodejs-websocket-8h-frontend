'use client'

import { useState, useEffect, useRef } from 'react';

type Ticket = {
    id: number;
    machine: string;
    detail: string;
    reporter: string;
    status: string;
    createdAt: string;
}

export default function RepairPage() {
    const [machine, setMachine] = useState('');
    const [detail, setDetail] = useState('');
    const [reporter, setReporter] = useState('');
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3001');
        wsRef.current = ws;

        ws.onmessage = (ev) => {
            try {
                const payload = JSON.parse(ev.data);
                if (payload.type === 'init') setTickets(payload.tickets || []);
                else if (payload.type === 'new_ticket') setTickets((prev) => [...prev, payload.ticket]);
                else if (payload.type === 'update_status') {
                    setTickets((prev) =>
                        prev.map((t) => t.id === payload.ticket.id ? payload.ticket : t)
                    )
                }
            } catch (e) { }
        }

        return () => ws.close();
    }, []);

    const submitTicket = async () => {
        if (!machine || !detail || !reporter) return alert('กรอกทุกช่องก่อน');

        try {
            const res = await fetch('http://localhost:3001/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ machine, detail, reporter })
            });

            if (!res.ok) throw new Error('Failed')

            setMachine('');
            setDetail('');
            setReporter('');
        } catch (e) {
            alert('ส่งใบแจ้งซ่อมไม่สำเร็จ');
        }
    }

    return (
        <div className='min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-black
        text-white p-6 flex flex-col items-center'>
            <div className='w-full max-w-md bg-gray-900 border border-gray-700 rounded-3xl p-6 shadow-2xl'>
                <h1 className='text-2xl font-bold mb-4 text-center'>แจ้งซ่อมเครื่องจักร</h1>
                <div className='flex flex-col gap-3'>
                    <input className="p-3 rounded-xl bg-gray-800 border border-gray-600 text-white"
                        placeholder='ชื่อเครื่องจักร'
                        value={machine}
                        onChange={(e) => setMachine(e.target.value)}
                    />
                    <input className="p-3 rounded-xl bg-gray-800 border border-gray-600 text-white"
                        placeholder='รายละเอียดปัญหา'
                        value={detail}
                        onChange={(e) => setDetail(e.target.value)}
                    />
                    <input className="p-3 rounded-xl bg-gray-800 border border-gray-600 text-white"
                        placeholder='ชื่อผู้แจ้ง'
                        value={reporter}
                        onChange={(e) => setReporter(e.target.value)}
                    />
                    <button
                        className="px-4 py-2 bg-green-600 rounded-xl hover:bg-green-700"
                        onClick={submitTicket}>
                        ส่งใบแจ้งซ๋อม
                    </button>
                </div>
            </div>

            <div className="w-full max-w-md mt-6 space-y-3">
                {tickets.length === 0 ? (
                    <div className="text-gray-400 text-center">ยังไม่มีใบแจ้งซ่อม</div>
                ) : (
                    tickets.map((t) => (
                        <div key={t.id}
                            className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex flex-col">
                            <div className="font-semibold">{t.machine}</div>
                            <div className="text-sm text-gray-300">{t.detail}</div>
                            <div className="text-sm text-gray-400 mt-1">
                                ผู้แจ้ง: {t.reporter} | สถานะ: {t.status}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {new Date(t.createdAt).toLocaleString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}