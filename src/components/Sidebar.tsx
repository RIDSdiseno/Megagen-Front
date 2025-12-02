import { NavLink } from "react-router-dom";
import Logo from "/LogoLogin.jpg";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  UserCog 
} from "lucide-react";

const linkClass =
  "flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-megagen-primary/10 text-[#1A334B] font-semibold";

export default function Sidebar() {
  return (
    <div className="flex flex-col h-full p-4">

      <div className="flex items-center gap-3 mb-8 px-2 py-3">
        <img src={Logo} className="w-10" />
        <p className="font-bold text-lg text-[#1A334B] tracking-tight">MegaGen CRM</p>
      </div>

      {/* NAV */}
      <nav className="flex flex-col gap-3 text-sm">

        <NavLink to="/dashboard" className={linkClass}>
          <LayoutDashboard size={18}/> Dashboard
        </NavLink>

        <NavLink to="/leads" className={linkClass}>
          <Users size={18}/> Leads / Clientes
        </NavLink>

        <NavLink to="/calendar" className={linkClass}>
          <Calendar size={18}/> Calendario y Reuniones
        </NavLink>

        <NavLink to="/cotizaciones" className={linkClass}>
          <FileText size={18}/> Cotizaciones
        </NavLink>

        <NavLink to="/usuarios" className={linkClass}>
          <UserCog size={18}/> Usuarios
        </NavLink>

        <NavLink to="/configuracion" className={linkClass}>
          <Settings size={18}/> Configuracion
        </NavLink>

      </nav>
    </div>
  );
}
