import { create } from 'zustand';
import { taskService } from '../services/taskService';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  project?: {
    id: number;
    name: string;
  };
  assigned_to?: {
    id: number;
    name: string;
  };
}

interface TaskStore {
  tasks: Task[];
  myTasks: Task[];
  currentTask: Task | null;
  loading: boolean;
  error: string | null;

  fetchTasks: (filters?: any) => Promise<void>;
  fetchMyTasks: () => Promise<void>;
  fetchTask: (id: number) => Promise<void>;
  createTask: (data: any) => Promise<void>;
  updateTask: (id: number, data: any) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  myTasks: [],
  currentTask: null,
  loading: false,
  error: null,

  fetchTasks: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.getTasks(filters);
      const tasksData = response.data.data ? response.data.data : response.data;
      set({ tasks: tasksData, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchMyTasks: async () => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.getMyTasks();
      const myTasksData = response.data.data ? response.data.data : response.data;
      set({ myTasks: myTasksData, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchTask: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await taskService.getTask(id);
      set({ currentTask: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createTask: async (data) => {
    set({ loading: true, error: null });
    try {
      await taskService.createTask(data);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateTask: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await taskService.updateTask(id, data);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteTask: async (id) => {
    set({ loading: true, error: null });
    try {
      await taskService.deleteTask(id);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
