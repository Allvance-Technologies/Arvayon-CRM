import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLeadStore } from '../../stores/leadStore';
import { leadService } from '../../services/leadService';

const leadSchema = z.object({
    company_name: z.string().min(2, 'Client name is required'),
    contact_person: z.string().optional().default('N/A'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional(),
    location: z.string().optional(),
    first_call: z.string().optional(),
    second_call: z.string().optional(),
    status: z.enum(['New Lead', 'Initial Contact', 'Qualification', 'Tech Call', 'Site Visit', 'Proposal', 'Won', 'Lost']).default('New Lead'),
    notes: z.string().optional(),
});
type LeadFormData = z.infer<typeof leadSchema>;

// A reusable styled field wrapper
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
    `w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${hasError
        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
        : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-400'
    }`;

export default function LeadForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);
    const { createLead, updateLead } = useLeadStore();
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<LeadFormData>({
        resolver: zodResolver(leadSchema),
        defaultValues: { status: 'New Lead' },
    });

    useEffect(() => {
        if (isEditing && id) {
            setLoading(true);
            leadService.getById(Number(id))
                .then((res: any) => {
                    const d = res.data || res;
                    reset({
                        company_name: d.company_name || '',
                        contact_person: d.contact_person || '',
                        email: d.email || '',
                        phone: d.phone || '',
                        location: d.location || '',
                        first_call: d.first_call || '',
                        second_call: d.second_call || '',
                        status: d.status || 'New Lead',
                        notes: d.notes || '',
                    });
                })
                .catch(() => setError('Failed to load lead'))
                .finally(() => setLoading(false));
        }
    }, [id, isEditing, reset]);

    const onSubmit = async (data: LeadFormData) => {
        setError(null);
        setSubmitLoading(true);
        try {
            if (isEditing && id) {
                await updateLead(Number(id), data);
                navigate(`/leads/${id}`);
            } else {
                await createLead(data);
                navigate('/leads');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to save lead. Check if backend is running.');
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit Lead' : 'New Lead'}</h1>
                    <p className="text-xs text-gray-500">{isEditing ? 'Update lead information' : 'Add a new lead to your pipeline'}</p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500 flex-shrink-0">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-5 flex items-center gap-2">
                        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                            <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1z" /></svg>
                        </div>
                        Lead Information
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Client Name" required error={errors.company_name?.message}>
                            <input {...register('company_name')} placeholder="e.g. Skyline Builders" className={inputCls(!!errors.company_name)} />
                        </Field>
                        <Field label="Phone Number" error={errors.phone?.message}>
                            <input {...register('phone')} placeholder="+91 98765 43210" className={inputCls(!!errors.phone)} />
                        </Field>
                        <Field label="Email ID" error={errors.email?.message}>
                            <input {...register('email')} type="email" placeholder="email@example.com" className={inputCls(!!errors.email)} />
                        </Field>
                        <Field label="Location" error={errors.location?.message}>
                            <input {...register('location')} placeholder="e.g. Mumbai, Maharashtra" className={inputCls(!!errors.location)} />
                        </Field>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-50">
                        <Field label="First Call (Text Data)">
                            <textarea
                                {...register('first_call')}
                                rows={3}
                                placeholder="Details from the first contact..."
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none transition-all"
                            />
                        </Field>
                        <Field label="Second Call (Text Data)">
                            <textarea
                                {...register('second_call')}
                                rows={3}
                                placeholder="Details from the second contact..."
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none transition-all"
                            />
                        </Field>
                    </div>
                    
                    <div className="pt-4">
                        <Field label="Pipeline Stage">
                            <select {...register('status')} className={inputCls()}>
                                {['New Lead', 'Initial Contact', 'Qualification', 'Tech Call', 'Site Visit', 'Proposal', 'Won', 'Lost'].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </Field>
                    </div>
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
                        {submitLoading ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        )}
                        {isEditing ? 'Update Lead' : 'Create Lead'}
                    </button>
                </div>
            </form>
        </div>
    );
}
