import { useEffect, useState } from 'react'
import { usePayrollStore } from '../../stores/payrollStore'
import { Play, CheckCircle2, Clock } from 'lucide-react'

export function PayrollList() {
    const { payrolls, isLoading, isGenerating, fetchPayrolls, generatePayrolls, updatePayrollStatus } = usePayrollStore()
    const [successMsg, setSuccessMsg] = useState('')

    useEffect(() => {
        fetchPayrolls()
    }, [fetchPayrolls])

    const handleGenerate = async () => {
        if (!window.confirm('Are you sure you want to generate payroll for the current month? This will recalculate based on attendance.')) return
        try {
            await generatePayrolls()
            setSuccessMsg('Payrolls generated successfully!')
            setTimeout(() => setSuccessMsg(''), 3000)
        } catch (e: any) {
            alert(e.message || 'Error generating payrolls')
        }
    }

    const fmtINR = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
    }

    const handleStatusChange = async (id: number, status: string) => {
        try {
            await updatePayrollStatus(id, status)
        } catch (e: any) {
            alert('Failed to update status')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Payroll Management</h1>
                    <p className="mt-1 text-sm text-slate-500">Manage employee salaries, attendance deductions, and processing</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Play className="w-4 h-4" />
                    <span className="font-medium">{isGenerating ? 'Generating...' : 'Generate Monthly Payroll'}</span>
                </button>
            </div>

            {successMsg && (
                <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="text-sm font-medium">{successMsg}</p>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Billing Cycle</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Base Salary</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Overtime</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Deductions</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Payable</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                            <span className="ml-3 font-medium">Loading payroll records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : payrolls.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Clock className="mx-auto h-12 w-12 text-slate-300" />
                                        <h3 className="mt-2 text-sm font-semibold text-slate-900">No records found</h3>
                                        <p className="mt-1 text-sm text-slate-500">Generate payrolls to populate this list.</p>
                                    </td>
                                </tr>
                            ) : (
                                payrolls.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                    {record.user?.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-slate-900">{record.user?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-slate-500">{record.user?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                                            {record.billing_cycle}
                                            <div className="text-xs font-normal text-slate-400 mt-0.5">{record.days_present} days present</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                                            {fmtINR(Number(record.base_salary))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-indigo-600">
                                            + {fmtINR(Number(record.overtime_pay || 0))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-rose-600">
                                            - {fmtINR(Number(record.leave_deductions))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-sm text-emerald-600">
                                            {fmtINR(Number(record.net_payable))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${record.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                record.status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    record.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                        'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <select
                                                value={record.status}
                                                onChange={(e) => handleStatusChange(record.id, e.target.value)}
                                                className="text-xs border border-slate-200 rounded p-1 text-slate-600 bg-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Processing">Processing</option>
                                                <option value="Paid">Mark as Paid</option>
                                                <option value="Rejected">Reject</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
