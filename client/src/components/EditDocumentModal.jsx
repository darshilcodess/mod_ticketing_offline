import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, FileText, AlertCircle, FileCheck, Plus, Trash2 } from 'lucide-react';
import api from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

const TEMPLATES = [
    { id: 'voucher', name: 'Standard Voucher' },
    { id: 'outbound_delivery', name: 'Outbound Delivery' },
    { id: 'voucher_variable_qty', name: 'Voucher (Variable Qty)' },
    { id: 'voucher_title', name: 'Voucher with Title' },
    { id: 'voucher_explanation', name: 'Voucher with Explanation' }
];

export default function EditDocumentModal({ document, onClose }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({});

    const template = TEMPLATES.find(t => t.id === document.document_type) || { name: 'Document' };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/documents/content/${document.file_id}`);
                setFormData(data.data);
            } catch (err) {
                console.error('Failed to fetch document content:', err);
                setError('Failed to load document data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (document) fetchData();
    }, [document]);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            await api.put(`/documents/${document.file_id}`, formData);
            onClose();
        } catch (err) {
            console.error('Failed to update document:', err);
            setError(err.response?.data?.detail || 'Failed to update document.');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        if (!formData.items || formData.items.length === 0) return;
        const itemSchema = formData.items[0];
        const newItem = Object.keys(itemSchema).reduce((acc, key) => ({ ...acc, [key]: '' }), {});
        setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    };

    const removeItem = (index) => {
        if (formData.items.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    };

    const renderFormFields = () => {
        switch (document.document_type) {
            case 'voucher':
                return renderVoucherFields();
            case 'outbound_delivery':
                return renderOutboundFields();
            case 'voucher_variable_qty':
                return renderVariableQtyFields();
            case 'voucher_title':
                return renderTitleFields();
            case 'voucher_explanation':
                return renderExplanationFields();
            default:
                return <p className="text-slate-500 italic text-center py-10">Unknown document type: {document.document_type}</p>;
        }
    };

    const renderVoucherFields = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-orange-600 uppercase">IV Details</p>
                    {['iv_no', 'unit_iv', 'stn_iv', 'date_iv'].map(f => (
                        <div key={f} className="space-y-0.5">
                            <label className="text-[9px] text-slate-400 uppercase font-bold">{f.replace('_', ' ')}</label>
                            <Input value={formData[f] || ''} onChange={e => updateField(f, e.target.value)} className="h-8 text-xs" />
                        </div>
                    ))}
                </div>
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-blue-600 uppercase">RV Details</p>
                    {['rv_no', 'unit_rv', 'stn_rv', 'date_rv'].map(f => (
                        <div key={f} className="space-y-0.5">
                            <label className="text-[9px] text-slate-400 uppercase font-bold">{f.replace('_', ' ')}</label>
                            <Input value={formData[f] || ''} onChange={e => updateField(f, e.target.value)} className="h-8 text-xs" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Body</p>
                {['issued_to', 'compliance', 'auth'].map(f => (
                    <div key={f} className="space-y-0.5">
                        <label className="text-[9px] text-slate-400 uppercase font-bold">{f.replace('_', ' ')}</label>
                        <Input value={formData[f] || ''} onChange={e => updateField(f, e.target.value)} className="h-8 text-xs" />
                    </div>
                ))}
            </div>
            {renderItemTable(['part_no', 'nomenclature', 'total', 'remarks'])}
        </div>
    );

    const renderOutboundFields = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
                {['shipment_no', 'shipment_date', 'class_name', 'obd_from', 'obd_to', 'obd_creation_date', 'str_no', 'tracking_number', 'str_date', 'sto_no', 'priority', 'type_of_str', 'authority', 'from_location', 'to_location', 'sus_no', 'ibd_number'].map(f => (
                    <div key={f} className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">{f.replace(/_/g, ' ')}</label>
                        <Input value={formData[f] || ''} onChange={e => updateField(f, e.target.value)} className="h-7 text-[11px]" />
                    </div>
                ))}
            </div>
            {renderItemTable(['cos_section', 'part_number', 'sap_number', 'material_description', 'batch_no', 'serial_no', 'au', 'demand_qty', 'obd_qty', 'sub_depot'])}
        </div>
    );

    const renderVariableQtyFields = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
                {['iv_no', 'rv_no', 'unit_iv', 'unit_rv', 'stn_iv', 'stn_rv', 'date_iv', 'date_rv', 'issued_to', 'compliance', 'auth', 'issued_by', 'handed_over', 'taken_over', 'received_by'].map(f => (
                    <div key={f} className="space-y-0.5">
                        <label className="text-[9px] text-slate-400 uppercase font-bold">{f.replace('_', ' ')}</label>
                        <Input value={formData[f] || ''} onChange={e => updateField(f, e.target.value)} className="h-8 text-xs" />
                    </div>
                ))}
            </div>
            {renderItemTable(['part_no', 'nomenclature', 'hq', 'p', 'q', 'total'])}
        </div>
    );

    const renderTitleFields = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
                {['iv_no', 'rv_no', 'date_iv', 'date_rv', 'unit_iv', 'unit_rv', 'pin_iv', 'pin_rv', 'station_iv', 'station_rv', 'issued_to', 'compliance', 'authority', 'issued_by', 'handed_over', 'taken_over', 'received_by'].map(f => (
                    <div key={f} className="space-y-0.5">
                        <label className="text-[9px] text-slate-400 uppercase font-bold">{f.replace('_', ' ')}</label>
                        <Input value={formData[f] || ''} onChange={e => updateField(f, e.target.value)} className="h-8 text-xs" />
                    </div>
                ))}
            </div>
            {renderItemTable(['vehicle_type', 'ba_no', 'au', 'qty', 'remarks'])}
        </div>
    );

    const renderExplanationFields = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
                {['iv_no', 'rv_no', 'date_iv', 'date_rv', 'unit_iv', 'unit_rv', 'stn_iv', 'stn_rv', 'center_heading', 'issued_by', 'handed_over', 'taken_over', 'received_by'].map(f => (
                    <div key={f} className="space-y-0.5">
                        <label className="text-[9px] text-slate-400 uppercase font-bold">{f.replace('_', ' ')}</label>
                        <Input value={formData[f] || ''} onChange={e => updateField(f, e.target.value)} className="h-8 text-xs" />
                    </div>
                ))}
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Paragraph Text</label>
                <textarea
                    className="w-full h-24 p-2 text-xs border rounded-md"
                    value={formData.paragraph_text || ''}
                    onChange={e => updateField('paragraph_text', e.target.value)}
                />
            </div>
            {renderItemTable(['part_no', 'nomenclature', 'au', 'qty', 'remarks'])}
        </div>
    );

    const renderItemTable = (fields) => (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Items List</p>
                <button onClick={addItem} className="text-[10px] font-bold text-orange-600 hover:text-orange-700">+ ADD ITEM</button>
            </div>
            <div className="border rounded-lg overflow-hidden border-slate-100 shadow-sm overflow-x-auto">
                <table className="w-full text-[10px]">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                        <tr>
                            <th className="px-2 py-2 text-left">#</th>
                            {fields.map(f => (
                                <th key={f} className="px-2 py-2 text-left uppercase tracking-tighter">{f.replace('_', ' ')}</th>
                            ))}
                            <th className="px-2 py-2 w-8"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {formData.items?.map((item, idx) => (
                            <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-2 py-1.5 text-slate-400 font-medium">{idx + 1}</td>
                                {fields.map(f => (
                                    <td key={f} className="px-1 py-1">
                                        <Input value={item[f] || ''} onChange={e => updateItem(idx, f, e.target.value)} className="h-7 text-[10px] border-transparent hover:border-slate-200 focus:border-orange-400 px-1" />
                                    </td>
                                ))}
                                <td className="px-2 py-1 text-center">
                                    {formData.items.length > 1 && (
                                        <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (!document) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <FileText className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg">Edit Document</h2>
                            <p className="text-slate-400 text-xs mt-0.5">
                                {template.name} • {document.file_id}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="overflow-y-auto flex-1 p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                            <p className="text-slate-500 font-medium italic">Fetching data from server...</p>
                        </div>
                    ) : renderFormFields()}

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading || saving}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-6 shadow-md shadow-orange-500/20 disabled:opacity-60"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving…
                            </>
                        ) : (
                            <>
                                <FileCheck className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}
