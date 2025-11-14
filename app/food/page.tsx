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
                            ${wsConnected ? 'bg-green-600' : 'bg-red-600'} `}>
                            {wsConnected ? 'connected' : 'disconncted'}
                        </span>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-7">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 shadow-lg">
                            <h2 className="text-lg font-semibold mb-3">เมนูอาหาร</h2>

                            <div className='grid grid-cols-2 gap-3'>
                                {foods.map((f) => (
                                    <div key={f.id} className="bg-linear-to-br from-gray-800 to-gray-700 
                                    p-3 rounded-lg flex items-center justify-center">
                                        <div>
                                            <div className="font-semibold">{f.name}</div>
                                            <div className="text-sm text-gray-300">{f.price}</div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <button
                                                onClick={() => openOrderModal(f)}
                                                className="px-3 py-1 bg-blue-600 rounded-md hover:bg-blue-700">
                                                สั่ง
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* รายการสั่งซื้อ */}
                    <div className="col-span-5">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 shadow-lg
                                    h-[560px] flex flex-col">
                            <h2 className="text-lg font-semibold mb-3">Order List</h2>
                            <div className="flex-1 overflow-y space-y-3 pr-2">
                                {orders.length === 0 ? (
                                    <div className="text-gray-400">ยังไม่มีคำสั่งซื้อ</div>
                                ) : (
                                    orders.map((o) => (
                                        <div key={o.id} className="bg-gray-800 border border-gray-700
                                        rounded-lg p-3 flex justify-between items-center">
                                            <div>
                                                <div className="font-semibold">
                                                    {o.name}
                                                    <span className="text-sm text-gray-400">{o.qty}</span>
                                                </div>
                                                <div className="text-sm text-gray-300">โต้ะ {o.tableNo}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold">{o.price * o.qty} ฿</div>
                                                <button
                                                    onClick={() => removeOrder(o.id)}
                                                    className="text-red-400 text-xs hover:text-red-300">
                                                    ลบ
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={ordersEndRef} />
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                <input
                                    className="w-[100px] p-2 rounded-md bg-gray-800 border border-gray-700"
                                    value={tableNo}
                                    onChange={(e) => setTableNo(e.target.value)}
                                />
                                <div className="text-sm text-gray-400 flex-1/2">หมายเลขโต้ะ</div>
                            </div>

                            <button onClick={confirmAllOrder}
                                className="mt-4 w-full py-2 bg-green-600 rounded-xl hover:bg-green-700 transition">
                                ยืนยันการสั่งทั้งหมด
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modal ยืนยันแต่ละเมนู */}
                {selectedFood && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
                            <h3 className="text-xl font-semibold mb-3">สั่ง: {selectedFood.name}</h3>
                            <div className="mb-4">
                                <label className="text-sm text-gray-300">จำนวน</label>
                                <div className="flex items-center gap-2 mt-2">
                                    <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                                        className="px-3 py-1 bg-gray-800 rounded">-</button>
                                    <div className="px-4">{qty}</div>
                                    <button onClick={() => setQty((q) => q + 1)}
                                        className="px-3 py-1 bg-gray-800 rounded">+</button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => addTempOrder(selectedFood, qty)}
                                    className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
                                    เพิ่มเข้ารายการ
                                </button>
                                <button onClick={() => setSelectedFood(null)}
                                    className="px-4 py-2 bg-gray-700 rounded">ยกเลิก</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}