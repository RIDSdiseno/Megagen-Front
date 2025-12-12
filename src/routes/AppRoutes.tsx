import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import DashboardHome from "../pages/DashboardHome";
import Leads from "../pages/Leads";
import ClientsPage from "../pages/Clients";
import CalendarPage from "../pages/Calendar";
import ForgotPasswordPage from "../pages/ForgotPassword";
import CotizacionesPage from "../pages/Quotes";
import UsuariosPage from "../pages/Users";
import ConfiguracionPage from "../pages/Settings";
import ProtectedRoute from "./ProtectedRoute";
import { type Role } from "../context/AuthContext";

const ALL_ROLES: Role[] = ["admin", "superadmin", "supervisor", "vendedor", "bodeguero"];
const COMERCIALES: Role[] = ["admin", "superadmin", "supervisor", "vendedor", "bodeguero"];

export default function AppRoutes() {
  return (
    <Routes>

      {/* PUBLIC */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot" element={<ForgotPasswordPage />} />

      {/* PRIVATE */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute allowedRoles={COMERCIALES}>
            <DashboardHome />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/leads" 
        element={
          <ProtectedRoute allowedRoles={["admin", "superadmin", "supervisor", "vendedor"]}>
            <Leads />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/clientes" 
        element={
          <ProtectedRoute allowedRoles={["admin", "superadmin", "supervisor", "vendedor"]}>
            <ClientsPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/calendar" 
        element={
          <ProtectedRoute allowedRoles={["admin", "superadmin", "supervisor", "vendedor"]}>
            <CalendarPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/cotizaciones" 
        element={
          <ProtectedRoute allowedRoles={["admin", "superadmin", "supervisor", "bodeguero"]}>
            <CotizacionesPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/usuarios" 
        element={
          <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
            <UsuariosPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/configuracion" 
        element={
          <ProtectedRoute allowedRoles={ALL_ROLES}>
            <ConfiguracionPage />
          </ProtectedRoute>
        } 
      />

      {/* DEFAULTS */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />

    </Routes>
  );
}
