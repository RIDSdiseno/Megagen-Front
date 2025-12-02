import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: any) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}
