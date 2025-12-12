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
} from "lucide-react";
import { useAuth, type Role } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";

const linkClass =
  "flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-megagen-primary/10 text-[#1A334B] font-semibold";

export default function Sidebar() {
  const { hasRole } = useAuth();
  const { t } = useI18n();

  const items: Array<{
    to: string;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    roles?: Role[];
  }> = [
    { to: "/dashboard", label: t("dashboard"), icon: LayoutDashboard, roles: ["admin", "superadmin", "supervisor", "vendedor", "bodeguero"] },
    { to: "/leads", label: t("leads"), icon: Users, roles: ["admin", "superadmin", "supervisor", "vendedor"] },
    { to: "/clientes", label: t("clients"), icon: UserCog, roles: ["admin", "superadmin", "supervisor", "vendedor"] },
    { to: "/calendar", label: t("calendar"), icon: Calendar, roles: ["admin", "superadmin", "supervisor", "vendedor"] },
    { to: "/cotizaciones", label: t("quotes"), icon: FileText, roles: ["admin", "superadmin", "supervisor", "bodeguero"] },
    { to: "/usuarios", label: t("users"), icon: Shield, roles: ["admin", "superadmin"] },
    { to: "/configuracion", label: t("settings"), icon: Settings },
  ];

  const canSee = (roles?: Role[]) => {
    if (!roles || roles.length === 0) return true;
    return hasRole(roles);
  };

  return (
    <div className="flex flex-col h-full p-4">

      <div className="flex items-center gap-3 mb-8 px-2 py-3">
        <img src={Logo} className="w-10" />
        <p className="font-bold text-lg text-[#1A334B] tracking-tight">MegaGen CRM</p>
      </div>

      {/* NAV */}
      <nav className="flex flex-col gap-3 text-sm">

        {items.filter((item) => canSee(item.roles)).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              <Icon size={18} /> {item.label}
            </NavLink>
          );
        })}

      </nav>
    </div>
  );
}
