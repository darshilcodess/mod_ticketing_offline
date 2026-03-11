import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, CheckCheck, AlertCircle, Info, Wrench,
    CheckCircle, Clock, RefreshCw, Inbox, ArrowRight, ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/* ── Helpers ──────────────────────────────────────────────── */
const getIcon = (message) => {
    const m = message?.toLowerCase() || '';
    if (m.includes('created')) return { icon: Bell, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' };
    if (m.includes('allocated')) return { icon: Info, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' };
    if (m.includes('resolved')) return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 border-green-200' };
    if (m.includes('closed')) return { icon: CheckCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
    if (m.includes('comment')) return { icon: Wrench, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200' };
    return { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200' };
};

const getRowAccent = (message, is_read) => {
    if (is_read) return 'border-slate-200/60 bg-white/10 opacity-60';
    const m = message?.toLowerCase() || '';
    if (m.includes('created')) return 'border-blue-200/60 bg-blue-50/20';
    if (m.includes('allocated')) return 'border-amber-200/60 bg-amber-50/20';
    if (m.includes('resolved')) return 'border-green-200/60 bg-green-50/20';
    if (m.includes('closed')) return 'border-emerald-200/60 bg-emerald-50/20';
    return 'border-orange-200/60 bg-orange-50/10';
};

const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

/* ── Component ────────────────────────────────────────────── */
const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${API_URL}/notifications/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(data);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotifications(); }, []);

    const markRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            window.dispatchEvent(new Event('notificationRead')); // Tell the bell to update
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const markAllRead = async () => {
        setMarkingAll(true);
        await Promise.all(notifications.filter(n => !n.is_read).map(n => markRead(n.id)));
        setMarkingAll(false);
        window.dispatchEvent(new Event('notificationRead')); // Tell the bell to update
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    /* ── Loading ── */
    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3 text-slate-400">
                <RefreshCw size={28} className="animate-spin text-orange-400" />
                <p className="text-sm font-medium">Loading notifications…</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-5">

            {/* ── Header ─────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/30 backdrop-blur-xl p-6 rounded-2xl border border-white/40 shadow-xl">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl bg-white/60 hover:bg-white/80 border border-white/50 text-slate-600 hover:text-orange-600 transition-all cursor-pointer shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/20 shadow-sm">
                        <Bell size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {unreadCount > 0
                                ? <><span className="font-semibold text-orange-600">{unreadCount} unread</span> · {notifications.length} total</>
                                : <>All caught up · {notifications.length} total</>
                            }
                        </p>
                    </div>
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        disabled={markingAll}
                        className="flex items-center gap-2 text-xs font-bold text-orange-700 bg-white/70 border border-orange-200 hover:bg-orange-50 px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                        <CheckCheck size={15} />
                        {markingAll ? 'Marking…' : 'Mark all read'}
                    </button>
                )}
            </div>

            {/* ── Empty State ─────────────────────────────── */}
            {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg text-center">
                    <div className="p-5 rounded-full bg-slate-100/60 border border-slate-200/60 mb-4">
                        <Inbox size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600">No Notifications</h3>
                    <p className="text-sm text-slate-400 mt-1">You're all caught up. Check back later.</p>
                </div>
            )}

            {/* ── Notification List ───────────────────────── */}
            {notifications.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white/30 backdrop-blur-xl shadow-lg overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[2.5rem_1fr_9rem_9rem] items-center gap-4 px-5 py-3 bg-white/70 border-b border-slate-200">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Message</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Time
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Action</span>
                    </div>

                    <AnimatePresence>
                        {notifications.map((n, i) => {
                            const { icon: Icon, color, bg } = getIcon(n.message);
                            return (
                                <motion.div
                                    key={n.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 8 }}
                                    transition={{ delay: i * 0.03 }}
                                    className={`grid grid-cols-[2.5rem_1fr_9rem_9rem] items-center gap-4 px-5 py-4 border-b border-slate-200 last:border-0 transition-all duration-200 ${getRowAccent(n.message, n.is_read)}`}
                                >
                                    {/* Icon */}
                                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 ${bg}`}>
                                        <Icon size={15} className={color} />
                                    </div>

                                    {/* Message + ticket link */}
                                    <div className="min-w-0">
                                        <p className={`text-sm leading-snug ${n.is_read ? 'text-slate-400' : 'text-slate-800 font-medium'}`}>
                                            {n.message}
                                        </p>
                                        {n.ticket_id && (
                                            <button
                                                onClick={() => navigate(`/tickets/${n.ticket_id}`)}
                                                className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
                                            >
                                                View Ticket #{n.ticket_id} <ArrowRight className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Time */}
                                    <span className="text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap">
                                        <Clock size={11} /> {timeAgo(n.created_at)}
                                    </span>

                                    {/* Mark read / read badge */}
                                    <div className="flex justify-end">
                                        {!n.is_read ? (
                                            <button
                                                onClick={() => markRead(n.id)}
                                                className="text-[11px] font-bold text-orange-700 bg-white/80 border border-orange-200 hover:bg-orange-50 px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
                                            >
                                                Mark read
                                            </button>
                                        ) : (
                                            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                                                <CheckCheck size={13} /> Read
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default Notifications;
