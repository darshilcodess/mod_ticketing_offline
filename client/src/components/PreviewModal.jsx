import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, ExternalLink, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function PreviewModal({ document, onClose }) {
    if (!document) return null;

    const baseURL = api.defaults.baseURL || 'http://localhost:8000/api/v1';
    const directPdfUrl = `${baseURL}/documents/download/${document.file_id}`;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    Document Preview
                                </h2>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                    {document.document_type.split('_').join(' ')} • {document.file_id}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <a
                                href={directPdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-all shadow-md group"
                            >
                                <Download size={16} className="group-hover:scale-110 transition-transform" />
                                <span>Download File</span>
                                <ExternalLink size={14} className="opacity-50" />
                            </a>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* PDF Viewer */}
                    <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                        <iframe
                            src={directPdfUrl}
                            className="w-full h-full border-none"
                            title="PDF Preview"
                        />
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                        <p className="text-[10px] text-slate-400 font-medium">
                            End-to-End Encrypted Selection • MOD Ticketing System
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
