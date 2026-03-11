import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ArrowLeft, FileSearch, ThumbsUp, RotateCcw, SendToBack, Search, Filter, Clock, AlertTriangle, ChevronDown, Check } from 'lucide-react';

const PRIORITY_BADGE = {
    CRITICAL: 'bg-red-50 text-red-600 border-red-200',
    HIGH: 'bg-orange-50 text-orange-600 border-orange-200',
    MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    LOW: 'bg-blue-50 text-blue-600 border-blue-200',
};
const PRIORITY_DOT = {
    CRITICAL: 'bg-red-500', HIGH: 'bg-orange-500', MEDIUM: 'bg-yellow-500', LOW: 'bg-blue-500',
};
const PRIORITY_ROW_BG = {
    CRITICAL: 'bg-red-50/80 hover:bg-red-100/80 border-red-100',
    HIGH: 'bg-orange-50/80 hover:bg-orange-100/80 border-orange-100',
    MEDIUM: 'bg-yellow-50/80 hover:bg-yellow-100/80 border-yellow-100',
    LOW: 'bg-blue-50/80 hover:bg-blue-100/80 border-blue-100',
};

export default function AllPendingReview() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [sortOrder, setSortOrder] = useState('NEWEST');

    useEffect(() => { fetchTickets(); }, []);

    const fetchTickets = async () => {
        try { const { data } = await api.get('/tickets/'); setTickets(data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleApprove = async (ticketId) => {
        try { await api.patch(`/tickets/${ticketId}/close`); fetchTickets(); }
        catch (err) { console.error(err); }
    };
    const handleReallocateToTeam = async (ticketId) => {
        try { await api.patch(`/tickets/${ticketId}/reallocate-to-team`); fetchTickets(); }
        catch (err) { console.error(err); }
    };
    const handleReallocateToG1 = async (ticketId) => {
        try { await api.patch(`/tickets/${ticketId}/reallocate-to-g1`); fetchTickets(); }
        catch (err) { console.error(err); }
    };

    const pending = tickets
        .filter(t => t.status === 'RESOLVED')
        .filter(t => priorityFilter === 'ALL' || t.priority === priorityFilter)
        .filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sortOrder === 'NEWEST') return new Date(b.created_at) - new Date(a.created_at);
            if (sortOrder === 'OLDEST') return new Date(a.created_at) - new Date(b.created_at);
            return 0;
        });

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between bg-white/30 backdrop-blur-xl p-5 rounded-2xl border border-white/40 shadow-xl">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl bg-white/60 hover:bg-white/80 border border-white/50 text-slate-600 hover:text-yellow-600 transition-all cursor-pointer shadow-sm">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">All Pending Reviews</h1>
                        <p className="text-sm text-slate-500">{pending.length} ticket{pending.length !== 1 ? 's' : ''} awaiting your approval</p>
                    </div>
                </div>
                <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 shadow-sm"><FileSearch size={22} /></div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search by title or description…" value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-300 shadow-sm transition-all" />
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Priority Dropdown */}
                    <div className="relative w-full sm:w-auto z-20">
                        <Menu as="div" className="relative inline-block text-left w-full sm:w-auto">
                            <Menu.Button className="flex items-center justify-between w-full sm:w-44 px-4 py-2.5 rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm text-sm font-semibold text-slate-700 hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-300 shadow-sm transition-all">
                                <span className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-yellow-600" />
                                    {priorityFilter === 'ALL' ? 'All Priorities' : priorityFilter.charAt(0) + priorityFilter.slice(1).toLowerCase()}
                                </span>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </Menu.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 sm:left-0 mt-2 w-full sm:w-44 origin-top-right rounded-xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-lg ring-1 ring-black/5 focus:outline-none overflow-hidden pb-1 z-50">
                                    <div className="py-1">
                                        {[
                                            { id: 'ALL', label: 'All Priorities' },
                                            { id: 'CRITICAL', label: 'Critical', color: 'text-red-500', bg: 'bg-red-50' },
                                            { id: 'HIGH', label: 'High', color: 'text-orange-500', bg: 'bg-orange-50' },
                                            { id: 'MEDIUM', label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' },
                                            { id: 'LOW', label: 'Low', color: 'text-blue-500', bg: 'bg-blue-50' }
                                        ].map((opt) => (
                                            <Menu.Item key={opt.id}>
                                                {({ active }) => (
                                                    <button
                                                        onClick={() => setPriorityFilter(opt.id)}
                                                        className={`${active || priorityFilter === opt.id ? 'bg-yellow-50/50' : ''
                                                            } flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:text-yellow-700 transition-colors ${priorityFilter === opt.id ? 'font-bold' : 'font-medium'}`}
                                                    >
                                                        {opt.id !== 'ALL' && (
                                                            <span className={`w-2 h-2 rounded-full ${opt.bg.replace('bg-', 'bg-').replace('-50', '-500')}`} />
                                                        )}
                                                        <span className="flex-1 text-left">{opt.label}</span>
                                                        {priorityFilter === opt.id && <Check className="w-4 h-4 text-yellow-600" />}
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        ))}
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative w-full sm:w-auto z-10">
                        <Menu as="div" className="relative inline-block text-left w-full sm:w-auto">
                            <Menu.Button className="flex items-center justify-between w-full sm:w-44 px-4 py-2.5 rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm text-sm font-semibold text-slate-700 hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-300 shadow-sm transition-all">
                                <span className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-500" />
                                    {sortOrder === 'NEWEST' ? 'Newest First' : 'Oldest First'}
                                </span>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </Menu.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 sm:left-0 mt-2 w-full sm:w-44 origin-top-right rounded-xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-lg ring-1 ring-black/5 focus:outline-none overflow-hidden pb-1 z-50">
                                    <div className="py-1">
                                        {[
                                            { id: 'NEWEST', label: 'Newest First' },
                                            { id: 'OLDEST', label: 'Oldest First' }
                                        ].map((opt) => (
                                            <Menu.Item key={opt.id}>
                                                {({ active }) => (
                                                    <button
                                                        onClick={() => setSortOrder(opt.id)}
                                                        className={`${active || sortOrder === opt.id ? 'bg-slate-50' : ''
                                                            } flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:text-slate-900 transition-colors ${sortOrder === opt.id ? 'font-bold' : 'font-medium'}`}
                                                    >
                                                        <span className="flex-1 text-left">{opt.label}</span>
                                                        {sortOrder === opt.id && <Check className="w-4 h-4 text-slate-500" />}
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        ))}
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 bg-white/30 backdrop-blur-xl shadow-lg overflow-hidden">
                <div className="grid grid-cols-[3.5rem_2fr_2.5fr_7rem_8rem_1fr] items-center gap-4 px-5 py-3 bg-white/70 border-b border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ID</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Title</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Resolution Note</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Priority</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Submitted</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</span>
                </div>
                <AnimatePresence>
                    {pending.length > 0 ? pending.map((ticket, i) => (
                        <motion.div key={ticket.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ delay: i * 0.03 }}
                            className={`grid grid-cols-[3.5rem_2fr_2.5fr_7rem_8rem_1fr] items-center gap-4 px-5 py-4 border-b last:border-0 transition-all duration-200 group ${PRIORITY_ROW_BG[ticket.priority] || 'bg-white/20 hover:bg-slate-50/40 border-slate-200'}`}>
                            <span className="text-xs font-bold text-slate-400">#{ticket.id}</span>
                            <div className="flex items-center gap-2 min-w-0 cursor-pointer" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[ticket.priority] ?? 'bg-slate-400'}`} />
                                <span className="text-sm font-semibold text-slate-800 hover:text-yellow-700 line-clamp-1 transition-colors">{ticket.title}</span>
                            </div>
                            <span className="text-xs text-slate-500 line-clamp-1 italic">{ticket.resolution_notes || '—'}</span>
                            <span className={`inline-flex w-fit px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${PRIORITY_BADGE[ticket.priority] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}>{ticket.priority}</span>
                            <span className="text-xs text-slate-400">{new Date(ticket.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => handleApprove(ticket.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-[10px] font-bold transition-all cursor-pointer shadow-sm">
                                    <ThumbsUp className="w-3 h-3" /> Approve
                                </button>
                                <button onClick={() => handleReallocateToTeam(ticket.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold transition-all cursor-pointer">
                                    <RotateCcw className="w-3 h-3" /> Retry
                                </button>
                                <button onClick={() => handleReallocateToG1(ticket.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-[10px] font-bold transition-all cursor-pointer">
                                    <SendToBack className="w-3 h-3" /> G1
                                </button>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="py-16 text-center text-slate-400">
                            <div className="inline-flex p-4 rounded-full bg-yellow-50/60 mb-3"><FileSearch size={28} className="text-yellow-400" /></div>
                            <p className="font-semibold text-slate-500">No pending reviews match your filters.</p>
                            <p className="text-sm mt-1">You're all caught up!</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
