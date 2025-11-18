'use client';

import { useEffect, useRef, useState } from 'react';

type Todo = {
    id: number;
    title: string;
    assignee: string;
    status: 'To Do' | 'In Progress' | 'Done';
    startDate: string;
    dueDate: string;
    note: string;
}

export default function TodoBoard() {
    const [name, setName] = useState('');
    const [loggedIn, setLoggedIn] = useState(false);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState(3);
    const [note, setNote] = useState('');
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        fetchTodos();

        const ws = new WebSocket('ws://localhost:3001');
        wsRef.current = ws;
        ws.onmessage = ev => {
            const payload = JSON.parse(ev.data);

            if (payload.type === 'new_todo' || payload.type === 'update_todo') {
                setTodos(payload.todos || []);
            }
        }
        return () => ws.close();
    }, []);

    const fetchTodos = async () => {
        const res = await fetch('http://localhost:3001/todos');
        const data = await res.json();
        setTodos(data);
    }

    const addTodo = async () => {
        if (!title) return alert('กรอกชื่อรายการ');
        if (!name) return alert('กรอกชื่อผู้ทำงาน');

        await fetch('http://localhost:3001/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, assignee: name, durationDays: duration, note }),
        });

        setTitle('');
        setDuration(3);
        setNote('');

        fetchTodos();
    }

    const changeStatus = async (id: number, status: string) => {
        await fetch(`http://localhost:3001/todos/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        })
        fetchTodos();
    }

    const deleteTodo = async (id: number) => {
        if (!confirm('ลบงานนี้จริงหรือไม่ ?')) return;

        await fetch(`http://localhost:3001/todos/${id}`, { method: 'DELETE' });

        fetchTodos();
    }

    const saveEdit = async () => {
        if (!editingTodo) return;

        const dueDate = new Date(editingTodo.startDate);
        dueDate.setDate(dueDate.getDate() + duration);
        await fetch(`http://localhost:3001/todos/${editingTodo.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: editingTodo.title,
                note: editingTodo.note,
                startDate: editingTodo.startDate,
                dueDate: dueDate.toISOString(),
                durationDays: duration
            })
        });
        setEditingTodo(null);
        fetchTodos();
    }

    const getStatusClasses = (status: string) => {
        if (status === 'To Do') return 'bg-gray-700 text-white';
        if (status === 'In Progress') return 'bg-yellow-600 text-black';
        if (status === 'Done') return 'bg-green-700 text-white line-through';

        return 'bg-gray-700 text-white';
    }

    return (
        <div className="p-6 min-h-screen bg-gray-900 text-white font-sans">
            {!loggedIn ? (
                <div className="mb-6">
                    <h2 className="text-xl font-bold mb-2">Login พนักงาน</h2>
                    <input placeholder="ชื่อผู้ใช้"
                        className="p-2 rounded border border-gray-600 bg-gray-800 text-white mr-2"
                        value={name}
                        onChange={(e) => setName(e.target.value)} />
                    <button className="p-2 rounded bg-green-500 hover:bg-green-600 text-black"
                        onClick={() => setLoggedIn(true)}>
                        Login
                    </button>
                </div>
            ) : (
                <>
                    <h2 className="text-2xl font-bold mb-4">Todo Board</h2>

                    <div className="flex flex-wrap gap-2 mb-4">
                        <input
                            placeholder='รายการงาน'
                            className="p-2 rounded border border-gray-600 bg-gray-800 text-white"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <input
                            type="number"
                            className="p-2 rounded border border-gray-600 bg-gray-800 text-white w-20"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                        />
                        <input
                            placeholder='หมายเหตุ'
                            className="p-2 rounded border border-gray-600 bg-gray-800 text-white"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                        <button
                            className="p-2 rounded bg-green-500 hover:bg-green-600 text-black"
                            onClick={addTodo}
                        >
                            สร้างงาน
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {todos.map(todo => (
                            <div key={todo.id}
                                className={`p-4 rounded-xl border border-gray-700 ${getStatusClasses(todo.status)}`}>
                                <h3 className="font-semibold txt-lg">{todo.title}</h3>
                                <p>ผู้ทำงาน: {todo.assignee}</p>
                                <p>
                                    สถานะ:
                                    <select value={todo.status}
                                        onChange={e => changeStatus(todo.id, e.target.value)}
                                        className="p-1 rounded bg-gray-900 border border-gray-600 text-white ml1">
                                        <option>To Do</option>
                                        <option>In Progress</option>
                                        <option>Done</option>
                                    </select>
                                </p>
                                <p>เริ่ม: {new Date(todo.startDate).toLocaleDateString()}</p>
                                <p>เสร็จ: {new Date(todo.dueDate).toLocaleDateString()}</p>
                                {todo.note && <p>หมายเหตุ: {todo.note}</p>}
                                <div className="mt-2 flex gap-2">
                                    <button
                                        className="px-4 py-2 rounded bg-yellow-500 text-black"
                                        onClick={() => setEditingTodo(todo)}
                                    >
                                        แก้ไข
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded bg-red-600"
                                        onClick={() => deleteTodo(todo.id)}
                                    >
                                        ลบ
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}