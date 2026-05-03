import api from './api';

export const taskService = {
  getTasks: (filters = {}) => {
    return api.get('/tasks', { params: filters });
  },

  getMyTasks: () => {
    return api.get('/tasks/my');
  },

  getTask: (id: number) => {
    return api.get(`/tasks/${id}`);
  },

  createTask: (data: any) => {
    return api.post('/tasks', data);
  },

  updateTask: (id: number, data: any) => {
    return api.put(`/tasks/${id}`, data);
  },

  deleteTask: (id: number) => {
    return api.delete(`/tasks/${id}`);
  },

  getCalendar: (month: number, year: number) => {
    return api.get('/tasks/calendar', { params: { month, year } });
  },
};
