import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../stores/projectStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { projectService } from '../../services/projectService';

const TABS = ['Overview', 'Milestones', 'Tasks', 'Finance', 'Documents'] as const;
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
        try { const r = await projectService.getMilestones(parseInt(id!)); setMilestones(r.data.data || []); } catch { }
    };
    const fetchDocuments = async () => {
        try { const r = await projectService.getDocuments(parseInt(id!)); setDocuments(r.data.data || []); } catch { }
    };
    const handleStatusChange = async (s: string) => {
        try { await projectService.updateProject(parseInt(id!), { status: s }); fetchProject(parseInt(id!)); } catch { }
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

    const fakeMilestones = milestones.length === 0 ? [
        { id: 1, title: 'Design Finalization', due_date: '2026-02-15', status: 'Completed', description: 'Architectural & structural drawings approved' },
        { id: 2, title: 'Foundation Work', due_date: '2026-03-10', status: 'Completed', description: 'Excavation and foundation pour complete' },
        { id: 3, title: 'Superstructure', due_date: '2026-04-20', status: 'In Progress', description: 'Column and beam work ongoing' },
        { id: 4, title: 'Finishing & Handover', due_date: '2026-06-30', status: 'Pending', description: 'Flooring, painting, electrical, plumbing' },
    ] : milestones;

    return (
        <div className="w-full space-y-4">
            {/* Back */}
            <button onClick={() => navigate('/projects')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                Back to Projects
            </button>

            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">{currentProject.name}</h1>
                            <p className="text-sm text-gray-500">{(currentProject as any).client?.company_name || 'Client'}</p>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                {(currentProject as any).estimated_cost && (
                                    <span className="text-xs text-gray-600 font-semibold bg-gray-100 px-2 py-0.5 rounded">
                                        ₹{Number((currentProject as any).estimated_cost).toLocaleString('en-IN')}
                                    </span>
                                )}
                                {currentProject.ai_delay_risk && (
                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded text-white" style={{ background: riskColor }}>
                                        {currentProject.ai_delay_risk} Risk
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => navigate(`/projects/${id}/edit`)} className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Edit</button>
                        <button onClick={() => projectService.predictDelay(parseInt(id!)).catch(() => { })} className="px-4 py-2 text-sm font-semibold text-blue-700 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">🤖 Predict Delay</button>
                        <select
                            value={currentProject.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        >
                            {['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                {/* Progress */}
                <div className="mt-5">
                    <div className="flex justify-between mb-1.5">
                        <p className="text-xs text-gray-500 font-medium">Project Completion</p>
                        <p className="text-xs font-bold text-gray-700">{pct}%</p>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full progress-bar" style={{ width: `${pct}%`, background: pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#3b82f6' }} />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100 overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative px-5 py-3.5 text-sm font-semibold transition-colors flex-shrink-0 ${activeTab === tab ? 'text-blue-600 tab-active' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
                            <div className="lg:col-span-2">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Project Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        ['Start Date', (currentProject as any).start_date || '—'],
                                        ['End Date', (currentProject as any).end_date || '—'],
                                        ['Estimated Cost', (currentProject as any).estimated_cost ? '₹' + Number((currentProject as any).estimated_cost).toLocaleString('en-IN') : '—'],
                                        ['Actual Cost', (currentProject as any).actual_cost != null ? '₹' + Number((currentProject as any).actual_cost).toLocaleString('en-IN') : '—'],
                                        ['Project Manager', currentProject.project_manager?.name || 'Unassigned'],
                                        ['Status', currentProject.status],
                                    ].map(([label, value]) => (
                                        <div key={label} className="p-4 bg-gray-50 rounded-lg">
                                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">{label}</p>
                                            <p className="text-sm font-medium text-gray-700">{value}</p>
                                        </div>
                                    ))}
                                </div>
                                {(currentProject as any).description && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Description</p>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{(currentProject as any).description}</p>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                {currentProject.ai_delay_risk && (
                                    <div className="p-4 rounded-lg border" style={{ background: riskColor + '0f', borderColor: riskColor + '30' }}>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: riskColor }}>⚠️ AI Delay Risk</p>
                                        <div className="text-2xl font-bold" style={{ color: riskColor }}>{currentProject.ai_delay_risk}</div>
                                        <p className="text-xs text-gray-500 mt-1">{(currentProject as any).ai_delay_warning}</p>
                                    </div>
                                )}
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                    <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mb-2">Quick Links</p>
                                    <div className="space-y-2">
                                        <button onClick={() => navigate(`/tasks?project=${id}`)} className="w-full text-sm text-blue-600 text-left hover:underline font-medium">View Project Tasks →</button>
                                        <button onClick={() => navigate(`/invoices?project=${id}`)} className="w-full text-sm text-blue-600 text-left hover:underline font-medium">View Invoices →</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MILESTONES */}
                    {activeTab === 'Milestones' && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Project Milestones</h3>
                            {fakeMilestones.map((m: any, i: number) => {
                                const mc = m.status === 'Completed' ? '#22c55e' : m.status === 'In Progress' ? '#f59e0b' : '#94a3b8';
                                return (
                                    <div key={m.id} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: mc + '20' }}>
                                                {m.status === 'Completed' ? (
                                                    <svg viewBox="0 0 20 20" fill={mc} className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                ) : (
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: mc }}></div>
                                                )}
                                            </div>
                                            {i < fakeMilestones.length - 1 && <div className="w-0.5 flex-1 my-1" style={{ background: mc + '40' }}></div>}
                                        </div>
                                        <div className="pb-4 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-gray-700">{m.title}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: mc + '20', color: mc }}>{m.status}</span>
                                                    <span className="text-xs text-gray-400">{m.due_date}</span>
                                                </div>
                                            </div>
                                            {m.description && <p className="text-xs text-gray-400 mt-0.5">{m.description}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* TASKS */}
                    {activeTab === 'Tasks' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Project Tasks</h3>
                                <button onClick={() => navigate('/tasks/new')} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">+ Add Task</button>
                            </div>
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-500">View all tasks for this project</p>
                                <button onClick={() => navigate('/tasks')} className="mt-2 text-sm text-blue-600 hover:underline font-semibold">Go to Tasks →</button>
                            </div>
                        </div>
                    )}

                    {/* FINANCE */}
                    {activeTab === 'Finance' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Finance Overview</h3>
                                <button onClick={() => navigate('/invoices/new')} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">+ New Invoice</button>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: 'Estimated', value: (currentProject as any).estimated_cost, color: '#3b82f6' },
                                    { label: 'Actual', value: (currentProject as any).actual_cost, color: '#f59e0b' },
                                    { label: 'Variance', value: ((currentProject as any).actual_cost || 0) - ((currentProject as any).estimated_cost || 0), color: '#22c55e' },
                                ].map(item => (
                                    <div key={item.label} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">{item.label}</p>
                                        <p className="text-lg font-bold" style={{ color: item.color }}>
                                            {item.value != null ? '₹' + Number(item.value).toLocaleString('en-IN') : '—'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => navigate('/invoices')} className="text-sm text-blue-600 hover:underline font-semibold">View All Invoices →</button>
                        </div>
                    )}

                    {/* DOCUMENTS */}
                    {activeTab === 'Documents' && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Documents</h3>
                            {documents.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-gray-300 mx-auto mb-2">
                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
                                    </svg>
                                    <p className="text-sm text-gray-400">No documents uploaded</p>
                                    <p className="text-xs text-gray-400 mt-1">Upload BOQ, drawings, approvals here</p>
                                </div>
                            ) : (
                                documents.map((d: any) => (
                                    <div key={d.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-500">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-medium text-gray-700">{d.name}</p>
                                        </div>
                                        <button onClick={() => window.open(d.url, '_blank')} className="text-xs text-blue-600 font-semibold hover:underline">View</button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
