import http from '../../../http';

export const fetchEmployees = (params) => http.get('/admin/employees', { params });
export const searchEmployee = (query) => http.get('/admin/employees/search', { params: query });
export const createEmployee = (data) => http.post('/admin/employees', data);
export const updateEmployee = (badgeNumber, data) => http.put(`/admin/employees/${badgeNumber}`, data);
export const patchEmployee = (badgeNumber, data) => http.patch(`/admin/employees/${badgeNumber}`, data);
export const deleteEmployee = (badgeNumber) => http.delete(`/admin/employees/${badgeNumber}`);
