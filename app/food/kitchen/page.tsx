'use client'

import { useEffect, useState, useRef } from 'react';

type Order = {
    id: number;
    FoodId: number;
    name: string;
    price: number;
    tableNo: string;
    qty: number;
    createdAt: string;
}

export default function Kitchen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [wsConnected, setWsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const ordersEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        fetch('http://localhost:3001/orders')
            .then((r) => r.json())
            .then(setOrders)
            .catch(console.error);

        const ws = new WebSocket('ws://localhost:3001');
        wsRef.current = ws;

        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => setWsConnected(false);

        ws.onmessage = (ev) => {
            try {
                const payload = JSON.parse(ev.data);

                if (payload.type === 'init') {
                    setOrders(payload.orders || [])
                } else if (payload.type === 'new_order') {
                    setOrders((prev) => [...prev, payload.order]);
                }
            } catch (e) {
                console.error('invalid Ws message', e);
            }
        }

        return () => {
            ws.close();
            wsRef.current = null
        }
    }, []);

    useEffect(() => {
        ordersEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [orders]);

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-black text-white p-6">
            <div className="max-w-5xl mx-auto">
                <header className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">รายการออเดอร์ (ครัว)</h1>
                    <div className="text-sm">
                        WS:
                        <span className={`px-2 py-1 rounded ${wsConnected ? 'bg-green-600' : 'bg-red-600'}`}>
                            {wsConnected ? 'connected' : 'disconnected'}
                        </span>
                    </div>
                </header>

                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 shadow-lg h-[80vh]
                    overflow-y-auto space-y-3">
                    {orders.length === 0 ? (
                        <div className="text-gray-400 text-center mt-20">
                            ยังไม่มีคำสั่งซื้อเข้ามา
                        </div>
                    ) : (
                        orders.slice().reverse().map((o) => (
                            <div key={o.id} className="bg-gray-800 border border-gray-700 rounded-lg
                                p-4 flex justify-between items-center">
                                <div>
                                    <div className="font-semibold text-lg">
                                        {o.name}
                                        <span className="text-sm text-gray-400">
                                            x{o.qty}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        โต้ะ {o.tableNo} . {new Date(o.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-yellow-400">
                                        {o.price * o.qty} ฿
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Order ID: {o.id}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={ordersEndRef} />
                </div>
            </div>
        </div>
    )
}