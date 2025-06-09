import http from '../../../http';

export const fetchDepartments = (params) => http.get('/admin/reg-depart', { params });
export const searchDepartment = (query) => http.get('/admin/reg-depart/search', { params: query });
export const createDepartment = (data) => http.post('/admin/reg-depart', data);
export const updateDepartment = (unitCode, data) => http.put(`/admin/reg-depart/${unitCode}`, data);
export const patchDepartment = (unitCode, data) => http.patch(`/admin/reg-depart/${unitCode}`, data);
export const deleteDepartment = (unitCode) => http.delete(`/admin/reg-depart/${unitCode}`);