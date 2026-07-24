import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const listParams = (values = {}) =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '' && value !== undefined && value !== null));

