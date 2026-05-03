import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../stores/projectStore';

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Planning: { bg: 'bg-blue-100', text: 'text-blue-700', dot: '#3b82f6' },
  'In Progress': { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: '#f59e0b' },
  'On Hold': { bg: 'bg-gray-100', text: 'text-gray-600', dot: '#94a3b8' },
  Completed: { bg: 'bg-green-100', text: 'text-green-700', dot: '#22c55e' },
  Cancelled: { bg: 'bg-red-100', text: 'text-red-700', dot: '#ef4444' },
};

export const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loading, fetchProjects } = useProjectStore();
  const [filters, setFilters] = useState({ search: '', status: '' });

  useEffect(() => { fetchProjects({}); }, []);

  const handleSearch = () => fetchProjects(filters);

  const displayProjects = projects;

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Projects</h1>
          <p className="text-xs text-gray-500 mt-0.5">{displayProjects.length} total projects</p>
        </div>
        <button
          onClick={() => navigate('/projects/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              placeholder="Search projects..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="">All Statuses</option>
            {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">Filter</button>
          <button onClick={() => { setFilters({ search: '', status: '' }); fetchProjects({}); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Clear</button>
        </div>
      </div>

      {/* Project Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Project Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Client</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Value</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Stage</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 min-w-[160px]">Completion</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : displayProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <p className="text-sm text-gray-400">No projects found</p>
                  </td>
                </tr>
              ) : (
                displayProjects.map((p: any) => {
                  const pct = p.completion_percentage || p.progress || 0;
                  const sc = STATUS_COLORS[p.status] || STATUS_COLORS['Planning'];
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/projects/${p.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: sc.dot + '20' }}>
                            <svg viewBox="0 0 20 20" fill={sc.dot} className="w-4 h-4"><path d="M3 7a2 2 0 012-2h4l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
                          </div>
                          <p className="font-semibold text-gray-800">{p.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{p.client?.company_name || '—'}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-700">
                        {p.estimated_cost ? '₹' + Number(p.estimated_cost).toLocaleString('en-IN') : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{p.stage || '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: sc.dot }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-600 w-9 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                          {p.status}
                        </span>
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
