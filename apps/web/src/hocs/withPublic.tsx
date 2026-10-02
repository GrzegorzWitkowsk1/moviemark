import type { ComponentType } from "react";
import { Navigate } from "react-router-dom";

import { useUser } from "@/hooks/useAuth";
import LoadingScreen from "@/shared/components/LoadingScreen";

export function withPublic<P extends object>(
  Component: ComponentType<P>
) {
  return function WithPublic(props: P) {
    const { isAuthenticated, isLoading, isGuest } = useUser();

    if (isLoading) {
      return <LoadingScreen state="pending" />;
    }

    if (isAuthenticated && !isGuest) {
      return <Navigate to="/auth/home" replace />;
    }

    return <Component {...props} />;
  };
}
