import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEmployeeStore } from '../../stores/employeeStore'
import { Plus, Search, Building2, UserCircle2 } from 'lucide-react'

export function EmployeeList() {
    const { employees, isLoading, fetchEmployees } = useEmployeeStore()
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchEmployees()
    }, [fetchEmployees])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
        // Debounce ideally, but just fetch for simple demo
        setTimeout(() => fetchEmployees(e.target.value), 500)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Employees Directory</h1>
                    <p className="mt-1 text-sm text-slate-500">Manage team members, roles, and workloads</p>
                </div>
                <Link
                    to="/employees/new"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Add Employee</span>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="p-4 border-b border-slate-200/60 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, designation..."
                            value={search}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm outline-none bg-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Designation</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading && employees.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                            <span className="ml-3 font-medium">Loading employees...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <UserCircle2 className="mx-auto h-12 w-12 text-slate-300" />
                                        <h3 className="mt-2 text-sm font-semibold text-slate-900">No employees found</h3>
                                        <p className="mt-1 text-sm text-slate-500">Get started by adding a new employee to the directory.</p>
                                    </td>
                                </tr>
                            ) : (
                                employees.map((employee) => (
                                    <tr key={employee.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
                                                        {employee.name.charAt(0)}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                        <Link to={`/employees/${employee.id}`}>{employee.name}</Link>
                                                    </div>
                                                    <div className="text-sm text-slate-500">{employee.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900 font-medium">
                                                {employee.employee_profile?.designation || <span className="text-slate-400 italic">Not specified</span>}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center mt-1">
                                                <Building2 className="w-3 h-3 mr-1" />
                                                {employee.employee_profile?.department || 'General'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-700">{employee.employee_profile?.phone || '--'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                {employee.is_active ? (employee.employee_profile?.status || 'Active') : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link to={`/employees/${employee.id}`} className="text-blue-600 hover:text-blue-900 mr-4 font-semibold">View</Link>
                                            <Link to={`/employees/${employee.id}/edit`} className="text-slate-500 hover:text-slate-900">Edit</Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
