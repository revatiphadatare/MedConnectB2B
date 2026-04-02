import axios from 'axios';

const api = axios.create({
  baseURL:  import.meta.env.VITE_API_URL || '/api',
  timeout:  20000,
  headers:  { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('medchain_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login:          d  => api.post('/auth/login',         d),
  adminLogin:     d  => api.post('/auth/admin/login',   d),
  register:       d  => api.post('/auth/register',      d),
  getMe:          () => api.get('/auth/me'),
  updateProfile:  d  => api.put('/auth/profile',        d),
  changePassword: d  => api.put('/auth/change-password',d),
};

export const usersAPI = {
  getAll:       p      => api.get('/users',                      { params: p }),
  getById:      id     => api.get(`/users/${id}`),
  getPending:   ()     => api.get('/users/pending'),
  approve:      (id,d) => api.put(`/users/${id}/approve`,        d),
  toggleStatus: id     => api.put(`/users/${id}/toggle-status`),
};

export const productsAPI = {
  getAll:       p      => api.get('/products',            { params: p }),
  getById:      id     => api.get(`/products/${id}`),
  getCategories:()     => api.get('/products/categories'),
  create:       d      => api.post('/products',           d),
  update:       (id,d) => api.put(`/products/${id}`,      d),
  delete:       id     => api.delete(`/products/${id}`),
};

export const ordersAPI = {
  getAll:       p      => api.get('/orders',              { params: p }),
  getById:      id     => api.get(`/orders/${id}`),
  getStats:     ()     => api.get('/orders/stats'),
  create:       d      => api.post('/orders',             d),
  updateStatus: (id,d) => api.put(`/orders/${id}/status`, d),
  cancel:       (id,d) => api.put(`/orders/${id}/cancel`, d),
};

export const invoicesAPI = {
  getAll:        p      => api.get('/invoices',                  { params: p }),
  getById:       id     => api.get(`/invoices/${id}`),
  create:        d      => api.post('/invoices',                 d),
  updatePayment: (id,d) => api.put(`/invoices/${id}/payment`,   d),
};

export const analyticsAPI = {
  admin:  () => api.get('/analytics/admin'),
  seller: () => api.get('/analytics/seller'),
  buyer:  () => api.get('/analytics/buyer'),
};

export const medicinesAPI = {
  getAll:      p      => api.get('/medicines',             { params: p }),
  getById:     id     => api.get(`/medicines/${id}`),
  getByBarcode:code   => api.get(`/medicines/barcode/${code}`),
  create:      d      => api.post('/medicines',            d),
  update:      (id,d) => api.put(`/medicines/${id}`,       d),
  delete:      id     => api.delete(`/medicines/${id}`),
};

export const batchesAPI = {
  getAll:       p      => api.get('/batches',                    { params: p }),
  create:       d      => api.post('/batches',                   d),
  movement:     (id,d) => api.post(`/batches/${id}/movement`,    d),
  expiryReport: p      => api.get('/batches/expiry-report',      { params: p }),
};

export const salesAPI = {
  getAll:     p  => api.get('/sales',              { params: p }),
  getById:    id => api.get(`/sales/${id}`),
  create:     d  => api.post('/sales',             d),
  getSummary: () => api.get('/sales/stats/summary'),
};

export const suppliersAPI = {
  getAll:    p      => api.get('/suppliers',                           { params: p }),
  create:    d      => api.post('/suppliers',                          d),
  update:    (id,d) => api.put(`/suppliers/${id}`,                     d),
  getPOs:    p      => api.get('/suppliers/purchase-orders',           { params: p }),
  createPO:  d      => api.post('/suppliers/purchase-orders',          d),
  receivePO: (id,d) => api.put(`/suppliers/purchase-orders/${id}/receive`, d),
  payPO:     (id,d) => api.put(`/suppliers/purchase-orders/${id}/payment`, d),
};

export const customersAPI = {
  getAll:  p      => api.get('/customers',       { params: p }),
  getById: id     => api.get(`/customers/${id}`),
  getStats:()     => api.get('/customers/stats'),
  create:  d      => api.post('/customers',      d),
  update:  (id,d) => api.put(`/customers/${id}`, d),
};

export const notificationsAPI = {
  getAll:     p  => api.get('/notifications',      { params: p }),
  generate:   () => api.post('/notifications/generate'),
  markRead:   id => api.put(`/notifications/${id}/read`),
  markAllRead:() => api.put('/notifications/read-all'),
};

export const reportsAPI = {
  sales:      p => api.get('/reports/sales',       { params: p }),
  profitLoss: p => api.get('/reports/profit-loss', { params: p }),
  stock:      () => api.get('/reports/stock'),
  expiry:     () => api.get('/reports/expiry'),
  accounting: p => api.get('/reports/accounting',  { params: p }),
  addEntry:   d => api.post('/reports/accounting', d),
};

export default api;
