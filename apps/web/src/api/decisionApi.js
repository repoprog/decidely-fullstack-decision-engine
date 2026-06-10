import apiClient from "./apiClient";
import { API_PATHS } from "../constants/apiConstants";

export const decisionApi = {
  async getProject(projectId) {
    const response = await apiClient.get(API_PATHS.PROJECTS.BY_ID(projectId));
    if (!response.data) throw new Error("Nie znaleziono decyzji");
    return response.data;
  },

  async getUserProjects(type) {
    const response = await apiClient.get(API_PATHS.PROJECTS.BASE, {
      params: {
        size: 50,
        type: type || undefined,
      },
    });
    return response.data.content || response.data || [];
  },

  async saveTree(id, treeData) {
    const response = await apiClient.patch(
      API_PATHS.PROJECTS.CONTENT(id),
      treeData,
    );
    return response.data;
  },

  async saveTable(id, tableData) {
    const response = await apiClient.patch(
      API_PATHS.PROJECTS.CONTENT(id),
      tableData,
    );
    return response.data;
  },

  async createProject(title, type, { notes = "", content = null } = {}) {
    const response = await apiClient.post(API_PATHS.PROJECTS.BASE, {
      title,
      type,
      notes,
      content,
    });

    return response.data;
  },

  async updateProjectMeta(id, { title, tags, category, notes }) {
    const response = await apiClient.put(API_PATHS.PROJECTS.BY_ID(id), {
      title,
      tags,
      category,
      notes,
    });
    return response.data;
  },

  async deleteProject(id) {
    const response = await apiClient.delete(API_PATHS.PROJECTS.BY_ID(id));
    return response.data;
  },

  async createSnapshot(projectId, label) {
    const response = await apiClient.post(
      API_PATHS.PROJECTS.SNAPSHOTS(projectId),
      { label },
    );
    return response.data;
  },

  async getSnapshots(projectId) {
    const response = await apiClient.get(
      API_PATHS.PROJECTS.SNAPSHOTS(projectId),
    );
    return Array.isArray(response.data)
      ? response.data
      : (response.data?.content ?? []);
  },

  async getSnapshot(projectId, snapshotId) {
    const response = await apiClient.get(
      API_PATHS.PROJECTS.SNAPSHOT(projectId, snapshotId),
    );
    return response.data;
  },

  async restoreSnapshot(projectId, snapshotId, version) {
    const response = await apiClient.post(
      API_PATHS.PROJECTS.SNAPSHOT_RESTORE(projectId, snapshotId),
      { version },
    );

    return response.data;
  },

  async createShareLink(projectId, payload) {
    const response = await apiClient.post(
      API_PATHS.PROJECTS.SHARE(projectId),
      payload,
    );
    return response.data;
  },

  async getSharedProject(token, config = {}) {
    const response = await apiClient.get(
      API_PATHS.PROJECTS.SHARED(token),
      config,
    );

    return response.data;
  },

  async analyzeTable(payload, signal) {
    const response = await apiClient.post(API_PATHS.ANALYSIS.TABLE, payload, {
      signal,
    });
    return response.data;
  },

  async analyzeTree(payload, signal) {
    const response = await apiClient.post(API_PATHS.ANALYSIS.TREE, payload, {
      signal,
    });
    return response.data;
  },
};
