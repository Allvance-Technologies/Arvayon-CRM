import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import { FileText, ArrowLeft, Eye } from 'lucide-react';

const schema = z.object({
    project_id: z.number().optional().nullable().or(z.string().transform(v => v ? Number(v) : null)),
    lead_id: z.number().optional().nullable().or(z.string().transform(v => v ? Number(v) : null)),
    status: z.enum(['Draft', 'Sent', 'Accepted', 'Rejected']).default('Draft'),
    // Override fields — auto-filled from project, but editable
    client_name: z.string().min(1, 'Client name is required'),
    project_location: z.string().optional().nullable(),
    project_area: z.string().optional().nullable(),
    // Internal
    title: z.string().optional(),
    content: z.string().optional().default(''),
});
type FormData = z.infer<typeof schema>;

const inputCls = (hasError?: boolean) =>
    `w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${hasError ? 'border-red-300 focus:ring-red-500/20' : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-400'}`;

export default function ProposalForm() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const leadId = searchParams.get('lead_id');
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [projectLoading, setProjectLoading] = useState(false);

    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { status: 'Draft', content: '', lead_id: leadId ? Number(leadId) : null },
    });

    const watchedProjectId = watch('project_id');

    // Load projects list
    useEffect(() => {
        api.get('/projects').then(res => setProjects(res.data.data || res.data)).catch(console.error);
    }, []);

    // Load lead data if lead_id is present
    useEffect(() => {
        if (!isEditing && leadId) {
            setLoading(true);
            api.get(`/leads/${leadId}`)
                .then(res => {
                    const lead = res.data.data || res.data;
                    setValue('client_name', lead.company_name || lead.contact_person);
                    setValue('project_location', lead.location || '');
                    setValue('title', `Proposal for ${lead.company_name}`);
                })
                .catch(() => setError('Failed to load lead data'))
                .finally(() => setLoading(false));
        }
    }, [leadId, isEditing, setValue]);

    // Load existing proposal for editing
    useEffect(() => {
        if (isEditing && id) {
            setLoading(true);
            api.get(`/proposals/${id}`)
                .then(res => {
                    const d = res.data;
                    reset({
                        project_id: d.project_id,
                        lead_id: d.lead_id,
                        status: d.status,
                        client_name: d.client_name || '',
                        project_location: d.project_location || '',
                        project_area: d.project_area || '',
                        title: d.title || '',
                        content: d.content || '',
                    });
                    // Also load project details
                    if (d.project_id) {
                        api.get(`/projects/${d.project_id}`).then(r => setSelectedProject(r.data.data || r.data)).catch(() => { });
                    }
                })
                .catch(() => setError('Failed to load proposal'))
                .finally(() => setLoading(false));
        }
    }, [id, isEditing, reset]);

    // Auto-fill from selected project
    useEffect(() => {
        const pid = Number(watchedProjectId);
        if (!pid) {
            setSelectedProject(null);
            return;
        }
        setProjectLoading(true);
        api.get(`/projects/${pid}`)
            .then(res => {
                const proj = res.data.data || res.data;
                setSelectedProject(proj);
                const clientName = proj.client?.company_name || proj.client?.contact_person || '';
                const location = proj.client?.address || '';
                setValue('client_name', clientName);
                setValue('project_location', location);
                setValue('title', `Proposal for ${proj.name}`);
            })
            .catch(() => { })
            .finally(() => setProjectLoading(false));
    }, [watchedProjectId, setValue]);

    const onSubmit = async (data: FormData) => {
        setError(null);
        setSubmitLoading(true);
        try {
            const payload = {
                ...data,
                title: data.title || `Proposal`,
                content: data.content || '',
            };
            if (isEditing && id) {
                await api.put(`/proposals/${id}`, payload);
            } else {
                await api.post('/proposals', payload);
            }
            navigate('/proposals');
        } catch (err: any) {
            const validationErrors = err.response?.data?.errors;
            let msg = err.response?.data?.message || err.message || 'Failed to save';
            if (validationErrors) msg += ': ' + Object.values(validationErrors).flat().join(', ');
            setError(msg);
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/proposals')} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500 hover:text-slate-900">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{isEditing ? 'Edit Proposal' : 'New Proposal'}</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Select a project — client & location data will fill automatically</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">{error}</div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Step 1 — Project Selection */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-base font-bold text-slate-800">Step 1 — Select Project</h2>
                        <p className="text-xs text-slate-500 mt-1">Client name and location will auto-fill from the selected project.</p>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                                Project <span className="text-red-500">*</span>
                            </label>
                            <select {...register('project_id')} className={inputCls(!!errors.project_id)}>
                                <option value="">— Select a project —</option>
                                {projects.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            {errors.project_id && <p className="mt-1 text-xs text-red-500 font-medium">{errors.project_id.message}</p>}
                        </div>

                        {projectLoading && (
                            <div className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-500">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                                Loading project data...
                            </div>
                        )}

                        {selectedProject && !projectLoading && (
                            <div className="sm:col-span-2 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-slate-700">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Project</p>
                                        <p className="font-semibold">{selectedProject.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Client</p>
                                        <p className="font-semibold">{selectedProject.client?.company_name || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Status</p>
                                        <p className="font-semibold">{selectedProject.status}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Step 2 — Proposal Data */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-base font-bold text-slate-800">Step 2 — Proposal Details</h2>
                        <p className="text-xs text-slate-500 mt-1">These fields fill the "Submitted To" section of the proposal template.</p>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                                Client Name (Submitted To) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                {...register('client_name')}
                                placeholder="e.g. Mr. Rajan"
                                className={inputCls(!!errors.client_name)}
                            />
                            {errors.client_name && <p className="mt-1 text-xs text-red-500 font-medium">{errors.client_name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Project Location</label>
                            <input
                                type="text"
                                {...register('project_location')}
                                placeholder="e.g. Chennai"
                                className={inputCls()}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Project Area (sq.ft)</label>
                            <input
                                type="text"
                                {...register('project_area')}
                                placeholder="e.g. 2400 sq.ft"
                                className={inputCls()}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Status</label>
                            <select {...register('status')} className={inputCls()}>
                                <option value="Draft">Draft</option>
                                <option value="Sent">Sent</option>
                                <option value="Accepted">Accepted</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        The proposal template (sections 1–8, tables, packages) is fixed and will auto-render on the print page.
                    </p>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => navigate('/proposals')} className="px-5 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitLoading}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
                        >
                            {submitLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Eye className="w-4 h-4" />}
                            {isEditing ? 'Save Changes' : 'Create & Preview'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
