import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Inbox, Clock, CheckCircle2 } from 'lucide-react';
import DashboardFilters from '../../components/DashboardFilters';

export default function G1Dashboard() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [allocation, setAllocation] = useState({ team_id: '', priority: '' });
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [sortOrder, setSortOrder] = useState('NEWEST');
    const [activePriorityFilter, setActivePriorityFilter] = useState('ALL');
    const [activeSortOrder, setActiveSortOrder] = useState('NEWEST');
    const [resolvedPriorityFilter, setResolvedPriorityFilter] = useState('ALL');
    const [resolvedSortOrder, setResolvedSortOrder] = useState('NEWEST');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ticketsRes, teamsRes] = await Promise.all([
                api.get('/tickets/'), // Fetch ALL tickets for history
                api.get('/teams/')
            ]);
            setTickets(ticketsRes.data);
            setTeams(teamsRes.data);
        } catch (error) {
            console.error("error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter pending tickets for allocation view
    const pendingTickets = tickets
        .filter(ticket => ticket.status === 'OPEN')
        .filter(t => priorityFilter === 'ALL' || t.priority === priorityFilter)
        .sort((a, b) => {
            if (sortOrder === 'NEWEST') return new Date(b.created_at) - new Date(a.created_at);
            if (sortOrder === 'OLDEST') return new Date(a.created_at) - new Date(b.created_at);
            return 0;
        });

    const handleAllocate = async (e) => {
        e.preventDefault();
        if (!selectedTicket || !allocation.team_id) return;
        try {
            await api.patch(`/tickets/${selectedTicket.id}/allocate`, {
                team_id: parseInt(allocation.team_id),
                priority: allocation.priority || selectedTicket.priority
            });
            setSelectedTicket(null);
            fetchData();
            setAllocation({ team_id: '', priority: '' });
        } catch (error) {
            console.error("Allocation failed", error);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'OPEN': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'ALLOCATED': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
            case 'RESOLVED': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'CLOSED': return 'text-green-400 bg-green-400/10 border-green-400/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    const getPriorityStyles = (priority) => {
        switch (priority) {
            case 'CRITICAL': return { line: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' };
            case 'HIGH': return { line: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200' };
            case 'MEDIUM': return { line: 'bg-yellow-500', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
            case 'LOW': return { line: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
            default: return { line: 'bg-slate-500', badge: 'bg-slate-50 text-slate-700 border-slate-200' };
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-white/30 backdrop-blur-xl p-6 rounded-2xl border border-white/40 shadow-xl">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 drop-shadow-sm">
                        Admin Dashboard (G1)
                    </h1>
                    <p className="text-slate-600">Allocate and manage unit requests</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/20 shadow-sm">
                    <Inbox size={24} />
                </div>
            </div>

            {/* Incoming Requests Section */}
            <section className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg min-h-[500px]">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1.5 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-lg shadow-orange-500/30"></div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Incoming Requests</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-extrabold border border-orange-200 shadow-sm">
                            {pendingTickets.length} PENDING
                        </span>
                        <DashboardFilters
                            priorityFilter={priorityFilter}
                            setPriorityFilter={setPriorityFilter}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                            themeColor="orange"
                        />
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-orange-600 cursor-pointer ml-1" onClick={() => navigate('/g1/incoming')}>
                            View All <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                        {pendingTickets.slice(0, 6).map(ticket => (
                            <Card
                                key={ticket.id}
                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                                className="group relative overflow-hidden border border-white/40 bg-white/60 backdrop-blur-xl hover:bg-white/70 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 shadow-sm cursor-pointer"
                            >
                                <div className={`h-1 w-full bg-gradient-to-r ${ticket.priority === 'CRITICAL' ? 'from-red-500 to-red-600' :
                                    ticket.priority === 'HIGH' ? 'from-orange-500 to-orange-600' :
                                        ticket.priority === 'MEDIUM' ? 'from-yellow-500 to-yellow-600' :
                                            'from-blue-500 to-blue-600'
                                    }`} />

                                <CardHeader className="pb-3 pt-4">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg font-bold text-slate-800 line-clamp-1">{ticket.title}</CardTitle>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${ticket.priority === 'CRITICAL' ? 'bg-red-50 text-red-600 border-red-200' :
                                            ticket.priority === 'HIGH' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                ticket.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    'bg-blue-50 text-blue-600 border-blue-200'
                                            }`}>
                                            {ticket.priority}
                                        </span>
                                    </div>
                                    <CardDescription className="text-xs text-slate-400 font-medium">
                                        ID: #{ticket.id}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600 mb-6 line-clamp-3 leading-relaxed">
                                        {ticket.description}
                                    </p>
                                    <Button
                                        onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}
                                        className="w-full bg-slate-800 hover:bg-slate-900 text-white shadow-lg shadow-slate-900/20 group-hover:scale-[1.02] transition-transform duration-200"
                                    >
                                        Allocate <ArrowRight size={16} className="ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </AnimatePresence>

                    {pendingTickets.length === 0 && (
                        <div className="col-span-full py-16 text-center text-slate-500 bg-white/40 backdrop-blur-sm rounded-xl border border-white/40 border-dashed">
                            <div className="inline-flex p-4 rounded-full bg-slate-100 mb-3 text-slate-400 shadow-inner">
                                <Inbox size={32} />
                            </div>
                            <p className="font-medium">No open tickets pending allocation.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Active Tickets | Resolved History — side by side */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Active Tickets Section */}
                <section className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 border border-white/20 shadow-lg min-h-[350px]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-1 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-lg shadow-orange-500/30"></div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Active Tickets</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[10px] font-extrabold border border-orange-200 shadow-sm">
                                {tickets.filter(t => t.status === 'OPEN' || t.status === 'ALLOCATED').length} ACTIVE
                            </span>
                            <DashboardFilters
                                priorityFilter={activePriorityFilter}
                                setPriorityFilter={setActivePriorityFilter}
                                sortOrder={activeSortOrder}
                                setSortOrder={setActiveSortOrder}
                                themeColor="orange"
                            />
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 hover:text-orange-600 cursor-pointer" onClick={() => navigate('/unit/active-tickets')}>
                                View All <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-3 grid-cols-1">
                        <AnimatePresence>
                            {tickets
                                .filter(t => t.status === 'OPEN' || t.status === 'ALLOCATED')
                                .filter(t => activePriorityFilter === 'ALL' || t.priority === activePriorityFilter)
                                .sort((a, b) => {
                                    if (activeSortOrder === 'NEWEST') return new Date(b.created_at) - new Date(a.created_at);
                                    if (activeSortOrder === 'OLDEST') return new Date(a.created_at) - new Date(b.created_at);
                                    return 0;
                                })
                                .slice(0, 5)
                                .map(ticket => (
                                    <Card
                                        key={ticket.id}
                                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                                        className="group border border-white/40 bg-white/60 backdrop-blur-xl hover:bg-white/70 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 overflow-hidden shadow-sm cursor-pointer"
                                    >
                                        <div className={`h-1 w-full ${getPriorityStyles(ticket.priority).line}`} />
                                        <CardHeader className="pb-2 pt-3 px-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="space-y-1 w-full">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-slate-800 line-clamp-1 text-sm">{ticket.title}</h3>
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getPriorityStyles(ticket.priority).badge}`}>
                                                            {ticket.priority}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] pt-1">
                                                        <span className={`px-1.5 py-0.5 rounded font-medium border ${getStatusColor(ticket.status)}`}>
                                                            {ticket.status}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-slate-400">
                                                            <Clock size={10} /> {new Date(ticket.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="px-4 pb-3">
                                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                                {ticket.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                        </AnimatePresence>
                        {tickets.filter(t => t.status === 'OPEN').length === 0 && (
                            <div className="col-span-full py-8 text-center text-slate-500 bg-white/40 backdrop-blur-sm rounded-xl border border-white/40 border-dashed">
                                <div className="inline-flex p-3 rounded-full bg-slate-100 mb-3 text-slate-400"><CheckCircle2 size={24} /></div>
                                <p className="font-medium text-sm">All caught up! No active tickets.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Resolved History Section */}
                <section className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 border border-white/20 shadow-lg min-h-[350px]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-1 bg-gradient-to-b from-green-400 to-green-600 rounded-full shadow-lg shadow-green-500/30"></div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Resolved History</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-extrabold border border-green-200 shadow-sm">
                                {tickets.filter(t => t.status === 'CLOSED').length} COMPLETED
                            </span>
                            <DashboardFilters
                                priorityFilter={resolvedPriorityFilter}
                                setPriorityFilter={setResolvedPriorityFilter}
                                sortOrder={resolvedSortOrder}
                                setSortOrder={setResolvedSortOrder}
                                themeColor="green"
                            />
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 hover:text-green-600 cursor-pointer" onClick={() => navigate('/unit/resolved-history')}>
                                View All <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4 grid-cols-1">
                        <AnimatePresence>
                            {tickets
                                .filter(t => t.status === 'CLOSED')
                                .filter(t => resolvedPriorityFilter === 'ALL' || t.priority === resolvedPriorityFilter)
                                .sort((a, b) => {
                                    if (resolvedSortOrder === 'NEWEST') return new Date(b.created_at) - new Date(a.created_at);
                                    if (resolvedSortOrder === 'OLDEST') return new Date(a.created_at) - new Date(b.created_at);
                                    return 0;
                                })
                                .slice(0, 5)
                                .map(ticket => (
                                    <Card
                                        key={ticket.id}
                                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                                        className="group border border-white/40 bg-white/40 backdrop-blur-md opacity-80 hover:opacity-100 transition-all duration-300 overflow-hidden shadow-sm cursor-pointer"
                                    >
                                        <div className={`h-1 w-full bg-green-500`} />
                                        <CardHeader className="pb-3 pt-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="space-y-1 w-full">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-slate-700 line-clamp-1 text-lg decoration-slate-400/50">{ticket.title}</h3>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-green-200 text-green-700 bg-green-50`}>
                                                            CLOSED
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs pt-1">
                                                        <span className="flex items-center gap-1 text-slate-400">
                                                            <Clock size={12} /> {new Date(ticket.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                                                {ticket.description}
                                            </p>
                                            {ticket.resolution_notes && (
                                                <div className="mt-3 p-3 bg-green-50/80 border border-green-200/60 rounded-md text-sm text-green-800">
                                                    <div className="flex items-center gap-2 font-bold mb-1 text-green-700">
                                                        <CheckCircle2 size={14} /> Resolution
                                                    </div>
                                                    {ticket.resolution_notes}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                        </AnimatePresence>
                        {tickets.filter(t => t.status === 'CLOSED').length === 0 && (
                            <div className="col-span-full py-8 text-center text-slate-400 italic">
                                No history available.
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <AnimatePresence>
                {selectedTicket && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-lg"
                        >
                            <Card className="border border-white/60 bg-white/90 backdrop-blur-2xl shadow-2xl overflow-hidden">
                                <div className="h-2 bg-gradient-to-r from-orange-500 via-white to-green-600"></div>
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-slate-900">Allocate Ticket #{selectedTicket.id}</CardTitle>
                                    <CardDescription className="text-slate-500">Assign this task to a specialized team.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleAllocate} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Assign to Team</label>
                                            <select
                                                className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                                value={allocation.team_id}
                                                onChange={e => setAllocation({ ...allocation, team_id: e.target.value })}
                                                required
                                            >
                                                <option value="" className="text-slate-400">Select Team</option>
                                                {teams.map(t => <option key={t.id} value={t.id} className="text-slate-900">{t.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Adjust Priority</label>
                                            <select
                                                className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                                value={allocation.priority}
                                                onChange={e => setAllocation({ ...allocation, priority: e.target.value })}
                                            >
                                                <option value="">Keep {selectedTicket.priority}</option>
                                                <option value="LOW">Low</option>
                                                <option value="MEDIUM">Medium</option>
                                                <option value="HIGH">High</option>
                                                <option value="CRITICAL">Critical</option>
                                            </select>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-4">
                                            <Button type="button" variant="ghost" onClick={() => setSelectedTicket(null)} className="hover:bg-slate-100 text-slate-600">
                                                Cancel
                                            </Button>
                                            <Button type="submit" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20">
                                                Confirm Allocation
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
