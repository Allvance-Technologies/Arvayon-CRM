import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    Draft: { bg: 'bg-gray-100', text: 'text-gray-600' },
    Sent: { bg: 'bg-blue-100', text: 'text-blue-700' },
    Paid: { bg: 'bg-green-100', text: 'text-green-700' },
    Overdue: { bg: 'bg-red-100', text: 'text-red-700' },
    Cancelled: { bg: 'bg-orange-100', text: 'text-orange-700' },
};

const fmtINR = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN');

export const InvoiceList: React.FC = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<'all' | 'overdue' | 'paid'>('all');

    // Finance summary
    const income = invoices.filter(i => i.status === 'Paid').reduce((a, i) => a + Number(i.total_amount), 0);
    const outstanding = invoices.filter(i => ['Sent', 'Draft'].includes(i.status)).reduce((a, i) => a + Number(i.total_amount), 0);
    const overdue = invoices.filter(i => i.status === 'Overdue').reduce((a, i) => a + Number(i.total_amount), 0);

    useEffect(() => { fetchInvoices(); }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const r = await api.get('/invoices');
            setInvoices(r.data.data || r.data);
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
            setInvoices([]);
        } finally { setLoading(false); }
    };

    const filtered = invoices.filter(i => {
        if (tab === 'overdue') return i.status === 'Overdue';
        if (tab === 'paid') return i.status === 'Paid';
        return true;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto w-full">
            {/* Header - Unified Document Style */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Invoice Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Professional billing and payment tracking</p>
                </div>
                <button
                    onClick={() => navigate('/invoices/new')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    New Invoice
                </button>
            </div>

            {/* Main List Container */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Filter tabs - Minimalist Style */}
                <div className="flex border-b border-slate-50 bg-slate-50/30">
                    {([['all', 'All Documents'], ['overdue', 'Overdue'], ['paid', 'Settled']] as [string, string][]).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setTab(key as any)}
                            className={`relative px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${tab === key ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {label}
                            {key === 'overdue' && invoices.filter(i => i.status === 'Overdue').length > 0 && (
                                <span className="ml-2 bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded text-[8px]">
                                    {invoices.filter(i => i.status === 'Overdue').length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Table - High Contrast Minimalist */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b bg-slate-50/50">
                                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Reference</th>
                                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Project / Client</th>
                                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Amount</th>
                                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Status</th>
                                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Due Date</th>
                                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j} className="px-6 py-5"><div className="h-4 bg-slate-100 rounded animate-pulse w-24"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-20 text-sm text-slate-400 font-medium italic">No financial documents found in this category.</td></tr>
                            ) : (
                                filtered.map((inv: any) => {
                                    const sc = STATUS_COLORS[inv.status] || STATUS_COLORS['Draft'];
                                    const isOverdue = inv.status === 'Overdue';
                                    return (
                                        <tr key={inv.id} className="hover:bg-blue-50/30 cursor-pointer transition-colors group" onClick={() => navigate(`/invoices/${inv.id}/edit`)}>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                    {inv.invoice_number || `INV-${String(inv.id).padStart(4, '0')}`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{inv.project?.name || 'Quick Invoice'}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">{inv.client?.company_name || 'Individual'}</div>
                                            </td>
                                            <td className="px-6 py-4 font-black text-slate-800">{fmtINR(Number(inv.total_amount))}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 text-[10px] rounded-full font-black uppercase tracking-wider ${sc.bg} ${sc.text} border border-transparent`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 text-xs font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-400'}`}>
                                                {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => navigate(`/invoices/${inv.id}/edit`)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Manage</button>
                                                    {inv.status !== 'Paid' && (
                                                        <button onClick={() => navigate(`/invoices/${inv.id}/payments/new`)} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Settle</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
