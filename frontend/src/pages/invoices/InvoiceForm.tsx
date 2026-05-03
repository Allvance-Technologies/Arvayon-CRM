import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';

const invoiceSchema = z.object({
    client_id: z.number().min(1, 'Client is required').or(z.string().regex(/^\d+$/).transform(Number)),
    project_id: z.number().min(1, 'Project is required').or(z.string().regex(/^\d+$/).transform(Number)),
    issue_date: z.string().min(1, 'Issue date is required'),
    due_date: z.string().min(1, 'Due date is required'),
    amount: z.number().min(1, 'Amount must be positive').or(z.string().transform(Number)),
    tax_amount: z.number().min(0).optional().or(z.string().optional().transform(v => v ? Number(v) : undefined)),
    notes: z.string().optional(),
    status: z.enum(['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled']).default('Draft'),
});
type InvoiceFormData = z.infer<typeof invoiceSchema>;

const STATUS_INFO: Record<string, { color: string; desc: string }> = {
    Draft: { color: '#94a3b8', desc: 'Not yet sent to client' },
    Sent: { color: '#3b82f6', desc: 'Awaiting payment' },
    Paid: { color: '#22c55e', desc: 'Payment received' },
    Overdue: { color: '#ef4444', desc: 'Past due date' },
    Cancelled: { color: '#f97316', desc: 'Invoice cancelled' },
};

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

export default function InvoiceForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState('Draft');

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<InvoiceFormData>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: { status: 'Draft' },
    });

    const watchedStatus = watch('status');
    const watchedAmount = watch('amount');
    const watchedTax = watch('tax_amount');
    const grandTotal = (Number(watchedAmount) || 0) + (Number(watchedTax) || 0);

    useEffect(() => {
        if (isEditing && id) {
            setLoading(true);
            api.get(`/invoices/${id}`)
                .then((res: any) => {
                    const d = res.data.data || res.data;
                    reset({
                        client_id: d.client_id || 1, // Optional fallback
                        project_id: d.project_id,
                        issue_date: d.issue_date,
                        due_date: d.due_date,
                        amount: parseFloat(d.amount),
                        tax_amount: d.tax_amount ? parseFloat(d.tax_amount) : undefined,
                        notes: d.notes || '',
                        status: d.status || 'Draft',
                    });
                    setSelectedStatus(d.status || 'Draft');
                })
                .catch(() => setError('Failed to load invoice'))
                .finally(() => setLoading(false));
        }
    }, [id, isEditing, reset]);

    const onSubmit = async (data: InvoiceFormData) => {
        setError(null);
        setSubmitLoading(true);
        try {
            if (isEditing && id) {
                await api.put(`/invoices/${id}`, data);
            } else {
                await api.post('/invoices', data);
            }
            navigate('/invoices');
        } catch (err: any) {
            const serverMsg = err.response?.data?.message;
            const validationErrors = err.response?.data?.errors;
            let displayErr = serverMsg || err.message || 'Failed to save invoice';
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
                    <h1 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit Invoice' : 'New Invoice'}</h1>
                    <p className="text-xs text-gray-500">{isEditing ? 'Update invoice details' : 'Create a new invoice'}</p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 text-red-400"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Invoice Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                            <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                        </div>
                        Invoice Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Client ID" required hint="Numeric client record ID" error={errors.client_id?.message}>
                            <input {...register('client_id')} type="number" placeholder="e.g. 4" className={inputCls(!!errors.client_id)} />
                        </Field>
                        <Field label="Project ID" required hint="Numeric project record ID" error={errors.project_id?.message}>
                            <input {...register('project_id')} type="number" placeholder="e.g. 2" className={inputCls(!!errors.project_id)} />
                        </Field>
                        <Field label="Issue Date" required error={errors.issue_date?.message}>
                            <input {...register('issue_date')} type="date" className={inputCls(!!errors.issue_date)} />
                        </Field>
                        <Field label="Due Date" required error={errors.due_date?.message}>
                            <input {...register('due_date')} type="date" className={inputCls(!!errors.due_date)} />
                        </Field>
                    </div>
                </div>

                {/* Amounts */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                            <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" /></svg>
                        </div>
                        Amounts (₹)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Sub Total" required error={errors.amount?.message}>
                            <input {...register('amount', { valueAsNumber: true })} type="number" step="0.01" placeholder="e.g. 250000" className={inputCls(!!errors.amount)} />
                        </Field>
                        <Field label="Tax / GST Amount">
                            <input {...register('tax_amount', { valueAsNumber: true })} type="number" step="0.01" placeholder="e.g. 45000" className={inputCls()} />
                        </Field>
                    </div>
                    {/* Grand Total Preview */}
                    {grandTotal > 0 && (
                        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl">
                            <p className="text-sm font-semibold text-gray-600">Grand Total (incl. tax)</p>
                            <p className="text-xl font-bold text-green-600">₹{grandTotal.toLocaleString('en-IN')}</p>
                        </div>
                    )}
                </div>

                {/* Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <div className="w-5 h-5 bg-purple-500 rounded flex items-center justify-center">
                            <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                        </div>
                        Status
                    </h2>
                    <input type="hidden" {...register('status')} />
                    <div className="grid grid-cols-5 gap-2">
                        {(Object.keys(STATUS_INFO) as string[]).map(s => {
                            const info = STATUS_INFO[s];
                            const isActive = (watchedStatus || selectedStatus) === s;
                            return (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => { setSelectedStatus(s); setValue('status', s as any); }}
                                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all ${isActive ? 'text-white shadow-md' : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                                        }`}
                                    style={isActive ? { background: info.color, borderColor: info.color } : {}}
                                >
                                    <div className="w-3 h-3 rounded-full" style={{ background: info.color, opacity: isActive ? 0 : 1 }}></div>
                                    {s}
                                </button>
                            );
                        })}
                    </div>
                    {watchedStatus && STATUS_INFO[watchedStatus] && (
                        <p className="text-xs text-gray-500 mt-2 text-center">{STATUS_INFO[watchedStatus].desc}</p>
                    )}
                </div>

                {/* Notes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Notes</h2>
                    <textarea {...register('notes')} rows={3} placeholder="Optional notes for this invoice (payment terms, references, etc.)" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all" />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <button type="button" onClick={() => navigate('/invoices')} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                    <button type="submit" disabled={submitLoading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md shadow-blue-600/20">
                        {submitLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        {isEditing ? 'Update Invoice' : 'Create Invoice'}
                    </button>
                </div>
            </form>
        </div>
    );
}
