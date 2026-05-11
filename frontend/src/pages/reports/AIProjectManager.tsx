import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { projectService } from '../../services/projectService';
import api from '../../services/api';

const TABS = ['Dashboard', 'Milestones', 'Tasks', 'Reports'] as const;
type Tab = typeof TABS[number];

export const AIProjectManager: React.FC = () => {
    const { projects, fetchProjects, loading } = useProjectStore();
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
    const [reportOutput, setReportOutput] = useState<React.ReactNode | null>(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleProjectSelect = async (projectId: number) => {
        try {
            const res = await projectService.getProject(projectId);
            setSelectedProject(res.data);
            setActiveTab('Dashboard');
            setReportOutput(null);
        } catch (error) {
            console.error("Failed to fetch project details", error);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading && !projects.length) return <LoadingSpinner message="Loading AI Manager..." />;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#3C3489] rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <svg className="w-6 h-6" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="10" width="4" height="8" rx="1" fill="#AFA9EC"/>
                            <rect x="8" y="6" width="4" height="12" rx="1" fill="#EEEDFE"/>
                            <rect x="14" y="2" width="4" height="16" rx="1" fill="#CECBF6"/>
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Arvayon — AI Project Manager</h1>
                        <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Architecture, PMC & Construction Consultancy</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <select 
                        onChange={(e) => handleProjectSelect(Number(e.target.value))}
                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        value={selectedProject?.id || ''}
                    >
                        <option value="">— Select Project to Analyze —</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {!selectedProject ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-gray-700">No project selected</h2>
                    <p className="text-sm text-gray-400 mt-1 max-w-sm text-center">Select an existing project from the dropdown above to initialize the AI Project Manager dashboard and generate reports.</p>
                </div>
            ) : (
                <>
                    {/* Navigation Tabs */}
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${
                                    activeTab === tab 
                                    ? 'bg-white text-[#3C3489] shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-6">
                        {activeTab === 'Dashboard' && (
                            <DashboardView project={selectedProject} formatDate={formatDate} />
                        )}
                        {activeTab === 'Milestones' && (
                            <MilestonesView project={selectedProject} formatDate={formatDate} />
                        )}
                        {activeTab === 'Tasks' && (
                            <TasksView project={selectedProject} />
                        )}
                        {activeTab === 'Reports' && (
                            <ReportsView project={selectedProject} formatDate={formatDate} reportOutput={reportOutput} setReportOutput={setReportOutput} />
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const DashboardView: React.FC<{ project: any, formatDate: any }> = ({ project, formatDate }) => {
    const totalMs = project.milestones?.length || 0;
    const doneMs = project.milestones?.filter((m: any) => m.status === 'Completed').length || 0;
    const progress = project.completion_percentage || 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Duration', val: project.duration || '—', sub: 'working days', icon: '⏱️' },
                    { label: 'Area', val: project.area ? Number(project.area).toLocaleString() : '—', sub: 'sq.ft · Built-up', icon: '📐' },
                    { label: 'Milestones', val: totalMs, sub: `${doneMs} completed`, icon: '🚩' },
                    { label: 'Completion', val: `${progress}%`, sub: 'overall progress', icon: '📈' },
                ].map((m, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{m.label}</span>
                            <span className="text-lg">{m.icon}</span>
                        </div>
                        <div className="text-2xl font-black text-gray-800">{m.val}</div>
                        <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">{m.sub}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{project.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">Client: <span className="font-semibold text-gray-700">{project.client?.company_name || project.client_id}</span></p>
                    </div>
                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100 uppercase tracking-widest">
                        {project.status}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pt-8 border-t border-gray-50">
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Project Manager</p>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                {project.project_manager?.name?.charAt(0) || 'P'}
                            </div>
                            <span className="text-sm font-bold text-gray-700">{project.project_manager?.name || 'Unassigned'}</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Timeline</p>
                        <p className="text-sm font-bold text-gray-700">{formatDate(project.start_date)} → {formatDate(project.end_date)}</p>
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Est. Budget</p>
                        <p className="text-sm font-bold text-green-600">₹{Number(project.estimated_cost || 0).toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Overall Execution Progress</span>
                        <span className="text-sm font-black text-indigo-600">{progress}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5">
                        <div 
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-1000 shadow-sm"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const MilestonesView: React.FC<{ project: any, formatDate: any }> = ({ project, formatDate }) => {
    // Group milestones by phase/category if possible
    const milestones = project.milestones || [];
    
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Execution Roadmap</h3>
                <div className="space-y-4">
                    {milestones.map((ms: any, i: number) => (
                        <div key={ms.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors group">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 font-black text-sm group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                {i + 1}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-bold text-gray-800">{ms.title || ms.name}</h4>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                        ms.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {ms.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                    <span>{formatDate(ms.start_date)} → {formatDate(ms.end_date)}</span>
                                    <span>·</span>
                                    <span>{ms.tasks?.length || 0} Tasks</span>
                                </div>
                                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-700 ${ms.status === 'Completed' ? 'bg-green-500' : 'bg-indigo-500'}`}
                                        style={{ width: ms.status === 'Completed' ? '100%' : '20%' }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const TasksView: React.FC<{ project: any }> = ({ project }) => {
    const milestones = project.milestones || [];
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {milestones.map((ms: any) => (
                <div key={ms.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                        <h3 className="text-sm font-bold text-gray-800">{ms.title || ms.name}</h3>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{ms.tasks?.length || 0} Tasks</span>
                    </div>
                    <div className="space-y-3">
                        {ms.tasks?.length ? ms.tasks.map((task: any) => (
                            <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                                <div className={`w-2 h-2 rounded-full ${task.status === 'Completed' ? 'bg-green-500' : 'bg-orange-400'}`} />
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-gray-700">{task.title || task.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                                            {task.assigned_to?.name || 'Team'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-xs text-gray-400 italic text-center py-4">No tasks found in this milestone</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

const ReportsView: React.FC<{ project: any, formatDate: any, reportOutput: any, setReportOutput: any }> = ({ project, formatDate, reportOutput, setReportOutput }) => {
    
    const runReport = (type: string) => {
        let content = null;
        const generatedAt = formatDate(new Date());

        if (type === 'summary') {
            content = (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl max-w-2xl mx-auto border-t-8 border-t-indigo-600">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Project Status Summary</h2>
                            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Arvayon AI Generated · {generatedAt}</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black">S</div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-8 py-6 border-y border-gray-100">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Project Name</p>
                                <p className="text-lg font-bold text-gray-800">{project.name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Client</p>
                                <p className="text-lg font-bold text-gray-800">{project.client?.company_name || 'Valued Client'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Total Completion</p>
                                <p className="text-xl font-black text-indigo-600">{project.completion_percentage}%</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Days Logged</p>
                                <p className="text-xl font-black text-gray-700">42 / {project.duration}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Health Score</p>
                                <p className="text-xl font-black text-green-600">92%</p>
                            </div>
                        </div>

                        <div className="pt-6">
                            <p className="text-xs text-gray-500 leading-relaxed italic">
                                "The project is currently proceeding according to the optimized AI timeline. Design phases are complete, and site mobilization has commenced with minimal variance from the baseline budget."
                            </p>
                        </div>
                    </div>
                </div>
            );
        } else if (type === 'milestone') {
            content = (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl max-w-2xl mx-auto border-t-8 border-t-green-600">
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter mb-6">Milestone Progress</h2>
                    <div className="space-y-4">
                        {project.milestones?.map((ms: any) => (
                            <div key={ms.id} className="flex items-center justify-between py-3 border-b border-gray-50">
                                <div>
                                    <p className="text-sm font-bold text-gray-700">{ms.title || ms.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{formatDate(ms.start_date)} → {formatDate(ms.end_date)}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${ms.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-50 text-orange-600'}`}>
                                    {ms.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        } else {
            content = (
                <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-gray-200 text-center">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Report module initializing...</p>
                </div>
            );
        }
        setReportOutput(content);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { id: 'summary', label: 'Summary Report', sub: 'Overview, timeline, progress', icon: '📄', color: 'indigo' },
                    { id: 'milestone', label: 'Milestone Report', sub: 'Status of all phases', icon: '🚩', color: 'green' },
                    { id: 'tasks', label: 'Task Analysis', sub: 'Team assignment & efficiency', icon: '📝', color: 'orange' },
                    { id: 'delay', label: 'Delay Audit', sub: 'Identify blockers & risks', icon: '⚠️', color: 'red' },
                    { id: 'floor', label: 'Floor-wise Progress', sub: 'Vertical execution status', icon: '🏢', color: 'blue' },
                    { id: 'client', label: 'Client Deck', sub: 'Professional presentation view', icon: '🤝', color: 'gray' },
                ].map(rpt => (
                    <button 
                        key={rpt.id}
                        onClick={() => runReport(rpt.id)}
                        className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
                    >
                        <div className={`w-12 h-12 bg-${rpt.color}-50 rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform`}>
                            {rpt.icon}
                        </div>
                        <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight">{rpt.label}</h4>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{rpt.sub}</p>
                    </button>
                ))}
            </div>

            {reportOutput && (
                <div className="pt-8 border-t border-gray-100 animate-in zoom-in-95 duration-300">
                    {reportOutput}
                    <div className="flex justify-center mt-8 gap-4">
                        <button className="px-6 py-2 bg-gray-800 text-white text-xs font-bold rounded-xl hover:bg-black transition-all">Print PDF</button>
                        <button className="px-6 py-2 bg-white text-gray-700 border border-gray-200 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all">Share Link</button>
                    </div>
                </div>
            )}
        </div>
    );
};
