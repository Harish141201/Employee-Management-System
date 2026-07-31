import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const axiosClient = axios.create({
    baseURL: BASE_URL,
});

// Attach the JWT to every request, if we have one.
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("ems_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// If the token is missing/expired, the backend returns 401. Clear the
// stale session and let the app redirect to /login on next render.
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            localStorage.removeItem("ems_token");
            localStorage.removeItem("ems_user");
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
