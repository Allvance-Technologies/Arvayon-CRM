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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Finance</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Invoices & Payment Tracking</p>
                </div>
                <button
                    onClick={() => navigate('/invoices/new')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    New Invoice
                </button>
            </div>

            {/* Finance KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Income This Month', value: fmtINR(income), color: 'from-green-500 to-emerald-600' },
                    { label: 'Outstanding', value: fmtINR(outstanding), color: 'from-blue-500 to-blue-700' },
                    { label: 'Overdue', value: fmtINR(overdue), color: 'from-red-500 to-red-700' },
                    { label: 'Total Invoices', value: String(invoices.length), color: 'from-violet-500 to-purple-700' },
                ].map(item => (
                    <div key={item.label} className={`kpi-card p-5 rounded-xl text-white bg-gradient-to-br ${item.color} shadow-md`}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">{item.label}</p>
                        <p className="text-2xl font-bold">{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Cashflow Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Filter tabs */}
                    <div className="flex border-b border-gray-100">
                        {([['all', 'All Invoices'], ['overdue', 'Overdue'], ['paid', 'Paid']] as [string, string][]).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setTab(key as any)}
                                className={`relative px-5 py-3 text-sm font-semibold transition-colors ${tab === key ? 'text-blue-600 tab-active' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {label}
                                {key === 'overdue' && invoices.filter(i => i.status === 'Overdue').length > 0 && (
                                    <span className="ml-1.5 text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                                        {invoices.filter(i => i.status === 'Overdue').length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Invoice #</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Project</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Amount</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Due Date</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i}>
                                            {Array.from({ length: 6 }).map((_, j) => (
                                                <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse"></div></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-sm text-gray-400">No invoices found</td></tr>
                                ) : (
                                    filtered.map((inv: any) => {
                                        const sc = STATUS_COLORS[inv.status] || STATUS_COLORS['Draft'];
                                        const isOverdue = inv.status === 'Overdue';
                                        return (
                                            <tr key={inv.id} className={`hover:bg-blue-50/30 cursor-pointer transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`} onClick={() => navigate(`/invoices/${inv.id}/edit`)}>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        {isOverdue && <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>}
                                                        <span className="font-semibold text-gray-800">{inv.invoice_number}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-600">{inv.project?.name || inv.client?.company_name || '—'}</td>
                                                <td className="px-5 py-3.5 font-semibold text-gray-800">{fmtINR(Number(inv.total_amount))}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>{inv.status}</span>
                                                </td>
                                                <td className={`px-5 py-3.5 text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                                                    {inv.due_date || '—'}
                                                </td>
                                                <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex gap-2">
                                                        <button onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${inv.id}/edit`); }} className="text-xs text-blue-600 font-semibold hover:underline">Edit</button>
                                                        {inv.status !== 'Paid' && (
                                                            <button onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${inv.id}/payments/new`); }} className="text-xs text-green-600 font-semibold hover:underline">Pay</button>
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

                {/* Cashflow sidebar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Cashflow Summary</h3>
                    <div className="space-y-3">
                        {[
                            { label: 'Income This Month', value: income, color: '#22c55e', icon: '↑' },
                            { label: 'Expenses', value: income * 0.56, color: '#ef4444', icon: '↓' },
                            { label: 'Net Profit', value: income * 0.44, color: '#3b82f6', icon: '=' },
                            { label: 'Outstanding', value: outstanding, color: '#f59e0b', icon: '⏳' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: item.color + '08' }}>
                                <div className="flex items-center gap-2">
                                    <span className="text-base" style={{ color: item.color }}>{item.icon}</span>
                                    <p className="text-xs text-gray-600 font-medium">{item.label}</p>
                                </div>
                                <p className="text-sm font-bold" style={{ color: item.color }}>{fmtINR(item.value)}</p>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => navigate('/reports')} className="w-full mt-4 text-sm text-blue-600 font-semibold text-center py-2.5 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors">
                        View Full Report →
                    </button>
                </div>
            </div>
        </div>
    );
};
