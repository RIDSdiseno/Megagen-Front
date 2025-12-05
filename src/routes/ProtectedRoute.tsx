import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, type Role } from "../context/AuthContext";

type Props = {
  children: ReactNode;
  allowedRoles?: Role[];
};

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, hasRole } = useAuth();
  if (!user) return <Navigate to="/login" />;

  if (allowedRoles && allowedRoles.length > 0) {
    const canAccess = hasRole(allowedRoles);
    if (!canAccess) {
      if (user.roles.includes("bodeguero")) return <Navigate to="/cotizaciones" replace />;
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
