import axiosClient from "./axiosClient";

export const listDepartments = () => axiosClient.get("/departments");

export const createDepartment = (department) => axiosClient.post("/departments", department);

export const deleteDepartment = (id) => axiosClient.delete(`/departments/${id}`);
