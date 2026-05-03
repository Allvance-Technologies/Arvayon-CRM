import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../../stores/taskStore';

const PRIORITY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Low: { bg: 'bg-gray-100', text: 'text-gray-600', dot: '#94a3b8' },
  Medium: { bg: 'bg-blue-100', text: 'text-blue-700', dot: '#3b82f6' },
  High: { bg: 'bg-orange-100', text: 'text-orange-700', dot: '#f97316' },
  Urgent: { bg: 'bg-red-100', text: 'text-red-700', dot: '#ef4444' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Pending: { bg: 'bg-gray-100', text: 'text-gray-600' },
  'In Progress': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  Completed: { bg: 'bg-green-100', text: 'text-green-700' },
  Cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, loading, fetchTasks, fetchMyTasks } = useTaskStore();
  const [view, setView] = useState<'my' | 'all' | 'calendar'>('my');
  const [filters, setFilters] = useState({ search: '', status: '', priority: '' });
  const [calDate, setCalDate] = useState(new Date(2026, 2, 1)); // March 2026

  useEffect(() => {
    if (view === 'my') fetchMyTasks();
    else if (view === 'all') fetchTasks(filters);
  }, [view]);

  const handleSearch = () => fetchTasks(filters);

  // Calendar helpers
  const daysInMonth = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay();
  const tasksByDay: Record<number, any[]> = {};
  tasks.forEach(t => {
    if (t.due_date) {
      const d = new Date(t.due_date);
      if (d.getMonth() === calDate.getMonth() && d.getFullYear() === calDate.getFullYear()) {
        const day = d.getDate();
        if (!tasksByDay[day]) tasksByDay[day] = [];
        tasksByDay[day].push(t);
      }
    }
  });

  const displayTasks = tasks;

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Tasks</h1>
          <p className="text-xs text-gray-500 mt-0.5">{displayTasks.length} tasks</p>
        </div>
        <button
          onClick={() => navigate('/tasks/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          New Task
        </button>
      </div>

      {/* View toggle tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 flex gap-1">
        {([['my', 'My Tasks'], ['all', 'All Tasks'], ['calendar', 'Calendar']] as [string, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setView(key as any)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${view === key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* All Tasks — filters */}
      {view === 'all' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none">
              <option value="">All Statuses</option>
              {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none">
              <option value="">All Priorities</option>
              {Object.keys(PRIORITY_COLORS).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">Filter</button>
          </div>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {view === 'calendar' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </button>
            <h3 className="text-sm font-bold text-gray-700">{MONTHS[calDate.getMonth()]} {calDate.getFullYear()}</h3>
            <button onClick={() => setCalDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase py-2">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const today = new Date();
              const isToday = today.getDate() === day && today.getMonth() === calDate.getMonth() && today.getFullYear() === calDate.getFullYear();
              const dayTasks = tasksByDay[day] || [];
              return (
                <div key={day} className={`min-h-[60px] p-1 rounded-lg border text-xs ${isToday ? 'bg-blue-50 border-blue-200' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${isToday ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>{day}</div>
                  {dayTasks.slice(0, 2).map(t => {
                    const pc = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS['Low'];
                    return (
                      <div key={t.id} className={`text-[9px] px-1 py-0.5 rounded mb-0.5 truncate ${pc.bg} ${pc.text} font-medium`}>{t.title}</div>
                    );
                  })}
                  {dayTasks.length > 2 && <div className="text-[9px] text-gray-400">+{dayTasks.length - 2} more</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TABLE VIEW (My Tasks / All Tasks) */}
      {view !== 'calendar' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Task</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Project</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Priority</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Assigned</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Due Date</th>
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
                ) : displayTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-gray-300">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-gray-400">No tasks found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayTasks.map((t: any) => {
                    const pc = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS['Low'];
                    const sc = STATUS_COLORS[t.status] || STATUS_COLORS['Pending'];
                    const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Completed';
                    return (
                      <tr key={t.id} className={`hover:bg-blue-50/30 cursor-pointer transition-colors ${isOverdue ? 'bg-red-50/20' : ''}`} onClick={() => navigate(`/tasks/${t.id}/edit`)}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div title={t.priority} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: pc.dot }}></div>
                            <p className={`font-medium text-gray-800 ${t.status === 'Completed' ? 'line-through text-gray-400' : ''}`}>{t.title}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">{t.project?.name || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>{t.status}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pc.bg} ${pc.text}`}>{t.priority}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {t.assigned_to ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-bold">
                                {t.assigned_to.name?.charAt(0)}
                              </div>
                              <span className="text-xs text-gray-600">{t.assigned_to.name?.split(' ')[0]}</span>
                            </div>
                          ) : <span className="text-xs text-gray-400">Unassigned</span>}
                        </td>
                        <td className={`px-5 py-3.5 text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          {t.due_date ? new Date(t.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          {isOverdue && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1 rounded">Overdue</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
