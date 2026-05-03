import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEmployeeStore } from '../../stores/employeeStore'
import { ArrowLeft, Save } from 'lucide-react'

const employeeSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
    role: z.string().min(1, 'Role is required'),
    is_active: z.boolean(),
    designation: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    join_date: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
    linkedin: z.string().url('Must be a valid URL').optional().or(z.literal('')).nullable(),
    facebook: z.string().url('Must be a valid URL').optional().or(z.literal('')).nullable(),
    instagram: z.string().url('Must be a valid URL').optional().or(z.literal('')).nullable(),
    whatsapp: z.string().optional().nullable(),
    website: z.string().url('Must be a valid URL').optional().or(z.literal('')).nullable(),
})

type EmployeeFormData = z.infer<typeof employeeSchema>

export default function EmployeeForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { getEmployee, createEmployee, updateEmployee, isLoading, error } = useEmployeeStore()
    const isEditing = Boolean(id)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<EmployeeFormData>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            role: 'Sales',
            is_active: true,
            status: 'Active',
        }
    })

    useEffect(() => {
        if (isEditing && id) {
            getEmployee(Number(id)).then(employee => {
                reset({
                    name: employee.name,
                    email: employee.email,
                    role: employee.role,
                    is_active: employee.is_active,
                    designation: employee.employee_profile?.designation || '',
                    department: employee.employee_profile?.department || '',
                    phone: employee.employee_profile?.phone || '',
                    address: employee.employee_profile?.address || '',
                    join_date: employee.employee_profile?.join_date ? employee.employee_profile.join_date.split('T')[0] : '',
                    status: employee.employee_profile?.status || 'Active',
                    linkedin: employee.employee_profile?.linkedin || '',
                    facebook: employee.employee_profile?.facebook || '',
                    instagram: employee.employee_profile?.instagram || '',
                    whatsapp: employee.employee_profile?.whatsapp || '',
                    website: employee.employee_profile?.website || '',
                })
            })
        }
    }, [id, isEditing, getEmployee, reset])

    const onSubmit = async (data: EmployeeFormData) => {
        try {
            if (isEditing && id) {
                // If password is empty string, delete it so it's not submitted
                if (!data.password) delete data.password;
                await updateEmployee(Number(id), data)
            } else {
                await createEmployee(data)
            }
            navigate('/employees')
        } catch (err) {
            // Error is handled in store
        }
    }

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/employees')}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {isEditing ? 'Edit Employee Profile' : 'Add New Employee'}
                        </h1>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 border border-red-100">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    <span className="font-medium text-sm">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                    <div className="p-6 border-b border-slate-200/60 bg-slate-50/50">
                        <h2 className="text-lg font-semibold text-slate-800">Account Details</h2>
                        <p className="text-sm text-slate-500 mt-1">Basic credentials for system access.</p>
                    </div>
                    <div className="p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                {...register('name')}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                            />
                            {errors.name && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                            <input
                                type="email"
                                {...register('email')}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                            />
                            {errors.email && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Password {isEditing && <span className="text-slate-400 font-normal text-xs">(Leave blank to keep current)</span>}
                                {!isEditing && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="password"
                                {...register('password')}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                            />
                            {errors.password && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.password.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Role <span className="text-red-500">*</span></label>
                            <select
                                {...register('role')}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none bg-white"
                            >
                                <option value="Admin">Admin</option>
                                <option value="Sales">Sales</option>
                                <option value="Architect">Architect</option>
                                <option value="Accounts">Accounts</option>
                            </select>
                        </div>

                        <div className="sm:col-span-2 mt-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...register('is_active')}
                                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-slate-700">Account is Active (Can login)</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-500"></div>
                    <div className="p-6 border-b border-slate-200/60 bg-slate-50/50">
                        <h2 className="text-lg font-semibold text-slate-800">Employment Information</h2>
                        <p className="text-sm text-slate-500 mt-1">Professional details and status.</p>
                    </div>
                    <div className="p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
                            <input
                                type="text"
                                {...register('designation')}
                                placeholder="e.g. Senior Architect"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                            <input
                                type="text"
                                {...register('department')}
                                placeholder="e.g. Design Team"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Date of Joining</label>
                            <input
                                type="date"
                                {...register('join_date')}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Employment Status</label>
                            <select
                                {...register('status')}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none bg-white"
                            >
                                <option value="Active">Active</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Resigned">Resigned</option>
                                <option value="Terminated">Terminated</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-indigo-500"></div>
                    <div className="p-6 border-b border-slate-200/60 bg-slate-50/50">
                        <h2 className="text-lg font-semibold text-slate-800">Contact & Social Links</h2>
                        <p className="text-sm text-slate-500 mt-1">For the digital business card and internal directory.</p>
                    </div>
                    <div className="p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                            <input
                                type="text"
                                {...register('phone')}
                                placeholder="+91..."
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                            <textarea
                                {...register('address')}
                                rows={2}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">WhatsApp Number (with country code)</label>
                            <input
                                type="text"
                                {...register('whatsapp')}
                                placeholder="+91..."
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn URL</label>
                            <input
                                type="url"
                                {...register('linkedin')}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Instagram URL</label>
                            <input
                                type="url"
                                {...register('instagram')}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Facebook URL</label>
                            <input
                                type="url"
                                {...register('facebook')}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Personal Website URL</label>
                            <input
                                type="url"
                                {...register('website')}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={() => navigate('/employees')}
                        className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {isEditing ? 'Save Changes' : 'Create Employee'}
                    </button>
                </div>
            </form>
        </div>
    )
}
