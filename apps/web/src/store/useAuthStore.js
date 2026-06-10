import { create } from "zustand";
import { persist } from "zustand/middleware";
import { accessTokenStore } from "../api/accessTokenStore.js";
import apiClient from "../api/apiClient";
import { getApiErrorMessage } from "../api/apiError.js";
import { API_PATHS } from "../constants/apiConstants";
import { STORAGE_KEYS } from "../constants/appConstants";
import { useTreeStore } from "../features/DecisionTree/store/useTreeStore";
import { useTableStore } from "../features/DecisionTable/store/useTableStore";

const INITIAL_AUTH_STATE = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isSessionInitialized: false,
  error: null,
  pendingRedirectPath: null,
  isLoginModalOpen: false,
  isRegisterModalOpen: false,
};

const clearEditorStorage = () => {
  useTreeStore.persist.clearStorage();
  useTableStore.persist.clearStorage();
};

const resetEditorStores = () => {
  useTreeStore.getState().resetTree();
  useTableStore.getState().resetAll();
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      ...INITIAL_AUTH_STATE,

      setPendingRedirectPath: (path) => {
        set({ pendingRedirectPath: path });
      },

      openLoginModal: () => {
        set({
          isLoginModalOpen: true,
          isRegisterModalOpen: false,
          error: null,
        });
      },

      openRegisterModal: () => {
        set({
          isRegisterModalOpen: true,
          isLoginModalOpen: false,
          error: null,
        });
      },

      closeAuthModals: () => {
        set({
          isLoginModalOpen: false,
          isRegisterModalOpen: false,
          error: null,
        });
      },

      fetchProfile: async () => {
        try {
          const response = await apiClient.get(API_PATHS.USERS.ME);

          set((state) => ({
            user: {
              ...state.user,
              ...response.data,
            },
          }));
        } catch (error) {
          if (error.response?.status === 401) {
            await get().logout();
            return;
          }

          set({
            error: getApiErrorMessage(
              error,
              "Nie udało się odświeżyć profilu użytkownika.",
            ),
          });
        }
      },

      initializeSession: async () => {
        accessTokenStore.clear();
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);

        set({ isLoading: true, error: null });

        try {
          const refreshResponse = await apiClient.post(API_PATHS.AUTH.REFRESH);
          const { accessToken } = refreshResponse.data;

          accessTokenStore.set(accessToken);

          const profileResponse = await apiClient.get(API_PATHS.USERS.ME);

          set((state) => ({
            user: {
              ...state.user,
              ...profileResponse.data,
            },
            isAuthenticated: true,
            isLoading: false,
            isSessionInitialized: true,
            error: null,
          }));
        } catch {
          accessTokenStore.clear();
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isSessionInitialized: true,
            error: null,
          });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post(API_PATHS.AUTH.LOGIN, {
            email,
            password,
          });

          const { accessToken, user } = response.data;

          accessTokenStore.set(accessToken);
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isSessionInitialized: true,
            isLoginModalOpen: false,
            isRegisterModalOpen: false,
            error: null,
          });

          await get().fetchProfile();
        } catch (error) {
          const errorMessage = getApiErrorMessage(
            error,
            "Nie udało się zalogować.",
          );

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      demoLogin: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post(API_PATHS.AUTH.DEMO_LOGIN);
          const { accessToken, user } = response.data;

          accessTokenStore.set(accessToken);
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isSessionInitialized: true,
            isLoginModalOpen: false,
            isRegisterModalOpen: false,
            error: null,
          });

          await get().fetchProfile();
        } catch (error) {
          const errorMessage = getApiErrorMessage(
            error,
            "Nie udało się zalogować jako gość.",
          );

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post(API_PATHS.AUTH.REGISTER, {
            name,
            email,
            password,
          });

          const { accessToken, user } = response.data;

          accessTokenStore.set(accessToken);
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isSessionInitialized: true,
            isLoginModalOpen: false,
            isRegisterModalOpen: false,
            error: null,
          });

          await get().fetchProfile();

          return user;
        } catch (error) {
          const errorMessage = getApiErrorMessage(
            error,
            "Nie udało się utworzyć konta.",
          );

          accessTokenStore.clear();

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          await apiClient.post(API_PATHS.AUTH.LOGOUT);
        } catch {
          // Logout must always clear local state, even if the server request fails.
        } finally {
          accessTokenStore.clear();
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);

          resetEditorStores();
          clearEditorStorage();

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isSessionInitialized: true,
            error: null,
            isLoginModalOpen: false,
            isRegisterModalOpen: false,
            pendingRedirectPath: null,
          });
        }
      },
    }),
    {
      name: STORAGE_KEYS.AUTH,
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
);

export default useAuthStore;