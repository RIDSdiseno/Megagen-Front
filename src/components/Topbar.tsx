import { useAuth } from "../../src/context/AuthContext";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function Topbar() {
  const { user, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState(false);

  const initial = user?.email ? user.email.charAt(0).toUpperCase() : "?";

  return (
    <header className="backdrop-blur bg-white/80 border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-40">

      <h2 className="font-bold text-[#1A334B] text-lg tracking-tight">
        MegaGen — Plataforma Comercial Chile
      </h2>

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
            </div>

            <button className="w-full text-left px-4 py-3 hover:bg-gray-100 text-gray-700 transition">
              Cambiar contraseña
            </button>

            <button
              className="w-full text-left px-4 py-3 hover:bg-gray-100 text-red-600 font-semibold transition"
              onClick={logout}
            >
              Cerrar sesión
            </button>
          </div>
        )}

      </div>
    </header>
  );
}
