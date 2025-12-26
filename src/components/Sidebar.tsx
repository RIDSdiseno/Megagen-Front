import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import Logo from "/LOGO.jpg";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  UserCog,
  Shield,
  Truck,
  Route,
  ClipboardList,
} from "lucide-react";
import { useAuth, type Role } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";

const linkClass =
  "flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-megagen-primary/10 text-[#1A334B] font-semibold";

const READY_COUNT_KEY = "megagen_ready_clients_count";

export default function Sidebar() {
  const { hasRole } = useAuth();
  const { t } = useI18n();
  const [readyCount, setReadyCount] = useState(0);

  useEffect(() => {
    const readReadyCount = () => {
      try {
        const raw = localStorage.getItem(READY_COUNT_KEY);
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 0;
      } catch {
        return 0;
      }
    };

    const syncReadyCount = () => setReadyCount(readReadyCount());
    syncReadyCount();
    window.addEventListener("storage", syncReadyCount);
    return () => window.removeEventListener("storage", syncReadyCount);
  }, []);

  const items: Array<{
    to: string;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    roles?: Role[];
  }> = [
    { to: "/dashboard", label: t("Dashboard"), icon: LayoutDashboard, roles: ["admin", "superadmin", "supervisor", "vendedor", "bodeguero"] },
    { to: "/leads", label: t("Leads"), icon: Users, roles: ["admin", "superadmin", "supervisor", "vendedor"] },
    { to: "/clientes", label: t("Clientes"), icon: UserCog, roles: ["admin", "superadmin", "supervisor", "vendedor"] },
    { to: "/clientes-listos", label: t("Clientes listos"), icon: ClipboardList, roles: ["admin", "superadmin", "supervisor", "vendedor"] },
    { to: "/calendar", label: `${t("Calendario")} / ${t("Reuniones")}`, icon: Calendar, roles: ["admin", "superadmin", "supervisor", "vendedor"] },
    { to: "/cotizaciones", label: t("Cotizaciones"), icon: FileText, roles: ["admin", "superadmin", "supervisor", "bodeguero"] },
    { to: "/historial-terreno", label: t("Historial de cotizaciones"), icon: Truck, roles: ["admin", "superadmin", "supervisor"] },
    { to: "/visitas-terreno", label: t("Visitas a terreno"), icon: Route, roles: ["admin", "superadmin", "supervisor", "bodeguero"] },
    { to: "/usuarios", label: t("Usuarios"), icon: Shield, roles: ["admin", "superadmin"] },
    { to: "/configuracion", label: t("Configuracion"), icon: Settings },
  ];

  const canSee = (roles?: Role[]) => {
    if (!roles || roles.length === 0) return true;
    return hasRole(roles);
  };

  return (
    <div className="flex flex-col h-full p-4">

      <div className="flex items-center gap-3 mb-8 px-2 py-3">
        <img src={Logo} className="w-10" />
        <p className="font-bold text-lg text-[#1A334B] tracking-tight">{t("MegaGen CRM")}</p>
      </div>

      {/* NAV */}
      <nav className="flex flex-col gap-3 text-sm">

        {items.filter((item) => canSee(item.roles)).map((item) => {
          const Icon = item.icon;
          const showReadyCount = item.to === "/clientes-listos";
          return (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {showReadyCount && (
                <span className="ml-auto min-w-[26px] px-2 py-0.5 rounded-full text-xs font-bold bg-[#E8F2FF] text-[#1A6CD3] text-center">
                  {readyCount}
                </span>
              )}
            </NavLink>
          );
        })}

      </nav>
    </div>
  );
}
