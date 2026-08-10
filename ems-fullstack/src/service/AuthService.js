import axiosClient from "./axiosClient";

export const login = (username, password) =>
    axiosClient.post("/auth/login", { username, password });

export const registerAccount = (registration) =>
    axiosClient.post("/auth/register", registration);

export const changePassword = (payload) =>
    axiosClient.put("/auth/change-password", payload);

export const refreshAccessToken = (refreshToken) =>
    axiosClient.post("/auth/refresh", { refreshToken });

export const logoutRequest = (refreshToken) =>
    axiosClient.post("/auth/logout", { refreshToken });
