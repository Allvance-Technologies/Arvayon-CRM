import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useEmployeeStore, Employee } from '../../stores/employeeStore'
import api from '../../services/api'
import {
    ArrowLeft, Mail, Phone, MapPin, Briefcase, Calendar,
    CheckCircle2, Clock, Globe, Linkedin, Facebook, Instagram, MessageCircle,
    PlusCircle, X, AlertCircle
} from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
    'Pending': 'bg-amber-100 text-amber-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    'Completed': 'bg-emerald-100 text-emerald-700',
    'Cancelled': 'bg-red-100 text-red-700',
}

const PRIORITY_COLORS: Record<string, string> = {
    'Low': 'border-slate-200 text-slate-600 bg-slate-50',
    'Medium': 'border-orange-200 text-orange-700 bg-orange-50',
    'High': 'border-rose-200 text-rose-700 bg-rose-50',
    'Urgent': 'border-purple-200 text-purple-700 bg-purple-50',
}

// ── Assign Task Modal ──────────────────────────────────────────────────────────
function AssignTaskModal({ employeeId, employeeName, onClose, onAssigned }: {
    employeeId: number
    employeeName: string
    onClose: () => void
    onAssigned: (task: any) => void
}) {
    const { assignTask } = useEmployeeStore()
    const [projects, setProjects] = useState<any[]>([])
    const [form, setForm] = useState({
        title: '',
        description: '',
        project_id: '',
        due_date: '',
        priority: 'Medium',
        status: 'Pending',
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        api.get('/projects').then(r => setProjects(r.data.data || r.data)).catch(() => { })
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title || !form.due_date) {
            setError('Task title and due date are required.')
            return
        }
        setSaving(true)
        setError(null)
        try {
            const result = await assignTask({
                ...form,
                project_id: form.project_id || null,
                assigned_to: employeeId,
            })
            onAssigned(result.data || result)
            onClose()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to assign task.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div>
                        <h2 className="text-lg font-bold text-white">Assign New Task</h2>
                        <p className="text-blue-200 text-sm mt-0.5">To: {employeeName}</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Task Title *</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="e.g. Review structural drawings for Block B"
                            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Description</label>
                        <textarea
                            rows={3}
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Optional details or instructions..."
                            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Project (Optional)</label>
                            <select
                                value={form.project_id}
                                onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                            >
                                <option value="">No specific project</option>
                                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Due Date *</label>
                            <input
                                type="date"
                                value={form.due_date}
                                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Priority</label>
                            <select
                                value={form.priority}
                                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                                <option>Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Initial Status</label>
                            <select
                                value={form.status}
                                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                            >
                                <option>Pending</option>
                                <option>In Progress</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-2">
                            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                            Assign Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ── Main Detail Page ───────────────────────────────────────────────────────────
export function EmployeeDetail() {
    const { id } = useParams()
    const { getEmployee, getEmployeeTasks, updateTaskStatus, isLoading } = useEmployeeStore()

    const [employee, setEmployee] = useState<Employee | null>(null)
    const [tasks, setTasks] = useState<any[]>([])
    const [tasksLoading, setTasksLoading] = useState(true)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [statusUpdating, setStatusUpdating] = useState<number | null>(null)
    const [filterStatus, setFilterStatus] = useState<string>('all')

    const loadTasks = () => {
        if (!id) return
        setTasksLoading(true)
        getEmployeeTasks(Number(id))
            .then(data => { setTasks(data.data || data) })
            .catch(console.error)
            .finally(() => setTasksLoading(false))
    }

    useEffect(() => {
        if (id) {
            getEmployee(Number(id)).then(setEmployee).catch(console.error)
            loadTasks()
        }
    }, [id])

    const handleStatusChange = async (taskId: number, status: string) => {
        setStatusUpdating(taskId)
        try {
            await updateTaskStatus(taskId, status)
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
        } catch (err) {
            console.error(err)
        } finally {
            setStatusUpdating(null)
        }
    }

    if (isLoading || !employee) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 font-medium text-slate-600">Loading profile...</span>
            </div>
        )
    }

    const profile = employee.employee_profile

    // Stats
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'Completed').length
    const inProgress = tasks.filter(t => t.status === 'In Progress').length
    const overdue = tasks.filter(t => t.status !== 'Completed' && t.due_date && new Date(t.due_date) < new Date()).length

    const filteredTasks = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus)

    return (
        <div className="space-y-6 pb-12">
            {/* Top bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/employees" className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-900">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">Employee Profile</h1>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowAssignModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition text-sm"
                    >
                        <PlusCircle className="w-4 h-4" /> Assign Task
                    </button>
                    <Link to={`/employees/${employee.id}/edit`} className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold transition shadow-sm text-sm">
                        Edit Profile
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Profile Sidebar ── */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden pb-6">
                        <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-600" />
                        <div className="px-6 flex flex-col items-center -mt-14 text-center">
                            <div className="w-28 h-28 rounded-full border-4 border-white bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0 shadow-lg">
                                <span className="text-3xl font-black text-blue-700">{employee.name.charAt(0)}</span>
                            </div>
                            <h2 className="mt-4 text-xl font-bold text-slate-900">{employee.name}</h2>
                            <p className="text-blue-600 font-medium mt-0.5 text-sm">{profile?.designation ?? employee.role}</p>
                            <div className="mt-3 flex gap-2 flex-wrap justify-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${employee.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {employee.is_active ? (profile?.status || 'Active') : 'Inactive'}
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                    {profile?.department ?? 'General'} Team
                                </span>
                            </div>
                        </div>

                        <div className="px-6 mt-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                <a href={`mailto:${employee.email}`} className="text-sm text-slate-600 hover:text-blue-600 break-all">{employee.email}</a>
                            </div>
                            {(profile?.phone || profile?.whatsapp) && (
                                <div className="flex items-start gap-3">
                                    <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                    <span className="text-sm text-slate-600">{profile.phone || profile.whatsapp}</span>
                                </div>
                            )}
                            {profile?.address && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                    <span className="text-sm text-slate-600 leading-snug">{profile.address}</span>
                                </div>
                            )}
                            {profile?.join_date && (
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                    <span className="text-sm text-slate-600">Joined {new Date(profile.join_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                            )}
                        </div>

                        {(profile?.linkedin || profile?.instagram || profile?.facebook || profile?.whatsapp || profile?.website) && (
                            <div className="px-6 mt-6 pt-4 border-t border-slate-100">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Socials</p>
                                <div className="flex gap-4">
                                    {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#0A66C2] transition"><Linkedin className="w-5 h-5" /></a>}
                                    {profile.instagram && <a href={profile.instagram} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#E4405F] transition"><Instagram className="w-5 h-5" /></a>}
                                    {profile.facebook && <a href={profile.facebook} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#1877F2] transition"><Facebook className="w-5 h-5" /></a>}
                                    {profile.whatsapp && <a href={`https://wa.me/${profile.whatsapp.replace(/\+/g, '')}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#25D366] transition"><MessageCircle className="w-5 h-5" /></a>}
                                    {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition"><Globe className="w-5 h-5" /></a>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Task Summary Stats ── */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-5">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Workload Summary</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Total Tasks', value: total, color: 'bg-slate-100 text-slate-700' },
                                { label: 'Completed', value: completed, color: 'bg-emerald-100 text-emerald-700' },
                                { label: 'In Progress', value: inProgress, color: 'bg-blue-100 text-blue-700' },
                                { label: 'Overdue', value: overdue, color: 'bg-rose-100 text-rose-700' },
                            ].map(stat => (
                                <div key={stat.label} className={`rounded-lg p-3 ${stat.color}`}>
                                    <p className="text-2xl font-extrabold">{stat.value}</p>
                                    <p className="text-xs font-semibold opacity-70 mt-0.5">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                        {total > 0 && (
                            <div className="mt-4">
                                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                                    <span>Completion Rate</span>
                                    <span>{Math.round((completed / total) * 100)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all"
                                        style={{ width: `${(completed / total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Task Monitoring Panel ── */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
                        <div className="p-5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3 bg-slate-50/50">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-blue-600" />
                                    Assigned Tasks
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Monitor progress and update status</p>
                            </div>
                            {/* Filter pills */}
                            <div className="flex flex-wrap gap-2">
                                {['all', 'Pending', 'In Progress', 'Completed', 'Cancelled'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setFilterStatus(s)}
                                        className={`px-3 py-1 text-xs font-semibold rounded-full transition ${filterStatus === s ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >
                                        {s === 'all' ? 'All' : s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {tasksLoading ? (
                                <div className="p-10 text-center text-slate-500">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-3" />
                                    <p>Loading tasks...</p>
                                </div>
                            ) : filteredTasks.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">
                                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-2" />
                                    <h4 className="text-base font-semibold text-slate-800 mb-1">No tasks here</h4>
                                    <p className="text-sm">
                                        {filterStatus === 'all'
                                            ? 'No tasks assigned yet. Click "Assign Task" to get started.'
                                            : `No "${filterStatus}" tasks for this employee.`}
                                    </p>
                                </div>
                            ) : (
                                filteredTasks.map(task => {
                                    const isOverdue = task.status !== 'Completed' && task.due_date && new Date(task.due_date) < new Date()
                                    return (
                                        <div key={task.id} className={`p-5 hover:bg-slate-50/60 transition-colors ${isOverdue ? 'border-l-4 border-rose-400' : ''}`}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-slate-900 text-sm">{task.title}</span>
                                                        {isOverdue && (
                                                            <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded">OVERDUE</span>
                                                        )}
                                                    </div>

                                                    {task.description && (
                                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{task.description}</p>
                                                    )}

                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        {task.project?.name && (
                                                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                                                {task.project.name}
                                                            </span>
                                                        )}
                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS['Medium']}`}>
                                                            {task.priority || 'Medium'}
                                                        </span>
                                                        {task.due_date && (
                                                            <span className={`text-xs flex items-center gap-1 font-medium ${isOverdue ? 'text-rose-600' : 'text-slate-500'}`}>
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Status selector */}
                                                <div className="shrink-0 relative">
                                                    {statusUpdating === task.id ? (
                                                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <select
                                                            value={task.status}
                                                            onChange={e => handleStatusChange(task.id, e.target.value)}
                                                            className={`text-xs font-bold py-1.5 pl-2.5 pr-7 rounded-full border-2 cursor-pointer focus:outline-none appearance-none ${STATUS_COLORS[task.status] || 'bg-slate-100'}`}
                                                        >
                                                            <option>Pending</option>
                                                            <option>In Progress</option>
                                                            <option>Completed</option>
                                                            <option>Cancelled</option>
                                                        </select>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Assign Task Modal */}
            {showAssignModal && (
                <AssignTaskModal
                    employeeId={employee.id}
                    employeeName={employee.name}
                    onClose={() => setShowAssignModal(false)}
                    onAssigned={(newTask) => {
                        setTasks(prev => [newTask, ...prev])
                    }}
                />
            )}
        </div>
    )
}
