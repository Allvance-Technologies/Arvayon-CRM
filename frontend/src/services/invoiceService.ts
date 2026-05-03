import api from './api';

export const invoiceService = {
  getInvoices: (filters = {}) => {
    return api.get('/invoices', { params: filters });
  },

  getInvoice: (id: number) => {
    return api.get(`/invoices/${id}`);
  },

  createInvoice: (data: any) => {
    return api.post('/invoices', data);
  },

  updateInvoice: (id: number, data: any) => {
    return api.put(`/invoices/${id}`, data);
  },

  deleteInvoice: (id: number) => {
    return api.delete(`/invoices/${id}`);
  },

  recordPayment: (invoiceId: number, data: any) => {
    return api.post(`/invoices/${invoiceId}/payments`, data);
  },

  getFinancialReports: (filters = {}) => {
    return api.get('/financial/reports', { params: filters });
  },
};
