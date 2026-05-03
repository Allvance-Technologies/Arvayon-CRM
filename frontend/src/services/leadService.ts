import api from './api'

export const leadService = {
  getAll: async (params?: any) => {
    const response = await api.get('/leads', { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await api.get(`/leads/${id}`)
    return response.data
  },

  create: async (data: any) => {
    const response = await api.post('/leads', data)
    return response.data
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/leads/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/leads/${id}`)
    return response.data
  },

  updateStatus: async (id: number, status: string, lostReason?: string) => {
    const response = await api.patch(`/leads/${id}/status`, { status, lost_reason: lostReason })
    return response.data
  },

  addNote: async (id: number, note: string) => {
    const response = await api.post(`/leads/${id}/notes`, { note })
    return response.data
  },

  getActivities: async (id: number) => {
    const response = await api.get(`/leads/${id}/activities`)
    return response.data
  },

  triggerScoring: async (id: number) => {
    const response = await api.post(`/leads/${id}/score`)
    return response.data
  },

  updateLeadStatus: async (id: number, status: string) => {
    const response = await api.patch(`/leads/${id}/status`, { status })
    return response.data
  },

  convertLead: async (id: number) => {
    const response = await api.post(`/leads/${id}/convert`)
    return response.data
  },

  generateProposal: async (id: number) => {
    const response = await api.post(`/leads/${id}/proposal`)
    return response.data
  },
}
