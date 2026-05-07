import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLeadStore } from '../../stores/leadStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { leadService } from '../../services/leadService';
import api from '../../services/api';

const TABS = ['Overview', 'Activity', 'Notes'] as const;
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

  // Document Generation State
  const [proposalData, setProposalData] = useState({ type: 'Standard Implementation', notes: '' });
  const [quoteData, setQuoteData] = useState({ type: 'Consulting Services', notes: '' });
  const [genProposalId, setGenProposalId] = useState<number | null>(null);
  const [genQuoteId, setGenQuoteId] = useState<number | null>(null);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);

  const handleGenerateProposal = async () => {
    setIsGeneratingDoc(true);
    try {
      const res = await api.post('/proposals', {
        lead_id: parseInt(id!),
        status: 'Draft',
        client_name: currentLead.company_name || currentLead.contact_person,
        project_location: currentLead.location || '',
        title: `${proposalData.type} for ${currentLead.company_name}`,
        content: `Type: ${proposalData.type}\nNotes: ${proposalData.notes}`
      });
      setGenProposalId(res.data.id);
    } catch (err: any) {
      alert('Error generating proposal: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const handleGenerateQuote = async () => {
    setIsGeneratingDoc(true);
    try {
      const value = Number(currentLead.budget || currentLead.estimated_value || 0);
      const res = await api.post('/quotes', {
        lead_id: parseInt(id!),
        status: 'Draft',
        quote_number: 'QT-' + Math.floor(Date.now() / 1000),
        tax_percent: 0,
        subtotal: value,
        tax: 0,
        total_amount: value,
        notes: quoteData.notes,
        items: [{
          description: quoteData.type,
          quantity: 1,
          unit_price: value,
          total: value
        }]
      });
      setGenQuoteId(res.data.id);
    } catch (err: any) {
      alert('Error generating quotation: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  useEffect(() => {
    if (id) { fetchLead(parseInt(id)); fetchActivities(); }
  }, [id]);

  const fetchActivities = async () => {
    try {
      const res = await leadService.getActivities(parseInt(id!));
      setActivities(res.data || []);
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
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-xl font-bold text-gray-800">{currentLead.company_name}</h1>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {currentLead.lead_custom_id || `LEAD_APBS_${new Date(currentLead.created_at || new Date()).getFullYear()}_${String(currentLead.id).padStart(3, '0')}`}
                </span>
              </div>
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
                      ['Lead ID', currentLead.lead_custom_id || `LEAD_APBS_${new Date(currentLead.created_at || new Date()).getFullYear()}_${String(currentLead.id).padStart(3, '0')}`],
                      ['Email', currentLead.email],
                      ['Phone', currentLead.phone || '—'],
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
                    {/* First Call Action - Proposal */}
                    <div className="p-5 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col justify-between">
                      <div className="flex-1 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[10px] font-bold">1</div>
                          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">First Call Note</p>
                        </div>
                        
                        {!genProposalId ? (
                          <div className="space-y-3 mt-4">
                            <div>
                              <label className="block text-[10px] font-semibold text-blue-800 uppercase tracking-wide mb-1">Proposal Type</label>
                              <select 
                                value={proposalData.type}
                                onChange={(e) => setProposalData({...proposalData, type: e.target.value})}
                                className="w-full px-3 py-2 text-xs border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                              >
                                <option value="Standard Implementation">Standard Implementation</option>
                                <option value="Premium Service">Premium Service</option>
                                <option value="Consulting Retainer">Consulting Retainer</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-blue-800 uppercase tracking-wide mb-1">Additional Notes</label>
                              <textarea 
                                value={proposalData.notes}
                                onChange={(e) => setProposalData({...proposalData, notes: e.target.value})}
                                rows={2} 
                                placeholder="Details from the first contact..."
                                className="w-full px-3 py-2 text-xs border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 p-4 bg-white rounded-lg border border-green-200 flex flex-col items-center gap-2 text-center shadow-sm">
                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <p className="text-sm font-semibold text-gray-800">Proposal Generated!</p>
                            <div className="flex gap-2 w-full mt-2">
                              <button onClick={() => window.open(`/proposals/${genProposalId}/print`, '_blank')} className="flex-1 py-1.5 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-700">Preview</button>
                              <button onClick={() => window.open(`/proposals/${genProposalId}/print?download=true`, '_blank')} className="flex-1 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100">Download</button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {!genProposalId && (
                        <button
                          disabled={isGeneratingDoc}
                          onClick={handleGenerateProposal}
                          className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-blue-600 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                        >
                          {isGeneratingDoc ? 'Generating...' : 'Save & Create Proposal'}
                        </button>
                      )}
                    </div>

                    {/* Second Call Action - Quotation */}
                    <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col justify-between">
                      <div className="flex-1 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white text-[10px] font-bold">2</div>
                          <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Second Call Note</p>
                        </div>
                        
                        {!genQuoteId ? (
                          <div className="space-y-3 mt-4">
                            <div>
                              <label className="block text-[10px] font-semibold text-indigo-800 uppercase tracking-wide mb-1">Service Type</label>
                              <select 
                                value={quoteData.type}
                                onChange={(e) => setQuoteData({...quoteData, type: e.target.value})}
                                className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                              >
                                <option value="Consulting Services">Consulting Services</option>
                                <option value="Hardware Installation">Hardware Installation</option>
                                <option value="Software License">Software License</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-indigo-800 uppercase tracking-wide mb-1">Additional Notes</label>
                              <textarea 
                                value={quoteData.notes}
                                onChange={(e) => setQuoteData({...quoteData, notes: e.target.value})}
                                rows={2} 
                                placeholder="Details from the follow-up..."
                                className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 p-4 bg-white rounded-lg border border-green-200 flex flex-col items-center gap-2 text-center shadow-sm">
                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <p className="text-sm font-semibold text-gray-800">Quotation Generated!</p>
                            <div className="flex gap-2 w-full mt-2">
                              <button onClick={() => window.open(`/quotes/${genQuoteId}/print`, '_blank')} className="flex-1 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700">Preview</button>
                              <button onClick={() => window.open(`/quotes/${genQuoteId}/print?download=true`, '_blank')} className="flex-1 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100">Download</button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {!genQuoteId && (
                        <button
                          disabled={isGeneratingDoc}
                          onClick={handleGenerateQuote}
                          className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-indigo-600 text-xs font-bold rounded-lg border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                        >
                          {isGeneratingDoc ? 'Generating...' : 'Save & Create Quotation'}
                        </button>
                      )}
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

        </div>
      </div>
    </div>
  );
};
