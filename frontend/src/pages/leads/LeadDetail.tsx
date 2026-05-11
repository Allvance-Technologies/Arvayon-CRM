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

const PLAN_TYPES = ['Basic', 'Standard', 'Premium'];
const SERVICE_CATEGORIES = [
  'Floor Plan Design', 'Working Drawing', 'Elevation Design', '3D Exterior WalkThru',
  'Structural Design', 'Electrical Layout', 'Plumbing Layout', 'Interior Concept Design',
  'Interior Detail Drawing', 'Interior WalkThru', 'BOQ & Estimation', 'Site Visit - Local',
  'PMC Consultancy', 'Full Construction (Turnkey)'
];

export const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentLead, loading, fetchLead } = useLeadStore();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [note, setNote] = useState('');
  const [activities, setActivities] = useState<any[]>([]);
  const [converting, setConverting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  // Document Generation State
  const [proposalData, setProposalData] = useState({ plan: 'Basic', service: 'Floor Plan Design', notes: '' });
  const [quoteData, setQuoteData] = useState({ 
    service: 'Floor Plan Design', 
    unitQuantity: 1, 
    notes: '',
    projectName: '',
    floors: 1,
    complexity: 'Standard',
    startDate: new Date().toISOString().split('T')[0],
    plotDimensions: '',
    style: 'Modern',
    locationLink: ''
  });
  const [genProposalId, setGenProposalId] = useState<number | null>(null);
  const [genQuoteId, setGenQuoteId] = useState<number | null>(null);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);

  // Initialize data from currentLead
  useEffect(() => {
    if (currentLead) {
      try {
        if (currentLead.first_call && currentLead.first_call.startsWith('{')) {
          const parsed = JSON.parse(currentLead.first_call);
          setProposalData({
            plan: parsed.consultancy_plan || 'Basic',
            service: parsed.primary_service || 'Floor Plan Design',
            notes: parsed.raw || ''
          });
        } else if (currentLead.first_call) {
          setProposalData(prev => ({ ...prev, notes: currentLead.first_call }));
        }

        if (currentLead.second_call && currentLead.second_call.startsWith('{')) {
          const parsed = JSON.parse(currentLead.second_call);
          setQuoteData({
            service: parsed.primary_service || 'Floor Plan Design',
            unitQuantity: parsed.unit_quantity || 1,
            notes: parsed.raw || '',
            projectName: parsed.project_name || currentLead.project_name || '',
            floors: parsed.floors || 1,
            complexity: parsed.complexity || 'Standard',
            startDate: parsed.start_date || currentLead.start_date || new Date().toISOString().split('T')[0],
            plotDimensions: parsed.plot_dimensions || currentLead.plot_dimensions || '',
            style: parsed.architectural_style || currentLead.architectural_style || 'Modern',
            locationLink: parsed.site_location_link || currentLead.site_location_link || ''
          });
        } else if (currentLead.second_call) {
          setQuoteData(prev => ({ ...prev, notes: currentLead.second_call }));
        }
      } catch (e) {
        console.error("Failed to parse call data", e);
      }
    }
  }, [currentLead]);

  const handleGenerateProposal = async () => {
    setIsGeneratingDoc(true);
    try {
      // 1. Update Lead with structured first_call data
      const firstCallJson = JSON.stringify({
        raw: proposalData.notes,
        consultancy_plan: proposalData.plan,
        primary_service: proposalData.service,
        unit_quantity: quoteData.unitQuantity // Carry over if exists
      });
      
      await leadService.update(parseInt(id!), { 
        ...currentLead,
        first_call: firstCallJson 
      });

      // 2. Generate Proposal
      const res = await api.post('/proposals', {
        lead_id: parseInt(id!),
        status: 'Draft',
        client_name: currentLead.company_name || currentLead.contact_person,
        project_location: currentLead.location || '',
        title: `${proposalData.plan} Plan - ${proposalData.service} for ${currentLead.company_name}`,
        content: `Plan: ${proposalData.plan}\nService: ${proposalData.service}\nNotes: ${proposalData.notes}`
      });
      setGenProposalId(res.data.id);
      fetchLead(parseInt(id!)); // Refresh lead data
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const handleGenerateQuote = async () => {
    setIsGeneratingDoc(true);
    try {
      // 1. Update Lead with structured second_call data
      const secondCallJson = JSON.stringify({
        raw: quoteData.notes,
        primary_service: quoteData.service,
        unit_quantity: quoteData.unitQuantity,
        project_name: quoteData.projectName,
        floors: quoteData.floors,
        complexity: quoteData.complexity,
        start_date: quoteData.startDate,
        plot_dimensions: quoteData.plotDimensions,
        architectural_style: quoteData.style,
        site_location_link: quoteData.locationLink
      });

      await leadService.update(parseInt(id!), {
        ...currentLead,
        second_call: secondCallJson,
        project_name: quoteData.projectName,
        start_date: quoteData.startDate,
        area: quoteData.unitQuantity,
        floors: quoteData.floors,
        complexity: quoteData.complexity,
        plot_dimensions: quoteData.plotDimensions,
        architectural_style: quoteData.style,
        site_location_link: quoteData.locationLink,
        budget: currentLead.budget || currentLead.estimated_value // Ensure budget is preserved
      });

      // 2. Generate Quote
      const value = Number(currentLead.budget || currentLead.estimated_value || 0);
      const res = await api.post('/quotes', {
        lead_id: parseInt(id!),
        status: 'Draft',
        quote_number: 'QT-' + Math.floor(Date.now() / 1000),
        tax_percent: 0,
        subtotal: value,
        tax: 0,
        total_amount: value,
        notes: `Unit Quantity: ${quoteData.unitQuantity}\n` + quoteData.notes,
        items: [{
          description: `${quoteData.service} - Quantity: ${quoteData.unitQuantity}`,
          quantity: quoteData.unitQuantity,
          unit_price: value,
          total: value
        }]
      });
      setGenQuoteId(res.data.id);
      fetchLead(parseInt(id!)); // Refresh lead data
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  useEffect(() => {
    if (id) { 
      fetchLead(parseInt(id)); 
      fetchActivities(); 
      fetchUsers();
    }
  }, [id]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || res.data || []);
    } catch { }
  };

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

  const handleUpdatePlanning = async (data: any) => {
    try {
      await leadService.update(parseInt(id!), { ...currentLead, ...data });
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
          {/* OVERVIEW - MINIMALIST MODERN */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                
                {/* Clean Identity Header */}
                <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400">
                      {(currentLead.company_name || 'L').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900">{currentLead.company_name}</h2>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-100 uppercase tracking-tight">
                          {currentLead.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 font-medium">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                          {currentLead.location || 'No Location'}
                        </span>
                        <span>•</span>
                        <span>{currentLead.email || 'No Email'}</span>
                        <span>•</span>
                        <span>{currentLead.phone || 'No Phone'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Specs Grid */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Technical Specifications</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: 'Built Area', value: `${quoteData.unitQuantity} Sqft` },
                      { label: 'Floors', value: `${quoteData.floors} F` },
                      { label: 'Architectural Style', value: quoteData.style },
                      { label: 'Complexity', value: quoteData.complexity },
                      { label: 'Plot Dimensions', value: quoteData.plotDimensions || '—' },
                      { label: 'Est. Start Date', value: quoteData.startDate || '—' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-gray-200 transition-colors">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">{item.label}</p>
                        <p className="text-sm font-bold text-gray-800">{item.value}</p>
                      </div>
                    ))}
                    <div className="col-span-2 md:col-span-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                       <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Primary Service Category</p>
                       <p className="text-sm font-bold text-gray-700">{quoteData.service}</p>
                    </div>
                  </div>
                </div>

                {/* Discussion Insights - DISPLAY ONLY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Call Status Card */}
                  <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-gray-900 uppercase">First Call Insights</h4>
                      <span className="w-6 h-6 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center text-[10px] font-bold">1st</span>
                    </div>
                    <div className="flex-1 text-xs text-gray-500 italic mb-6 leading-relaxed">
                      {proposalData.notes || 'No discussion notes recorded.'}
                    </div>
                    
                    {genProposalId ? (
                       <div className="space-y-3">
                          <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase">
                             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                             Proposal Generated
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => window.open(`/#/proposals/${genProposalId}/print`, '_blank')} className="flex-1 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-bold rounded border border-gray-100 hover:bg-gray-100 uppercase">View Document</button>
                             <button onClick={() => window.open(`/#/proposals/${genProposalId}/print?download=true`, '_blank')} className="flex-1 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-bold rounded border border-gray-100 hover:bg-gray-100 uppercase">Download PDF</button>
                          </div>
                       </div>
                    ) : (
                       <div className="py-2 px-3 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-400 uppercase text-center border border-gray-100">
                          Proposal Pending
                       </div>
                    )}
                  </div>

                  {/* Second Call Status Card */}
                  <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-gray-900 uppercase">Second Call Review</h4>
                      <span className="w-6 h-6 bg-gray-50 text-gray-400 rounded-md flex items-center justify-center text-[10px] font-bold">2nd</span>
                    </div>
                    <div className="flex-1 text-xs text-gray-500 italic mb-6 leading-relaxed">
                      {quoteData.notes || 'No technical notes recorded.'}
                    </div>
                    
                    {genQuoteId ? (
                       <div className="space-y-3">
                          <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase">
                             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                             Quotation Finalized
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => window.open(`/#/quotes/${genQuoteId}/print`, '_blank')} className="flex-1 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-bold rounded border border-gray-100 hover:bg-gray-100 uppercase">View Quote</button>
                             <button onClick={() => window.open(`/#/quotes/${genQuoteId}/print?download=true`, '_blank')} className="flex-1 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-bold rounded border border-gray-100 hover:bg-gray-100 uppercase">Download PDF</button>
                          </div>
                       </div>
                    ) : (
                       <div className="py-2 px-3 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-400 uppercase text-center border border-gray-100">
                          Quotation Pending
                       </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Minimalist Sidebar */}
              <div className="space-y-6">
                <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Conversion Status</p>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-bold text-gray-900">{currentLead.ai_score || 0}%</span>
                    <span className="text-xs text-gray-400 font-medium mb-1.5 uppercase">Match</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${currentLead.ai_score}%` }}></div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Architect Assigned</p>
                    {currentLead.assigned_to ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-200">
                          {currentLead.assigned_to.name?.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-gray-700">{currentLead.assigned_to.name}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Unassigned</p>
                    )}
                  </div>
                  <div className="pt-4 border-t border-gray-50">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pipeline History</p>
                     <div className="space-y-2">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                           <p className="text-xs font-bold text-gray-700">{currentLead.status}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                           <p className="text-xs text-gray-400 font-medium tracking-tight">Created {new Date(currentLead.created_at).toLocaleDateString()}</p>
                        </div>
                     </div>
                  </div>
                </div>

                <button
                   onClick={handleConvert}
                   disabled={converting || currentLead.status !== 'Won'}
                   className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                     currentLead.status === 'Won' 
                     ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                     : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'
                   }`}
                >
                   Convert to Project
                </button>
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
