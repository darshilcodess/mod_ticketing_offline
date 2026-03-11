import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Clock, CheckCircle2, AlertCircle, ArrowRight, FileSearch, RotateCcw, SendToBack, ThumbsUp, CalendarDays, FileText, ShieldCheck, AlertTriangle, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import VoucherModal from '../../components/VoucherModal';
import DashboardFilters from '../../components/DashboardFilters';

export default function UnitDashboard() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [createVoucher, setCreateVoucher] = useState(false);
    const [addMoreDetails, setAddMoreDetails] = useState(false);
    const [modalStep, setModalStep] = useState(1);
    const [activeTicketId, setActiveTicketId] = useState(null);
    const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'MEDIUM', remarks: '', details: [], documents: [] });
    const [pendingSortOrder, setPendingSortOrder] = useState('NEWEST');
    const [pendingPriorityFilter, setPendingPriorityFilter] = useState('ALL');
    const [activePriorityFilter, setActivePriorityFilter] = useState('ALL');
    const [activeSortOrder, setActiveSortOrder] = useState('NEWEST');
    const [resolvedPriorityFilter, setResolvedPriorityFilter] = useState('ALL');
    const [resolvedSortOrder, setResolvedSortOrder] = useState('NEWEST');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const { data } = await api.get('/tickets/');
            setTickets(data);
        } catch (error) {
            console.error("Failed to fetch tickets", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (showCreateModal || showVoucherModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [showCreateModal, showVoucherModal]);

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('title', newTicket.title);
            formData.append('description', newTicket.description);
            formData.append('priority', newTicket.priority);
            if (newTicket.remarks) {
                formData.append('remarks', newTicket.remarks);
            }
            if (newTicket.documents && newTicket.documents.length > 0) {
                newTicket.documents.forEach(file => {
                    formData.append('files', file);
                });
            }

            if (newTicket.details && newTicket.details.length > 0) {
                // Filter out empty rows before sending
                const validDetails = newTicket.details.filter(row => row.key.trim() !== '');
                if (validDetails.length > 0) {
                    // Convert array of {key, value} to a standard dictionary object
                    const detailsDict = validDetails.reduce((acc, row) => {
                        acc[row.key] = row.value;
                        return acc;
                    }, {});
                    formData.append('details', JSON.stringify(detailsDict));
                }
            }

            const { data } = await api.post('/tickets/', formData);
            setShowCreateModal(false);
            setModalStep(1);
            setAddMoreDetails(false);
            setNewTicket({ title: '', description: '', priority: 'MEDIUM', remarks: '', details: [], documents: [] });
            fetchTickets();

            // Open voucher modal after ticket is created
            if (createVoucher) {
                setCreateVoucher(false);
                setActiveTicketId(data.id);
                setShowVoucherModal(true);
            }
        } catch (error) {
            console.error("Failed to create ticket", error);
        }
    };

    const handleCloseCreateModal = () => {
        setShowCreateModal(false);
        setCreateVoucher(false);
        setAddMoreDetails(false);
        setModalStep(1);
        setNewTicket({ title: '', description: '', priority: 'MEDIUM', remarks: '', details: [], documents: [] });
    };

    const addDetailRow = () => {
        setNewTicket(prev => ({ ...prev, details: [...prev.details, { key: '', value: '' }] }));
    };

    const updateDetailRow = (index, field, value) => {
        const updatedDetails = [...newTicket.details];
        updatedDetails[index][field] = value;
        setNewTicket(prev => ({ ...prev, details: updatedDetails }));
    };

    const removeDetailRow = (index) => {
        const updatedDetails = newTicket.details.filter((_, i) => i !== index);
        setNewTicket(prev => ({ ...prev, details: updatedDetails }));
    };

    const handleApprove = async (e, ticketId) => {
        e.stopPropagation();
        try {
            await api.patch(`/tickets/${ticketId}/close`);
            fetchTickets();
        } catch (error) {
            console.error("Failed to approve ticket", error);
        }
    };

    const handleReallocateToG1 = async (e, ticketId) => {
        e.stopPropagation();
        try {
            await api.patch(`/tickets/${ticketId}/reallocate-to-g1`);
            fetchTickets();
        } catch (error) {
            console.error("Failed to reallocate to G1", error);
        }
    };

    const handleReallocateToTeam = async (e, ticketId) => {
        e.stopPropagation();
        try {
            await api.patch(`/tickets/${ticketId}/reallocate-to-team`);
            fetchTickets();
        } catch (error) {
            console.error("Failed to reallocate to same team", error);
        }
    };

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

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/30 backdrop-blur-xl p-6 rounded-2xl border border-white/40 shadow-xl">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 drop-shadow-sm">
                        Unit Dashboard
                    </h1>
                    <p className="text-slate-600">Manage and track your service requests</p>
                </div>
                <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Ticket
                </Button>
            </div>

            {/* Pending Review — full width on top */}
            <section className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 border border-white/20 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-1 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full shadow-lg shadow-yellow-500/30"></div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Pending Review</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-[10px] font-extrabold border border-yellow-200 shadow-sm">
                            {tickets.filter(t => t.status === 'RESOLVED').length} PENDING
                        </span>
                        <DashboardFilters
                            priorityFilter={pendingPriorityFilter}
                            setPriorityFilter={setPendingPriorityFilter}
                            sortOrder={pendingSortOrder}
                            setSortOrder={setPendingSortOrder}
                            themeColor="yellow"
                        />
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 hover:text-yellow-600 cursor-pointer" onClick={() => navigate('/unit/pending-review')}>
                            View All <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence>
                        {tickets
                            .filter(t => t.status === 'RESOLVED')
                            .filter(t => pendingPriorityFilter === 'ALL' || t.priority === pendingPriorityFilter)
                            .sort((a, b) => {
                                if (pendingSortOrder === 'NEWEST') return new Date(b.created_at) - new Date(a.created_at);
                                if (pendingSortOrder === 'OLDEST') return new Date(a.created_at) - new Date(b.created_at);
                                return 0;
                            })
                            .slice(0, 6)
                            .map((ticket, i) => (
                                <motion.div
                                    key={ticket.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.97 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group flex flex-col rounded-2xl border border-yellow-200/70 bg-white/70 backdrop-blur-xl shadow-md hover:shadow-xl hover:shadow-yellow-400/10 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                                >
                                    {/* Card header accent */}
                                    <div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400" />

                                    {/* Title + meta row */}
                                    <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                                        <div className="mt-0.5 flex-shrink-0 p-2 rounded-xl bg-yellow-50 border border-yellow-200 shadow-sm">
                                            <FileSearch className="w-4 h-4 text-yellow-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3
                                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                                                className="font-bold text-slate-800 text-sm line-clamp-1 hover:text-yellow-700 cursor-pointer transition-colors"
                                            >
                                                {ticket.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                                    <CalendarDays className="w-3 h-3" />
                                                    {new Date(ticket.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[9px] font-bold border border-yellow-200 uppercase tracking-widest">
                                                    Pending Review
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="px-4 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                        {ticket.description}
                                    </p>

                                    {/* Resolution notes block */}
                                    {ticket.resolution_notes && (
                                        <div className="mx-4 mt-3 rounded-xl bg-amber-50 border border-amber-200/70 p-3">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600 mb-1">Team's Resolution Note</p>
                                            <p className="text-[11px] text-amber-900 leading-relaxed line-clamp-3 italic">
                                                "{ticket.resolution_notes}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Divider */}
                                    <div className="mx-4 mt-4 border-t border-slate-100" />

                                    {/* Action buttons */}
                                    <div className="px-4 pt-3 pb-4 flex flex-col gap-2">
                                        {/* Primary — Approve */}
                                        <button
                                            onClick={(e) => handleApprove(e, ticket.id)}
                                            className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs font-bold py-2 shadow-sm shadow-green-400/30 hover:shadow-md hover:shadow-green-500/30 transition-all duration-200 cursor-pointer"
                                        >
                                            <ThumbsUp className="w-3.5 h-3.5" />
                                            Approve &amp; Close
                                        </button>

                                        {/* Secondary row */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={(e) => handleReallocateToTeam(e, ticket.id)}
                                                className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold py-1.5 transition-all duration-200 cursor-pointer"
                                            >
                                                <RotateCcw className="w-3 h-3" />
                                                Retry · Same Team
                                            </button>
                                            <button
                                                onClick={(e) => handleReallocateToG1(e, ticket.id)}
                                                className="flex items-center justify-center gap-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-[10px] font-bold py-1.5 transition-all duration-200 cursor-pointer"
                                            >
                                                <SendToBack className="w-3 h-3" />
                                                Return to G1
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                    </AnimatePresence>
                    {tickets.filter(t => t.status === 'RESOLVED').length === 0 && (
                        <div className="col-span-full py-10 text-center text-slate-400 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40 border-dashed">
                            <div className="inline-flex p-3 rounded-full bg-yellow-50 border border-yellow-100 mb-3">
                                <FileSearch className="w-5 h-5 text-yellow-400" />
                            </div>
                            <p className="font-semibold text-sm text-slate-500">No resolutions pending your review.</p>
                            <p className="text-xs text-slate-400 mt-0.5">You're all caught up!</p>
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
                                <p className="font-medium text-sm">All caught up! No open tickets.</p>
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

            {/* ── Create Ticket Modal ── */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-lg"
                        >
                            <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden min-h-[500px] max-h-[90vh] flex flex-col">
                                <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 p-6 border-b border-orange-100 shrink-0">
                                    <CardTitle className="text-orange-800 text-xl font-bold">
                                        {modalStep === 1 ? 'Create New Ticket' : 'Add More Details'}
                                    </CardTitle>
                                    <CardDescription className="text-orange-600/80 font-medium">
                                        {modalStep === 1 ? 'Submit a new issue for the team to resolve.' : 'Provide specific attributes and upload relevant documents.'}
                                    </CardDescription>
                                </div>
                                <CardContent className="p-6 flex-1 overflow-y-auto">
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        if (modalStep === 1 && addMoreDetails) {
                                            setModalStep(2);
                                            // Ensure there's at least one empty row when navigating to step 2
                                            if (newTicket.details.length === 0) {
                                                addDetailRow();
                                            }
                                        } else {
                                            handleCreateTicket(e);
                                        }
                                    }} className="space-y-5 h-full flex flex-col">

                                        {modalStep === 1 && (
                                            <div className="space-y-5 flex-1">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Title</label>
                                                    <Input
                                                        placeholder="Brief summary of the issue"
                                                        value={newTicket.title}
                                                        onChange={e => setNewTicket({ ...newTicket, title: e.target.value })}
                                                        required
                                                        className="border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Description</label>
                                                    <textarea
                                                        className="w-full min-h-[120px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 resize-none"
                                                        placeholder="Please provide detailed information about the issue..."
                                                        value={newTicket.description}
                                                        onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-sm font-semibold text-slate-700">Priority Level</label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {Object.entries({
                                                            LOW: { icon: <ShieldCheck size={14} />, desc: "Routine maintenance or non-critical inquiries." },
                                                            MEDIUM: { icon: <AlertCircle size={14} />, desc: "Standard requests or issues with workarounds." },
                                                            HIGH: { icon: <AlertTriangle size={14} />, desc: "Important tasks with performance impact." },
                                                            CRITICAL: { icon: <Zap size={14} />, desc: "System blocking issues or critical failures." }
                                                        }).map(([p, cfg]) => (
                                                            <div key={p} className="relative group">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setNewTicket({ ...newTicket, priority: p })}
                                                                    className={`w-full flex items-center justify-center gap-2 px-3 py-3 text-xs font-bold rounded-xl border transition-all duration-200 ${newTicket.priority === p
                                                                        ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-600/20 scale-[1.02]'
                                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700'
                                                                        }`}
                                                                >
                                                                    {cfg.icon}
                                                                    {p}
                                                                </button>

                                                                {/* Simple Tooltip */}
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[60] shadow-xl text-center">
                                                                    <div className="font-bold border-b border-white/20 pb-1 mb-1">{p} Priority</div>
                                                                    {cfg.desc}
                                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Remarks (Optional)</label>
                                                    <Input
                                                        placeholder="Any additional remarks or context..."
                                                        value={newTicket.remarks}
                                                        onChange={e => setNewTicket({ ...newTicket, remarks: e.target.value })}
                                                        className="border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                                                    />
                                                </div>

                                                {/* ── Add More Details Checkbox ── */}
                                                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors group">
                                                    <input
                                                        type="checkbox"
                                                        checked={addMoreDetails}
                                                        onChange={(e) => setAddMoreDetails(e.target.checked)}
                                                        className="w-4 h-4 rounded border-slate-300 accent-orange-500 cursor-pointer"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <Plus className="w-4 h-4 text-slate-500 group-hover:text-orange-500 transition-colors" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-700 group-hover:text-orange-700 transition-colors">
                                                                Add More Details & Attachments
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                Include custom key-value attributes and file attachments
                                                            </p>
                                                        </div>
                                                    </div>
                                                </label>

                                                {/* ── Voucher Checkbox ── */}
                                                <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50/50 hover:bg-orange-50 cursor-pointer transition-colors group">
                                                    <input
                                                        type="checkbox"
                                                        checked={createVoucher}
                                                        onChange={(e) => setCreateVoucher(e.target.checked)}
                                                        className="w-4 h-4 rounded border-orange-300 accent-orange-500 cursor-pointer"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-orange-500" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-700 group-hover:text-orange-700 transition-colors">
                                                                Generate a Voucher
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                Opens the document generator after ticket is created
                                                            </p>
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>
                                        )}

                                        {/* ── Step 2: Extra Details & Attachments ── */}
                                        {modalStep === 2 && (
                                            <div className="space-y-6 flex-1">

                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-sm font-semibold text-slate-700">Custom Attributes</label>
                                                        <Button type="button" size="sm" variant="outline" onClick={addDetailRow} className="h-8 text-xs text-orange-600 border-orange-200 hover:bg-orange-50">
                                                            <Plus className="w-3 h-3 mr-1" /> Add Row
                                                        </Button>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {newTicket.details.map((row, idx) => (
                                                            <div key={idx} className="flex gap-2 items-center">
                                                                <Input
                                                                    placeholder="Key (e.g. Server IP)"
                                                                    value={row.key}
                                                                    onChange={(e) => updateDetailRow(idx, 'key', e.target.value)}
                                                                    className="flex-1 border-slate-200 focus:border-orange-500"
                                                                />
                                                                <span className="text-slate-400 font-bold">:</span>
                                                                <Input
                                                                    placeholder="Value (e.g. 192.168.1.5)"
                                                                    value={row.value}
                                                                    onChange={(e) => updateDetailRow(idx, 'value', e.target.value)}
                                                                    className="flex-[2] border-slate-200 focus:border-orange-500"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removeDetailRow(idx)}
                                                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 h-10 w-10 shrink-0"
                                                                >
                                                                    <Plus className="w-4 h-4 rotate-45" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                        {newTicket.details.length === 0 && (
                                                            <div className="text-center py-4 bg-slate-50 border border-slate-100 border-dashed rounded-xl text-sm text-slate-500">
                                                                No custom attributes added.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-slate-100 space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Attachments (Optional)</label>
                                                    <Input
                                                        type="file"
                                                        multiple
                                                        accept=".pdf,.docx,.png,.jpg,.jpeg"
                                                        onChange={e => setNewTicket({ ...newTicket, documents: Array.from(e.target.files) })}
                                                        className="border-slate-200 focus:border-orange-500 focus:ring-orange-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                                    />
                                                    <p className="text-xs text-slate-500">Allowed formats: PDF, DOCX, PNG, JPG/JPEG</p>
                                                </div>

                                            </div>
                                        )}

                                        <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto shrink-0">
                                            {modalStep === 2 ? (
                                                <Button type="button" variant="ghost" onClick={() => setModalStep(1)} className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                                                    Back
                                                </Button>
                                            ) : (
                                                <Button type="button" variant="ghost" onClick={handleCloseCreateModal} className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                                                    Cancel
                                                </Button>
                                            )}

                                            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white px-6">
                                                {modalStep === 1 && addMoreDetails
                                                    ? 'Next'
                                                    : (createVoucher ? 'Create & Proceed to Voucher' : 'Submit Ticket')}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showVoucherModal && (
                    <VoucherModal
                        ticketId={activeTicketId}
                        onClose={() => {
                            setShowVoucherModal(false);
                            setActiveTicketId(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
