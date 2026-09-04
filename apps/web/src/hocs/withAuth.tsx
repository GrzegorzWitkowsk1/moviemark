import type { ComponentType } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@/hooks/useAuth";

export function withAuth<P extends object>(
  Component: ComponentType<P>
) {
  return function WithAuth(props: P) {
    const { isAuthenticated, isLoading } = useUser();

    if (isLoading) {
      return null;
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    return <Component {...props} />;
  };
}
