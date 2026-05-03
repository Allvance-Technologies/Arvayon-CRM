import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProjectStore } from '../../stores/projectStore';
import { projectService } from '../../services/projectService';
import api from '../../services/api';

const projectSchema = z.object({
    name: z.string().optional(),
    client_id: z.number().min(1, 'Client is required').or(z.string().regex(/^\d+$/).transform(Number)),
    lead_id: z.number().optional().or(z.string().optional().transform(v => v ? Number(v) : undefined)),
    description: z.string().optional(),
    status: z.enum(['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled']).default('Planning'),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    estimated_cost: z.number().min(0).optional().or(z.string().optional().transform(v => v ? Number(v) : undefined)),
    actual_cost: z.number().min(0).optional().or(z.string().optional().transform(v => v ? Number(v) : undefined)),
    project_manager_id: z.number().optional().or(z.string().optional().transform(v => v ? Number(v) : undefined)),
});
type ProjectFormData = z.infer<typeof projectSchema>;

const Field = ({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
        {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
);

const inputCls = (hasError?: boolean) =>
    `w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${hasError ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-400'
    }`;

export default function ProjectForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);
    const { createProject, updateProject } = useProjectStore();
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clients, setClients] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectFormData>({
        resolver: zodResolver(projectSchema),
        defaultValues: { status: 'Planning' },
    });

    // Fetch clients and managers for dropdowns
    useEffect(() => {
        api.get('/clients', { params: { all: true } })
            .then(r => setClients(r.data.data || r.data))
            .catch(() => { });
        api.get('/employees')
            .then(r => setManagers(r.data.data || r.data))
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (isEditing && id) {
            setLoading(true);
            projectService.getProject(Number(id))
                .then((res: any) => {
                    const d = res.data || res;
                    reset({
                        name: d.name,
                        client_id: d.client_id,
                        lead_id: d.lead_id,
                        description: d.description || '',
                        status: d.status || 'Planning',
                        start_date: d.start_date || '',
                        end_date: d.end_date || '',
                        estimated_cost: d.estimated_cost,
                        actual_cost: d.actual_cost,
                        project_manager_id: d.project_manager_id,
                    });
                })
                .catch(() => setError('Failed to load project'))
                .finally(() => setLoading(false));
        }
    }, [id, isEditing, reset]);

    const onSubmit = async (data: ProjectFormData) => {
        setError(null);
        setSubmitLoading(true);
        try {
            if (isEditing && id) {
                await updateProject(Number(id), data);
                navigate(`/projects/${id}`);
            } else {
                await createProject(data);
                navigate('/projects');
            }
        } catch (err: any) {
            const serverMsg = err.response?.data?.message;
            const validationErrors = err.response?.data?.errors;
            let displayErr = serverMsg || err.message || 'Failed to save project';
            if (validationErrors) {
                displayErr += ': ' + Object.values(validationErrors).flat().join(', ');
            }
            setError(displayErr);
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit Project' : 'New Project'}</h1>
                    <p className="text-xs text-gray-500">{isEditing ? 'Update project details' : 'Create a new construction project'}</p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 text-red-400"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Basic Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-5 flex items-center gap-2">
                        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                            <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path d="M3 7a2 2 0 012-2h4l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
                        </div>
                        Project Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Project Name" hint="Leave empty to auto-generate: APBS_ID_CLIENT_LOCATION" error={errors.name?.message}>
                            <input {...register('name')} placeholder="Auto-generated if empty" className={inputCls(!!errors.name)} />
                        </Field>
                        <Field label="Status">
                            <select {...register('status')} className={inputCls()}>
                                {['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </Field>
                        <Field label="Client" required error={errors.client_id?.message}>
                            <select {...register('client_id')} className={inputCls(!!errors.client_id)}>
                                <option value="">— Select Client —</option>
                                {clients.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.company_name}{c.contact_person ? ` — ${c.contact_person}` : ''}</option>
                                ))}
                            </select>
                            {clients.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">⚠️ No clients found. <a href="#" className="underline" onClick={(e) => { e.preventDefault(); navigate('/clients/new'); }}>Add a client first</a>.</p>
                            )}
                        </Field>
                        <Field label="Lead ID" hint="Optional – if converted from a lead">
                            <input {...register('lead_id')} type="number" placeholder="e.g. 12" className={inputCls()} />
                        </Field>
                        <Field label="Project Manager">
                            <select {...register('project_manager_id')} className={inputCls()}>
                                <option value="">— None —</option>
                                {managers.map((m: any) => (
                                    <option key={m.id} value={m.id}>{m.name}{m.employee_profile?.designation ? ` (${m.employee_profile.designation})` : ''}</option>
                                ))}
                            </select>
                        </Field>
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-5 flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                            <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                        </div>
                        Timeline
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Start Date">
                            <input {...register('start_date')} type="date" className={inputCls()} />
                        </Field>
                        <Field label="End Date">
                            <input {...register('end_date')} type="date" className={inputCls()} />
                        </Field>
                    </div>
                </div>

                {/* Budget */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-5 flex items-center gap-2">
                        <div className="w-5 h-5 bg-yellow-500 rounded flex items-center justify-center">
                            <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" /></svg>
                        </div>
                        Budget (₹)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Estimated Cost" error={errors.estimated_cost?.message}>
                            <input {...register('estimated_cost')} type="number" placeholder="e.g. 2500000" className={inputCls(!!errors.estimated_cost)} />
                        </Field>
                        <Field label="Actual Cost" hint="Fill in as expenses are incurred">
                            <input {...register('actual_cost')} type="number" placeholder="e.g. 1200000" className={inputCls()} />
                        </Field>
                    </div>
                </div>

                {/* Description */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <div className="w-5 h-5 bg-purple-500 rounded flex items-center justify-center">
                            <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                        </div>
                        Description
                    </h2>
                    <textarea
                        {...register('description')}
                        rows={4}
                        placeholder="Brief description of the project scope, location, and key requirements…"
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none transition-all"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitLoading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md shadow-blue-600/20"
                    >
                        {submitLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        {isEditing ? 'Update Project' : 'Create Project'}
                    </button>
                </div>
            </form>
        </div>
    );
}
