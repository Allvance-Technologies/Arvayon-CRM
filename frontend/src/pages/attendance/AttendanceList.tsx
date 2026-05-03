import { useEffect, useState } from 'react'
import { useAttendanceStore } from '../../stores/attendanceStore'
import { Clock } from 'lucide-react'

export function AttendanceList() {
    const { records, isLoading, fetchRecords, updateRecord } = useAttendanceStore()

    // local states for easy inline editing
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editStatus, setEditStatus] = useState('')
    const [editLeaveType, setEditLeaveType] = useState('')
    const [editOvertime, setEditOvertime] = useState(0)

    useEffect(() => {
        fetchRecords()
    }, [fetchRecords])

    const startEditing = (record: any) => {
        setEditingId(record.id)
        setEditStatus(record.status)
        setEditLeaveType(record.leave_type || '')
        setEditOvertime(record.overtime_hours || 0)
    }

    const saveEditing = async (id: number) => {
        try {
            await updateRecord(id, {
                status: editStatus,
                leave_type: editLeaveType || null,
                overtime_hours: editOvertime
            })
            setEditingId(null)
        } catch (e) {
            alert('Failed to update attendance record')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Attendance & Leaves</h1>
                    <p className="mt-1 text-sm text-slate-500">Monitor employee hours, log overtime, and categorize leaves</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Leave Type</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Overtime (Hrs)</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                            <span className="ml-3 font-medium">Loading records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Clock className="mx-auto h-12 w-12 text-slate-300" />
                                        <h3 className="mt-2 text-sm font-semibold text-slate-900">No attendance records found</h3>
                                        <p className="mt-1 text-sm text-slate-500">Employees clocking in will appear here.</p>
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                                                    {record.user?.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-slate-900">{record.user?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-slate-500">{record.user?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {record.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                            {editingId === record.id ? (
                                                <select
                                                    value={editStatus}
                                                    onChange={e => setEditStatus(e.target.value)}
                                                    className="border border-slate-300 rounded p-1 text-xs"
                                                >
                                                    <option value="Present">Present</option>
                                                    <option value="Leave">Leave</option>
                                                    <option value="Absent">Absent</option>
                                                </select>
                                            ) : (
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                    {record.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-600">
                                            {editingId === record.id ? (
                                                <input
                                                    type="text"
                                                    value={editLeaveType}
                                                    placeholder="Sick Leave etc."
                                                    onChange={e => setEditLeaveType(e.target.value)}
                                                    className="border border-slate-300 rounded p-1 text-xs w-24 text-center"
                                                />
                                            ) : (
                                                record.leave_type || '-'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-indigo-600 font-bold">
                                            {editingId === record.id ? (
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    value={editOvertime}
                                                    onChange={e => setEditOvertime(Number(e.target.value))}
                                                    className="border border-slate-300 rounded p-1 text-xs w-16 text-right"
                                                />
                                            ) : (
                                                record.overtime_hours > 0 ? `+${record.overtime_hours}` : '-'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {editingId === record.id ? (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => saveEditing(record.id)} className="text-emerald-600 hover:text-emerald-900 font-semibold">Save</button>
                                                    <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-700">Cancel</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => startEditing(record)} className="text-blue-600 hover:text-blue-900 font-semibold">Edit</button>
                                            )}
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
