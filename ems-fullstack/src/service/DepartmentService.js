import axiosClient from "./axiosClient";

export const listDepartments = () => axiosClient.get("/departments");
