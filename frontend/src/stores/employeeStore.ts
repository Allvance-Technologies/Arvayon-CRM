import { create } from 'zustand'
import api from '../services/api'

export interface EmployeeProfile {
    id: number
    user_id: number
    designation: string | null
    department: string | null
    phone: string | null
    address: string | null
    join_date: string | null
    status: string
    linkedin: string | null
    instagram: string | null
    whatsapp: string | null
    facebook: string | null
    website: string | null
}

export interface Employee {
    id: number
    name: string
    email: string
    role: string
    is_active: boolean
    employee_profile: EmployeeProfile | null
}

interface EmployeeState {
    employees: Employee[]
    isLoading: boolean
    error: string | null
    fetchEmployees: (search?: string) => Promise<void>
    getEmployee: (id: number) => Promise<Employee>
    createEmployee: (data: any) => Promise<void>
    updateEmployee: (id: number, data: any) => Promise<void>
    deleteEmployee: (id: number) => Promise<void>
    getEmployeeTasks: (id: number) => Promise<any>
    assignTask: (data: any) => Promise<any>
    updateTaskStatus: (taskId: number, status: string) => Promise<any>
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
    employees: [],
    isLoading: false,
    error: null,

    fetchEmployees: async (search) => {
        set({ isLoading: true, error: null })
        try {
            const { data } = await api.get('/employees', { params: { search } })
            set({ employees: data.data || data, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
        }
    },

    getEmployee: async (id) => {
        set({ isLoading: true, error: null })
        try {
            const { data } = await api.get(`/employees/${id}`)
            set({ isLoading: false })
            return data
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    createEmployee: async (dataToSubmit) => {
        set({ isLoading: true, error: null })
        try {
            await api.post('/employees', dataToSubmit)
            set({ isLoading: false })
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Failed to create employee', isLoading: false })
            throw error
        }
    },

    updateEmployee: async (id, dataToSubmit) => {
        set({ isLoading: true, error: null })
        try {
            await api.put(`/employees/${id}`, dataToSubmit)
            set({ isLoading: false })
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Failed to update employee', isLoading: false })
            throw error
        }
    },

    deleteEmployee: async (id) => {
        set({ isLoading: true, error: null })
        try {
            await api.delete(`/employees/${id}`)
            set((state) => ({
                employees: state.employees.filter((emp) => emp.id !== id),
                isLoading: false,
            }))
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    getEmployeeTasks: async (id) => {
        try {
            const { data } = await api.get(`/employees/${id}/tasks`)
            return data
        } catch (error: any) {
            throw error
        }
    },

    assignTask: async (taskData) => {
        try {
            const { data } = await api.post('/tasks', taskData)
            return data
        } catch (error: any) {
            throw error
        }
    },

    updateTaskStatus: async (taskId, status) => {
        try {
            const { data } = await api.put(`/tasks/${taskId}`, { status })
            return data
        } catch (error: any) {
            throw error
        }
    },
}))
