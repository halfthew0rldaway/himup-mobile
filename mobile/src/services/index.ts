import api from '@/lib/api';
import type { User } from '@/types';

interface LoginResponse {
  token: string;
  user: User;
}

// Unwraps Laravel resource-style { data: { ... } } without destroying nested arrays
const unwrapOne = (r: any) => {
  let d = r?.data;
  // Laravel Resource: { data: { id, ... } }
  if (d && d.data && !Array.isArray(d.data)) d = d.data;
  return d || {};
};

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/login', { email, password });
    return data;
  },

  logout: async () => {
    try { await api.post('/logout'); } catch { /* ignore */ }
  },

  me: async (): Promise<User> => {
    const { data } = await api.get<User>('/user');
    return data;
  },
};

export const ticketService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/tickets', { params }).then((r) => r.data),

  getMy: (params?: Record<string, unknown>) =>
    api.get('/tickets/my', { params }).then((r) => r.data),

  getOne: (id: number) =>
    api.get(`/tickets/${id}`).then(unwrapOne),

  updateStatus: (id: number, status: string) =>
    api.patch(`/tickets/${id}/status`, { status }).then((r) => r.data),

  close: (id: number, resolution?: string) =>
    api.post(`/tickets/${id}/close`, { resolution }).then((r) => r.data),

  hold: (id: number, reason?: string) =>
    api.post(`/tickets/${id}/hold`, { reason }).then((r) => r.data),

  resume: (id: number) =>
    api.post(`/tickets/${id}/resume`).then((r) => r.data),

  takeOwnership: (id: number, picId: number) =>
    api.post(`/tickets/${id}/assign`, { pic_id: picId }).then((r) => r.data),

  create: (payload: Record<string, unknown>) =>
    api.post('/tickets', payload).then((r) => r.data),

  addComment: (id: number, content: string) =>
    api.post(`/tickets/${id}/comments`, { content }).then((r) => r.data),

  uploadAttachment: (id: number, file: File) => {
    const form = new FormData();
    form.append('attachments[]', file);
    return api.post(`/tickets/${id}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};

export const assetService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/assets', { params }).then((r) => r.data),

  getOne: (id: number) =>
    api.get(`/assets/${id}`).then(unwrapOne),

  getByTag: (tag: string) =>
    api.get('/assets', { params: { search: tag, per_page: 1 } }).then((r) => r.data),

  getHistory: (id: number) =>
    api.get(`/assets/${id}/mutations`).then((r) => r.data),
};

export const maintenanceService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/asset-maintenances', { params }).then((r) => r.data),

  getOne: (id: number) =>
    api.get(`/asset-maintenances/${id}`).then(unwrapOne),

  create: (payload: Record<string, unknown>) =>
    api.post('/asset-maintenances', payload).then((r) => r.data),

  approve: (id: number) =>
    api.post(`/asset-maintenances/${id}/approve`).then((r) => r.data),

  reject: (id: number, reason?: string) =>
    api.post(`/asset-maintenances/${id}/reject`, { rejection_reason: reason }).then((r) => r.data),

  complete: (id: number, cost?: number, notes?: string) =>
    api.put(`/asset-maintenances/${id}`, { status: 'completed', cost, notes }).then((r) => r.data),

  updateStatus: (id: number, status: string) =>
    api.put(`/asset-maintenances/${id}`, { status }).then((r) => r.data),
};

export const notificationService = {
  getAll: () => api.get('/notifications').then((r) => r.data),
  getUnreadCount: () => api.get('/notifications/unread-count').then((r) => r.data),
  markAllRead: () => api.put('/notifications/mark-all-read').then((r) => r.data),
  markRead: (id: number) => api.put(`/notifications/${id}/read`).then((r) => r.data),
};

export const branchService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/branches', { params }).then((r) => r.data),
};

export const categoryService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/ticket-categories', { params }).then((r) => r.data),
};
