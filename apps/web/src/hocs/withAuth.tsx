import type { ComponentType } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/authContext";

export function withAuth<P extends object>(
  Component: ComponentType<P>
) {
  return function WithAuth(props: P) {
    const { isAuthenticated, isInitializing } = useAuth();

    if (isInitializing) {
      return null;
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    return <Component {...props} />;
  };
}