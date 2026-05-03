import api from './api';

export const projectService = {
  getProjects: (filters = {}) => {
    return api.get('/projects', { params: filters });
  },

  getProject: (id: number) => {
    return api.get(`/projects/${id}`);
  },

  createProject: (data: any) => {
    return api.post('/projects', data);
  },

  updateProject: (id: number, data: any) => {
    return api.put(`/projects/${id}`, data);
  },

  deleteProject: (id: number) => {
    return api.delete(`/projects/${id}`);
  },

  getMilestones: (projectId: number) => {
    return api.get(`/projects/${projectId}/milestones`);
  },

  createMilestone: (projectId: number, data: any) => {
    return api.post(`/projects/${projectId}/milestones`, data);
  },

  getDocuments: (projectId: number) => {
    return api.get(`/projects/${projectId}/documents`);
  },

  predictDelay: (projectId: number) => {
    return api.post(`/projects/${projectId}/predict-delay`);
  },
};
