import api from './api';

export const searchService = {
  search: (query: string) => {
    return api.get('/search', { params: { query } });
  },

  getSavedFilters: () => {
    return api.get('/saved-filters');
  },

  createSavedFilter: (data: any) => {
    return api.post('/saved-filters', data);
  },

  updateSavedFilter: (id: number, data: any) => {
    return api.put(`/saved-filters/${id}`, data);
  },

  deleteSavedFilter: (id: number) => {
    return api.delete(`/saved-filters/${id}`);
  },
};
