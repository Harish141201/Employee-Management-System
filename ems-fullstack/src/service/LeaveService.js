import axiosClient from "./axiosClient";

export const applyForLeave = (request) => axiosClient.post("/leave", request);

export const getMyLeaveRequests = () => axiosClient.get("/leave/me");

export const getTeamLeaveRequests = () => axiosClient.get("/leave/team");

export const getAllLeaveRequests = (status) =>
    axiosClient.get("/leave", { params: status ? { status } : {} });

export const decideLeaveRequest = (id, decision) =>
    axiosClient.put(`/leave/${id}/decision`, decision);

export const cancelLeaveRequest = (id) => axiosClient.delete(`/leave/${id}`);
