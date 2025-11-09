'use client';

import { useEffect, useState, useRef, use } from 'react';

type Food = {
    id: number;
    name: string;
    price: number;
}
type Order = {
    id: number;
    FoodId: number;
    name: string;
    price: number;
    tableNo: string;
    qty: number;
    createdAt: string;
}

export default function Food() {
    const [foods, setFoods] = useState<Food[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedFood, setSelectedFood] = useState<Food | null>(null);
    const [qty, setQty] = useState<number>(1);
    const [tableNo, setTableNo] = useState<string>('1');
    const [wsConnected, setWsConnected] = useState<boolean>(false);
    const wsRef = useRef<WebSocket | null>(null);
    const ordersEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        fetch('http://localhost:3001/foods')
            .then((r) => r.json())
            .then(setFoods)
            .catch(console.error);

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
                    setOrders(payload.orders || []);
                } else if (payload.type === 'new_order') {
                    setOrders((prev) => [...prev, payload.order]);
                }
            } catch (e) {
                console.error('Invalid WS message', e);
            }
        }

        return () => {
            ws.close();
            wsRef.current = null;
        }
    }, []);

    useEffect(() => {
        ordersEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [orders]);

    const openOrderModal = (food: Food) => {
        setSelectedFood(food);
        setQty(1);
    };

    const addTempOrder = (food: Food, qty: number) => {
        const newOrder: Order = {
            id: Date.now(),
            FoodId: food.id,
            name: food.name,
            price: food.price,
            tableNo,
            qty,
            createdAt: new Date().toISOString()
        };
        setOrders((prev) => [...prev, newOrder]);
        setSelectedFood(null);
    }

    const confirmAllOrder = async () => {
        if (orders.length === 0) {
            alert('ยังไม่มีรายการที่จะส่ง');
            return;
        }

        try {
            const res = await fetch('http://localhost:3001/orders/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tableNo, items: orders }),
            });

            if (!res.ok) throw new Error('ส่งคำสั่งซื้อไม่สำเร็จ');

            alert('ส่งคำสั่งซื้อทั้งหมดเรียบร้อย');
            setOrders([]);
        } catch (err) {
            console.error(err);
            alert('มีข้อผิดพลาดในการส่งคำสั่งซื้อ');
        }
    }

    const removeOrder = (id: number) => {
        setOrders((prev) => prev.filter((o) => o.id !== id));
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-900 
        via-gray-800 to-black text-white p-6">
            <div className="max-w-6xl mx-auto">
                <header className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">POS - WebSocket Demo</h1>
                    <div className="text-sm">
                        WS:
                        <span className={`px-2 py-1 rounded 
                            ${wsConnected} ? 'bg-green-600' : 'bg-red-600'} `}>
                            {wsConnected ? 'connected' : 'disconncted'}
                        </span>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-7">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 shadow-lg">
                            <h2 className="text-lg font-semibold mb-3">เมนูอาหาร</h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}