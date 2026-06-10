import apiClient from "./apiClient";
import { API_PATHS } from "../constants/apiConstants";

export const getSystemStats = async () => {
  const response = await apiClient.get(API_PATHS.ADMIN.STATS);
  return response.data;
};

export const getUsersPage = async (page = 0, size = 20) => {
  const response = await apiClient.get(API_PATHS.ADMIN.USERS, {
    params: { page, size },
  });
  return response.data;
};

export const getActiveSharesPage = async (page = 0, size = 20) => {
  const response = await apiClient.get(API_PATHS.ADMIN.SHARES, {
    params: { page, size },
  });
  return response.data;
};

export const toggleUserStatus = async (userId) => {
  const response = await apiClient.patch(API_PATHS.ADMIN.TOGGLE_USER(userId));
  return response.data;
};

export const revokeShare = async (shareId) => {
  const response = await apiClient.delete(
    API_PATHS.ADMIN.REVOKE_SHARE(shareId),
  );
  return response.data;
};
