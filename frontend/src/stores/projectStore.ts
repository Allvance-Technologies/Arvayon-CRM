import { create } from 'zustand';
import { projectService } from '../services/projectService';

interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  estimated_cost?: number;
  actual_cost?: number;
  client?: {
    id: number;
    company_name: string;
  };
  project_manager?: {
    id: number;
    name: string;
  };
  ai_delay_risk?: string;
  ai_delay_warning?: string;
}

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;

  fetchProjects: (filters?: any) => Promise<void>;
  fetchProject: (id: number) => Promise<void>;
  createProject: (data: any) => Promise<void>;
  updateProject: (id: number, data: any) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchProjects: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await projectService.getProjects(filters);
      // Laravel pagination returns the array inside response.data.data
      const projectsData = response.data.data ? response.data.data : response.data;
      set({ projects: projectsData, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await projectService.getProject(id);
      set({ currentProject: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createProject: async (data) => {
    set({ loading: true, error: null });
    try {
      await projectService.createProject(data);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateProject: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await projectService.updateProject(id, data);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteProject: async (id) => {
    set({ loading: true, error: null });
    try {
      await projectService.deleteProject(id);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
