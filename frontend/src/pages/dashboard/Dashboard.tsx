import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { useEmployeeStore } from '../../stores/employeeStore';

interface DashboardData {
  kpis: {
    total_leads: number;
    revenue_won_this_month: number;
    active_projects: number;
    total_revenue: number;
    overdue_invoices: number;
  };
  sales_funnel: Record<string, number>;
  upcoming_tasks: any[];
  ai_insights: { high_score_leads: any[]; at_risk_projects: any[] };
  project_progress: any[];
}

const fmtINR = (n: number) =>
  '₹' + Number(n || 0).toLocaleString('en-IN');

const KPICard = ({
  title, value, subtitle, color, icon,
}: {
  title: string; value: string; subtitle?: string; color: string; icon: React.ReactNode;
}) => (
  <div className={`kpi-card rounded-xl p-5 text-white relative overflow-hidden ${color} shadow-md`}>
    <div className="absolute right-4 top-4 opacity-20 scale-150">{icon}</div>
    <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">{title}</p>
    <p className="text-3xl font-bold leading-tight">{value}</p>
    {subtitle && <p className="text-xs text-white/60 mt-1">{subtitle}</p>}
  </div>
);

const FUNNEL_STAGES = ['New Leads', 'Contacted', 'Site Visit', 'Proposal Sent', 'Won'];
const FUNNEL_COLORS = ['#3b82f6', '#6366f1', '#f59e0b', '#10b981', '#22c55e'];

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { employees, fetchEmployees } = useEmployeeStore();

  useEffect(() => { fetchDashboard(); fetchEmployees(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardService.getDashboardData();
      setData(res.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const funnelTotal = Object.values(data.sales_funnel).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="w-full space-y-5">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Architectural & PMC Consultancy</p>
        </div>
        <button
          onClick={() => navigate('/leads/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          New Lead
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPICard
          title="Active Projects"
          value={String(data.kpis.active_projects)}
          subtitle="Currently running"
          color="bg-gradient-to-br from-blue-500 to-blue-700"
          icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>}
        />
        <KPICard
          title="Revenue This Month"
          value={fmtINR(data.kpis.revenue_won_this_month)}
          subtitle="Won this month"
          color="bg-gradient-to-br from-green-500 to-emerald-600"
          icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2v-1.93c-1.71-.36-3-1.5-3.12-3.12h1.83c.1.86.91 1.51 2.31 1.51 1.54 0 2.18-.77 2.18-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-3.77-1.74-3.77-3.46 0-1.54 1.25-2.65 2.97-3.01V5h2v1.94c1.67.43 2.79 1.69 2.85 3.06h-1.83c-.07-.86-.87-1.52-2.16-1.52-1.4 0-1.9.74-1.9 1.37 0 .82.5 1.22 2.6 1.75 2.1.53 3.84 1.49 3.84 3.44 0 1.58-1.09 2.8-3.14 3.05z" /></svg>}
        />
        <KPICard
          title="Outstanding Payments"
          value={fmtINR(data.kpis.total_revenue)}
          subtitle="Total outstanding"
          color="bg-gradient-to-br from-orange-500 to-red-500"
          icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" /></svg>}
        />
        <KPICard
          title="New Leads This Week"
          value={String(data.kpis.total_leads)}
          subtitle="Total leads"
          color="bg-gradient-to-br from-violet-500 to-purple-700"
          icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>}
        />
        <KPICard
          title="Conversion Rate"
          value={Math.round((data.kpis.active_projects / (data.kpis.total_leads || 1)) * 100) + '%'}
          subtitle="Lead to project"
          color="bg-gradient-to-br from-cyan-500 to-teal-600"
          icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" /></svg>}
        />
      </div>

      {/* Employee Workload Quick-View */}
      {employees.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Team Directory</h2>
            <button onClick={() => navigate('/employees')} className="text-xs text-blue-600 font-semibold hover:underline">Manage Employees →</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {employees.slice(0, 6).map(emp => (
              <div
                key={emp.id}
                onClick={() => navigate(`/employees/${emp.id}`)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 border-2 border-white shadow-sm flex items-center justify-center text-blue-700 font-bold text-sm">
                  {emp.name.charAt(0)}
                </div>
                <div className="text-center min-w-0 w-full">
                  <p className="text-xs font-semibold text-gray-800 group-hover:text-blue-600 truncate">{emp.name.split(' ')[0]}</p>
                  <p className="text-[10px] text-gray-400 truncate">{emp.employee_profile?.designation ?? emp.role}</p>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${emp.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>{emp.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            ))}
            {employees.length > 6 && (
              <div
                onClick={() => navigate('/employees')}
                className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border border-dashed border-gray-200 hover:border-blue-300 cursor-pointer transition-all text-gray-400 hover:text-blue-600"
              >
                <span className="text-xl font-bold">+{employees.length - 6}</span>
                <span className="text-[10px] font-medium">more</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Row 2: Lead Pipeline + Project Status */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Lead Pipeline / Sales Funnel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Lead Pipeline</h2>
            <button
              onClick={() => navigate('/leads?view=kanban')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Full Kanban →
            </button>
          </div>

          {/* Funnel arrow stages */}
          <div className="flex items-stretch gap-0.5 mb-5 h-10">
            {FUNNEL_STAGES.map((s, i) => {
              const count = data.sales_funnel[s] || 0;
              return (
                <div
                  key={s}
                  className="funnel-stage flex-1 flex items-center justify-center text-white cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ background: FUNNEL_COLORS[i], fontSize: 11 }}
                  title={`${s}: ${count}`}
                >
                  {s.split(' ')[0]}
                </div>
              );
            })}
          </div>

          {/* Stage counts */}
          <div className="space-y-2">
            {FUNNEL_STAGES.map((s, i) => {
              const count = data.sales_funnel[s] || 0;
              const pct = Math.round((count / funnelTotal) * 100);
              return (
                <div key={s} className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: FUNNEL_COLORS[i] }}
                  />
                  <span className="text-xs text-gray-600 flex-1">{s}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: FUNNEL_COLORS[i] }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-5 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Project Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Project Status</h2>
            <button
              onClick={() => navigate('/projects')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              All Projects →
            </button>
          </div>
          <div className="space-y-4">
            {data.project_progress.map((p: any) => {
              const pct = p.progress || 0;
              const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
              return (
                <div key={p.id} className="group cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <p className="text-xs font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.client || 'Client'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: color + '20', color }}
                      >
                        {p.status || 'In Progress'}
                      </span>
                      <span className="text-xs font-bold text-gray-600">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full progress-bar"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Upcoming Tasks + Overdue Alerts + AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Upcoming Tasks</h2>
          </div>
          <div className="space-y-3">
            {data.upcoming_tasks.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No upcoming tasks</p>
            ) : (
              data.upcoming_tasks.map((t: any) => {
                const priorityColor: Record<string, string> = {
                  High: 'bg-red-100 text-red-600',
                  Medium: 'bg-yellow-100 text-yellow-700',
                  Low: 'bg-green-100 text-green-700',
                };
                return (
                  <div
                    key={t.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate('/tasks')}
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-blue-500">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{t.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {t.project?.name} • {new Date(t.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    {t.priority && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${priorityColor[t.priority] || 'bg-gray-100 text-gray-500'}`}>
                        {t.priority}
                      </span>
                    )}
                  </div>
                );
              })
            )}
            <button
              onClick={() => navigate('/tasks')}
              className="w-full text-xs text-blue-600 font-semibold text-center py-2 hover:bg-blue-50 rounded-lg transition-colors mt-1"
            >
              View All Tasks →
            </button>
          </div>
        </div>

        {/* Overdue Payments / Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Overdue Payments</h2>
          </div>
          <div className="space-y-3">
            {data.kpis.overdue_invoices === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-500">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500">All payments up to date</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500 flex-shrink-0">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs font-semibold text-red-700">{data.kpis.overdue_invoices} invoices overdue</p>
                  </div>
                  <button onClick={() => navigate('/invoices')} className="text-[10px] font-bold text-red-600 hover:underline">View</button>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
                  <p className="text-xs font-semibold text-orange-700">Invoice reminders pending</p>
                  <p className="text-[10px] text-orange-500 mt-1">Send automated reminders to overdue clients</p>
                </div>
              </>
            )}
            <button
              onClick={() => navigate('/invoices')}
              className="w-full text-xs text-blue-600 font-semibold text-center py-2 hover:bg-blue-50 rounded-lg transition-colors mt-1"
            >
              View All Invoices →
            </button>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-[8px] font-black">AI</span>
            </div>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">AI Insights</h2>
          </div>

          {/* High score leads */}
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">🎯 Hot Leads</p>
          <div className="space-y-2 mb-4">
            {data.ai_insights.high_score_leads.slice(0, 2).map((l: any) => (
              <div
                key={l.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-green-50 border border-green-100 cursor-pointer hover:bg-green-100 transition-colors"
                onClick={() => navigate(`/leads/${l.id}`)}
              >
                <div>
                  <p className="text-xs font-semibold text-gray-700">{l.company_name}</p>
                  <p className="text-[10px] text-gray-400">{l.contact_person}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{l.ai_score}</span>
                </div>
              </div>
            ))}
            {data.ai_insights.high_score_leads.length === 0 && (
              <p className="text-xs text-gray-400 italic">No high-score leads yet</p>
            )}
          </div>

          {/* At risk projects */}
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">⚠️ At Risk</p>
          <div className="space-y-2">
            {data.ai_insights.at_risk_projects.slice(0, 2).map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <div>
                  <p className="text-xs font-semibold text-gray-700">{p.name}</p>
                  <p className="text-[10px] text-gray-400">{p.ai_delay_warning}</p>
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-1 rounded ${p.ai_delay_risk === 'High' ? 'bg-red-500 text-white' : 'bg-yellow-400 text-yellow-900'
                    }`}
                >
                  {p.ai_delay_risk}
                </span>
              </div>
            ))}
            {data.ai_insights.at_risk_projects.length === 0 && (
              <p className="text-xs text-gray-400 italic">All projects on track</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
