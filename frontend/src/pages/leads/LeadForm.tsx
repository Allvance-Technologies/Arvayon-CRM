import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLeadStore } from '../../stores/leadStore';
import { leadService } from '../../services/leadService';
import api from '../../services/api';

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
    plot_dimensions: z.string().optional(),
    architectural_style: z.string().optional(),
    site_location_link: z.string().optional(),
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

const PLAN_TYPES = ['Basic', 'Standard', 'Premium'];
const SERVICE_CATEGORIES = [
    'Floor Plan Design', 'Working Drawing', 'Elevation Design', '3D Exterior WalkThru',
    'Structural Design', 'Electrical Layout', 'Plumbing Layout', 'Interior Concept Design',
    'Interior Detail Drawing', 'Interior WalkThru', 'BOQ & Estimation', 'Site Visit - Local',
    'PMC Consultancy', 'Full Construction (Turnkey)'
];

export default function LeadForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);
    const { createLead, updateLead } = useLeadStore();
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [proposalPlan, setProposalPlan] = useState('Basic');
    const [proposalService, setProposalService] = useState('Floor Plan Design');
    const [quoteService, setQuoteService] = useState('Floor Plan Design');
    const [quoteUnitQuantity, setQuoteUnitQuantity] = useState<number>(1);
    const [generatingDoc, setGeneratingDoc] = useState<'proposal' | 'quote' | null>(null);
    const [proposalId, setProposalId] = useState<number | null>(null);
    const [quoteId, setQuoteId] = useState<number | null>(null);
    const [plotDimensions, setPlotDimensions] = useState('');
    const [archStyle, setArchStyle] = useState('Modern');
    const [locationLink, setLocationLink] = useState('');
    const [numFloors, setNumFloors] = useState<number>(1);
    const [complexity, setComplexity] = useState('Standard');

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
                        first_call: '',
                        second_call: '',
                        status: d.status || 'New Lead',
                        notes: d.notes || '',
                        plot_dimensions: d.plot_dimensions || '',
                        architectural_style: d.architectural_style || 'Modern',
                        site_location_link: d.site_location_link || '',
                    });
                    setPlotDimensions(d.plot_dimensions || '');
                    setArchStyle(d.architectural_style || 'Modern');
                    setLocationLink(d.site_location_link || '');
                    
                    try {
                        if (d.first_call && d.first_call.startsWith('{')) {
                            const parsed = JSON.parse(d.first_call);
                            reset((formVals) => ({ ...formVals, first_call: parsed.raw || '' }));
                            if (parsed.consultancy_plan) setProposalPlan(parsed.consultancy_plan);
                            if (parsed.primary_service) setProposalService(parsed.primary_service);
                            if (parsed.unit_quantity) setQuoteUnitQuantity(parsed.unit_quantity);
                        } else {
                            reset((formVals) => ({ ...formVals, first_call: d.first_call || '' }));
                        }
                        
                        if (d.second_call && d.second_call.startsWith('{')) {
                            const parsed = JSON.parse(d.second_call);
                            reset((formVals) => ({ ...formVals, second_call: parsed.raw || '' }));
                            if (parsed.floors) setNumFloors(parsed.floors);
                            if (parsed.complexity) setComplexity(parsed.complexity);
                        } else {
                            reset((formVals) => ({ ...formVals, second_call: d.second_call || '' }));
                        }
                        if (d.floors) setNumFloors(d.floors);
                        if (d.complexity) setComplexity(d.complexity);
                    } catch (e) {
                        // ignore JSON parse errors
                    }
                })
                .catch(() => setError('Failed to load lead'))
                .finally(() => setLoading(false));
        }
    }, [id, isEditing, reset]);

    const onSubmit = async (data: LeadFormData, actionOverride?: string) => {
        setError(null);
        setSubmitLoading(true);
        try {
            const submissionData = { ...data };
            submissionData.first_call = JSON.stringify({
                raw: data.first_call || '',
                consultancy_plan: proposalPlan,
                primary_service: proposalService,
                unit_quantity: quoteUnitQuantity
            });
            submissionData.second_call = JSON.stringify({
                raw: data.second_call || '',
                requirements: data.second_call || '',
                plot_dimensions: plotDimensions,
                architectural_style: archStyle,
                site_location_link: locationLink
            });
            submissionData.plot_dimensions = plotDimensions;
            submissionData.architectural_style = archStyle;
            submissionData.site_location_link = locationLink;
            submissionData.area = quoteUnitQuantity;
            submissionData.floors = numFloors;
            submissionData.complexity = complexity;

            let leadId = id ? Number(id) : null;
            if (isEditing && id) {
                await updateLead(leadId!, submissionData);
            } else {
                const res = await createLead(submissionData);
                leadId = res?.id || res?.data?.id || res?.data?.data?.id;
                
                if (!leadId) {
                    console.warn('Lead created but no ID returned for redirection');
                }
            }

            const action = actionOverride || (window as any)._afterAction;
            (window as any)._afterAction = null;

            if (action === 'proposal' && leadId) {
                setGeneratingDoc('proposal');
                try {
                    const res = await api.post('/proposals', {
                        lead_id: leadId,
                        status: 'Draft',
                        client_name: data.company_name || data.contact_person,
                        project_location: data.location || '',
                        title: `${proposalPlan} Plan - ${proposalService} for ${data.company_name}`,
                        content: `Plan: ${proposalPlan}\nService: ${proposalService}\nNotes: ${data.first_call}`
                    });
                    setProposalId(res.data.id);
                } catch (err: any) {
                    setError('Error generating proposal: ' + (err.response?.data?.message || err.message));
                } finally {
                    setGeneratingDoc(null);
                }
            }
            else if (action === 'quote' && leadId) {
                setGeneratingDoc('quote');
                try {
                    // We don't have budget here, so default to 0
                    const value = 0;
                    const res = await api.post('/quotes', {
                        lead_id: leadId,
                        status: 'Draft',
                        quote_number: 'QT-' + Math.floor(Date.now() / 1000),
                        tax_percent: 0,
                        subtotal: value,
                        tax: 0,
                        total_amount: value,
                        notes: `Unit Quantity: ${quoteUnitQuantity}\n` + data.second_call,
                        items: [{
                            description: `${quoteService} - Quantity: ${quoteUnitQuantity}`,
                            quantity: quoteUnitQuantity,
                            unit_price: value,
                            total: value
                        }]
                    });
                    setQuoteId(res.data.id);
                } catch (err: any) {
                    setError('Error generating quotation: ' + (err.response?.data?.message || err.message));
                } finally {
                    setGeneratingDoc(null);
                }
            }
            else if (action === 'invoice' && leadId) navigate(`/invoices/new?lead_id=${leadId}`);
            else if (isEditing) navigate(`/leads/${id}`);
            else navigate('/leads');
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
                        <Field label="Client Name (Company/Project)" required error={errors.company_name?.message}>
                            <input {...register('company_name')} placeholder="e.g. Skyline Builders" className={inputCls(!!errors.company_name)} />
                        </Field>
                        <Field label="Contact Person" error={errors.contact_person?.message}>
                            <input {...register('contact_person')} placeholder="e.g. Mr. Arjun Menon" className={inputCls(!!errors.contact_person)} />
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

                    <div className="space-y-8 pt-6 border-t border-gray-100">
                        {/* Technical Data Section */}
                        <div className="p-6 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                            <h3 className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[10px]">🛠️</span>
                                Technical Initialization Data
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Field label="Built-up Area (Sqft)">
                                    <input 
                                        type="number"
                                        value={quoteUnitQuantity}
                                        onChange={(e) => setQuoteUnitQuantity(Number(e.target.value))}
                                        className={inputCls()}
                                        placeholder="e.g. 2000"
                                    />
                                </Field>
                                <Field label="Number of Floors">
                                    <input 
                                        type="number"
                                        value={numFloors}
                                        onChange={(e) => setNumFloors(Number(e.target.value))}
                                        className={inputCls()}
                                        placeholder="e.g. 2"
                                    />
                                </Field>
                                <Field label="Plot Dimensions">
                                    <input 
                                        type="text" 
                                        value={plotDimensions}
                                        onChange={(e) => setPlotDimensions(e.target.value)}
                                        placeholder="e.g. 30x40 Ft"
                                        className={inputCls()}
                                    />
                                </Field>
                                <Field label="Architectural Style">
                                    <select 
                                        value={archStyle}
                                        onChange={(e) => setArchStyle(e.target.value)}
                                        className={inputCls()}
                                    >
                                        {['Modern', 'Traditional', 'Minimalist', 'Industrial', 'Classical', 'Contemporary'].map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Site Location Link (Maps)">
                                    <input 
                                        type="text" 
                                        value={locationLink}
                                        onChange={(e) => setLocationLink(e.target.value)}
                                        placeholder="https://maps.google.com/..."
                                        className={inputCls()}
                                    />
                                </Field>
                                <Field label="Project Complexity">
                                    <select 
                                        value={complexity}
                                        onChange={(e) => setComplexity(e.target.value)}
                                        className={inputCls()}
                                    >
                                        {['Basic', 'Standard', 'Premium'].map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </Field>
                            </div>
                        </div>

                        {/* Call Logs Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field label="First Call Summary">
                                <textarea
                                    {...register('first_call')}
                                    rows={4}
                                    placeholder="Initial requirements and discussion notes..."
                                    className={`${inputCls()} resize-none`}
                                />
                            </Field>
                            <Field label="Second Call Summary">
                                <textarea
                                    {...register('second_call')}
                                    rows={4}
                                    placeholder="Technical discussion and finalization notes..."
                                    className={`${inputCls()} resize-none`}
                                />
                            </Field>
                        </div>
                    </div>
                    
                    <div className="pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Pipeline Stage">
                            <select {...register('status')} className={inputCls()}>
                                {['New Lead', 'Initial Contact', 'Qualification', 'Tech Call', 'Site Visit', 'Proposal', 'Won', 'Lost'].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="General Notes">
                            <input {...register('notes')} placeholder="Any other internal notes..." className={inputCls()} />
                        </Field>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4 gap-4">
                    <button type="button" onClick={() => navigate(-1)} className="w-full md:w-auto px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <button
                            type="button"
                            disabled={submitLoading || generatingDoc !== null}
                            onClick={handleSubmit((data) => onSubmit(data, 'proposal'))}
                            className="flex-1 px-5 py-2.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50 uppercase tracking-wider"
                        >
                            {generatingDoc === 'proposal' ? 'Generating...' : proposalId ? '✓ Proposal Ready' : 'Save & Create Proposal'}
                        </button>

                        <button
                            type="button"
                            disabled={submitLoading || generatingDoc !== null}
                            onClick={handleSubmit((data) => onSubmit(data, 'quote'))}
                            className="flex-1 px-5 py-2.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 uppercase tracking-wider"
                        >
                            {generatingDoc === 'quote' ? 'Generating...' : quoteId ? '✓ Quotation Ready' : 'Save & Create Quotation'}
                        </button>

                        <button
                            type="button"
                            disabled={submitLoading || generatingDoc !== null}
                            onClick={handleSubmit((data) => onSubmit(data, 'invoice'))}
                            className="flex-1 px-5 py-2.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50 uppercase tracking-wider"
                        >
                            Save & Create Invoice
                        </button>

                        <button
                            type="submit"
                            disabled={submitLoading || generatingDoc !== null}
                            className="flex-1 px-8 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50 shadow-md shadow-gray-200 uppercase tracking-widest"
                        >
                            {submitLoading && !generatingDoc ? 'Saving...' : 'Save Lead'}
                        </button>
                    </div>
                </div>

                {/* Post-Generation Quick Links */}
                {(proposalId || quoteId) && (
                   <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <p className="text-xs font-bold text-emerald-800 uppercase tracking-tight">Documents successfully prepared!</p>
                      <div className="flex gap-3">
                         {proposalId && <button type="button" onClick={() => window.open(`/#/proposals/${proposalId}/print`, '_blank')} className="text-[10px] font-black text-emerald-600 hover:underline uppercase">View Proposal</button>}
                         {quoteId && <button type="button" onClick={() => window.open(`/#/quotes/${quoteId}/print`, '_blank')} className="text-[10px] font-black text-emerald-600 hover:underline uppercase">View Quotation</button>}
                      </div>
                   </div>
                )}
            </form>
        </div>
    );
}
