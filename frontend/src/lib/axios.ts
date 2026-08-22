import Axios from 'axios';

const axios = Axios.create({
    // Relative base URL: the Vite dev proxy (see vite.config.ts) forwards
    // /api and /sanctum to the backend, keeping requests same-origin
    // and eliminating the CORS preflight round trip.
    baseURL: '',
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    withCredentials: true,
    withXSRFToken: true,
});

export default axios;
