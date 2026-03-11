import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion } from 'framer-motion';
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    MessageSquare,
    Paperclip,
    Send,
    FileText,
    MoreVertical,
    User,
    Calendar,
    ChevronRight,
    ArrowLeft,
    ShieldCheck,
    RotateCcw,
    Info,
    Pencil,
    DownloadCloud,
    X,
    Eye,
    Building,
    History,
    ArrowRight
} from 'lucide-react';
import TicketComments from '../components/TicketComments';
import VoucherModal from '../components/VoucherModal';
import EditDocumentModal from '../components/EditDocumentModal';
import PreviewModal from '../components/PreviewModal';

/* ── Helpers ──────────────────────────────────── */
const STATUS_STYLES = {
    OPEN: 'text-blue-600 bg-blue-50 border-blue-200',
    ALLOCATED: 'text-orange-600 bg-orange-50 border-orange-200',
    RESOLVED: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    CLOSED: 'text-green-600 bg-green-50 border-green-200',
};
const PRIORITY_BAR = {
    CRITICAL: 'bg-red-500',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-yellow-500',
    LOW: 'bg-blue-500',
};
const PRIORITY_BADGE = {
    CRITICAL: 'bg-red-500 text-white border-red-600',
    HIGH: 'bg-orange-500 text-white border-orange-600',
    MEDIUM: 'bg-yellow-500 text-white border-yellow-600',
    LOW: 'bg-blue-500 text-white border-blue-600',
};
const HISTORY_STYLES = {
    CREATED: { dot: 'bg-blue-500', text: 'text-blue-700', label: '🆕 Created', icon: <Building size={12} /> },
    ALLOCATED: { dot: 'bg-purple-500', text: 'text-purple-700', label: '📋 Allocated', icon: <ArrowRight size={12} /> },
    MARKED_FOR_REVIEW: { dot: 'bg-yellow-500', text: 'text-yellow-700', label: '🔍 Marked for Review', icon: <Clock size={12} /> },
    APPROVED_AND_CLOSED: { dot: 'bg-green-500', text: 'text-green-700', label: '✅ Approved & Closed', icon: <CheckCircle2 size={12} /> },
    REALLOCATED_TO_G1: { dot: 'bg-red-500', text: 'text-red-700', label: '⬆ Sent back to G1', icon: <Send size={12} className="rotate-180" /> },
    REALLOCATED_TO_SAME_TEAM: { dot: 'bg-amber-500', text: 'text-amber-700', label: '↩ Returned to Team', icon: <RotateCcw size={12} /> },
    COMMENT_ADDED: { dot: 'bg-orange-500', text: 'text-orange-700', label: '💬 Comment Added', icon: <MessageSquare size={12} /> },
};

export default function TicketDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // Added user from useAuth
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState(''); // Added comment state
    const [submitting, setSubmitting] = useState(false); // Added submitting state
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false); // Added isVoucherModalOpen state
    const [previewDoc, setPreviewDoc] = useState(null); // Added previewDoc state
    const [editDoc, setEditDoc] = useState(null); // Added editDoc state

    const fetchTicketDetails = useCallback(async () => {
        try {
            const { data } = await api.get(`/tickets/${id}`);
            setTicket(data);
        } catch (err) {
            console.error('Failed to fetch ticket', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchTicketDetails();
    }, [id, fetchTicketDetails]);

    const handleApprove = async () => {
        try {
            await api.patch(`/tickets/${id}/close`);
            const { data } = await api.get(`/tickets/${id}`);
            setTicket(data);
        } catch (err) {
            console.error('Failed to approve ticket', err);
        }
    };

    /* ── Loading ── */
    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!ticket) return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
            <h2 className="text-2xl font-bold text-slate-700">Ticket Not Found</h2>
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 border border-white/50 text-slate-600 hover:text-orange-600 transition-all cursor-pointer shadow-sm">
                <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
        </div>
    );

    const statusLabel = ticket.status === 'RESOLVED' ? 'PENDING REVIEW' : ticket.status;

    return (
        <div className="space-y-5">

            {/* ── Page Header ─────────────────────────────── */}
            <div className="flex items-center justify-between bg-white/30 backdrop-blur-xl p-5 rounded-2xl border border-white/40 shadow-xl">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl bg-white/60 hover:bg-white/80 border border-white/50 text-slate-600 hover:text-orange-600 transition-all cursor-pointer shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Ticket #{id}</p>
                        <h1 className="text-2xl font-bold text-slate-800 leading-tight line-clamp-1">{ticket.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${PRIORITY_BADGE[ticket.priority] ?? 'bg-slate-500 text-white border-slate-600'}`}>
                        {ticket.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${STATUS_STYLES[ticket.status] ?? 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                        {statusLabel}
                    </span>
                    {ticket.status === 'RESOLVED' && (
                        <button
                            onClick={handleApprove}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-md transition-all cursor-pointer"
                        >
                            <CheckCircle2 className="w-4 h-4" /> Approve Resolution
                        </button>
                    )}
                </div>
            </div>

            {/* ── Ticket Info Card ─────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/40 bg-white/30 backdrop-blur-xl shadow-xl overflow-hidden"
            >
                {/* Priority colour bar */}
                <div className={`h-1.5 w-full ${PRIORITY_BAR[ticket.priority] ?? 'bg-slate-400'}`} />

                <div className="p-6 space-y-6">
                    {/* Meta row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 bg-white/50 p-4 rounded-xl border border-white/60 shadow-sm">
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                <Building size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Unit / Location</p>
                                <p className="font-semibold text-slate-800">Unit {ticket.unit_id || 'N/A'}</p>
                            </div>
                        </div>

                        {ticket.assigned_to && (
                            <div className="flex items-center gap-3 bg-white/50 p-4 rounded-xl border border-white/60 shadow-sm">
                                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                                    <User size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assigned To</p>
                                    <p className="font-semibold text-slate-800">Team {ticket.assigned_to}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 bg-white/50 p-4 rounded-xl border border-white/60 shadow-sm">
                            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                                <Clock size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Created</p>
                                <p className="font-semibold text-slate-800 text-sm">{new Date(ticket.created_at).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Remarks */}
                    {ticket.remarks && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Remarks</p>
                            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 shadow-sm text-slate-700 leading-relaxed text-sm">
                                {ticket.remarks}
                            </div>
                        </div>
                    )}

                    {/* Additional Details (Key-Value) */}
                    {ticket.details && Object.keys(ticket.details).length > 0 && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Additional Details</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(ticket.details).map(([key, value], idx) => (
                                    <div key={idx} className="bg-white/50 px-4 py-3 rounded-lg border border-slate-200 shadow-sm flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{key}</span>
                                        <span className="text-sm font-semibold text-slate-800">{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Description</p>
                        <div className="bg-white/50 p-5 rounded-xl border border-white/60 shadow-sm text-slate-700 leading-relaxed">
                            {ticket.description}
                        </div>
                    </div>

                    {/* Resolution notes */}
                    {ticket.resolution_notes && (
                        <div className="bg-green-50/80 border border-green-200 rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <CheckCircle2 size={80} className="text-green-600" />
                            </div>
                            <h3 className="flex items-center gap-2 text-green-800 font-bold mb-2 relative z-10">
                                <CheckCircle2 size={18} /> Resolution Notes
                            </h3>
                            <p className="text-green-900 leading-relaxed relative z-10">{ticket.resolution_notes}</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ── Documents Section ──────────────────────────── */}
            {ticket.documents && ticket.documents.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl border border-white/40 bg-white/30 backdrop-blur-xl shadow-xl overflow-hidden"
                >
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-white/40 bg-white/20">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20">
                            <FileText size={16} />
                        </div>
                        <h2 className="text-base font-bold text-slate-800">Attached Documents</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {ticket.documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-white/50 border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm italic">
                                                {doc.document_type === 'voucher' ? 'Voucher' : doc.document_type.split('_').join(' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </p>
                                            <p className="text-[10px] text-slate-400 capitalize">{new Date(doc.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Preview Button */}
                                        <button
                                            onClick={() => setPreviewDoc(doc)}
                                            className="p-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                            title="Quick Preview"
                                        >
                                            <Eye size={16} />
                                        </button>

                                        {/* Edit Button - Only for UNIT and ADMIN */}
                                        {(user?.role === 'UNIT' || user?.role === 'ADMIN') && (
                                            <button
                                                onClick={() => setEditDoc(doc)}
                                                className="p-2 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                                title="Edit Details"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        )}

                                        {/* Download Link */}
                                        <a
                                            href={`${api.defaults.baseURL || 'http://localhost:8000/api/v1'}/documents/download/${doc.file_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-sm"
                                            title="Download PDF"
                                        >
                                            <DownloadCloud size={16} />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── Comments Section ─────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="rounded-2xl border border-white/40 bg-white/30 backdrop-blur-xl shadow-xl overflow-hidden"
            >
                {/* Section heading */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/40 bg-white/20">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 border border-orange-500/20">
                        <MessageSquare size={16} />
                    </div>
                    <h2 className="text-base font-bold text-slate-800">Comments</h2>
                </div>
                <div className="p-6">
                    <TicketComments ticketId={id} />
                </div>
            </motion.div>

            {/* ── History Section ──────────────────────────── */}
            {ticket.history && ticket.history.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.14 }}
                    className="rounded-2xl border border-white/40 bg-white/30 backdrop-blur-xl shadow-xl overflow-hidden"
                >
                    {/* Section heading */}
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-white/40 bg-white/20">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                            <History size={16} />
                        </div>
                        <h2 className="text-base font-bold text-slate-800">Issue History</h2>
                        <span className="ml-auto px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                            {ticket.history.length} event{ticket.history.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="p-6">
                        <ol className="relative border-l border-slate-200 ml-3 space-y-6">
                            {ticket.history.map((event, idx) => {
                                const style = HISTORY_STYLES[event.event] || { dot: 'bg-slate-400', text: 'text-slate-600', label: event.event };
                                return (
                                    <li key={idx} className="ml-6">
                                        <span className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full ${style.dot} ring-4 ring-white shadow-sm text-white`}>
                                            {style.icon || null}
                                        </span>
                                        <div className="flex flex-wrap items-baseline gap-x-2 mb-1">
                                            <span className={`text-xs font-bold uppercase ${style.text}`}>{style.label}</span>
                                            <span className="text-[10px] text-slate-400">{new Date(event.timestamp).toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-slate-600">
                                            By <span className="font-semibold">{event.actor}</span>
                                            {event.role && <span className="text-slate-400"> ({event.role})</span>}
                                            {event.team_name && <span> → <span className="font-semibold text-orange-700">{event.team_name}</span></span>}
                                        </p>
                                        {event.notes && (
                                            <p className="mt-1 text-[11px] text-slate-500 italic bg-white/60 px-3 py-1.5 rounded-lg border border-slate-200">
                                                "{event.notes}"
                                            </p>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                </motion.div>
            )}
            {/* Modals */}
            {previewDoc && (
                <PreviewModal
                    document={previewDoc}
                    onClose={() => setPreviewDoc(null)}
                />
            )}
            {editDoc && (
                <EditDocumentModal
                    document={editDoc}
                    onClose={() => {
                        setEditDoc(null);
                        fetchTicketDetails();
                    }}
                />
            )}
            {isVoucherModalOpen && (
                <VoucherModal
                    onClose={() => {
                        setIsVoucherModalOpen(false);
                        fetchTicketDetails();
                    }}
                    ticketId={id}
                />
            )}
        </div>
    );
}
