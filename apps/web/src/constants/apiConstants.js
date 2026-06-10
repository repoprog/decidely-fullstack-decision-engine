export const PROJECT_STATUS = {
  DRAFT: "DRAFT",
  FINALIZED: "FINALIZED",
  ARCHIVED: "ARCHIVED",
};

export const SNAPSHOT_TRIGGERS = {
  MANUAL: "MANUAL",
  AUTO: "AUTO",
  PRE_REJECTION: "PRE_REJECTION",
  PRE_RESTORE: "PRE_RESTORE",
};

export const API_PATHS = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    DEMO_LOGIN: "/api/v1/auth/demo-login",
    REGISTER: "/api/v1/auth/register",
    LOGOUT: "/api/v1/auth/logout",
    REFRESH: "/api/v1/auth/refresh",
  },
  USERS: {
    ME: "/api/v1/users/me",
    PROFILE: "/api/v1/users/me/profile",
    PASSWORD: "/api/v1/users/me/password",
  },
  PROJECTS: {
    BASE: "/api/v1/projects",
    BY_ID: (id) => `/api/v1/projects/${id}`,
    CONTENT: (id) => `/api/v1/projects/${id}/content`,
    SNAPSHOTS: (id) => `/api/v1/projects/${id}/snapshots`,
    SNAPSHOT: (id, snapId) => `/api/v1/projects/${id}/snapshots/${snapId}`,
    SHARE: (id) => `/api/v1/projects/${id}/share`,
    SHARED: (token) => `/api/v1/projects/shared/${token}`,
    SNAPSHOT_RESTORE: (id, snapId) =>
      `/api/v1/projects/${id}/snapshots/${snapId}/restore`,
  },

  ANALYSIS: {
    TABLE: "/api/v1/analysis/table",
    TREE: "/api/v1/analysis/tree",
  },
  ADMIN: {
    STATS: "/api/v1/admin/stats",
    USERS: "/api/v1/admin/users",
    TOGGLE_USER: (id) => `/api/v1/admin/users/${id}/toggle-active`,
    SHARES: "/api/v1/admin/shares",
    REVOKE_SHARE: (id) => `/api/v1/admin/shares/${id}`,
  },
};
