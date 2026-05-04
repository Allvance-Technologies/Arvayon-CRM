import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLeadStore } from '../../stores/leadStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { leadService } from '../../services/leadService';

const TABS = ['Overview', 'Activity', 'Notes', 'Proposal', 'Convert'] as const;
type Tab = typeof TABS[number];

const STATUS_COLORS: Record<string, string> = {
  'New Lead': 'bg-blue-500',
  'Initial Contact': 'bg-cyan-500',
  Qualification: 'bg-indigo-500',
  'Tech Call': 'bg-violet-500',
  'Site Visit': 'bg-yellow-500',
  Proposal: 'bg-orange-500',
  Won: 'bg-green-500',
  Lost: 'bg-red-500',
};

export const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentLead, loading, fetchLead } = useLeadStore();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [note, setNote] = useState('');
  const [activities, setActivities] = useState<any[]>([]);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (id) { fetchLead(parseInt(id)); fetchActivities(); }
  }, [id]);

  const fetchActivities = async () => {
    try {
      const res = await leadService.getActivities(parseInt(id!));
      setActivities(res.data.data);
    } catch { }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      await leadService.addNote(parseInt(id!), note);
      setNote('');
      fetchLead(parseInt(id!));
      fetchActivities();
    } catch { }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await leadService.updateLeadStatus(parseInt(id!), newStatus);
      fetchLead(parseInt(id!));
    } catch { }
  };

  const handleConvert = async () => {
    setConverting(true);
    try {
      await leadService.convertLead(parseInt(id!));
      navigate('/projects');
    } catch {
      alert('Conversion failed or already converted');
    } finally {
      setConverting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading lead details..." />;
  if (!currentLead) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-gray-500">Lead not found</p>
      <button onClick={() => navigate('/leads')} className="text-sm text-blue-600 hover:underline">← Back to Leads</button>
    </div>
  );

  const stagePct: Record<string, number> = {
    'New Lead': 10, 'Initial Contact': 20, Qualification: 35,
    'Tech Call': 50, 'Site Visit': 65, Proposal: 80, Won: 100, Lost: 0,
  };
  const pct = stagePct[currentLead.status] || 0;

  return (
    <div className="w-full space-y-4">
      {/* Back */}
      <button
        onClick={() => navigate('/leads')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
        Back to Leads
      </button>

      {/* Lead header card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {(currentLead.company_name || 'L').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{currentLead.company_name}</h1>
              <p className="text-sm text-gray-500">{currentLead.contact_person}</p>
              <div className="flex items-center gap-3 mt-2">
                {currentLead.budget && (
                  <span className="text-xs text-gray-600 font-semibold bg-gray-100 px-2 py-0.5 rounded">
                    ₹{Number(currentLead.budget).toLocaleString('en-IN')}
                  </span>
                )}
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded text-white ${STATUS_COLORS[currentLead.status] || 'bg-gray-500'}`}>
                  {currentLead.status}
                </span>
                {currentLead.ai_score && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">
                    AI Score: {currentLead.ai_score}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate(`/leads/${id}/edit`)}
              className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit Lead
            </button>
            <button
              onClick={() => leadService.triggerScoring(parseInt(id!)).catch(() => { })}
              className="px-4 py-2 text-sm font-semibold text-blue-700 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              🤖 Score Lead
            </button>
            {currentLead.status !== 'Won' && currentLead.status !== 'Lost' && (
              <select
                value={currentLead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {['New Lead', 'Initial Contact', 'Qualification', 'Tech Call', 'Site Visit', 'Proposal', 'Won', 'Lost'].map(s =>
                  <option key={s} value={s}>{s}</option>
                )}
              </select>
            )}
          </div>
        </div>

        {/* Pipeline progress */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-gray-500 font-medium">Pipeline Progress</p>
            <p className="text-xs font-bold text-gray-700">{pct}%</p>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full progress-bar"
              style={{ width: `${pct}%`, background: pct === 100 ? '#22c55e' : '#3b82f6' }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-3.5 text-sm font-semibold transition-colors flex-shrink-0 ${activeTab === tab
                ? 'text-blue-600 tab-active'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              {tab}
              {tab === 'Convert' && (
                <span className="ml-1.5 w-2 h-2 bg-green-500 rounded-full inline-block"></span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* OVERVIEW */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Lead Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      ['Email', currentLead.email],
                      ['Phone', currentLead.phone || '—'],
                      ['Industry', currentLead.industry || '—'],
                      ['Budget', currentLead.budget ? '₹' + Number(currentLead.budget).toLocaleString('en-IN') : '—'],
                      ['Source', currentLead.source || '—'],
                      ['Location', currentLead.location || '—'],
                    ].map(([label, value]) => (
                      <div key={label} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-sm font-medium text-gray-700">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Call Logs & Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Call Action */}
                    <div className="p-5 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[10px] font-bold">1</div>
                          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">First Call Note</p>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed mb-4 italic">
                          {currentLead.first_call || 'No records from initial contact.'}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/proposals/new?lead_id=${id}`)}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-blue-600 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        Create Proposal
                      </button>
                    </div>

                    {/* Second Call Action */}
                    <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white text-[10px] font-bold">2</div>
                          <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Second Call Note</p>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed mb-4 italic">
                          {currentLead.second_call || 'No records from follow-up call.'}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/quotes/new?lead_id=${id}`)}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-indigo-600 text-xs font-bold rounded-lg border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                        Create Quotation
                      </button>
                    </div>
                  </div>

                  {/* Final Financial Action */}
                  <div className="mt-4 p-5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">Finalize Deal</p>
                          <p className="text-xs text-gray-500">Generate the final tax invoice for this client</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/invoices/new?lead_id=${id}`)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                        Create Invoice
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Assigned To</p>
                  {currentLead.assigned_to ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">
                        {currentLead.assigned_to.name?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{currentLead.assigned_to.name}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Unassigned</p>
                  )}
                </div>
                {currentLead.ai_score && (
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-lg text-center shadow-sm">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">AI Score</p>
                    <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-lg shadow-green-200">
                      {currentLead.ai_score}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {currentLead.ai_score >= 70 ? '🔥 Hot Lead' : currentLead.ai_score >= 40 ? '👍 Warm Lead' : '❄️ Cold Lead'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ACTIVITY */}
          {activeTab === 'Activity' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Activity Timeline</h3>
              {activities.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <p className="text-sm text-gray-400 italic">No activities recorded yet</p>
                </div>
              ) : (
                activities.map((a: any, i: number) => (
                  <div key={a.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                        {a.user?.name?.charAt(0) || 'S'}
                      </div>
                      {i < activities.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 my-1"></div>}
                    </div>
                    <div className="pb-4 flex-1">
                      <p className="text-sm text-gray-700">{a.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {a.user?.name} · {new Date(a.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* NOTES */}
          {activeTab === 'Notes' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Notes</h3>
              <div className="flex gap-2">
                <textarea
                  placeholder="Add a note about this lead..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                />
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors self-start"
                >
                  Add
                </button>
              </div>
              {currentLead.notes && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{currentLead.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* PROPOSAL */}
          {activeTab === 'Proposal' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Proposal</h3>
              <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl flex flex-col items-center gap-3">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-blue-400">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
                </svg>
                <p className="text-sm text-gray-600 text-center">Generate and send a professional proposal to this lead</p>
                <button
                  onClick={() => leadService.generateProposal?.(parseInt(id!)).catch(() => { })}
                  className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🤖 Generate AI Proposal
                </button>
              </div>
            </div>
          )}

          {/* CONVERT */}
          {activeTab === 'Convert' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Convert Lead to Project</h3>
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-200">
                    <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-1">Mark as Won & Create Project</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      This will automatically:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-none">
                      <li className="flex items-center gap-2">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500 flex-shrink-0"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Create a new Client record
                      </li>
                      <li className="flex items-center gap-2">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500 flex-shrink-0"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Create a new Project automatically
                      </li>
                      <li className="flex items-center gap-2">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500 flex-shrink-0"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Set milestone timeline and handover tasks
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={handleConvert}
                    disabled={converting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 shadow-md"
                  >
                    {converting ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    )}
                    Convert to Project
                  </button>
                  <button
                    onClick={() => handleStatusChange('Lost')}
                    className="px-6 py-2.5 text-sm font-bold text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Mark as Lost
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
