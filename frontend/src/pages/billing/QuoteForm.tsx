import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';

const quoteSchema = z.object({
    project_id: z.number().optional().nullable().or(z.string().transform(v => v ? Number(v) : null)),
    lead_id: z.number().optional().nullable().or(z.string().transform(v => v ? Number(v) : null)),
    quote_number: z.string().min(1, 'Quote number is required'),
    valid_until: z.string().optional(),
    status: z.enum(['Draft', 'Sent', 'Accepted', 'Rejected']).default('Draft'),
    notes: z.string().optional(),
    tax_percent: z.number().min(0).default(0).or(z.string().transform(Number)),
});
type QuoteFormData = z.infer<typeof quoteSchema>;

interface QuoteItem {
    id?: number;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
}

const Field = ({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
);

const inputCls = (hasError?: boolean) =>
    `w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${hasError ? 'border-red-300 focus:ring-red-500/20' : 'border-gray-200 focus:ring-blue-500/20'
    }`;

export default function QuoteForm() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const leadId = searchParams.get('lead_id');
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [projects, setProjects] = useState<any[]>([]);

    const [items, setItems] = useState<QuoteItem[]>([
        { description: 'Consulting Services', quantity: 1, unit_price: 1000, total: 1000 }
    ]);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<QuoteFormData>({
        resolver: zodResolver(quoteSchema),
        defaultValues: { 
            status: 'Draft', 
            tax_percent: 0, 
            quote_number: 'QT-' + Math.floor(Date.now() / 1000),
            lead_id: leadId ? Number(leadId) : null
        },
    });

    const watchedProjectId = watch('project_id');
    const watchedTaxPercent = watch('tax_percent') || 0;

    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const taxAmount = (subtotal * watchedTaxPercent) / 100;
    const grandTotal = subtotal + taxAmount;

    useEffect(() => {
        // Fetch projects for dropdown
        api.get('/projects').then(res => setProjects(res.data.data || res.data)).catch(console.error);

        if (isEditing && id) {
            setLoading(true);
            api.get(`/quotes/${id}`)
                .then(res => {
                    const d = res.data;
                    reset({
                        project_id: d.project_id,
                        lead_id: d.lead_id,
                        quote_number: d.quote_number,
                        valid_until: d.valid_until || '',
                        status: d.status,
                        notes: d.notes || '',
                        tax_percent: d.subtotal > 0 ? (d.tax / d.subtotal) * 100 : 0
                    });
                    if (d.items && d.items.length > 0) setItems(d.items);
                })
                .catch(() => setError('Failed to load quote'))
                .finally(() => setLoading(false));
        } else if (leadId) {
            // Fetch lead data to pre-fill
            api.get(`/leads/${leadId}`)
                .then(res => {
                    const lead = res.data.data || res.data;
                    setItems([{
                        description: `Services for ${lead.company_name}`,
                        quantity: 1,
                        unit_price: Number(lead.budget || lead.estimated_value || 0),
                        total: Number(lead.budget || lead.estimated_value || 0)
                    }]);
                    if (lead.notes) {
                        setValue('notes', `Lead Notes: ${lead.notes}`);
                    }
                })
                .catch(console.error);
        }
    }, [id, isEditing, leadId, reset, setValue]);

    // Auto-fetch billing data when project changes (only when creating new)
    useEffect(() => {
        if (!isEditing && watchedProjectId && !leadId) {
            api.get(`/projects/${watchedProjectId}/billing-data`)
                .then(res => {
                    const d = res.data;
                    if (d.suggested_subtotal > 0) {
                        setItems([{
                            description: `Project Implementation: ${d.project?.name}`,
                            quantity: 1,
                            unit_price: Number(d.suggested_subtotal),
                            total: Number(d.suggested_subtotal)
                        }]);
                    }
                }).catch(console.error);
        }
    }, [watchedProjectId, isEditing, leadId]);

    const validateItems = () => {
        for (let i = 0; i < items.length; i++) {
            if (!items[i].description.trim()) return `Item ${i + 1} needs a description`;
            if (items[i].quantity <= 0) return `Item ${i + 1} quantity must be > 0`;
            if (items[i].unit_price < 0) return `Item ${i + 1} unit price cannot be negative`;
        }
        return null;
    };

    const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
        const newItems = [...items];
        const item = { ...newItems[index], [field]: value };

        // Auto calculate item total
        if (field === 'quantity' || field === 'unit_price') {
            item.total = Number(item.quantity) * Number(item.unit_price);
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
    const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

    const onSubmit = async (data: QuoteFormData) => {
        setError(null);

        const itemError = validateItems();
        if (itemError) return setError(itemError);

        setSubmitLoading(true);
        const payload = {
            ...data,
            subtotal,
            tax: taxAmount,
            total_amount: grandTotal,
            items: items.map(i => ({
                description: i.description,
                quantity: Number(i.quantity),
                unit_price: Number(i.unit_price),
                total: Number(i.total)
            }))
        };

        try {
            if (isEditing && id) {
                await api.put(`/quotes/${id}`, payload);
            } else {
                await api.post('/quotes', payload);
            }
            navigate('/quotes');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to save quote');
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) return <div className="text-center p-10 py-12 text-slate-500 font-medium animate-pulse">Loading Quote Editor...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 w-full">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                    <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{isEditing ? 'Edit Quote' : 'New Quote'}</h1>
                    <p className="text-sm text-slate-500">{isEditing ? 'Update your quote terms and values' : 'Draft a new quote based on project metrics'}</p>
                </div>
            </div>

            {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">{error}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Project" required error={errors.project_id?.message}>
                            <select {...register('project_id')} className={inputCls(!!errors.project_id)}>
                                <option value="">Select a project...</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </Field>
                        <Field label="Quote Number" required error={errors.quote_number?.message}>
                            <input {...register('quote_number')} className={inputCls(!!errors.quote_number)} />
                        </Field>
                        <Field label="Valid Until" error={errors.valid_until?.message}>
                            <input type="date" {...register('valid_until')} className={inputCls()} />
                        </Field>
                        <Field label="Status" required error={errors.status?.message}>
                            <select {...register('status')} className={inputCls()}>
                                <option value="Draft">Draft</option>
                                <option value="Sent">Sent</option>
                                <option value="Accepted">Accepted</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </Field>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
                    <div className="flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Line Items</h2>
                        <button type="button" onClick={addItem} className="text-sm text-blue-600 font-semibold hover:text-blue-800">+ Add Item</button>
                    </div>

                    <div className="space-y-3">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex-1">
                                    <input
                                        type="text" value={item.description} placeholder="Item Description"
                                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div className="w-24">
                                    <input
                                        type="number" min="0.01" step="0.01" value={item.quantity} placeholder="Qty"
                                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-center"
                                    />
                                </div>
                                <div className="w-32">
                                    <input
                                        type="number" step="0.01" value={item.unit_price} placeholder="Price"
                                        onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div className="w-32 pt-2 text-right font-medium text-slate-700">
                                    ₹{item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                {items.length > 1 && (
                                    <button type="button" onClick={() => removeItem(idx)} className="mt-2 text-red-400 hover:text-red-600">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-slate-200 pt-4 flex flex-col items-end gap-3 w-full">
                        <div className="flex justify-between w-64 text-sm text-slate-600">
                            <span>Subtotal:</span>
                            <span className="font-semibold">₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center w-64 text-sm text-slate-600">
                            <span className="flex items-center gap-2">Tax (%): <input type="number" {...register('tax_percent')} className="w-16 px-2 py-1 border border-slate-200 rounded text-right" /></span>
                            <span className="font-semibold">₹{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between w-64 text-lg font-bold text-slate-800 pt-2 border-t border-slate-200">
                            <span>Total:</span>
                            <span className="text-blue-600">₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Notes</h2>
                    <textarea {...register('notes')} rows={3} placeholder="Terms and conditions, or notes for the client..." className={inputCls()} />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => navigate('/quotes')} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                    <button type="submit" disabled={submitLoading} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md transition disabled:opacity-50 flex items-center gap-2">
                        {submitLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
                        {isEditing ? 'Update Quote' : 'Create Quote'}
                    </button>
                </div>
            </form>
        </div>
    );
}
