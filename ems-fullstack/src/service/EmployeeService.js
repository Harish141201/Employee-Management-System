import axiosClient from "./axiosClient";

export const listEmployees = (params) => axiosClient.get("/emp", { params });

export const getMyProfile = () => axiosClient.get("/emp/me");

export const savedEmployee = (employee) => axiosClient.post("/emp", employee);

export const editEmployee = (employeeId) => axiosClient.get(`/emp/${employeeId}`);

export const updateDataEmployee = (employeeId, employee) =>
    axiosClient.put(`/emp/${employeeId}`, employee);

export const deleteEmployee = (employeeId) => axiosClient.delete(`/emp/${employeeId}`);
