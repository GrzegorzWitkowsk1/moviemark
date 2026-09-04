import type { ComponentType } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@/hooks/useAuth";

export function withPublic<P extends object>(
  Component: ComponentType<P>
) {
  return function WithPublic(props: P) {
    const { isAuthenticated, isLoading } = useUser();

    if (isLoading) {
      return null;
    }

    if (isAuthenticated) {
      return <Navigate to="/auth/home" replace />;
    }

    return <Component {...props} />;
  };
}
