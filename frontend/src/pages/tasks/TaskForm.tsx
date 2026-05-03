import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTaskStore } from '../../stores/taskStore';
import { taskService } from '../../services/taskService';
import { useEmployeeStore } from '../../stores/employeeStore';

const taskSchema = z.object({
    title: z.string().min(2, 'Title is required'),
    description: z.string().optional(),
    project_id: z.number().optional().or(z.string().optional().transform(v => v ? Number(v) : undefined)),
    assigned_to: z.number().min(1, 'Assign to a user').or(z.string().regex(/^\d+$/).transform(Number)),
    due_date: z.string().min(1, 'Due date is required'),
    status: z.enum(['Pending', 'In Progress', 'Completed', 'Cancelled']).default('Pending'),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
});
type TaskFormData = z.infer<typeof taskSchema>;

const PRIORITY_COLORS: Record<string, string> = {
    Low: 'bg-gray-100 border-gray-300 text-gray-600',
    Medium: 'bg-blue-100 border-blue-400 text-blue-700',
    High: 'bg-orange-100 border-orange-400 text-orange-700',
    Urgent: 'bg-red-100 border-red-400 text-red-700',
};

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
    `w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${hasError ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-400'
    }`;

export default function TaskForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);
    const { createTask, updateTask } = useTaskStore();
    const { employees, fetchEmployees } = useEmployeeStore();
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPriority, setSelectedPriority] = useState('Medium');

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
        defaultValues: { status: 'Pending', priority: 'Medium' },
    });

    const watchedPriority = watch('priority');

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        if (isEditing && id) {
            setLoading(true);
            taskService.getTask(Number(id))
                .then((res: any) => {
                    const d = res.data || res;
                    reset({
                        title: d.title,
                        description: d.description || '',
                        project_id: d.project_id,
                        assigned_to: d.assigned_to_id || d.assigned_to,
                        due_date: d.due_date,
                        status: d.status || 'Pending',
                        priority: d.priority || 'Medium',
                    });
                    setSelectedPriority(d.priority || 'Medium');
                })
                .catch(() => setError('Failed to load task'))
                .finally(() => setLoading(false));
        }
    }, [id, isEditing, reset]);

    const onSubmit = async (data: TaskFormData) => {
        setError(null);
        setSubmitLoading(true);
        try {
            if (isEditing && id) {
                await updateTask(Number(id), data);
            } else {
                await createTask(data);
            }
            navigate('/tasks');
        } catch (err: any) {
            const serverMsg = err.response?.data?.message;
            const validationErrors = err.response?.data?.errors;
            let displayErr = serverMsg || err.message || 'Failed to save task';
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
                    <h1 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit Task' : 'New Task'}</h1>
                    <p className="text-xs text-gray-500">{isEditing ? 'Update task details' : 'Create a new task'}</p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 text-red-400"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Task Details */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                            <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </div>
                        Task Details
                    </h2>

                    <Field label="Task Title" required error={errors.title?.message}>
                        <input {...register('title')} placeholder="e.g. Site inspection – Green Villa foundation" className={inputCls(!!errors.title)} />
                    </Field>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Project ID">
                            <input {...register('project_id')} type="number" placeholder="e.g. 3" className={inputCls()} />
                        </Field>
                        <Field label="Assign To" required error={errors.assigned_to?.message}>
                            <select {...register('assigned_to')} className={inputCls(!!errors.assigned_to)}>
                                <option value="">— Select Employee —</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.name}{emp.employee_profile?.designation ? ` (${emp.employee_profile.designation})` : ''}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Due Date" required error={errors.due_date?.message}>
                            <input {...register('due_date')} type="date" className={inputCls(!!errors.due_date)} />
                        </Field>
                        <Field label="Status">
                            <select {...register('status')} className={inputCls()}>
                                {['Pending', 'In Progress', 'Completed', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </Field>
                    </div>

                    {/* Priority Selector — visual cards */}
                    <Field label="Priority" required>
                        <input type="hidden" {...register('priority')} />
                        <div className="grid grid-cols-4 gap-2 mt-1">
                            {(['Low', 'Medium', 'High', 'Urgent'] as const).map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => { setSelectedPriority(p); setValue('priority', p); }}
                                    className={`py-2.5 text-xs font-bold rounded-lg border-2 transition-all ${(watchedPriority || selectedPriority) === p
                                        ? PRIORITY_COLORS[p] + ' ring-2 ring-offset-1 ring-current'
                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                >
                                    {p === 'Urgent' ? '🔴' : p === 'High' ? '🟠' : p === 'Medium' ? '🔵' : '⚪'} {p}
                                </button>
                            ))}
                        </div>
                    </Field>

                    <Field label="Description">
                        <textarea
                            {...register('description')}
                            rows={3}
                            placeholder="Describe what needs to be done…"
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
                        />
                    </Field>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <button type="button" onClick={() => navigate('/tasks')} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitLoading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md shadow-blue-600/20"
                    >
                        {submitLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        {isEditing ? 'Update Task' : 'Create Task'}
                    </button>
                </div>
            </form>
        </div>
    );
}
