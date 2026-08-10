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

function clearSession() {
    localStorage.removeItem("ems_token");
    localStorage.removeItem("ems_refresh_token");
    localStorage.removeItem("ems_user");
}

// Silently refreshes an expired access token and retries the original
// request once, so a short-lived token doesn't mean the user gets kicked
// out mid-session. Deliberately uses a plain axios.post (not axiosClient)
// for the refresh call itself — calling back through this same instance
// would mean a failed refresh (e.g. an expired refresh token) re-enters
// this exact interceptor and tries to "refresh the refresh," which is
// both pointless and a real infinite-loop risk.
axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error?.response?.status;
        const url = originalRequest?.url || "";

        if (status !== 401) {
            return Promise.reject(error);
        }

        // A failed login attempt is a wrong password, not an expired
        // session — the user is already on the login screen. Let
        // Login.jsx's own error handling show that inline; don't touch
        // session state or redirect.
        if (url.includes("/auth/login")) {
            return Promise.reject(error);
        }

        const canAttemptRefresh = originalRequest && !originalRequest._retry && !url.includes("/auth/");

        if (canAttemptRefresh) {
            const refreshToken = localStorage.getItem("ems_refresh_token");
            if (refreshToken) {
                originalRequest._retry = true;
                try {
                    const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
                    const newAccessToken = response.data.token;
                    localStorage.setItem("ems_token", newAccessToken);
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return axiosClient(originalRequest);
                } catch {
                    // Refresh itself failed (expired/invalid refresh token) —
                    // fall through to the session-clear + redirect below.
                }
            }
        }

        // Reached when: there's no refresh token, the refresh call failed,
        // or a request already retried once still got a 401. The session
        // is genuinely gone at this point. Clear it and force a full
        // reload to /login rather than just rejecting the promise — a
        // plain reject would leave AuthContext's React state stale (still
        // "logged in" per its last render) while every subsequent API
        // call quietly fails, which is a confusing stuck state. The
        // reload re-initializes AuthContext from the now-cleared
        // localStorage.
        clearSession();
        if (window.location.pathname !== "/login") {
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
