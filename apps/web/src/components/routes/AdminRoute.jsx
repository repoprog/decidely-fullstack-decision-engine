import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import { APP_ROUTES } from "../../constants/appConstants";

export const AdminRoute = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated || !user || user.role !== "ADMIN") {
    return <Navigate to={APP_ROUTES.HOME} replace />;
  }

  return <Outlet />;
};
