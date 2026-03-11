import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Briefcase, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import DashboardFilters from '../../components/DashboardFilters';

export default function TeamDashboard() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolvingTicket, setResolvingTicket] = useState(null);
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [sortOrder, setSortOrder] = useState('NEWEST');
    const [pendingPriorityFilter, setPendingPriorityFilter] = useState('ALL');
    const [pendingSortOrder, setPendingSortOrder] = useState('NEWEST');
    const [closedPriorityFilter, setClosedPriorityFilter] = useState('ALL');
    const [closedSortOrder, setClosedSortOrder] = useState('NEWEST');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            // Fetch all tickets to show history, will filter for assigned tasks
            const { data } = await api.get('/tickets/');
            setTickets(data);
        } catch (error) {
            console.error("Error fetching tickets", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter for tickets that are currently allocated/assigned to the team for action
    const assignedTickets = tickets
        .filter(t => t.status === 'ALLOCATED')
        .filter(t => priorityFilter === 'ALL' || t.priority === priorityFilter)
        .sort((a, b) => {
            if (sortOrder === 'NEWEST') return new Date(b.created_at) - new Date(a.created_at);
            if (sortOrder === 'OLDEST') return new Date(a.created_at) - new Date(b.created_at);
            return 0;
        });

    const [resolveError, setResolveError] = useState('');
    const [resolutionNotes, setResolutionNotes] = useState('');

    const handleResolve = async (e) => {
        e.preventDefault();
        if (!resolvingTicket) return;
        setResolveError('');
        try {
            await api.patch(`/tickets/${resolvingTicket.id}/resolve`, { resolution_notes: resolutionNotes });
            setResolvingTicket(null);
            setResolutionNotes('');
            fetchTickets();
        } catch (error) {
            console.error("Failed to resolve", error);
            setResolveError(error?.response?.data?.detail || 'Failed to resolve ticket. Please try again.');
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
                        Team Dashboard
                    </h1>
                    <p className="text-slate-600">Manage assigned tickets and track resolution</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-white/50 rounded-full text-xs font-bold text-slate-700 border border-white/20 shadow-sm flex items-center gap-2">
                        <Briefcase size={14} className="text-orange-600" />
                        {assignedTickets.length} Pending Actions
                    </span>
                </div>
            </div>

            {/* Assigned Tasks Section */}
            <section className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1.5 bg-gradient-to-b from-green-400 to-green-600 rounded-full shadow-lg shadow-green-500/30"></div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Your Assignments</h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-extrabold border border-green-200 shadow-sm">
                            {assignedTickets.length} ASSIGNED
                        </span>
                        <DashboardFilters
                            priorityFilter={priorityFilter}
                            setPriorityFilter={setPriorityFilter}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                            themeColor="green"
                        />
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-green-600 cursor-pointer ml-1" onClick={() => navigate('/team/assignments')}>
                            View All <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                        {assignedTickets.slice(0, 6).map(ticket => (
                            <Card
                                key={ticket.id}
                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                                className="group relative overflow-hidden border border-white/40 bg-white/60 backdrop-blur-xl hover:bg-white/70 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 shadow-sm cursor-pointer"
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
                                        ID: #{ticket.id} • Status: <span className="text-blue-600 font-bold">{ticket.status}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600 mb-6 line-clamp-3 leading-relaxed">
                                        {ticket.description}
                                    </p>
                                    <Button
                                        onClick={(e) => { e.stopPropagation(); setResolvingTicket(ticket); }}
                                        className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 group-hover:scale-[1.02] transition-transform duration-200 border-none"
                                    >
                                        <CheckCircle size={16} className="mr-2" /> Mark for Review
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </AnimatePresence>

                    {assignedTickets.length === 0 && (
                        <div className="col-span-full py-16 text-center text-slate-500 bg-white/40 backdrop-blur-sm rounded-xl border border-white/40 border-dashed">
                            <div className="inline-flex p-4 rounded-full bg-slate-100 mb-3 text-slate-400 shadow-inner">
                                <Briefcase size={32} />
                            </div>
                            <p className="font-medium">No pending tasks assigned to your team.</p>
                        </div>
                    )}
                </div>
            </section >

            {/* Pending for Review & Closed Tickets — Side by Side */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">

                {/* Pending for Review Section */}
                <section className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-1.5 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full shadow-lg shadow-yellow-500/30"></div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Pending for Review</h2>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-[10px] font-extrabold border border-yellow-200 shadow-sm">
                                {tickets.filter(t => t.status === 'RESOLVED').length} PENDING
                            </span>
                            <DashboardFilters
                                priorityFilter={pendingPriorityFilter}
                                setPriorityFilter={setPendingPriorityFilter}
                                sortOrder={pendingSortOrder}
                                setSortOrder={setPendingSortOrder}
                                themeColor="yellow"
                            />
                            <Button variant="ghost" size="sm" className="hidden text-slate-500 hover:text-yellow-600 cursor-pointer ml-1" onClick={() => navigate('/team/pending-review')}>
                                View All <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4 grid-cols-1">
                        <AnimatePresence>
                            {tickets
                                .filter(t => t.status === 'RESOLVED')
                                .filter(t => pendingPriorityFilter === 'ALL' || t.priority === pendingPriorityFilter)
                                .sort((a, b) => {
                                    if (pendingSortOrder === 'NEWEST') return new Date(b.created_at) - new Date(a.created_at);
                                    if (pendingSortOrder === 'OLDEST') return new Date(a.created_at) - new Date(b.created_at);
                                    return 0;
                                })
                                .slice(0, 5).map(ticket => (
                                    <Card
                                        key={ticket.id}
                                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                                        className="group relative overflow-hidden border border-white/40 bg-white/60 backdrop-blur-xl hover:bg-white/70 hover:shadow-xl hover:shadow-yellow-500/10 transition-all duration-300 shadow-sm cursor-pointer"
                                    >
                                        <div className={`h-1 w-full bg-yellow-400`} />
                                        <CardHeader className="pb-3 pt-4 px-5">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-sm font-bold text-slate-800 line-clamp-1">{ticket.title}</CardTitle>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-yellow-200 text-yellow-700 bg-yellow-50`}>
                                                    PENDING REVIEW
                                                </span>
                                            </div>
                                            <CardDescription className="text-xs text-slate-400 font-medium pt-1">
                                                ID: #{ticket.id} • {new Date(ticket.created_at).toLocaleDateString()}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="px-5 pb-4">
                                            <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                                                {ticket.description}
                                            </p>
                                            {ticket.resolution_notes && (
                                                <div className="mt-2 p-2.5 bg-yellow-50/80 border border-yellow-200/60 rounded-md text-xs text-yellow-800">
                                                    <div className="flex items-center gap-1.5 font-bold mb-1 text-yellow-700">
                                                        <CheckCircle2 size={12} /> Resolution Note
                                                    </div>
                                                    <div className="line-clamp-2 italic">{ticket.resolution_notes}</div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                        </AnimatePresence>

                        {tickets.filter(t => t.status === 'RESOLVED').length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-500 bg-white/40 backdrop-blur-sm rounded-xl border border-white/40 border-dashed">
                                <div className="inline-flex p-3 rounded-full bg-slate-100 mb-3 text-slate-400 shadow-inner">
                                    <Clock size={24} />
                                </div>
                                <p className="font-medium text-sm">No tickets pending unit review.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Closed Tickets Section */}
                <section className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-1.5 bg-gradient-to-b from-green-400 to-green-600 rounded-full shadow-lg shadow-green-500/30"></div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Closed Tickets</h2>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-extrabold border border-green-200 shadow-sm">
                                {tickets.filter(t => t.status === 'CLOSED').length} CLOSED
                            </span>
                            <DashboardFilters
                                priorityFilter={closedPriorityFilter}
                                setPriorityFilter={setClosedPriorityFilter}
                                sortOrder={closedSortOrder}
                                setSortOrder={setClosedSortOrder}
                                themeColor="green"
                            />
                            <Button variant="ghost" size="sm" className="hidden text-slate-500 hover:text-green-600 cursor-pointer ml-1" onClick={() => navigate('/team/closed-tickets')}>
                                View All <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4 grid-cols-1">
                        <AnimatePresence>
                            {tickets
                                .filter(t => t.status === 'CLOSED')
                                .filter(t => closedPriorityFilter === 'ALL' || t.priority === closedPriorityFilter)
                                .sort((a, b) => {
                                    if (closedSortOrder === 'NEWEST') return new Date(b.created_at) - new Date(a.created_at);
                                    if (closedSortOrder === 'OLDEST') return new Date(a.created_at) - new Date(b.created_at);
                                    return 0;
                                })
                                .slice(0, 5).map(ticket => (
                                    <Card
                                        key={ticket.id}
                                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                                        className="group relative overflow-hidden border border-white/40 bg-white/40 backdrop-blur-md opacity-80 hover:opacity-100 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 shadow-sm cursor-pointer"
                                    >
                                        <div className={`h-1 w-full bg-green-500`} />
                                        <CardHeader className="pb-3 pt-4 px-5">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-sm font-bold text-slate-700 line-clamp-1 decoration-slate-400/50">{ticket.title}</CardTitle>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-green-200 text-green-700 bg-green-50`}>
                                                    CLOSED
                                                </span>
                                            </div>
                                            <CardDescription className="text-xs text-slate-400 font-medium pt-1">
                                                ID: #{ticket.id} • {new Date(ticket.created_at).toLocaleDateString()}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="px-5 pb-4">
                                            <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                                                {ticket.description}
                                            </p>
                                            {ticket.resolution_notes && (
                                                <div className="mt-2 p-2.5 bg-green-50/80 border border-green-200/60 rounded-md text-xs text-green-800">
                                                    <div className="flex items-center gap-1.5 font-bold mb-1 text-green-700">
                                                        <CheckCircle2 size={12} /> Resolution Note
                                                    </div>
                                                    <div className="line-clamp-2 italic">{ticket.resolution_notes}</div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                        </AnimatePresence>

                        {tickets.filter(t => t.status === 'CLOSED').length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-500 bg-white/40 backdrop-blur-sm rounded-xl border border-white/40 border-dashed">
                                <div className="inline-flex p-3 rounded-full bg-slate-100 mb-3 text-slate-400 shadow-inner">
                                    <CheckCircle2 size={24} />
                                </div>
                                <p className="font-medium text-sm">No closed tickets yet.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <AnimatePresence>
                {resolvingTicket && (
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
                                <div className="h-2 bg-gradient-to-r from-green-500 via-white to-orange-600"></div>
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-slate-900">Mark for Review</CardTitle>
                                    <CardDescription className="text-slate-500">Provide details on the resolution for unit approval.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleResolve} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Resolution Notes</label>
                                            <textarea
                                                className="w-full min-h-[150px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-all focus-visible:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none"
                                                placeholder="Describe the solution implementation..."
                                                value={resolutionNotes}
                                                onChange={e => setResolutionNotes(e.target.value)}
                                                required
                                            />
                                        </div>
                                        {resolveError && (
                                            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                                {resolveError}
                                            </div>
                                        )}
                                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-4">
                                            <Button type="button" variant="ghost" onClick={() => { setResolvingTicket(null); setResolveError(''); }} className="hover:bg-slate-100 text-slate-600">
                                                Cancel
                                            </Button>
                                            <Button type="submit" variant="default" className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-600/20">
                                                Submit for Review
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
