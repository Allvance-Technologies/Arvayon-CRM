import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import api from '../../services/api';

const paymentSchema = z.object({
    invoice_id: z.number().min(1, 'Invoice ID is required').or(z.string().regex(/^\d+$/).transform(Number)),
    amount: z.number().min(0.01, 'Amount must be greater than 0').or(z.string().transform(Number)),
    payment_date: z.string().min(1, 'Payment date is required'),
    payment_method: z.enum(['Credit Card', 'Bank Transfer', 'Cash', 'Check', 'Other']).default('Bank Transfer'),
    transaction_reference: z.string().optional(),
    notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export default function PaymentForm() {
    const { invoiceId, id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            payment_method: 'Bank Transfer',
            invoice_id: invoiceId ? Number(invoiceId) : undefined,
            payment_date: new Date().toISOString().split('T')[0]
        }
    });

    useEffect(() => {
        if (isEditing && id) {
            setLoading(true);
            api.get(`/payments/${id}`)
                .then((res: any) => {
                    reset({
                        invoice_id: res.data.invoice_id,
                        amount: res.data.amount,
                        payment_date: res.data.payment_date,
                        payment_method: res.data.payment_method || 'Bank Transfer',
                        transaction_reference: res.data.transaction_reference || '',
                        notes: res.data.notes || '',
                    });
                    setLoading(false);
                })
                .catch((err: any) => {
                    console.error(err);
                    setError('Failed to fetch payment');
                    setLoading(false);
                });
        }
    }, [id, isEditing, reset]);

    const onSubmit = async (data: PaymentFormData) => {
        setError(null);
        setLoading(true);
        try {
            if (isEditing && id) {
                await api.put(`/payments/${id}`, data);
            } else {
                await api.post('/payments', data);
            }
            navigate(`/invoices/${data.invoice_id}`);
        } catch (err: any) {
            const serverMsg = err.response?.data?.message;
            const validationErrors = err.response?.data?.errors;
            let displayErr = serverMsg || err.message || 'Failed to record payment';
            if (validationErrors) {
                displayErr += ': ' + Object.values(validationErrors).flat().join(', ');
            }
            setError(displayErr);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditing) return <div className="p-4">Loading...</div>;

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Payment' : 'Record Payment'}</h1>
                <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <Card>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Invoice ID *"
                            type="number"
                            error={errors.invoice_id?.message}
                            {...register('invoice_id')}
                            disabled={!!invoiceId && !isEditing}
                        />
                        <Input
                            label="Amount (₹) *"
                            type="number"
                            step="0.01"
                            error={errors.amount?.message}
                            {...register('amount')}
                        />
                        <Input
                            label="Payment Date *"
                            type="date"
                            error={errors.payment_date?.message}
                            {...register('payment_date')}
                        />
                        <Select
                            label="Payment Method *"
                            options={[
                                { value: 'Bank Transfer', label: 'Bank Transfer' },
                                { value: 'Credit Card', label: 'Credit Card' },
                                { value: 'Cash', label: 'Cash' },
                                { value: 'Check', label: 'Check' },
                                { value: 'Other', label: 'Other' },
                            ]}
                            {...register('payment_method')}
                        />
                        <Input
                            label="Transaction Reference (Optional)"
                            error={errors.transaction_reference?.message}
                            {...register('transaction_reference')}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            rows={4}
                            {...register('notes')}
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : (isEditing ? 'Update Payment' : 'Record Payment')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
