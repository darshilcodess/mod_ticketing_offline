import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Loader2, ChevronRight, FileCheck, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import api from '../services/api';

// Available templates
const TEMPLATES = [
    {
        id: 'voucher',
        name: 'Standard Voucher',
        description: 'Standard receipt, issue & expense voucher',
        icon: '📄',
        endpoint: '/documents/voucher'
    },
    {
        id: 'outbound_delivery',
        name: 'Outbound Delivery',
        description: 'Detailed A4 Landscape delivery note for shipments',
        icon: '🚚',
        endpoint: '/documents/outbound-delivery'
    },
    {
        id: 'voucher_variable_qty',
        name: 'Voucher (Variable Qty)',
        description: 'Voucher format supporting measurements (HQ/P/Q)',
        icon: '⚖️',
        endpoint: '/documents/voucher-variable-qty'
    },
    {
        id: 'voucher_title',
        name: 'Voucher with Title',
        description: 'Portrait voucher with custom title and vehicle details',
        icon: '🏷️',
        endpoint: '/documents/voucher-title'
    },
    {
        id: 'voucher_explanation',
        name: 'Voucher with Explanation',
        description: 'Portrait voucher with detailed justification block',
        icon: 'ℹ️',
        endpoint: '/documents/voucher-explanation'
    },
];

const INITIAL_STATES = {
    voucher: {
        iv_no: '', unit_iv: '', stn_iv: '', date_iv: '',
        rv_no: '', unit_rv: '', stn_rv: '', date_rv: '',
        issued_to: '', compliance: '', auth: '',
        items: [{ part_no: '', nomenclature: '', total: '', remarks: '' }],
    },
    outbound_delivery: {
        shipment_no: '', shipment_date: '', class_name: '', obd_from: '', obd_to: '', obd_creation_date: '',
        str_no: '', tracking_number: '', str_date: '', sto_no: '', priority: '', type_of_str: '',
        authority: '', from_location: '', to_location: '', sus_no: '', ibd_number: '',
        items: [{ cos_section: '', part_number: '', sap_number: '', material_description: '', batch_no: '', serial_no: '', au: '', demand_qty: '', obd_qty: '', sub_depot: '' }]
    },
    voucher_variable_qty: {
        iv_no: '', rv_no: '', unit_iv: '', unit_rv: '', stn_iv: '', stn_rv: '', date_iv: '', date_rv: '',
        issued_to: '', compliance: '', auth: '', issued_by: '', handed_over: '', taken_over: '', received_by: '',
        items: [{ part_no: '', nomenclature: '', hq: '', p: '', q: '', total: '' }]
    },
    voucher_title: {
        iv_no: '', rv_no: '', date_iv: '', date_rv: '', unit_iv: '', unit_rv: '', pin_iv: '', pin_rv: '', station_iv: '', station_rv: '',
        issued_to: '', compliance: '', authority: '', issued_by: '', handed_over: '', taken_over: '', received_by: '',
        items: [{ vehicle_type: '', ba_no: '', au: '', qty: '', remarks: '' }]
    },
    voucher_explanation: {
        iv_no: '', rv_no: '', date_iv: '', date_rv: '', unit_iv: '', unit_rv: '', stn_iv: '', stn_rv: '',
        center_heading: '', paragraph_text: '', issued_by: '', handed_over: '', taken_over: '', received_by: '',
        items: [{ part_no: '', nomenclature: '', au: '', qty: '', remarks: '' }]
    }
};

export default function VoucherModal({ onClose, ticketId }) {
    const [step, setStep] = useState('select'); // 'select' | 'fill'
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [data, setData] = useState({});
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        setData(INITIAL_STATES[template.id]);
        setStep('fill');
    };

    const updateField = (field, value) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        const itemSchema = INITIAL_STATES[selectedTemplate.id].items[0];
        const newItem = Object.keys(itemSchema).reduce((acc, key) => ({ ...acc, [key]: '' }), {});
        setData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    };

    const removeItem = (index) => {
        if (data.items.length <= 1) return;
        setData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    };

    const handleGenerate = async () => {
        if (!selectedTemplate) return;
        setGenerating(true);
        setError('');
        try {
            await api.post(selectedTemplate.endpoint, { ...data, ticket_id: ticketId });
            onClose();
        } catch (err) {
            console.error('Document generation failed:', err);
            setError(err.response?.data?.detail || 'Failed to generate document.');
        } finally {
            setGenerating(false);
        }
    };

    const renderFormFields = () => {
        if (!selectedTemplate) return null;

        switch (selectedTemplate.id) {
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
                return null;
        }
    };

    const renderVoucherFields = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-orange-600 uppercase">IV Details</p>
                    {['iv_no', 'unit_iv', 'stn_iv', 'date_iv'].map(f => (
                        <Input key={f} placeholder={f.replace('_', ' ').toUpperCase()} value={data[f]} onChange={e => updateField(f, e.target.value)} className="h-8 text-xs bg-white text-slate-900 border-slate-300 focus:border-orange-500 placeholder:text-slate-400" />
                    ))}
                </div>
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-blue-600 uppercase">RV Details</p>
                    {['rv_no', 'unit_rv', 'stn_rv', 'date_rv'].map(f => (
                        <Input key={f} placeholder={f.replace('_', ' ').toUpperCase()} value={data[f]} onChange={e => updateField(f, e.target.value)} className="h-8 text-xs bg-white text-slate-900 border-slate-300 focus:border-orange-500 placeholder:text-slate-400" />
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Body</p>
                {['issued_to', 'compliance', 'auth'].map(f => (
                    <Input key={f} placeholder={f.replace('_', ' ').toUpperCase()} value={data[f]} onChange={e => updateField(f, e.target.value)} className="h-8 text-xs bg-white text-slate-900 border-slate-300 focus:border-orange-500 placeholder:text-slate-400" />
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
                        <Input value={data[f]} onChange={e => updateField(f, e.target.value)} className="h-7 text-[11px] bg-white text-slate-900 border-slate-300 focus:border-orange-500 placeholder:text-slate-400" />
                    </div>
                ))}
            </div>
            {renderItemTable(['cos_section', 'part_number', 'sap_number', 'material_description', 'batch_no', 'serial_no', 'au', 'demand_qty', 'obd_qty', 'sub_depot'])}
        </div>
    );

    const renderVariableQtyFields = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                {['iv_no', 'rv_no', 'unit_iv', 'unit_rv', 'stn_iv', 'stn_rv', 'date_iv', 'date_rv', 'issued_to', 'compliance', 'auth', 'issued_by', 'handed_over', 'taken_over', 'received_by'].map(f => (
                    <Input key={f} placeholder={f.replace('_', ' ').toUpperCase()} value={data[f]} onChange={e => updateField(f, e.target.value)} className="h-8 text-xs bg-white text-slate-900 border-slate-300 focus:border-orange-500 placeholder:text-slate-400" />
                ))}
            </div>
            {renderItemTable(['part_no', 'nomenclature', 'hq', 'p', 'q', 'total'])}
        </div>
    );

    const renderTitleFields = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                {['iv_no', 'rv_no', 'date_iv', 'date_rv', 'unit_iv', 'unit_rv', 'pin_iv', 'pin_rv', 'station_iv', 'station_rv', 'issued_to', 'compliance', 'authority', 'issued_by', 'handed_over', 'taken_over', 'received_by'].map(f => (
                    <Input key={f} placeholder={f.replace('_', ' ').toUpperCase()} value={data[f]} onChange={e => updateField(f, e.target.value)} className="h-8 text-xs bg-white text-slate-900 border-slate-300 focus:border-orange-500 placeholder:text-slate-400" />
                ))}
            </div>
            {renderItemTable(['vehicle_type', 'ba_no', 'au', 'qty', 'remarks'])}
        </div>
    );

    const renderExplanationFields = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                {['iv_no', 'rv_no', 'date_iv', 'date_rv', 'unit_iv', 'unit_rv', 'stn_iv', 'stn_rv', 'center_heading', 'issued_by', 'handed_over', 'taken_over', 'received_by'].map(f => (
                    <Input key={f} placeholder={f.replace('_', ' ').toUpperCase()} value={data[f]} onChange={e => updateField(f, e.target.value)} className="h-8 text-xs bg-white text-slate-900 border-slate-300 focus:border-orange-500 placeholder:text-slate-400" />
                ))}
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Paragraph Text</label>
                <textarea
                    className="w-full h-24 p-2 text-xs border rounded-md bg-white text-slate-900 border-slate-300 focus:border-orange-500 focus:outline-none placeholder:text-slate-400"
                    value={data.paragraph_text}
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
                        {data.items.map((item, idx) => (
                            <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-2 py-1.5 text-slate-400 font-medium">{idx + 1}</td>
                                {fields.map(f => (
                                    <td key={f} className="px-1 py-1">
                                        <Input value={item[f]} onChange={e => updateItem(idx, f, e.target.value)} className="h-7 text-[10px] bg-white text-slate-900 border-slate-200 hover:border-slate-300 focus:border-orange-500 px-1 placeholder:text-slate-400" />
                                    </td>
                                ))}
                                <td className="px-2 py-1 text-center">
                                    {data.items.length > 1 && (
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
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <FileText className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg">Generate Document</h2>
                            <p className="text-slate-400 text-xs">{step === 'select' ? 'Choose Template' : selectedTemplate.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 transition-colors"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'select' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {TEMPLATES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => handleTemplateSelect(t)}
                                    className="p-4 rounded-xl border-2 border-slate-50 hover:border-orange-500 hover:bg-orange-50/30 text-left transition-all group"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">{t.icon}</span>
                                        <p className="font-bold text-slate-800 group-hover:text-orange-950">{t.name}</p>
                                    </div>
                                    <p className="text-xs text-slate-500">{t.description}</p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        renderFormFields()
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-slate-50/80 backdrop-blur-md flex items-center justify-between">
                    {step === 'fill' ? (
                        <button onClick={() => setStep('select')} className="text-xs font-bold text-slate-400 hover:text-slate-600">← CHANGE TEMPLATE</button>
                    ) : <div></div>}
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        {step === 'fill' && (
                            <Button onClick={handleGenerate} disabled={generating} className="bg-orange-600 hover:bg-orange-700 text-white font-bold min-w-[120px]">
                                {generating ? <Loader2 className="animate-spin" /> : <><FileCheck className="mr-2" size={16} /> GENERATE</>}
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
