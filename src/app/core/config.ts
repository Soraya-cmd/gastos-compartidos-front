const enLocal =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1';

export const API_URL = enLocal
  ? 'http://127.0.0.1:8000'
  : 'https://gastos-compartidos-api.onrender.com';