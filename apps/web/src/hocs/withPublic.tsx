import type { ComponentType } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/authContext";

export function withPublic<P extends object>(
  Component: ComponentType<P>
) {
  return function WithPublic(props: P) {
    const { isAuthenticated, isInitializing } = useAuth();

    if (isInitializing) {
      return null;
    }

    if (isAuthenticated) {
      return <Navigate to="/auth/home" replace />;
    }

    return <Component {...props} />;
  };
}