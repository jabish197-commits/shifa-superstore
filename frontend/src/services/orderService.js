import api from './api';
export const orderService = {
  create: (data) => api.post('orders/', data),
  get: (id) => api.get(`orders/${id}/`),
  checkDelivery: (data) => api.post('delivery-areas/check/', data),
  updateStatus: (id, status) => api.patch(`orders/${id}/status/`, { status }),
};
