import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../stores/projectStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { projectService } from '../../services/projectService';

const TABS = ['Overview', 'Milestones', 'Tasks'] as const;
type Tab = typeof TABS[number];

export const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentProject, loading, fetchProject } = useProjectStore();
    const [activeTab, setActiveTab] = useState<Tab>('Overview');
    const [milestones, setMilestones] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            fetchProject(parseInt(id));
            fetchMilestones();
            fetchDocuments();
        }
    }, [id]);

    const fetchMilestones = async () => {
        try { 
            const r = await projectService.getMilestones(parseInt(id!)); 
            setMilestones(r.data.data || r.data || []); 
        } catch { }
    };
    const fetchDocuments = async () => {
        try { 
            const r = await projectService.getDocuments(parseInt(id!)); 
            setDocuments(r.data.data || r.data || []); 
        } catch { }
    };
    const handleStatusChange = async (s: string) => {
        try { 
            await projectService.updateProject(parseInt(id!), { status: s }); 
            fetchProject(parseInt(id!)); 
        } catch { }
    };

    if (loading) return <LoadingSpinner message="Loading project..." />;
    if (!currentProject) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <p className="text-gray-500">Project not found</p>
            <button onClick={() => navigate('/projects')} className="text-sm text-blue-600 hover:underline">← Back to Projects</button>
        </div>
    );

    const pct = (currentProject as any).completion_percentage || 0;
    const riskColor = currentProject.ai_delay_risk === 'High' ? '#ef4444' : currentProject.ai_delay_risk === 'Medium' ? '#f59e0b' : '#22c55e';

    return (
        <div className="w-full space-y-4 pb-10">
            {/* Back Navigation */}
            <button 
                onClick={() => navigate('/projects')} 
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-bold transition-colors"
            >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                Back to Projects
            </button>

            {/* Project Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-700 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-black text-gray-800 tracking-tight">{currentProject.name}</h1>
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black border border-blue-100 uppercase tracking-widest">
                                    {currentProject.status}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-gray-400">{(currentProject as any).client?.company_name || 'Project Client'}</p>
                            
                            <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Budget</span>
                                    <span className="text-sm font-black text-green-600">
                                        ₹{Number((currentProject as any).estimated_cost || 0).toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Risk Level</span>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white uppercase`} style={{ background: riskColor }}>
                                        {currentProject.ai_delay_risk || 'Low'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate(`/projects/${id}/edit`)}
                            className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                        >
                            Edit Details
                        </button>
                        <select
                            value={currentProject.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        >
                            {['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Main Progress Bar */}
                <div className="mt-8">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Execution Progress</span>
                        <span className="text-sm font-black text-indigo-600">{pct}%</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden p-1">
                        <div 
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-1000 shadow-sm" 
                            style={{ width: `${pct}%` }} 
                        />
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-50 p-1">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-2xl ${
                                activeTab === tab 
                                ? 'bg-indigo-50 text-indigo-600' 
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    {/* OVERVIEW SECTION */}
                    {activeTab === 'Overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="lg:col-span-2 space-y-8">
                                <div>
                                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6">Core Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { label: 'Planned Start', value: (currentProject as any).start_date, icon: '📅' },
                                            { label: 'Target Completion', value: (currentProject as any).end_date, icon: '🏁' },
                                            { label: 'Project Manager', value: currentProject.project_manager?.name || 'Unassigned', icon: '👤' },
                                            { label: 'Lead Reference', value: `LEAD-${currentProject.lead_id}`, icon: '🔗' },
                                        ].map((item, idx) => (
                                            <div key={idx} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                                                <span className="text-xl">{item.icon}</span>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                                                    <p className="text-sm font-bold text-gray-700">{item.value || '—'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {currentProject.description && (
                                    <div>
                                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4">Description & Scope</h3>
                                        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                            {currentProject.description}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4">Project Architecture Profile</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-8 bg-white border border-gray-100 rounded-3xl shadow-sm">
                                        {[
                                            { label: 'Built-up Area', value: `${(currentProject as any).area || 0} Sqft`, icon: '📐' },
                                            { label: 'Floors', value: `${(currentProject as any).floors || 1} Storey`, icon: '🏢' },
                                            { label: 'Complexity', value: (currentProject as any).complexity || 'Standard', icon: '⚡' },
                                            { label: 'Plot Size', value: (currentProject as any).plot_dimensions || '—', icon: '📏' },
                                            { label: 'Design Style', value: (currentProject as any).architectural_style || 'Modern', icon: '🎨' },
                                            { label: 'Location', value: (currentProject as any).site_location_link ? 'View Map ↗' : '—', icon: '📍', link: (currentProject as any).site_location_link },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex flex-col items-center justify-center p-4 rounded-2xl hover:bg-gray-50 transition-all group">
                                                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform opacity-80">{item.icon}</div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                                                {item.link ? (
                                                   <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline">{item.value}</a>
                                                ) : (
                                                   <p className="text-xs font-bold text-gray-700">{item.value}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-70">AI Insight</h4>
                                    <p className="text-sm font-bold leading-relaxed mb-6">
                                        {(currentProject as any).ai_delay_warning || "Project is currently performing within calculated variance. No immediate blockers detected."}
                                    </p>
                                    <div className="flex items-center justify-between pt-6 border-t border-white/10">
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Risk Index</span>
                                        <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase">
                                            {currentProject.ai_delay_risk || 'Low'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Quick Operations</h4>
                                    <div className="space-y-2">
                                        <button onClick={() => navigate(`/tasks?project=${id}`)} className="w-full text-left p-3 text-xs font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all flex items-center justify-between">
                                            Manage Tasks <span>→</span>
                                        </button>
                                        <button onClick={() => navigate(`/invoices?project=${id}`)} className="w-full text-left p-3 text-xs font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all flex items-center justify-between">
                                            Billing History <span>→</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MILESTONES SECTION */}
                    {activeTab === 'Milestones' && (
                        <div className="space-y-8 max-w-4xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Execution Roadmap</h3>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Completed</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase">In Progress</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-12 relative">
                                {/* Vertical progress line */}
                                <div className="absolute left-6 top-4 bottom-4 w-1 bg-gray-50 -z-10"></div>
                                
                                {(() => {
                                    const phases = ['Design', 'PMC', 'Construction'];
                                    return phases.map(phase => {
                                        const phaseMilestones = milestones.filter((m: any) => m.name.includes(`[${phase}]`));
                                        if (phaseMilestones.length === 0) return null;

                                        return (
                                            <div key={phase} className="space-y-6">
                                                <div className="inline-flex items-center px-4 py-1.5 bg-gray-800 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] ml-1">
                                                    {phase} Phase
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    {phaseMilestones.map((ms: any, idx: number) => (
                                                        <div key={ms.id} className="flex items-start gap-6 group">
                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shadow-lg transition-all flex-shrink-0 z-10 ${
                                                                ms.status === 'Completed' 
                                                                ? 'bg-green-500 text-white scale-110 shadow-green-100' 
                                                                : 'bg-white border-2 border-gray-100 text-gray-300 group-hover:border-indigo-500 group-hover:text-indigo-500'
                                                            }`}>
                                                                {idx + 1}
                                                            </div>
                                                            <div className="flex-1 bg-gray-50/50 border border-gray-100 rounded-3xl p-5 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h4 className="text-sm font-black text-gray-800 tracking-tight">
                                                                        {ms.name.includes('] ') ? ms.name.split('] ')[1] : ms.name}
                                                                    </h4>
                                                                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                                                                        ms.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                                                                    }`}>
                                                                        {ms.status}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                                        <span className="flex items-center gap-1">📅 {new Date(ms.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                                        <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                                                                        <span>📋 {(ms as any).tasks?.length || 3} Tasks</span>
                                                                    </div>
                                                                    
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigate(`/invoices/new?project_id=${currentProject.id}&milestone_id=${ms.id}`);
                                                                        }}
                                                                        className="px-3 py-1.5 bg-white border border-gray-100 text-gray-600 text-[9px] font-black uppercase rounded-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all flex items-center gap-1"
                                                                    >
                                                                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>
                                                                        Bill Stage
                                                                    </button>
                                                                </div>
                                                                {ms.status !== 'Completed' && (
                                                                    <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                        <div 
                                                                            className="h-full bg-indigo-500 transition-all duration-700" 
                                                                            style={{ width: ms.status === 'In Progress' ? '45%' : '0%' }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    )}

                    {/* TASKS SECTION - HIGH FIDELITY BOARD */}
                    {activeTab === 'Tasks' && (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                   <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-1">Task Assignment Board</h3>
                                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Active Team Operations & Assignments</p>
                                </div>
                                <button onClick={() => navigate('/tasks/new')} className="px-5 py-2.5 bg-gray-900 text-white text-[10px] font-black rounded-xl hover:bg-black transition-all uppercase tracking-widest shadow-lg shadow-gray-200">
                                    + Add Operation
                                </button>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {milestones.map((ms: any) => {
                                    const total = ms.tasks?.length || 0;
                                    const completed = ms.tasks?.filter((t: any) => t.status === 'Completed').length || 0;
                                    const progress = total ? Math.round((completed / total) * 100) : 0;

                                    return (
                                        <div key={ms.id} className="bg-white border border-gray-100 rounded-[32px] p-7 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-sm font-black">
                                                        {ms.name.includes('[') ? ms.name.match(/\[(.*?)\]/)?.[1]?.charAt(0) : 'P'}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-gray-800 tracking-tight leading-none mb-1.5">
                                                            {ms.name.split('] ')[1] || ms.name}
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-20 h-1 bg-gray-50 rounded-full overflow-hidden">
                                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                                                            </div>
                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{completed}/{total} DONE</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${
                                                   progress === 100 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-400 border border-gray-100'
                                                }`}>
                                                   {progress === 100 ? 'Finalized' : 'In Motion'}
                                                </span>
                                            </div>

                                            <div className="space-y-4">
                                                {ms.tasks && ms.tasks.length > 0 ? ms.tasks.map((task: any) => {
                                                   const initials = task.assigned_to?.name?.split(' ').map((n:any) => n[0]).join('').toUpperCase() || 'AM';
                                                   return (
                                                      <div key={task.id} className="flex items-center gap-4 p-4 bg-gray-50/30 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all group cursor-pointer">
                                                         {/* Task Checkbox-style status */}
                                                         <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                            task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 group-hover:border-indigo-400'
                                                         }`}>
                                                            {task.status === 'Completed' && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                         </div>

                                                         <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-bold truncate ${task.status === 'Completed' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                               {task.title}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                               <div className="flex items-center gap-1.5">
                                                                  <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center text-[8px] font-black text-indigo-600">
                                                                     {initials}
                                                                  </div>
                                                                  <span className="text-[9px] font-bold text-gray-400 uppercase">{task.assigned_to?.name || 'Member'}</span>
                                                               </div>
                                                               {task.due_date && (
                                                                  <span className="text-[9px] font-bold text-gray-300 uppercase flex items-center gap-1">
                                                                     <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                     {new Date(task.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                                  </span>
                                                               )}
                                                            </div>
                                                         </div>

                                                         {/* Priority Tag */}
                                                         <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                            task.priority === 'High' ? 'bg-rose-50 text-rose-500' : 'bg-gray-100 text-gray-400'
                                                         }`}>
                                                            {task.priority || 'Medium'}
                                                         </div>
                                                      </div>
                                                   );
                                                }) : (
                                                   <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                                                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Operations Pending Initialization</p>
                                                   </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
