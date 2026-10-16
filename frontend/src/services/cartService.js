import api from './api';
export const cartService = {
  get: () => api.get('cart/'),
  add: (product_id, quantity = 1) => api.post('cart/', { product_id, quantity }),
  update: (id, quantity) => api.patch(`cart/items/${id}/`, { quantity }),
  remove: (id) => api.delete(`cart/items/${id}/`),
  clear: () => api.delete('cart/'),
};
