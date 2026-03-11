import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const TicketComments = ({ ticketId }) => {
    const { user: currentUser } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const commentsEndRef = useRef(null);

    const fetchComments = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${API_URL}/tickets/${ticketId}/comments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComments(data);
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
        const interval = setInterval(fetchComments, 10000);
        return () => clearInterval(interval);
    }, [ticketId]);

    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/tickets/${ticketId}/comments`,
                { content: newComment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewComment('');
            fetchComments();
        } catch (err) {
            console.error('Error posting comment:', err);
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            + ' · ' + d.toLocaleDateString();
    };

    return (
        <div className="flex flex-col gap-5">
            {/* Comment list */}
            <div className="min-h-[180px] max-h-[420px] overflow-y-auto space-y-3 pr-1">
                {loading ? (
                    <div className="text-center text-slate-400 py-8 text-sm">Loading comments…</div>
                ) : comments.length === 0 ? (
                    <div className="text-center text-slate-400 py-10 italic text-sm">
                        No comments yet — start the conversation!
                    </div>
                ) : (
                    comments.map((comment) => {
                        const isMe = currentUser
                            ? comment.user_id === currentUser.id
                            : comment.is_me;
                        return (
                            <div
                                key={comment.id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm text-sm ${isMe
                                        ? 'bg-orange-500 text-white rounded-tr-none'
                                        : 'bg-white/70 backdrop-blur-sm text-slate-800 border border-white/60 rounded-tl-none'
                                    }`}>
                                    {!isMe && (
                                        <div className="text-xs font-semibold text-orange-600 mb-1 flex items-center gap-1">
                                            <UserIcon size={11} /> {comment.user_name}
                                        </div>
                                    )}
                                    <p className="whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                                    <div className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-orange-100' : 'text-slate-400'}`}>
                                        {formatDate(comment.created_at)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={commentsEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-3 items-center">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type your comment…"
                    className="flex-1 px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-300 shadow-sm transition-all"
                />
                <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default TicketComments;
