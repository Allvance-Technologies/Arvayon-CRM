import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import { useToastStore } from '../../stores/toastStore';

const userSchema = z.object({
    name: z.string().min(2, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
    role: z.enum(['Admin', 'Manager', 'Sales', 'Architect', 'Accounts']).default('Sales'),
});
type UserFormData = z.infer<typeof userSchema>;

const ROLE_INFO: Record<string, { color: string; desc: string; icon: string }> = {
    Admin: { color: '#ef4444', desc: 'Full system access', icon: '🔑' },
    Manager: { color: '#f97316', desc: 'Projects & team oversight', icon: '📊' },
    Sales: { color: '#3b82f6', desc: 'Leads & client management', icon: '🎯' },
    Architect: { color: '#22c55e', desc: 'Projects & technical docs', icon: '🏗️' },
    Accounts: { color: '#8b5cf6', desc: 'Finance & invoice access', icon: '💰' },
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

export default function UserForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);
    const { addToast } = useToastStore();
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string>('Sales');

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: { role: 'Sales' },
    });

    const watchedRole = watch('role') || selectedRole;

    useEffect(() => {
        if (isEditing && id) {
            setLoading(true);
            api.get(`/users/${id}`)
                .then((res: any) => {
                    const d = res.data.data || res.data;
                    reset({ name: d.name, email: d.email, role: d.role || 'Sales' });
                    setSelectedRole(d.role || 'Sales');
                })
                .catch(() => { addToast('Failed to load user', 'error'); navigate('/users'); })
                .finally(() => setLoading(false));
        }
    }, [id, isEditing, reset]);

    const onSubmit = async (data: UserFormData) => {
        setSubmitLoading(true);
        try {
            if (isEditing && id) {
                if (!data.password) delete (data as any).password;
                await api.put(`/users/${id}`, data);
                addToast('User updated successfully', 'success');
            } else {
                await api.post('/users', data);
                addToast('User created successfully', 'success');
            }
            navigate('/users');
        } catch (err: any) {
            addToast(err.response?.data?.message || 'Failed to save user', 'error');
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/users')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit User' : 'Add Team Member'}</h1>
                    <p className="text-xs text-gray-500">{isEditing ? 'Update user details and permissions' : 'Create a new account for a team member'}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
                {/* Personal Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                            <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
                        </div>
                        Personal Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Full Name" required error={errors.name?.message}>
                            <input {...register('name')} placeholder="e.g. Arun Kumar" className={inputCls(!!errors.name)} />
                        </Field>
                        <Field label="Email Address" required error={errors.email?.message}>
                            <input {...register('email')} type="email" placeholder="arun@arvayon.com" className={inputCls(!!errors.email)} />
                        </Field>
                    </div>
                </div>

                {/* Password */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <div className="w-5 h-5 bg-yellow-500 rounded flex items-center justify-center">
                            <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                        </div>
                        {isEditing ? 'Change Password' : 'Set Password'}
                    </h2>
                    <Field
                        label={isEditing ? 'New Password (leave blank to keep current)' : 'Password'}
                        required={!isEditing}
                        error={errors.password?.message}
                    >
                        <input
                            {...register('password')}
                            type="password"
                            placeholder={isEditing ? 'Leave blank to keep existing' : 'Min 6 characters'}
                            className={inputCls(!!errors.password)}
                        />
                    </Field>
                </div>

                {/* Role Selector */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <div className="w-5 h-5 bg-purple-500 rounded flex items-center justify-center">
                            <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                        </div>
                        Role & Permissions
                    </h2>
                    <input type="hidden" {...register('role')} />
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        {(Object.keys(ROLE_INFO) as string[]).map(role => {
                            const info = ROLE_INFO[role];
                            const isActive = watchedRole === role;
                            return (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => { setSelectedRole(role); setValue('role', role as any); }}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${isActive ? 'text-white shadow-lg' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-600'
                                        }`}
                                    style={isActive ? { background: info.color, borderColor: info.color } : {}}
                                >
                                    <span className="text-xl">{info.icon}</span>
                                    <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-700'}`}>{role}</p>
                                    <p className={`text-[10px] leading-tight ${isActive ? 'text-white/70' : 'text-gray-400'}`}>{info.desc}</p>
                                </button>
                            );
                        })}
                    </div>
                    {watchedRole && ROLE_INFO[watchedRole] && (
                        <div
                            className="mt-4 p-3 rounded-lg text-sm flex items-center gap-2"
                            style={{ background: ROLE_INFO[watchedRole].color + '10', color: ROLE_INFO[watchedRole].color }}
                        >
                            <span>{ROLE_INFO[watchedRole].icon}</span>
                            <span className="font-semibold">{watchedRole}</span>
                            <span className="font-normal opacity-70">— {ROLE_INFO[watchedRole].desc}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <button type="button" onClick={() => navigate('/users')} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitLoading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md shadow-blue-600/20"
                    >
                        {submitLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        {isEditing ? 'Update User' : 'Create User'}
                    </button>
                </div>
            </form>
        </div>
    );
}
