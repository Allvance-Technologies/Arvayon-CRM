import { create } from 'zustand';
import { leadService } from '../services/leadService';

interface Lead {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone?: string;
  status: string;
  budget?: number;
  ai_score?: number;
  industry?: string;
  source?: string;
  notes?: string;
  location?: string;
  first_call?: string;
  second_call?: string;
  assigned_to?: {
    id: number;
    name: string;
  };
  created_at: string;
}

interface LeadStore {
  leads: Lead[];
  currentLead: Lead | null;
  loading: boolean;
  error: string | null;

  fetchLeads: (filters?: any) => Promise<void>;
  fetchLead: (id: number) => Promise<void>;
  createLead: (data: any) => Promise<any>;
  updateLead: (id: number, data: any) => Promise<any>;
  deleteLead: (id: number) => Promise<void>;
  updateLeadStatus: (id: number, status: string) => Promise<void>;
  clearError: () => void;
}

export const useLeadStore = create<LeadStore>((set) => ({
  leads: [],
  currentLead: null,
  loading: false,
  error: null,

  fetchLeads: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await leadService.getAll(filters);
      // Support both paginated objects and flat array responses
      const leadsData = response.data.data ? response.data.data : response.data;
      set({ leads: leadsData, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchLead: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await leadService.getById(id);
      set({ currentLead: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createLead: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await leadService.create(data);
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateLead: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await leadService.update(id, data);
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteLead: async (id) => {
    set({ loading: true, error: null });
    try {
      await leadService.delete(id);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateLeadStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      await leadService.updateStatus(id, status);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
