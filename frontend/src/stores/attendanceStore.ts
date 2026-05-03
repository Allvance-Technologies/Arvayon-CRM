import { create } from 'zustand'
import api from '../services/api'

export interface Attendance {
    id: number
    user_id: number
    date: string
    clock_in_time: string | null
    clock_out_time: string | null
    status: string
    leave_type: string | null
    overtime_hours: number
    user?: {
        name: string
        email: string
    }
}

interface AttendanceState {
    records: Attendance[]
    isLoading: boolean
    error: string | null
    fetchRecords: () => Promise<void>
    updateRecord: (id: number, data: Partial<Attendance>) => Promise<void>
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
    records: [],
    isLoading: false,
    error: null,

    fetchRecords: async () => {
        set({ isLoading: true, error: null })
        try {
            const { data } = await api.get('/attendance/all')
            set({ records: data, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
        }
    },

    updateRecord: async (id, dataToUpdate) => {
        try {
            await api.put(`/attendance/${id}`, dataToUpdate)
            // refetch to stay synced
            const { data } = await api.get('/attendance/all')
            set({ records: data })
        } catch (error: any) {
            throw error
        }
    }
}))
