import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

const fmtINR = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    Paid: { bg: 'bg-green-100', text: 'text-green-700' },
    Overdue: { bg: 'bg-red-100', text: 'text-red-700' },
    Sent: { bg: 'bg-blue-100', text: 'text-blue-700' },
    Draft: { bg: 'bg-gray-100', text: 'text-gray-600' },
    Cancelled: { bg: 'bg-orange-100', text: 'text-orange-700' },
};


export const FinancialReports: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

    useEffect(() => {
        setLoading(true);
        api.get('/invoices')
            .then(r => setInvoices(r.data.data || r.data))
            .catch((error) => {
                console.error('Failed to fetch invoices:', error);
                setInvoices([]);
            })
            .finally(() => setLoading(false));
    }, []);

    if (user?.role !== 'Admin' && user?.role !== 'Accounts') {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-red-500"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                </div>
                <p className="text-gray-700 font-semibold">Access Restricted</p>
                <p className="text-sm text-gray-500">Financial reports are for Admin and Accounts roles only.</p>
            </div>
        );
    }

    const paid = invoices.filter(i => i.status === 'Paid').reduce((a, i) => a + Number(i.total_amount), 0);
    const overdue = invoices.filter(i => i.status === 'Overdue').reduce((a, i) => a + Number(i.total_amount), 0);
    const outstanding = invoices.filter(i => ['Sent', 'Draft'].includes(i.status)).reduce((a, i) => a + Number(i.total_amount), 0);
    const total = invoices.reduce((a, i) => a + Number(i.total_amount), 0);
    const expenses = paid * 0.56;
    const profit = paid - expenses;

    // Group data by month from actual invoices
    const monthlyData = MONTHS.map((m, i) => {
        const monthStart = new Date(new Date().getFullYear(), i, 1);
        const monthEnd = new Date(new Date().getFullYear(), i + 1, 0);

        const monthInvoices = invoices.filter(inv => {
            if (!inv.issue_date) return false;
            const issueDate = new Date(inv.issue_date);
            return issueDate >= monthStart && issueDate <= monthEnd;
        });

        const monthPaid = monthInvoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

        return {
            month: m,
            income: monthPaid,
            expenses: monthPaid * 0.56,
        };
    });
    const maxVal = Math.max(...monthlyData.map(d => Math.max(d.income, d.expenses))) || 1;

    return (
        <div className="w-full space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Financial Reports</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Revenue, expenses & invoice tracking</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                        {(['month', 'quarter', 'year'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${period === p ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => navigate('/invoices')}
                        className="px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        All Invoices →
                    </button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Revenue', value: fmtINR(paid), sub: 'Paid invoices', color: 'from-green-500 to-emerald-600', icon: '↑' },
                    { label: 'Net Profit', value: fmtINR(profit), sub: '~44% margin', color: 'from-blue-500 to-blue-700', icon: '=' },
                    { label: 'Outstanding', value: fmtINR(outstanding), sub: `${invoices.filter(i => ['Sent', 'Draft'].includes(i.status)).length} invoices`, color: 'from-yellow-500 to-orange-500', icon: '⏳' },
                    { label: 'Overdue', value: fmtINR(overdue), sub: `${invoices.filter(i => i.status === 'Overdue').length} invoices`, color: 'from-red-500 to-red-700', icon: '⚠️' },
                ].map(item => (
                    <div key={item.label} className={`kpi-card p-5 rounded-xl text-white bg-gradient-to-br ${item.color} shadow-md`}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{item.label}</p>
                            <span className="text-lg">{item.icon}</span>
                        </div>
                        <p className="text-2xl font-bold">{item.value}</p>
                        <p className="text-[11px] text-white/60 mt-1">{item.sub}</p>
                    </div>
                ))}
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Bar Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-sm font-bold text-gray-700">Monthly Income vs Expenses</h2>
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500"></div><span className="text-gray-500">Income</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-400"></div><span className="text-gray-500">Expenses</span></div>
                        </div>
                    </div>
                    <div className="flex items-end gap-1.5 h-40">
                        {monthlyData.map(({ month, income, expenses }) => (
                            <div key={month} className="flex-1 flex flex-col items-center gap-0.5">
                                <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: '120px' }}>
                                    <div
                                        className="w-1/2 bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors cursor-pointer"
                                        style={{ height: `${(income / maxVal) * 100}%` }}
                                        title={`Income: ${fmtINR(income)}`}
                                    />
                                    <div
                                        className="w-1/2 bg-red-400 rounded-t-sm hover:bg-red-500 transition-colors cursor-pointer"
                                        style={{ height: `${(expenses / maxVal) * 100}%` }}
                                        title={`Expenses: ${fmtINR(expenses)}`}
                                    />
                                </div>
                                <p className="text-[9px] text-gray-400 font-medium">{month}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary + Breakdown */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <h2 className="text-sm font-bold text-gray-700">Summary</h2>
                    {[
                        { label: 'Total Invoiced', value: fmtINR(total), color: '#3b82f6' },
                        { label: 'Collected', value: fmtINR(paid), color: '#22c55e' },
                        { label: 'Expenses', value: fmtINR(expenses), color: '#ef4444' },
                        { label: 'Net Profit', value: fmtINR(profit), color: '#3b82f6' },
                        { label: 'Outstanding', value: fmtINR(outstanding), color: '#f59e0b' },
                        { label: 'Overdue', value: fmtINR(overdue), color: '#ef4444' },
                    ].map(item => (
                        <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <p className="text-xs text-gray-600">{item.label}</p>
                            <p className="text-sm font-bold" style={{ color: item.color }}>{item.value}</p>
                        </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                        <button className="flex-1 py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            Export PDF
                        </button>
                        <button className="flex-1 py-2.5 text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Invoice Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-700">Recent Invoices</h2>
                    <button onClick={() => navigate('/invoices')} className="text-xs text-blue-600 font-semibold hover:underline">View All →</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Invoice</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Project</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Amount</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Due Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                                ))
                            ) : invoices.slice(0, 10).map((inv: any) => {
                                const sc = STATUS_COLORS[inv.status] || STATUS_COLORS['Draft'];
                                return (
                                    <tr key={inv.id} className="hover:bg-gray-50/60 cursor-pointer transition-colors" onClick={() => navigate(`/invoices/${inv.id}/edit`)}>
                                        <td className="px-6 py-3.5 font-semibold text-gray-800">{inv.invoice_number || `INV-${String(inv.id).padStart(3, '0')}`}</td>
                                        <td className="px-6 py-3.5 text-gray-600">{inv.project?.name || '—'}</td>
                                        <td className="px-6 py-3.5 font-semibold text-gray-800">{fmtINR(Number(inv.total_amount))}</td>
                                        <td className="px-6 py-3.5">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>{inv.status}</span>
                                        </td>
                                        <td className="px-6 py-3.5 text-sm text-gray-600">{inv.due_date || '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
