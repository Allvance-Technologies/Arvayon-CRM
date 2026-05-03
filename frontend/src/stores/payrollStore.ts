import { create } from 'zustand'
import api from '../services/api'

export interface Payroll {
    id: number
    user_id: number
    billing_cycle: string
    base_salary: number
    days_present: number
    leave_deductions: number
    overtime_pay: number
    net_payable: number
    status: string
    created_at: string
    updated_at: string
    user?: {
        id: number
        name: string
        email: string
    }
}

interface PayrollState {
    payrolls: Payroll[]
    isLoading: boolean
    isGenerating: boolean
    error: string | null
    fetchPayrolls: () => Promise<void>
    generatePayrolls: () => Promise<void>
    updatePayrollStatus: (id: number, status: string) => Promise<void>
}

export const usePayrollStore = create<PayrollState>((set) => ({
    payrolls: [],
    isLoading: false,
    isGenerating: false,
    error: null,

    fetchPayrolls: async () => {
        set({ isLoading: true, error: null })
        try {
            const { data } = await api.get('/payrolls')
            set({ payrolls: data, isLoading: false })
        } catch (error: any) {
            set({ error: error.response?.data?.message || error.message, isLoading: false })
        }
    },

    generatePayrolls: async () => {
        set({ isGenerating: true, error: null })
        try {
            await api.post('/payroll/generate')

            // Re-fetch payrolls after generation
            const { data } = await api.get('/payrolls')
            set({ payrolls: data, isGenerating: false })
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Failed to generate payrolls', isGenerating: false })
            throw error
        }
    },

    updatePayrollStatus: async (id, status) => {
        try {
            await api.put(`/payrolls/${id}`, { status })

            // Re-fetch payrolls after update to keep it simple and accurate
            const { data } = await api.get('/payrolls')
            set({ payrolls: data })
        } catch (error: any) {
            throw error
        }
    }
}))
