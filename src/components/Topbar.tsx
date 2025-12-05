import { useAuth } from "../../src/context/AuthContext";
import { useEffect, useState } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearNotifications, getNotifications, removeNotification, type NotificationItem } from "../utils/notifications";

export default function Topbar() {
  const { user, logout, exitImpersonation } = useAuth();
  const [openMenu, setOpenMenu] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const navigate = useNavigate();

  const initial = user?.email ? user.email.charAt(0).toUpperCase() : "?";

  useEffect(() => {
    const load = () => setNotifications(getNotifications());
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  return (
    <header className="backdrop-blur bg-white/80 border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-40">

      <h2 className="font-bold text-[#1A334B] text-lg tracking-tight">
        MegaGen CRM - Plataforma Comercial Chile
      </h2>

      <div className="flex items-center gap-3 relative">

        <div className="relative">
          <button
            onClick={() => setOpenNotif(!openNotif)}
            className="relative rounded-full p-2 hover:bg-gray-100 transition"
            aria-label="Notificaciones"
          >
            <Bell size={18} className="text-[#1A334B]" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {openNotif && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 shadow-xl rounded-xl z-50 max-h-80 overflow-auto">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">Notificaciones</p>
                <button
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => {
                    clearNotifications();
                    setNotifications([]);
                  }}
                >
                  Limpiar
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="text-xs text-gray-500 px-4 py-3">Sin notificaciones</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 border-b border-gray-100 last:border-b-0 flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                        <p className="text-xs text-gray-600">{n.detail}</p>
                      </div>
                      <input
                        type="checkbox"
                        onChange={() => {
                          removeNotification(n.id);
                          setNotifications((prev) => prev.filter((x) => x.id !== n.id));
                        }}
                        className="mt-1"
                        aria-label="Marcar como leida"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400">{n.time}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setOpenMenu(!openMenu)}
            className="flex items-center gap-2 hover:bg-gray-100 px-3 py-1 rounded-lg transition"
          >
            <div className="w-10 h-10 bg-megagen-light rounded-full flex items-center justify-center text-megagen-primary font-bold text-xl shadow-sm">
              {initial}
            </div>
            <ChevronDown size={18}/>
          </button>

          {openMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 shadow-xl rounded-xl z-50">
              <div className="px-4 pt-3 pb-2 border-b border-gray-100">
                <p className="text-sm text-gray-600">Conectado como</p>
                <p className="text-sm font-bold text-gray-800">{user?.email}</p>
                {user?.impersonator && (
                  <p className="text-[11px] text-amber-600">Impersonando (origen: {user.impersonator.email})</p>
                )}
              </div>

              <button
                className="w-full text-left px-4 py-3 hover:bg-gray-100 text-gray-700 transition"
                onClick={() => {
                  setOpenMenu(false);
                  navigate("/configuracion#seguridad");
                }}
              >
                Cambiar contrasena
              </button>

              <button
                className="w-full text-left px-4 py-3 hover:bg-gray-100 text-gray-700 transition"
                onClick={() => {
                  setOpenMenu(false);
                  navigate("/configuracion");
                }}
              >
                Configuracion
              </button>

              {user?.impersonator && (
                <button
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 text-blue-600 font-semibold transition"
                  onClick={() => {
                    setOpenMenu(false);
                    exitImpersonation();
                  }}
                >
                  Salir de impersonacion
                </button>
              )}

              <button
                className="w-full text-left px-4 py-3 hover:bg-gray-100 text-red-600 font-semibold transition"
                onClick={logout}
              >
              Cerrar sesion
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
