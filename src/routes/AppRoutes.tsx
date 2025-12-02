import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import DashboardHome from "../pages/DashboardHome";
import Leads from "../pages/Leads";
import CalendarPage from "../pages/Calendar";
import ForgotPasswordPage from "../pages/ForgotPassword";
import CotizacionesPage from "../pages/Quotes";
import UsuariosPage from "../pages/Users";
import ConfiguracionPage from "../pages/Settings";
import ProtectedRoute from "./ProtectedRoute";

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
          <ProtectedRoute>
            <DashboardHome />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/leads" 
        element={
          <ProtectedRoute>
            <Leads />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/calendar" 
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/cotizaciones" 
        element={
          <ProtectedRoute>
            <CotizacionesPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/usuarios" 
        element={
          <ProtectedRoute>
            <UsuariosPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/configuracion" 
        element={
          <ProtectedRoute>
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
