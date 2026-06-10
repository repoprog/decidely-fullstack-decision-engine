import { useEffect, useRef } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { LoginModal } from "./auth/LoginModal.jsx";
import { RegisterModal } from "./auth/RegisterModal.jsx";
import { Layout } from "./components/layout/Layout.jsx";
import { AdminRoute } from "./components/routes/AdminRoute.jsx";
import { ToastContainer } from "./components/ui/ToastContainer.jsx";
import { APP_ROUTES } from "./constants/appConstants";
import { DecisionTablePage } from "./features/DecisionTable/DecisionTablePage.jsx";
import { DecisionTreePage } from "./features/DecisionTree/DecisionTreePage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import Settings from "./pages/Settings.jsx";
import { SharedProjectPage } from "./pages/SharedProjectPage.jsx";
import UserPanel from "./pages/UserPanel.jsx";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage.jsx";
import useAuthStore from "./store/useAuthStore.js";

const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSessionInitialized = useAuthStore(
    (state) => state.isSessionInitialized,
  );
  const openLoginModal = useAuthStore((state) => state.openLoginModal);
  const setPendingRedirectPath = useAuthStore(
    (state) => state.setPendingRedirectPath,
  );

  const location = useLocation();
  const hasOpenedLoginModalRef = useRef(false);

  useEffect(() => {
    if (!isSessionInitialized) {
      return;
    }

    if (isAuthenticated) {
      hasOpenedLoginModalRef.current = false;
      return;
    }

    if (hasOpenedLoginModalRef.current) {
      return;
    }

    hasOpenedLoginModalRef.current = true;
    setPendingRedirectPath(location.pathname);
    openLoginModal();
  }, [
    isSessionInitialized,
    isAuthenticated,
    location.pathname,
    openLoginModal,
    setPendingRedirectPath,
  ]);

  if (!isSessionInitialized) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.HOME} replace />;
  }

  return <Outlet />;
};

function App() {
  const hasInitializedSessionRef = useRef(false);

  const isLoginModalOpen = useAuthStore((state) => state.isLoginModalOpen);
  const isRegisterModalOpen = useAuthStore(
    (state) => state.isRegisterModalOpen,
  );
  const closeAuthModals = useAuthStore((state) => state.closeAuthModals);
  const openRegisterModal = useAuthStore((state) => state.openRegisterModal);
  const openLoginModal = useAuthStore((state) => state.openLoginModal);

  const initializeSession = useAuthStore((state) => state.initializeSession);

  useEffect(() => {
    if (hasInitializedSessionRef.current) {
      return;
    }

    hasInitializedSessionRef.current = true;
    initializeSession();
  }, [initializeSession]);

  return (
    <BrowserRouter>
      <ToastContainer />

      <Routes>
        <Route path={APP_ROUTES.HOME} element={<LandingPage />} />
        <Route path="/shared/:token" element={<SharedProjectPage />} />

        <Route path={APP_ROUTES.APP} element={<Layout />}>
          <Route index element={<Navigate to={APP_ROUTES.TABLE} replace />} />

          <Route path={APP_ROUTES.TABLE} element={<DecisionTablePage />} />
          <Route path={APP_ROUTES.TREE} element={<DecisionTreePage />} />

          <Route element={<ProtectedRoute />}>
            <Route path={APP_ROUTES.PANEL} element={<UserPanel />} />
            <Route path={APP_ROUTES.SETTINGS} element={<Settings />} />

            <Route element={<AdminRoute />}>
              <Route path={APP_ROUTES.ADMIN} element={<AdminDashboardPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={APP_ROUTES.HOME} replace />} />
      </Routes>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeAuthModals}
        onSwitchToRegister={openRegisterModal}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={closeAuthModals}
        onSwitchToLogin={openLoginModal}
      />
    </BrowserRouter>
  );
}

export default App;