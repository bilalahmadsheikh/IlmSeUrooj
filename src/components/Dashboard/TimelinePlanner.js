'use client';

import { useState, useEffect } from 'react';

const CATEGORIES = ['document', 'test_prep', 'application', 'fee_payment', 'interview', 'follow_up', 'personal', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const PRIORITY_COLORS = {
    low: '#71717a',
    medium: '#fbbf24',
    high: '#f97316',
    urgent: '#ef4444',
};

const SUGGESTED_TASKS = [
    { task_title: 'Collect Matric DMC (attested copies)', task_category: 'document', priority: 'high' },
    { task_title: 'Collect Intermediate DMC (attested copies)', task_category: 'document', priority: 'high' },
    { task_title: 'Get Domicile Certificate', task_category: 'document', priority: 'high' },
    { task_title: 'Get Character Certificate from school', task_category: 'document', priority: 'medium' },
    { task_title: 'Get passport photos (6 copies)', task_category: 'document', priority: 'medium' },
    { task_title: 'Register for entry test (NTS/ECAT/SAT)', task_category: 'test_prep', priority: 'urgent' },
    { task_title: 'Fill online application form', task_category: 'application', priority: 'urgent' },
    { task_title: 'Pay application fee', task_category: 'fee_payment', priority: 'high' },
    { task_title: 'Upload documents on portal', task_category: 'application', priority: 'high' },
    { task_title: 'Check merit list result', task_category: 'follow_up', priority: 'medium' },
];

export default function TimelinePlanner({ apiFetch }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [filter, setFilter] = useState('all');
    const [form, setForm] = useState({
        task_title: '',
        task_category: 'application',
        priority: 'medium',
        due_date: '',
        university_name: '',
        notes: '',
    });

    const load = async () => {
        const res = await apiFetch('/api/timeline');
        if (res?.tasks) setTasks(res.tasks);
        setLoading(false);
    };

    useEffect(() => { load(); }, [apiFetch]);

    const addTask = async (taskData) => {
        const payload = taskData ?? form;
        const res = await apiFetch('/api/timeline', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        if (res?.task) {
            setTasks(prev => [...prev, res.task].sort((a, b) =>
                (a.due_date ?? 'zzzz').localeCompare(b.due_date ?? 'zzzz')
            ));
            setForm({ task_title: '', task_category: 'application', priority: 'medium', due_date: '', university_name: '', notes: '' });
            setShowAdd(false);
        }
    };

    const toggleComplete = async (task) => {
        const res = await apiFetch('/api/timeline', {
            method: 'PUT',
            body: JSON.stringify({
                id: task.id,
                completed: !task.completed,
                completed_at: !task.completed ? new Date().toISOString() : null,
            }),
        });
        if (res?.task) setTasks(prev => prev.map(t => t.id === task.id ? res.task : t));
    };

    const deleteTask = async (id) => {
        await apiFetch(`/api/timeline?id=${id}`, { method: 'DELETE' });
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const filtered = filter === 'all' ? tasks
        : filter === 'pending' ? tasks.filter(t => !t.completed)
        : filter === 'overdue' ? tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) < new Date())
        : tasks.filter(t => t.completed);

    const overdue = tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) < new Date());

    if (loading) return <div className="dash-empty">Loading tasks…</div>;

    return (
        <div>
            {/* Strategy planner banner */}
            <a href="/timeline" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '12px 16px', marginBottom: 16, borderRadius: 12, textDecoration: 'none',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))',
                border: '1px solid rgba(16,185,129,0.15)',
            }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#F5F5F0' }}>Visual Timeline &amp; Strategy Planner</div>
                    <div style={{ fontSize: 12, color: '#6B8A83', marginTop: 2 }}>Gantt chart, conflict detection, priority ordering</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#10B981', whiteSpace: 'nowrap' }}>Open →</span>
            </a>

            {overdue.length > 0 && (
                <div style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13,
                    color: '#ef4444',
                }}>
                    <span style={{ fontSize: 18 }}>⚠️</span>
                    <strong>{overdue.length} overdue task{overdue.length > 1 ? 's' : ''}</strong> — take action now!
                </div>
            )}

            <div className="dash-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h2 className="dash-section-title" style={{ marginBottom: 0 }}>📅 Application Timeline</h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="dash-btn-ghost" onClick={() => setShowAdd(!showAdd)}>
                            {showAdd ? '✕ Cancel' : '+ Add Task'}
                        </button>
                    </div>
                </div>

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    {[['all', 'All'], ['pending', 'Pending'], ['overdue', 'Overdue'], ['done', 'Done']].map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => setFilter(val)}
                            style={{
                                padding: '5px 12px',
                                border: `1px solid ${filter === val ? '#4ade80' : '#27272a'}`,
                                background: filter === val ? 'rgba(74,222,128,0.1)' : 'transparent',
                                color: filter === val ? '#4ade80' : '#71717a',
                                borderRadius: 20,
                                fontSize: 12,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            {label} {val === 'all' ? `(${tasks.length})` : ''}
                        </button>
                    ))}
                </div>

                {/* Add form */}
                {showAdd && (
                    <div style={{
                        background: '#1a1c1a',
                        border: '1px solid #27272a',
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 16,
                    }}>
                        <div className="dash-grid-2" style={{ marginBottom: 12 }}>
                            <div className="dash-field">
                                <label className="dash-label">Task Title *</label>
                                <input
                                    className="dash-input"
                                    value={form.task_title}
                                    onChange={e => setForm(f => ({ ...f, task_title: e.target.value }))}
                                    placeholder="e.g. Submit COMSATS application"
                                />
                            </div>
                            <div className="dash-field">
                                <label className="dash-label">University</label>
                                <input
                                    className="dash-input"
                                    value={form.university_name}
                                    onChange={e => setForm(f => ({ ...f, university_name: e.target.value }))}
                                    placeholder="e.g. COMSATS"
                                />
                            </div>
                            <div className="dash-field">
                                <label className="dash-label">Category</label>
                                <select
                                    className="dash-select"
                                    value={form.task_category}
                                    onChange={e => setForm(f => ({ ...f, task_category: e.target.value }))}
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="dash-field">
                                <label className="dash-label">Priority</label>
                                <select
                                    className="dash-select"
                                    value={form.priority}
                                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                                >
                                    {PRIORITIES.map(p => (
                                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="dash-field">
                                <label className="dash-label">Due Date</label>
                                <input
                                    type="date"
                                    className="dash-input"
                                    value={form.due_date}
                                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                                />
                            </div>
                            <div className="dash-field">
                                <label className="dash-label">Notes</label>
                                <input
                                    className="dash-input"
                                    value={form.notes}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="Optional notes"
                                />
                            </div>
                        </div>
                        <button className="dash-btn" onClick={() => addTask()}>Add Task</button>
                    </div>
                )}

                {/* Task list */}
                {filtered.length === 0 ? (
                    <div className="dash-empty">
                        No tasks found.
                        {tasks.length === 0 && (
                            <div style={{ marginTop: 12 }}>
                                <p style={{ marginBottom: 12 }}>Quick start: Add suggested tasks</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                                    {SUGGESTED_TASKS.slice(0, 5).map((t, i) => (
                                        <button
                                            key={i}
                                            className="dash-btn-ghost"
                                            onClick={() => addTask(t)}
                                        >
                                            + {t.task_title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {filtered.map(task => {
                            const isOverdue = !task.completed && task.due_date && new Date(task.due_date) < new Date();
                            return (
                                <div
                                    key={task.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 12,
                                        padding: '12px 14px',
                                        background: task.completed ? 'rgba(74,222,128,0.04)' : '#1a1c1a',
                                        border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : '#27272a'}`,
                                        borderRadius: 10,
                                        opacity: task.completed ? 0.6 : 1,
                                    }}
                                >
                                    <button
                                        onClick={() => toggleComplete(task)}
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: 4,
                                            border: `2px solid ${task.completed ? '#4ade80' : '#27272a'}`,
                                            background: task.completed ? '#4ade80' : 'transparent',
                                            color: '#0c0e0b',
                                            fontSize: 12,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            marginTop: 2,
                                        }}
                                    >
                                        {task.completed ? '✓' : ''}
                                    </button>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            color: task.completed ? '#71717a' : '#e4e4e7',
                                            textDecoration: task.completed ? 'line-through' : 'none',
                                            marginBottom: 4,
                                        }}>
                                            {task.task_title}
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                            {task.university_name && (
                                                <span className="dash-tag dash-tag-blue">{task.university_name}</span>
                                            )}
                                            <span className="dash-tag dash-tag-gray">
                                                {(task.task_category ?? '').replace(/_/g, ' ')}
                                            </span>
                                            <span style={{
                                                fontSize: 11,
                                                color: PRIORITY_COLORS[task.priority] ?? '#71717a',
                                                fontWeight: 600,
                                            }}>
                                                ● {task.priority}
                                            </span>
                                            {task.due_date && (
                                                <span style={{
                                                    fontSize: 11,
                                                    color: isOverdue ? '#ef4444' : '#71717a',
                                                }}>
                                                    {isOverdue ? '⚠ ' : '📅 '}
                                                    {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-PK', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button className="dash-btn-danger" onClick={() => deleteTask(task.id)}>✕</button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {tasks.length > 0 && tasks.length < SUGGESTED_TASKS.length && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #1f2520' }}>
                        <p style={{ fontSize: 12, color: '#71717a', marginBottom: 10 }}>
                            Suggested tasks to add:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {SUGGESTED_TASKS.filter(s => !tasks.find(t => t.task_title === s.task_title))
                                .slice(0, 4)
                                .map((t, i) => (
                                <button
                                    key={i}
                                    className="dash-btn-ghost"
                                    onClick={() => addTask(t)}
                                    style={{ fontSize: 11 }}
                                >
                                    + {t.task_title}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
