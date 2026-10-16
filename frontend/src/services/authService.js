import api from './api';
export const authService = {
  login: (data) => api.post('accounts/login/', data),
  register: (data) => api.post('accounts/register/', data),
  me: () => api.get('accounts/me/'),
  logout: (refresh) => api.post('accounts/logout/', { refresh }),
};
