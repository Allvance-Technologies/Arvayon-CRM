import api from './api';

export const userService = {
  getUsers: (filters = {}) => {
    return api.get('/users', { params: filters });
  },

  getUser: (id: number) => {
    return api.get(`/users/${id}`);
  },

  createUser: (data: any) => {
    return api.post('/users', data);
  },

  updateUser: (id: number, data: any) => {
    return api.put(`/users/${id}`, data);
  },

  deleteUser: (id: number) => {
    return api.delete(`/users/${id}`);
  },

  activateUser: (id: number) => {
    return api.post(`/users/${id}/activate`);
  },

  deactivateUser: (id: number) => {
    return api.post(`/users/${id}/deactivate`);
  },

  resetPassword: (id: number, data: any) => {
    return api.post(`/users/${id}/reset-password`, data);
  },
};
